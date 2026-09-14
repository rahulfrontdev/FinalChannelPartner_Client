import axios from 'axios'
import { getCookie, hasCookie, setCookie } from 'cookies-next'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'
import {
  Baseurl,
  getCpVisitActivationDate,
  getCpVisitActivationTime,
  getVisitDateLabel,
  mapCpVisitHistoryItem,
  showCpVisitScheduleColumns,
} from '../../../../Utils/Constants'
import { toast } from 'react-toastify'
import VisitHistoryModel from './VisitHistoryModel'
import FinishVisitModal from './FinishVisitModal'

const VisitDetailsScreen = () => { 
  const router = useRouter()
  const { id, type } = router.query;
  const isCpVisit = type === "cp";
  const [visitData, setVisitData] = useState([])
  const [cpVisitRows, setCpVisitRows] = useState([])
  const clientBtnColor = hasCookie("clientBtnColor") ? getCookie("clientBtnColor") : "#293790"
  const userInfo = hasCookie("userInfo") ? JSON.parse(getCookie("userInfo")) : null
  const visitDateLabel = getVisitDateLabel(userInfo?.role_id)
  const possibleVisitDateLabel = getVisitDateLabel(userInfo?.role_id, { possible: true })
  const showScheduleActivationColumns = showCpVisitScheduleColumns(userInfo)
  const [show, setShow] = useState(false)
  const [showFinishVisit, setShowFinishVisit] = useState(false)
  const [selectedFinishVisit, setSelectedFinishVisit] = useState(null)
  const [visitRowOverrides, setVisitRowOverrides] = useState({})
  const visitRowOverridesRef = React.useRef({})
  const [projectList, setProjectList] = useState([])
  const [visitHistory, setVisitHiistory] = useState([])

  useEffect(() => {
    visitRowOverridesRef.current = visitRowOverrides;
  }, [visitRowOverrides]);

  const getFinishedActivationStorageKey = (cplId) =>
    `cp_finished_visit_activations_${cplId || id || ""}`;

  const loadFinishedActivations = (cplId) => {
    try {
      const raw =
        localStorage.getItem(getFinishedActivationStorageKey(cplId)) ||
        sessionStorage.getItem(getFinishedActivationStorageKey(cplId));
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (e) {
      return {};
    }
  };

  const persistFinishedActivation = (cplId, rowKey, payload = {}) => {
    if (!rowKey && !payload?.project_name) return;
    const current = loadFinishedActivations(cplId);
    const fp = buildActivationFingerprint(
      payload?.project_name,
      payload?.scheduled_date,
      payload?.scheduled_time
    );
    const entry = {
      isCompleted: true,
      status: "Completed",
      otpSent: false,
      ...payload,
    };
    const next = { ...current };
    if (rowKey) next[rowKey] = { ...(current[rowKey] || {}), ...entry };
    if (fp && fp !== "||") next[`fp:${fp}`] = { ...(current[`fp:${fp}`] || {}), ...entry };
    try {
      localStorage.setItem(getFinishedActivationStorageKey(cplId), JSON.stringify(next));
      sessionStorage.setItem(getFinishedActivationStorageKey(cplId), JSON.stringify(next));
    } catch (e) {
      // ignore
    }
  };

  const finishedActivationsToOverrides = (cplId) => {
    const finished = loadFinishedActivations(cplId);
    const overrides = {};
    Object.entries(finished || {}).forEach(([key, entry]) => {
      if (!entry) return;
      overrides[key] = {
        isCompleted: true,
        otpSent: false,
        status: "Completed",
        activation_date: entry.activation_date || "",
        activation_time: entry.activation_time || "",
      };
    });
    return overrides;
  };

  const findFinishedEntryForRow = (row = {}, cplId) => {
    const finished = loadFinishedActivations(cplId);
    if (row?.rowKey && finished?.[row.rowKey]) return finished[row.rowKey];
    const fp = buildActivationFingerprint(
      row?.project_name,
      row?.scheduled_date,
      row?.scheduled_time
    );
    if (fp && fp !== "||" && finished?.[`fp:${fp}`]) return finished[`fp:${fp}`];
    return (
      Object.values(finished || {}).find((entry) => {
        if (!entry?.project_name) return false;
        return (
          buildActivationFingerprint(
            entry.project_name,
            entry.scheduled_date,
            entry.scheduled_time
          ) === fp
        );
      }) || null
    );
  };

  const buildActivationFingerprint = (projectName, scheduledDate, scheduledTime) =>
    [
      normalizeProjectName(projectName),
      normalizeScheduleDate(scheduledDate),
      normalizeScheduleTime(scheduledTime),
    ].join("|");

  const sanitizeHistoryActivations = (rows = [], cplId) => {
    const finishedMap = loadFinishedActivations(cplId);
    const finishedByFingerprint = {};
    Object.values(finishedMap || {}).forEach((entry) => {
      const fp = buildActivationFingerprint(
        entry?.project_name,
        entry?.scheduled_date,
        entry?.scheduled_time
      );
      if (fp && fp !== "||") finishedByFingerprint[fp] = entry;
    });

    const withOwnership = (Array.isArray(rows) ? rows : []).map((row) => {
      const fp = buildActivationFingerprint(
        row?.project_name,
        row?.scheduled_date,
        row?.scheduled_time
      );
      const finished = finishedByFingerprint[fp] || finishedMap?.[row?.rowKey];
      if (finished) {
        return {
          ...row,
          activation_date: finished.activation_date || row.activation_date || "",
          activation_time: finished.activation_time || row.activation_time || "",
          _activationOwned: true,
        };
      }
      return { ...row, _activationOwned: false };
    });

    const stampOwners = {};
    withOwnership.forEach((row, index) => {
      if (!row.activation_date && !row.activation_time) return;
      const stamp = `${normalizeScheduleDate(row.activation_date)}|${normalizeScheduleTime(row.activation_time)}`;
      if (!stampOwners[stamp]) stampOwners[stamp] = [];
      stampOwners[stamp].push({ index, row });
    });

    return withOwnership.map((row, index) => {
      if (!row.activation_date && !row.activation_time) {
        const { _activationOwned, ...rest } = row;
        return rest;
      }

      const stamp = `${normalizeScheduleDate(row.activation_date)}|${normalizeScheduleTime(row.activation_time)}`;
      const peers = stampOwners[stamp] || [];
      const distinctProjects = [
        ...new Set(
          peers.map((p) => normalizeProjectName(p.row?.project_name)).filter(Boolean)
        ),
      ];
      const hasOwnedPeer = peers.some((p) => p.row?._activationOwned);

      // Shared activation stamp across rows → keep only the finished record(s)
      if (peers.length > 1 && !row._activationOwned) {
        if (hasOwnedPeer || distinctProjects.length > 1) {
          const { _activationOwned, ...rest } = row;
          return { ...rest, activation_date: "", activation_time: "" };
        }
        // Same project duplicates with same stamp: keep only the first row
        if (peers[0]?.index !== index) {
          const { _activationOwned, ...rest } = row;
          return { ...rest, activation_date: "", activation_time: "" };
        }
      }

      const { _activationOwned, ...rest } = row;
      return rest;
    });
  };

  function formatTime(timeString) {
    if (!timeString) return "---------";
    const timeParts = String(timeString || '').split(':');
    const hours = parseInt(timeParts[0], 10);
    const minutes = parseInt(timeParts[1], 10);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return String(timeString);
  
    const date = new Date(2000, 0, 1, hours, minutes);
  
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  }
  
  function formatDate(date) {
    if (!date) return "---------";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "---------";
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${day}/${month}/${year}`;
  }

  const normalizeProjectName = (name = "") =>
    String(name || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");

  const normalizeScheduleDate = (value = "") => {
    if (!value) return "";
    const str = String(value);
    if (str.includes("T")) return str.split("T")[0];
    return str.slice(0, 10);
  };

  const normalizeScheduleTime = (value = "") => {
    if (!value) return "";
    const str = String(value).trim();
    if (str.length === 5) return `${str}:00`;
    return str.slice(0, 8);
  };

  const getVisitRowKey = (item = {}, index = 0) => {
    const uniqueId =
      item?.visit_history_id ??
      item?.history_id ??
      item?.vh_id ??
      item?.cpvh_id ??
      item?.cpl_visit_id ??
      item?.visit_id;
    if (uniqueId !== undefined && uniqueId !== null && String(uniqueId).trim() !== "") {
      return `vid-${uniqueId}`;
    }
    const projectId = item?.project_id || item?.sales_project_id || "";
    const project = normalizeProjectName(
      item?.project_name || item?.sales_project_name || ""
    );
    const date = normalizeScheduleDate(
      item?.schedule_visit_date ||
        item?.follow_up_date ||
        item?.visit_date ||
        item?.scheduled_date ||
        ""
    );
    const time = normalizeScheduleTime(
      item?.schedule_visit_time ||
        item?.follow_up_time ||
        item?.visit_time ||
        item?.scheduled_time ||
        ""
    );
    const visitType = String(item?.visit_type || "").trim().toLowerCase();
    return `row-${projectId}-${project}-${date}-${time}-${visitType}`;
  };

  const hasOtpSentFlag = (item = {}) =>
    item?.otp_sent === 1 ||
    item?.otp_sent === true ||
    item?.visit_code_sent === 1 ||
    item?.visit_code_sent === true ||
    item?.code_sent === 1 ||
    item?.code_sent === true ||
    Boolean(item?.visit_code_sent_at) ||
    Boolean(item?.otp_sent_at) ||
    Boolean(item?.code_sent_at) ||
    String(item?.visit_status || item?.status || "").toLowerCase().includes("progress") ||
    String(item?.visit_status || item?.status || "")
      .toLowerCase()
      .includes("not completed");

  const mapCpVisitRow = (item = {}, lead = {}, index = 0) => {
    const fallbackProject = lead?.project_name || lead?.sales_project_name || "";
    const mapped = mapCpVisitHistoryItem(item, fallbackProject);
    const statusRaw =
      item?.visit_status ||
      item?.current_stage ||
      item?.stage ||
      item?.status ||
      "";
    const statusKey = String(statusRaw).toLowerCase().trim();
    const isOpenSchedule =
      statusKey === "visit" ||
      statusKey === "upcoming" ||
      statusKey.includes("schedule") ||
      statusKey === "";

    // Only real OTP/activation proof on THIS history row (never updatedAt)
    const hasRealActivation = Boolean(
      item?.activation_date ||
        item?.activation_time ||
        item?.visit_verified_at ||
        item?.code_verified_at ||
        item?.visit_code_verified_at ||
        item?.activation_at
    );
    const hasCompletedStatus =
      statusKey === "completed" ||
      statusKey === "complete";
    const hasVerifiedFlag =
      item?.visit_verified === 1 ||
      item?.visit_verified === true ||
      item?.visit_verified === "1";

    const scheduleDate = normalizeScheduleDate(mapped.scheduled_date);
    const oldActivationDate = normalizeScheduleDate(
      item?.activation_date ||
        item?.visit_verified_at ||
        item?.code_verified_at ||
        item?.visit_code_verified_at ||
        item?.activation_at ||
        ""
    );
    // CP lead reschedule: new schedule after previous activation => still Upcoming
    const looksRescheduled =
      Boolean(scheduleDate) &&
      Boolean(oldActivationDate) &&
      scheduleDate > oldActivationDate &&
      (isOpenSchedule || hasVerifiedFlag || hasRealActivation);

    const isCompleted =
      !looksRescheduled &&
      (hasCompletedStatus ||
        hasRealActivation ||
        (hasVerifiedFlag && !isOpenSchedule));

    const activationDate = isCompleted
      ? (item?.activation_date || mapped.activation_date || getCpVisitActivationDate(item) || "")
      : "";
    const activationTime = isCompleted
      ? (item?.activation_time || mapped.activation_time || getCpVisitActivationTime(item) || "")
      : "";

    const otpSent = !isCompleted && hasOtpSentFlag(item);
    const isScheduled =
      Boolean(mapped.scheduled_date) ||
      Boolean(mapped.scheduled_time) ||
      isOpenSchedule;
    const status = isCompleted
      ? "Completed"
      : otpSent
        ? "Not Completed"
        : isScheduled
          ? "Scheduled Visit"
          : "Scheduled Visit";
    const leadName =
      lead?.name ||
      `${lead?.first_name || ""} ${lead?.last_name || ""}`.trim() ||
      item?.name ||
      `${item?.first_name || ""} ${item?.last_name || ""}`.trim() ||
      "---------";
    const projectName = mapped.project_name || fallbackProject || "---------";
    const rowKey = getVisitRowKey(
      {
        ...item,
        project_name: projectName,
        scheduled_date: mapped.scheduled_date,
        scheduled_time: mapped.scheduled_time,
      },
      index
    );
    return {
      rowKey,
      visit_id:
        item?.visit_id ||
        item?.history_id ||
        item?.vh_id ||
        item?.cpvh_id ||
        item?.cpl_visit_id ||
        item?.visit_history_id ||
        null,
      history_id: item?.history_id || item?.vh_id || item?.visit_history_id || null,
      project_id: item?.project_id || item?.sales_project_id || null,
      lead_name: leadName,
      email: lead?.email || item?.email || "---------",
      contact: lead?.contact || item?.contact || "---------",
      registration_date: lead?.createdAt || item?.createdAt || "",
      project_name: projectName,
      scheduled_date: mapped.scheduled_date,
      scheduled_time: mapped.scheduled_time,
      activation_date: activationDate,
      activation_time: activationTime,
      visit_type: item?.visit_type || "---------",
      assigned_to:
        item?.assigned_to_name ||
        item?.bst_name ||
        item?.user ||
        lead?.assigned_to_name ||
        lead?.bst_name ||
        lead?.user ||
        (typeof item?.assigned_to === "string" && Number.isNaN(Number(item.assigned_to))
          ? item.assigned_to
          : null) ||
        (typeof lead?.assigned_to === "string" && Number.isNaN(Number(lead.assigned_to))
          ? lead.assigned_to
          : null) ||
        "---------",
      status,
      isCompleted,
      otpSent,
      raw: item,
    };
  };

  const applyVisitRowOverrides = (
    rows = [],
    overrides = visitRowOverridesRef.current,
    cplId = visitData?.cpl_id || id
  ) =>
    (Array.isArray(rows) ? rows : []).map((row) => {
      const finishedEntry = findFinishedEntryForRow(row, cplId);
      const override =
        overrides?.[row.rowKey] ||
        (finishedEntry
          ? {
              isCompleted: true,
              otpSent: false,
              status: "Completed",
              activation_date: finishedEntry.activation_date || "",
              activation_time: finishedEntry.activation_time || "",
            }
          : null);
      if (!override) return row;
      if (row.isCompleted && !override.isCompleted) {
        return { ...row, status: "Completed", otpSent: false };
      }
      return {
        ...row,
        ...override,
        isCompleted: Boolean(override.isCompleted) || Boolean(row.isCompleted),
        otpSent:
          (Boolean(override.otpSent) || Boolean(row.otpSent)) &&
          !(override.isCompleted || row.isCompleted),
        status:
          override.isCompleted || row.isCompleted
            ? "Completed"
            : override.otpSent || row.otpSent
              ? "Not Completed"
              : override.status || row.status,
        activation_date:
          override.activation_date || row.activation_date || "",
        activation_time:
          override.activation_time || row.activation_time || "",
      };
    });

  const resolveProjectId = async (selected = {}) => {
    if (selected?.project_id) return selected.project_id;
    if (selected?.raw?.project_id) return selected.raw.project_id;
    if (selected?.raw?.sales_project_id) return selected.raw.sales_project_id;

    let projects = Array.isArray(projectList) ? projectList : [];
    if (!projects.length && hasCookie("token")) {
      try {
        const token = getCookie("token");
        const db_name = getCookie("db_name");
        const res = await axios.get(`${Baseurl}/db/channel/lead/projects`, {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
            db: db_name,
            m_id: 76,
          },
        });
        projects = res?.data?.data?.records || [];
        setProjectList(projects);
      } catch (e) {
        projects = [];
      }
    }

    const targetName = normalizeProjectName(selected?.project_name);
    if (!targetName || !projects.length) return null;
    const match = projects.find((project) => {
      const names = [
        project?.project_name,
        project?.sales_project_name,
        project?.name,
        project?.p_name,
      ]
        .filter(Boolean)
        .map(normalizeProjectName);
      return names.includes(targetName);
    });
    return (
      match?.project_id ||
      match?.sales_project_id ||
      match?.p_id ||
      match?.id ||
      null
    );
  };

  const syncLeadToSelectedVisit = async () => {
    if (!hasCookie("token")) return false;
    const token = getCookie("token");
    const db_name = getCookie("db_name");
    const cplId = visitData?.cpl_id || id;
    const selected = selectedFinishVisit;
    if (!cplId || !selected?.rowKey) return false;

    const projectId = await resolveProjectId(selected);
    const scheduleDate = normalizeScheduleDate(selected?.scheduled_date);
    const scheduleTime = normalizeScheduleTime(selected?.scheduled_time);
    const projectName =
      selected?.project_name && selected.project_name !== "---------"
        ? selected.project_name
        : visitData?.project_name || visitData?.sales_project_name || "";
    const visitType =
      selected?.visit_type && selected.visit_type !== "---------"
        ? selected.visit_type
        : visitData?.visit_type || "";

    const payload = {
      cpl_id: cplId,
      first_name: visitData?.first_name || "",
      last_name: visitData?.last_name || "",
      contact: visitData?.contact || "",
      email: visitData?.email || "",
      remarks: visitData?.remarks || "Finish visit sync",
      stage: "VISIT",
      project_id: projectId || visitData?.project_id || visitData?.sales_project_id || "",
      project_name: projectName,
      schedule_visit_date: scheduleDate,
      db_name,
      client_url: "http://18.61.246.105",
    };
    if (scheduleTime) payload.schedule_visit_time = scheduleTime;
    if (visitType) payload.visit_type = visitType;
    if (selected?.visit_id) payload.visit_id = selected.visit_id;
    if (selected?.history_id) payload.history_id = selected.history_id;

    if (!payload.project_id && !payload.project_name) {
      toast.error("Selected visit project missing", { autoClose: 2500 });
      return false;
    }
    if (!payload.schedule_visit_date) {
      toast.error("Selected visit schedule date missing", { autoClose: 2500 });
      return false;
    }

    const currentProject = normalizeProjectName(
      visitData?.project_name || visitData?.sales_project_name || ""
    );
    const currentDate = normalizeScheduleDate(
      visitData?.schedule_visit_date || visitData?.follow_up_date || ""
    );
    const currentTime = normalizeScheduleTime(
      visitData?.schedule_visit_time || visitData?.follow_up_time || ""
    );
    const alreadySynced =
      currentProject === normalizeProjectName(projectName) &&
      currentDate === scheduleDate &&
      (!scheduleTime || currentTime === scheduleTime);

    if (alreadySynced) return true;

    try {
      await axios.put(`${Baseurl}/db/channelPartnerLeads`, payload, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          pass: "pass",
          db: db_name,
        },
      });
      setVisitData((prev) => ({
        ...(prev || {}),
        project_id: payload.project_id || prev?.project_id,
        project_name: payload.project_name,
        sales_project_name: payload.project_name,
        schedule_visit_date: payload.schedule_visit_date,
        schedule_visit_time: payload.schedule_visit_time || prev?.schedule_visit_time,
        visit_type: payload.visit_type || prev?.visit_type,
        stage: "VISIT",
      }));
      return true;
    } catch (error) {
      if (error?.response?.data?.message) {
        toast.error(error.response.data.message, { autoClose: 2500 });
      } else {
        toast.error("Failed to switch visit record", { autoClose: 2500 });
      }
      return false;
    }
  };

  const getClientVisitById = async () => {
    if (!hasCookie('token')) return;
    const token = getCookie('token');
    const db_name = getCookie('db_name');
    const header = {
      headers: {
        Accept: "application/json",
        Authorization: "Bearer ".concat(token),
        db: db_name,
        m_id: 76,
      }
    };

    try {
      const { data } = await axios.get(Baseurl + `/db/channel/visit?visit_id=${id}`, header);
      setVisitData(data?.data);
    } catch (error) {
      if (error?.response?.data?.message) {
        toast.error(error?.response?.data?.message, { autoClose: 2500 });
      } else {
        toast.error("Something went wrong!", { autoClose: 2500 });
      }
    }
  };

  const getProjectList = async () => {
    if (!hasCookie("token")) return;
    const token = getCookie("token");
    const db_name = getCookie("db_name");
    try {
      const projects = await axios.get(`${Baseurl}/db/channel/lead/projects`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          db: db_name,
          m_id: 76,
        },
      });
      setProjectList(projects?.data?.data?.records || []);
    } catch (error) {
      setProjectList([]);
    }
  };

  const getCpVisitById = async () => {
    if (!hasCookie('token')) return;
    const token = getCookie('token');
    const db_name = getCookie('db_name');
    const header = {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        db: db_name,
        m_id: 76,
      }
    };

    try {
      const { data } = await axios.get(
        `${Baseurl}/db/channelPartnerLeads?db_name=${db_name}&cpl_id=${id}`,
        header
      );
      const raw = data?.data;
      const list = Array.isArray(raw?.leads)
        ? raw.leads
        : Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.visits)
            ? raw.visits
            : raw
              ? [raw]
              : [];
      const lead = list.find((item) => String(item?.cpl_id) === String(id)) || list[0];
      if (!lead) {
        toast.error("CP visit record not found", { autoClose: 2500 });
        return;
      }
      setVisitData(lead);

      let historyRows = [];
      try {
        const historyRes = await axios.get(
          `${Baseurl}/db/channelPartnerLeads/getVisitHistory?cpl_id=${lead?.cpl_id || id}`,
          {
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
              db: db_name,
              pass: "pass",
            },
          }
        );
        const history = Array.isArray(historyRes?.data?.data?.visit_history)
          ? historyRes.data.data.visit_history
          : Array.isArray(historyRes?.data?.data)
            ? historyRes.data.data
            : [];
        historyRows = history.map((item, index) => mapCpVisitRow(item, lead, index));
      } catch (error) {
        historyRows = [];
      }

      if (!historyRows.length) {
        historyRows = [mapCpVisitRow(lead, lead, 0)];
      }
      const restored = finishedActivationsToOverrides(lead?.cpl_id || id);
      setVisitRowOverrides(restored);
      visitRowOverridesRef.current = restored;
      setCpVisitRows(applyVisitRowOverrides(historyRows, restored, lead?.cpl_id || id));
    } catch (error) {
      if (error?.response?.data?.message) {
        toast.error(error?.response?.data?.message, { autoClose: 2500 });
      } else {
        toast.error("Something went wrong!", { autoClose: 2500 });
      }
    }
  };

  const getClientVisitHistory = async () => {
    if (!hasCookie('token')) return;
    const token = getCookie('token');
    const db_name = getCookie('db_name');
    const header = {
      headers: {
        Accept: "application/json",
        Authorization: "Bearer ".concat(token),
        db: db_name,
        pass: "pass"
      }
    };

    try {
      const { data } = await axios.get(Baseurl + `/db/channel/visit/getRevisitHistory?visit_id=${id}`, header);
      setVisitHiistory(data?.data || []);
    } catch (error) {
      if (error?.response?.data?.message) {
        toast.error(error?.response?.data?.message, { autoClose: 2500 });
      } else {
        toast.error("Something went wrong!", { autoClose: 2500 });
      }
    }
  };

  const getCpVisitHistory = async () => {
    if (!hasCookie('token')) return;
    const token = getCookie('token');
    const db_name = getCookie('db_name');
    const cplId = visitData?.cpl_id || id;
    if (!cplId) {
      toast.error("CP lead id missing", { autoClose: 2500 });
      return;
    }

    const header = {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        db: db_name,
        pass: "pass",
      }
    };

    try {
      const { data } = await axios.get(
        `${Baseurl}/db/channelPartnerLeads/getVisitHistory?cpl_id=${cplId}`,
        header
      );
      const history = Array.isArray(data?.data?.visit_history)
        ? data.data.visit_history
        : Array.isArray(data?.data)
          ? data.data
          : [];
      const mappedHistory = history.map((item, index) => {
        // Never fall back project name from lead — that mixes activation across projects
        const mapped = mapCpVisitHistoryItem(item, item?.project_name || item?.sales_project_name || "");
        return {
          ...mapped,
          rowKey: getVisitRowKey(
            {
              ...item,
              project_name: mapped.project_name,
              scheduled_date: mapped.scheduled_date,
              scheduled_time: mapped.scheduled_time,
            },
            index
          ),
        };
      });
      setVisitHiistory(sanitizeHistoryActivations(mappedHistory, cplId));
    } catch (error) {
      setVisitHiistory([]);
      if (error?.response?.data?.message) {
        toast.error(error?.response?.data?.message, { autoClose: 2500 });
      } else {
        toast.error("Something went wrong!", { autoClose: 2500 });
      }
    }
  };

  const handleVisitHistory = async () => {
    if (isCpVisit) {
      await getCpVisitHistory();
    } else if (!visitHistory?.length) {
      await getClientVisitHistory();
    }
    setShow(true);
  };

  useEffect(() => {
    if (!id) return;
    setSelectedFinishVisit(null);
    setShowFinishVisit(false);
    if (isCpVisit) {
      const restored = finishedActivationsToOverrides(id);
      setVisitRowOverrides(restored);
      visitRowOverridesRef.current = restored;
      getProjectList();
      getCpVisitById();
      setVisitHiistory([]);
    } else {
      setVisitRowOverrides({});
      visitRowOverridesRef.current = {};
      getClientVisitById();
      getClientVisitHistory();
    }
  }, [id, type]);

  const cpLeadName =
    visitData?.name ||
    `${visitData?.first_name || ""} ${visitData?.last_name || ""}`.trim();
  const visitStatus = isCpVisit
    ? (
        selectedFinishVisit?.status ||
        (
          (
            String(visitData?.visit_status || "").toLowerCase() === "completed" ||
            visitData?.visit_verified === 1 ||
            visitData?.visit_verified === true
          )
            ? (visitData?.visit_status || "Completed")
            : "Scheduled Visit"
        )
      )
    : (visitData?.status || "Scheduled Visit");

  const handleBackToVisits = () => {
    if (isCpVisit) {
      setCookie("VisitTypeTab", "cp");
    } else {
      setCookie("VisitTypeTab", "client");
    }
    router.push("/partner/Visits");
  };

  const openFinishVisitForRow = (row) => {
    setSelectedFinishVisit(row);
    setShowFinishVisit(true);
  };

  const markSelectedVisitOverride = (patch = {}) => {
    const rowKey = selectedFinishVisit?.rowKey;
    if (!rowKey) return;
    const nextOverrides = {
      ...visitRowOverridesRef.current,
      [rowKey]: {
        ...(visitRowOverridesRef.current[rowKey] || {}),
        ...patch,
      },
    };
    visitRowOverridesRef.current = nextOverrides;
    setVisitRowOverrides(nextOverrides);
    setCpVisitRows((prev) =>
      (Array.isArray(prev) ? prev : []).map((row) => {
        if (row.rowKey !== rowKey) return row;
        const next = { ...row, ...patch };
        if (patch.isCompleted) {
          next.isCompleted = true;
          next.otpSent = false;
          next.status = "Completed";
        } else if (patch.otpSent) {
          next.isCompleted = false;
          next.otpSent = true;
          next.status = "Not Completed";
        }
        return next;
      })
    );
    setSelectedFinishVisit((prev) =>
      prev?.rowKey === rowKey
        ? {
            ...prev,
            ...patch,
            status: patch.isCompleted
              ? "Completed"
              : patch.otpSent
                ? "Not Completed"
                : patch.status || prev.status,
          }
        : prev
    );
  };

  const markSelectedVisitCompleted = () => {
    const now = new Date();
    const activation_date = now.toISOString().slice(0, 10);
    const activation_time = now.toTimeString().slice(0, 8);
    markSelectedVisitOverride({
      isCompleted: true,
      otpSent: false,
      status: "Completed",
      activation_date,
      activation_time,
    });
    const cplId = visitData?.cpl_id || id;
    const selected = selectedFinishVisit || {};
    persistFinishedActivation(cplId, selected?.rowKey, {
      activation_date,
      activation_time,
      project_name: selected?.project_name || "",
      scheduled_date: selected?.scheduled_date || "",
      scheduled_time: selected?.scheduled_time || "",
    });
  };

  const buildVisitCodePayload = async (extra = {}) => {
    const cplId = visitData?.cpl_id || id;
    const selected = selectedFinishVisit || {};
    const projectId = await resolveProjectId(selected);
    const payload = {
      cpl_id: cplId,
      db_name: getCookie("db_name"),
      ...extra,
    };
    if (selected?.visit_id) payload.visit_id = selected.visit_id;
    if (selected?.history_id) payload.history_id = selected.history_id;
    if (projectId) payload.project_id = projectId;
    if (selected?.project_name && selected.project_name !== "---------") {
      payload.project_name = selected.project_name;
    }
    if (selected?.scheduled_date) {
      payload.schedule_visit_date = normalizeScheduleDate(selected.scheduled_date);
    }
    if (selected?.scheduled_time) {
      payload.schedule_visit_time = normalizeScheduleTime(selected.scheduled_time);
    }
    if (selected?.visit_type && selected.visit_type !== "---------") {
      payload.visit_type = selected.visit_type;
    }
    return payload;
  };

  const sendVisitCode = async () => {
    if (!hasCookie('token')) return false;
    const token = getCookie('token');
    const db_name = getCookie('db_name');
    const cplId = visitData?.cpl_id || id;
    if (!cplId) {
      toast.error("CP lead id missing", { autoClose: 2500 });
      return false;
    }
    if (!selectedFinishVisit?.rowKey) {
      toast.error("Please select a visit record", { autoClose: 2500 });
      return false;
    }

    try {
      const synced = await syncLeadToSelectedVisit();
      if (!synced) return false;

      const { data } = await axios.post(
        `${Baseurl}/db/channelPartnerLeads/sendVisitCode`,
        await buildVisitCodePayload(),
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
            db: db_name,
            m_id: 76,
          },
        }
      );
      toast.success(data?.message || "Visit code sent successfully", { autoClose: 2500 });
      markSelectedVisitOverride({
        otpSent: true,
        isCompleted: false,
        status: "Not Completed",
      });
      return true;
    } catch (error) {
      if (error?.response?.data?.message) {
        toast.error(error?.response?.data?.message, { autoClose: 2500 });
      } else {
        toast.error("Failed to send visit code", { autoClose: 2500 });
      }
      return false;
    }
  };

  const verifyVisitCode = async (visitCode) => {
    if (!hasCookie('token')) return false;
    const token = getCookie('token');
    const db_name = getCookie('db_name');
    const cplId = visitData?.cpl_id || id;
    if (!cplId) {
      toast.error("CP lead id missing", { autoClose: 2500 });
      return false;
    }
    if (!selectedFinishVisit?.rowKey) {
      toast.error("Please select a visit record", { autoClose: 2500 });
      return false;
    }
    if (!visitCode) {
      toast.error("Please enter visit code", { autoClose: 2500 });
      return false;
    }

    try {
      const synced = await syncLeadToSelectedVisit();
      if (!synced) return false;

      const { data } = await axios.post(
        `${Baseurl}/db/channelPartnerLeads/verifyVisitCode`,
        await buildVisitCodePayload({ visit_code: visitCode }),
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
            db: db_name,
            m_id: 76,
          },
        }
      );
      toast.success(data?.message || "Visit verified successfully", { autoClose: 2500 });
      markSelectedVisitCompleted();
      return true;
    } catch (error) {
      if (error?.response?.data?.message) {
        toast.error(error?.response?.data?.message, { autoClose: 2500 });
      } else {
        toast.error("Failed to verify visit code", { autoClose: 2500 });
      }
      return false;
    }
  };

  return (
    <>
    <div className='w-100 overflow-auto pb-5'>
       <section className="Channel-profile  Visit-Details pt-4 pb-2">
  <div className="container  mt-4 mb-4">
    <div className="row gx-4">
      <div className="profile-text mb-4">Visits/ Visit Detail</div>
      <div className="col-12  col-lg-12">
        <div className="lead-detail-sec overflow-hidden">
          <ul className="list-group General-list h-auto rounded-0 m-0">
            <li style={{background:`${clientBtnColor}`}} href="#" className="list-group-item list-group-item-action  text-white d-flex justify-content-between" aria-current="true">
              <span className="lead-id text-white">
                {isCpVisit ? `CPL-${visitData?.cpl_id || id}` : visitData?.visit_code}
              </span>
            </li>
          </ul>
          <ul className="list-group General-list d-flex flex-column gap-4 bg-white leads-content h-auto m-0">
            {isCpVisit ? (
              <>
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                  <h5 className="mb-0 fw-bold" style={{ color: "#293790" }}>Visit List</h5>
                </div>

                <div className="table-responsive">
                  <table className="table table-bordered align-middle mb-0">
                    <thead>
                      <tr style={{ background: clientBtnColor, color: "#fff" }}>
                        <th>CP Lead Name</th>
                        <th>Email</th>
                        <th>Contact No.</th>
                        <th>Registration Date</th>
                        <th>Project Name</th>
                        <th>Scheduled Date</th>
                        <th>Scheduled Time</th>
                        <th>Activation Date</th>
                        <th>Activation Time</th>
                        <th>Visit Type</th>
                        <th>Assigned To</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cpVisitRows.length ? (
                        cpVisitRows.map((row, index) => {
                          const statusKey = String(row.status || "").toLowerCase();
                          const isCompleted = Boolean(row.isCompleted) || statusKey === "completed";
                          const isInProgress =
                            !isCompleted &&
                            (Boolean(row.otpSent) ||
                              statusKey === "in progress" ||
                              statusKey === "not completed");
                          const statusLabel = isCompleted
                            ? "Completed"
                            : isInProgress
                              ? "Not Completed"
                              : "Scheduled Visit";
                          const statusBg = isCompleted
                            ? "#198754"
                            : isInProgress
                              ? "#fd7e14"
                              : "#17B4E7";
                          return (
                            <tr key={row.rowKey || `cp-visit-row-${index}`}>
                              <td>{row.lead_name || "---------"}</td>
                              <td>{row.email || "---------"}</td>
                              <td>+91-{row.contact || "---------"}</td>
                              <td>{formatDate(row.registration_date)}</td>
                              <td>{row.project_name || "---------"}</td>
                              <td>{formatDate(row.scheduled_date)}</td>
                              <td>{formatTime(row.scheduled_time)}</td>
                              <td>{formatDate(row.activation_date)}</td>
                              <td>{formatTime(row.activation_time)}</td>
                              <td>
                                <span
                                  style={{
                                    background: "violet",
                                    color: "white",
                                    padding: "4px 12px",
                                    borderRadius: "20px",
                                    display: "inline-block",
                                  }}
                                >
                                  {row.visit_type || "---------"}
                                </span>
                              </td>
                              <td>{row.assigned_to || "---------"}</td>
                              <td>
                                <span
                                  style={{
                                    background: statusBg,
                                    color: "white",
                                    padding: "4px 12px",
                                    borderRadius: "20px",
                                    display: "inline-block",
                                  }}
                                >
                                  {statusLabel}
                                </span>
                              </td>
                              <td>
                                {!isCompleted ? (
                                  <button
                                    type="button"
                                    className="finish-visit-table-btn"
                                    style={{
                                      background: clientBtnColor || "#293790",
                                    }}
                                    onClick={() => openFinishVisitForRow(row)}
                                  >
                                    Finish Visit
                                  </button>
                                ) : null}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={13} className="text-center">No visit records found</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <>
            <div className="row">
              <div className="col-6 col-md-5">
                <div className="list-group-item list-group-item-action p-0 border-0">
                  <span className="list-left">Lead Name</span>
                </div>
              </div>
              <div className="col-6 col-md-6">
                <div className="list-group-item list-group-item-action p-0 border-0">
                  <span className="list-right">{visitData?.leadData?.lead_name}</span>
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-6 col-md-5">
                <div className="list-group-item list-group-item-action p-0 border-0">
                  <span className="list-left">Email</span>
                </div>
              </div>                            
              <div className="col-6 col-md-6">
                <div className="list-group-item list-group-item-action p-0 border-0">
                  <span className="list-right">{visitData?.leadData?.email_id}</span>
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-6 col-md-5">
                <div className="list-group-item list-group-item-action p-0 border-0">
                  <span className="list-left">Contact No.</span>
                </div>
              </div>
              <div className="col-6 col-md-6">
                <div className="list-group-item list-group-item-action p-0 border-0">
                  <span className="list-right">+91-{visitData?.leadData?.p_contact_no}</span>
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-6 col-md-5">
                <div className="list-group-item list-group-item-action p-0 border-0">
                  <span className="list-left">Project</span>
                </div>
              </div>
              <div className="col-6 col-md-6">
                <div className="list-group-item list-group-item-action p-0 border-0">
                  <span className="list-right">{visitData?.leadData?.sales_project_name || "------"}
                  </span>
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-6 col-md-5">
                <div className="list-group-item list-group-item-action p-0 border-0">
                  <span className="list-left">Location</span>
                </div>
              </div>
              <div className="col-6 col-md-6">
                <div className="list-group-item list-group-item-action p-0 border-0">
                  <span className="list-right">{visitData?.leadData?.address}</span>
                </div>
              </div>                            
            </div>
            <div className="row">
              <div className="col-6 col-md-5">
                <div className="list-group-item list-group-item-action p-0 border-0">
                  <span className="list-left">Pincode</span>
                </div>
              </div>
              <div className="col-6 col-md-6">
                <div className="list-group-item list-group-item-action p-0 border-0">
                  <span className="list-right">{visitData?.leadData?.pincode}</span>
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-6 col-md-5">
                <div className="list-group-item list-group-item-action p-0 border-0">
                  <span className="list-left">{possibleVisitDateLabel}</span>
                </div>
              </div>
              <div className="col-6 col-md-6">
                <div className="list-group-item list-group-item-action p-0 border-0">
                  <span className="list-right">{formatDate(visitData?.p_visit_date)}</span>
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-6 col-md-5">
                <div className="list-group-item list-group-item-action p-0 border-0">
                  <span className="list-left">Possible Visit Time</span>
                </div>
              </div>
              <div className="col-6 col-md-6">
                <div className="list-group-item list-group-item-action p-0 border-0">
                  <span className="list-right">{formatTime(visitData?.p_visit_time)}</span>
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-6 col-md-5">
                <div className="list-group-item list-group-item-action p-0 border-0">
                  <span className="list-left">Visit Status</span>
                </div>
              </div>
              <div className="col-6 col-md-6">
                <div className="list-group-item list-group-item-action p-0 border-0">
                  <span className="list-right">{visitData?.status}</span>
                </div>
              </div>
            </div>
            {
              visitData?.visit_remark && (
                <div className="row">
                <div className="col-6 col-md-5">
                  <div className="list-group-item list-group-item-action p-0 border-0">
                    <span className="list-left">Visit Remark</span>
                  </div>
                </div>
                <div className="col-6 col-md-6">
                  <div className="list-group-item list-group-item-action p-0 border-0">
                    <span className="list-right">{visitData?.visit_remark ? visitData?.visit_remark :"---------"}</span>
                  </div>
                </div>
              </div>
              )
            }
            <div className="row">
              <div className="col-6 col-md-5">
                <div className="list-group-item list-group-item-action p-0 border-0">
                  <span className="list-left">Created At</span>
                </div>
              </div>
              <div className="col-6 col-md-6">
                <div className="list-group-item list-group-item-action p-0 border-0">
                  <span className="list-right">{formatDate(visitData?.createdAt?.split("T"))}</span>
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-6 col-md-5">
                <div className="list-group-item list-group-item-action p-0 border-0">
                  <span className="list-left">Created By</span>
                </div>
              </div>
              <div className="col-6 col-md-6">
                <div className="list-group-item list-group-item-action p-0 border-0">
                  <span className="list-right">{visitData?.leadData?.leadOwner?.user ?visitData?.leadData?.leadOwner?.user :"---------"}</span>
                </div>
              </div>
            </div>
            {
              visitData?.revisit_date && (
                <div className="row">
                <div className="col-6 col-md-5">
                  <div className="list-group-item list-group-item-action p-0 border-0">
                    <span className="list-left">Revisit Date</span>
                  </div>
                </div>
                <div className="col-6 col-md-6">
                  <div className="list-group-item list-group-item-action p-0 border-0">
                    <span className="list-right">{formatDate(visitData?.revisit_date)}</span>
                  </div>
                </div>
              </div>
              )
            }
            
            {
              visitData?.revisit_time && (
                <div className="row">
              <div className="col-6 col-md-5">
                <div className="list-group-item list-group-item-action p-0 border-0">
                  <span className="list-left">Revisit Time</span>
                </div>
              </div>
              <div className="col-6 col-md-6">
                <div className="list-group-item list-group-item-action p-0 border-0">
                  <span className="list-right">{formatTime(visitData?.revisit_time)}</span>
                </div>
              </div>
            </div>
              )
            }
              </>
            )}
          </ul></div>
        <div className="details-btn d-flex justify-content-center gap-4 mt-4 mt-md-5">
          <button className="back-to-lead d-flex align-items-center justify-content-center text-white border-0"
            style={{background:`${clientBtnColor}`}}
            onClick={handleBackToVisits}
          >Back to Visits</button>
          {!isCpVisit && (
            <button className="back-to-lead d-flex align-items-center justify-content-center text-white border-0"
              style={{background:`${clientBtnColor}`}}
              onClick={handleVisitHistory}
            >Visit History</button>
          )}
        </div>
        
        
      </div>  
    </div>                                                                                                                                                                                                                                                                                                             
  </div>
</section>
    </div>

    <VisitHistoryModel
        show={show}
        setShow={setShow}
        visitHistory={visitHistory}
        showScheduleActivationColumns={isCpVisit && showScheduleActivationColumns}
    />

    {isCpVisit && (
      <FinishVisitModal
        show={showFinishVisit}
        setShow={(value) => {
          setShowFinishVisit(value);
          if (!value) setSelectedFinishVisit(null);
        }}
        visitStatus={visitStatus}
        startAtVerify={Boolean(selectedFinishVisit?.otpSent)}
        onSendVisitCode={sendVisitCode}
        onVerifyVisitCode={verifyVisitCode}
      />
    )}
    </>

  )
}

export default VisitDetailsScreen
