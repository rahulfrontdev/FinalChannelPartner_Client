import React, { useEffect, useState } from 'react'
import MUIDataTable from "mui-datatables";
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Button, Modal } from 'react-bootstrap';
import Select, { components } from 'react-select';
import axios from 'axios';
import { Baseurl, isRmRole, isBstRole, showCpVisitScheduleColumns } from '../../../../Utils/Constants';
import moment from 'moment';
import { getZoneList } from '../../../../Utils/zoneMasterApi';
import { getCookie, hasCookie, setCookie } from 'cookies-next';
import { toast } from 'react-toastify';
import DateRange from '../../../DateRangeCustom/Daterange';
import Loader from '../../../Loader/Loader';
import { Form } from 'react-bootstrap';
import { fetchData } from '../../../../Utils/getReq';
import * as XLSX from "xlsx";
import DeleteIcon from "../../../Svg/DeleteIcon";
import EditIcon from "../../../Svg/EditIcon";
import ViewIcon from "../../../Svg/ViewIcon";



const CheckboxOption = (props) => {
  const { isFocused, isSelected, children, innerProps, getStyles, isDisabled, ...rest } = props;
  let bg = "transparent";
  if (isFocused) bg = "#eee";
  if (isSelected) bg = "#B2D4FF";

  return (
    <components.Option
      {...rest}
      isDisabled={isDisabled}
      isFocused={isFocused}
      isSelected={isSelected}
      getStyles={getStyles}
      innerProps={{
        ...innerProps,
        style: {
          alignItems: "center",
          backgroundColor: bg,
          color: "inherit",
          display: "flex",
          gap: 8,
        },
      }}
    >
      <input type="checkbox" checked={isSelected} readOnly style={{ marginRight: 8 }} />
      {children}
    </components.Option>
  );
};

const ManageUsersTable = ({ start, end, deleteConfirm, disableConfirm, dataList, openEdtMdl, title, setShowAssignTo, oldAssignTo, setoldAssignTo, oldAssignToRm, setoldAssignToRm, setShowDateFilter, usersList, getDataList, loader, selectedOption, setSelectedOption, channelPartnerFilter }) => {
  const router = useRouter()
  const [data, setData] = useState([])
  const [userData, setUserData] = useState([])
  const [actionMode, setActionMode] = useState('')
  const [showModal, setShowModal] = useState(false)
  const userInfo = hasCookie("userInfo") ? JSON.parse(getCookie("userInfo")) : null;
  const getCurrentWeekDates = () => {
    const startDate = new Date(new Date().setDate(new Date().getDate() - new Date().getDay() + 1));
    const endDate = new Date(new Date().setDate(startDate.getDate() + 6));
    if (hasCookie("Channel_PartnerFilter")) {
      let data = JSON.parse(getCookie("Channel_PartnerFilter"))
      return { startDate: data?.f_date, endDate: data?.t_date }
    }
    else {
      return { startDate, endDate };
    }

  };

  const [value, setValue] = useState(getCurrentWeekDates());
  const clientBtnColor = hasCookie("clientBtnColor") ? getCookie("clientBtnColor") : "#293790"
  const [partnerTypes, setPartnerTypes] = useState([])
  const [errorToast, setErrorToast] = useState(false);
  const [showAssignRm, setShowAssignRm] = useState(false);
  const [assignRmUserId, setAssignRmUserId] = useState("");
  const [zoneList, setZoneList] = useState([]);
  const [projectList, setProjectList] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [selectedZone, setSelectedZone] = useState(null);
  const [selectedProjectIds, setSelectedProjectIds] = useState([]);
  const [assignRmSaving, setAssignRmSaving] = useState(false);
  const [assignmentMap, setAssignmentMap] = useState({});
  const [assignmentDetails, setAssignmentDetails] = useState({});
  const [currentAssignments, setCurrentAssignments] = useState([]);
  const [rmDetailsShow, setRmDetailsShow] = useState(false);
  const [rmDetailsRows, setRmDetailsRows] = useState([]);
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [visitSaving, setVisitSaving] = useState(false);
  const [visitErrors, setVisitErrors] = useState({});
  const [visitProjectList, setVisitProjectList] = useState([]);
  const [visitForm, setVisitForm] = useState({
    cpl_id: "",
    user_id: "",
    first_name: "",
    last_name: "",
    contact: "",
    email: "",
    createdAt: "",
    stage: "VISIT",
    remarks: "",
    follow_up_date: "",
    schedule_visit_date: "",
    schedule_visit_time: "",
    project_id: "",
    project_name: "",
    visit_type: "",
    state_id: "",
    city_id: "",
    operating_location: "",
    zone_name: "",
  });
  const isBstProfile = isBstRole(userInfo?.role_id);
  const isRmProfile = isRmRole(userInfo?.role_id);
  const showScheduleTimeField = showCpVisitScheduleColumns(userInfo);
  const visitTypeOptions = [
    { value: "Video Visit", label: "Video Visit" },
    { value: "Site Visit", label: "Site Visit" },
    { value: "Out Visit", label: "Out Visit" },
  ];
  const CP_PROJECT_ASSIGN_API = `${Baseurl}/db/channel/cp-project-assign`;
  const PROJECT_MASTER_API = `${Baseurl}/db/channel/project-master`;


  async function getPartnerTypes() {
    await fetchData("/db/users/channelPartnerType", setPartnerTypes, errorToast, setErrorToast);
  }

  useEffect(() => {
    getPartnerTypes()
  }, [])

  const mapUserOption = (data) => ({
    value: data?.user_id,
    label: (
      <>
        {data?.user ?? ""}{" "}
        {data?.user_status ? (
          <span className="status_box  text-center">
            <span className="active status_btn">active</span>
          </span>
        ) : (
          <span className="status_box  text-center">
            <span className="inactive status_btn">inactive</span>
          </span>
        )}
      </>
    ),
  });

  const getBstUserOptions = () => [
    { value: userInfo?.user_id, label: "N.A" },
    ...(usersList?.filter(user => isBstRole(user.role_id))?.map(mapUserOption) || []),
  ];

  const userListFilterBasisOfRole = (selectedOption, usersList) => {
    if (selectedOption === "BST") {
      return [{ value: userInfo?.user_id, label: "N.A" }, ...usersList
        ?.filter(user => user.role_id === 3)
        ?.map(mapUserOption)];
    }
    return [];
  };

  const getSelectValue = (assignId) => {
    if (assignId === "" || assignId == null) return null;
    if (assignId === userInfo?.user_id) {
      return { value: userInfo?.user_id, label: "N.A" };
    }
    const user = usersList?.find(u => u.user_id === assignId);
    return user ? mapUserOption(user) : null;
  };

  const userSearchFilterOption = (option, inputValue) => {
    if (!inputValue) return true;
    const user = usersList?.find(u => u.user_id === option.value);
    if (!user) return option.label?.toString()?.toLowerCase()?.includes(inputValue.toLowerCase());
    const searchTerm = inputValue.toLowerCase();
    return (
      user.user?.toLowerCase().includes(searchTerm) ||
      user.email?.toLowerCase().includes(searchTerm) ||
      String(user.contact_number || "").includes(searchTerm)
    );
  };

  const setAssignPrefill = (assignedId) => {
    const id = assignedId ?? "";
    const assignedUser = usersList?.find(u => u.user_id === id);
    if (isRmRole(assignedUser?.role_id)) {
      setoldAssignToRm?.(id);
      setoldAssignTo?.("");
    } else {
      setoldAssignTo?.(id);
      setoldAssignToRm?.("");
    }
  };

  const getSelectedAssignTo = () => {
    if (oldAssignTo !== "" && oldAssignTo != null) return oldAssignTo;
    if (oldAssignToRm !== "" && oldAssignToRm != null) return oldAssignToRm;
    return null;
  };

  const authHeader = () => {
    const token = getCookie("token");
    const db_name = getCookie("db_name");
    return {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        db: db_name,
        pass: "pass",
      },
    };
  };

  const formatAssignmentNames = (assignments = []) => {
    const names = assignments.flatMap((item) => {
      if (Array.isArray(item?.rm_names) && item.rm_names.length) return item.rm_names;
      if (item?.rm_name) return String(item.rm_name).split(",").map((name) => name.trim());
      if (Array.isArray(item?.rm_users)) return item.rm_users.map((user) => user?.name || user?.user);
      return [];
    }).map((name) => String(name || "").trim()).filter(Boolean);
    return [...new Set(names)].join(", ");
  };

  const rmNamesFromUser = (list) => {
    if (Array.isArray(list?.assigned_rm) && list.assigned_rm.length) {
      const fromAssignments = formatAssignmentNames(list.assigned_rm);
      if (fromAssignments) return fromAssignments;
    }
    if (Array.isArray(list?.assigned_rm_users) && list.assigned_rm_users.length) {
      return [...new Set(
        list.assigned_rm_users
          .map((user) => String(user?.name || user?.user || "").trim())
          .filter(Boolean)
      )].join(", ");
    }
    return "";
  };

  const applyAssignments = (userId, assignments = []) => {
    setCurrentAssignments(assignments);
    setAssignmentMap((prev) => ({
      ...prev,
      [userId]: formatAssignmentNames(assignments),
    }));
    setAssignmentDetails((prev) => ({
      ...prev,
      [userId]: assignments,
    }));
  };

  const buildRmRows = (assignments = [], onlyName = "") => {
    const rows = assignments.flatMap((item) => {
      const users = Array.isArray(item?.rm_users) && item.rm_users.length
        ? item.rm_users
        : (Array.isArray(item?.rm_names) ? item.rm_names : String(item?.rm_name || "").split(","))
            .map((name, index) => ({
              user_id: item?.rm_ids?.[index],
              name: String(name || "").trim(),
            }))
            .filter((user) => user.name);
      return users.map((user) => ({
        user_id: user?.user_id || user?.id || "-",
        name: user?.name || user?.user || "-",
        zone: user?.zone || user?.zone_name || item?.zone || "-",
        state:
          user?.state_name ||
          (typeof user?.state === "string" ? user.state : "") ||
          item?.projectState?.state_name ||
          item?.state_name ||
          "-",
        city:
          user?.city_name ||
          (typeof user?.city === "string" ? user.city : "") ||
          item?.projectCity?.city_name ||
          item?.city_name ||
          "-",
        project_id: item?.project_id,
        zone_name: item?.zone || "",
      }));
    });
    if (!onlyName) return rows;
    return rows.filter((row) => String(row.name).trim().toLowerCase() === String(onlyName).trim().toLowerCase());
  };

  const enrichRmRows = async (rows, assignments) => {
    const zones = [...new Set(assignments.map((item) => item?.zone).filter(Boolean))];
    if (!zones.length || !hasCookie("token")) return rows;
    const projects = [];
    await Promise.all(
      zones.map(async (zone) => {
        try {
          const { data } = await axios.get(
            `${PROJECT_MASTER_API}?zone=${encodeURIComponent(zone)}`,
            authHeader()
          );
          const raw = Array.isArray(data?.data) ? data.data : [];
          projects.push(...raw);
        } catch (error) {
          // keep the assignment fields already available
        }
      })
    );
    return rows.map((row) => {
      const project = projects.find((item) => String(item?.project_id) === String(row.project_id));
      const user = (project?.rm_users || []).find((item) => String(item?.user_id) === String(row.user_id));
      return {
        ...row,
        zone: row.zone && row.zone !== "-" ? row.zone : project?.zone || row.zone,
        state: row.state && row.state !== "-" ? row.state : user?.state || project?.projectState?.state_name || row.state,
        city: row.city && row.city !== "-" ? row.city : user?.city || project?.projectCity?.city_name || row.city,
      };
    });
  };

  const loadVisitProjects = async () => {
    if (visitProjectList.length || !hasCookie("token")) return;
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
      const raw = projects?.data?.data;
      const records = Array.isArray(raw?.records)
        ? raw.records
        : Array.isArray(raw)
          ? raw
          : [];
      setVisitProjectList(records);
    } catch (error) {
      setVisitProjectList([]);
    }
  };

  const openScheduleVisit = (userCode) => {
    const row = dataList?.find((item) => item?.user_code === userCode);
    if (!row) return;
    setVisitForm({
      cpl_id: row?.cpl_id || "",
      user_id: row?.user_id || "",
      first_name: row?.user || "",
      last_name: row?.user_l_name || "",
      contact: row?.contact_number ? String(row.contact_number) : "",
      email: row?.email || "",
      createdAt: row?.createdAt || "",
      stage: "VISIT",
      remarks: row?.remarks || "",
      follow_up_date: "",
      schedule_visit_date: "",
      schedule_visit_time: "",
      project_id: "",
      project_name: "",
      visit_type: "",
      state_id: row?.state_id || "",
      city_id: row?.city_id || "",
      operating_location: row?.operating_location || "",
      zone_name: row?.zone_name || "",
    });
    setVisitErrors({});
    setShowVisitModal(true);
    loadVisitProjects();
  };

  const handleVisitInput = (event) => {
    const { name, value } = event.target;
    if (name === "stage" && value !== "VISIT") {
      setVisitForm((prev) => ({
        ...prev,
        stage: value,
        schedule_visit_date: "",
        schedule_visit_time: "",
        project_id: "",
        project_name: "",
        visit_type: "",
      }));
      return;
    }
    setVisitForm((prev) => ({ ...prev, [name]: value }));
  };

  const validateVisitForm = () => {
    const nextErrors = {};
    if (!visitForm.first_name) nextErrors.first_name = "First name is required";
    if (!visitForm.last_name) nextErrors.last_name = "Last name is required";
    if (!visitForm.contact || String(visitForm.contact).length !== 10) {
      nextErrors.contact = "Contact must be 10 digits";
    }
    if (!visitForm.email || !/\S+@\S+\.\S+/.test(visitForm.email)) {
      nextErrors.email = "Valid email is required";
    }
    if (visitForm.stage === "FOLLOW UP" && !visitForm.follow_up_date) {
      nextErrors.follow_up_date = "Date is required";
    }
    if (visitForm.stage === "VISIT") {
      if (!String(visitForm.schedule_visit_date || "").slice(0, 10)) {
        nextErrors.follow_up_date = "Scheduled date is required";
      }
      if (showScheduleTimeField && !visitForm.schedule_visit_time) {
        nextErrors.schedule_visit_time = "Scheduled time is required";
      }
      if (!visitForm.project_id) nextErrors.project_id = "Project is required";
      if (!visitForm.visit_type) nextErrors.visit_type = "Visit Type is required";
    }
    return nextErrors;
  };

  const submitScheduleVisit = async (event) => {
    event?.preventDefault?.();
    const nextErrors = validateVisitForm();
    if (Object.keys(nextErrors).length) {
      setVisitErrors(nextErrors);
      toast.error(Object.values(nextErrors)[0], { autoClose: 2500 });
      return;
    }
    if (!hasCookie("token")) {
      toast.error("Please login again", { autoClose: 2500 });
      return;
    }
    const token = getCookie("token");
    const db_name = getCookie("db_name");
    const header = {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        db: db_name,
        pass: "pass",
      },
    };
    if (!visitForm.cpl_id) {
      toast.error("Lead record not found", { autoClose: 2500 });
      return;
    }
    const timeValue = String(visitForm.schedule_visit_time || "");
    const payload = {
      cpl_id: visitForm.cpl_id,
      stage: "VISIT",
      project_id: visitForm.project_id,
      visit_type: visitForm.visit_type,
      schedule_visit_date: String(visitForm.schedule_visit_date || "").slice(0, 10),
      schedule_visit_time: timeValue.length === 5 ? `${timeValue}:00` : timeValue,
      remarks: visitForm.remarks || "",
    };

    setVisitSaving(true);
    try {
      const response = await axios.put(`${Baseurl}/db/channelPartnerLeads`, payload, header);
      toast.success(response?.data?.message || "Visit scheduled", { autoClose: 2500 });
      setShowVisitModal(false);
      if (getDataList) getDataList();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Something went wrong!", { autoClose: 2500 });
    } finally {
      setVisitSaving(false);
    }
  };

  const openRmDetails = async (cpUserId, rmName) => {
    const fromList = dataList?.find((item) => String(item?.user_id) === String(cpUserId));
    const stored = assignmentDetails[cpUserId];
    const assignments = Array.isArray(stored) && stored.length
      ? stored
      : (Array.isArray(fromList?.assigned_rm) ? fromList.assigned_rm : []);
    let rows = buildRmRows(assignments, rmName);
    if (rows.some((row) => !row.state || row.state === "-" || !row.city || row.city === "-")) {
      rows = await enrichRmRows(rows, assignments);
    }
    setRmDetailsRows(rows);
    setRmDetailsShow(true);
  };

  const normalizeProject = (item = {}) => {
    const rmUsers = (Array.isArray(item?.rm_users) ? item.rm_users : [])
      .map((user) => ({
        user_id: user?.user_id || user?.id,
        name: user?.name || user?.user || "",
      }))
      .filter((user) => user.user_id);
    const rmIds = rmUsers.length
      ? rmUsers.map((user) => String(user.user_id))
      : Array.isArray(item?.rm_ids)
        ? item.rm_ids.map(String)
        : [];
    const rmNames = Array.isArray(item?.rm_names)
      ? item.rm_names
      : item?.rm_name
        ? String(item.rm_name).split(",").map((name) => name.trim()).filter(Boolean)
        : rmUsers.map((user) => user.name).filter(Boolean);
    const users = rmUsers.length
      ? rmUsers
      : rmIds.map((id, index) => ({ user_id: id, name: rmNames[index] || `RM ${id}` }));
    return {
      project_id: item?.project_id || item?.id || "",
      project_name: item?.project || item?.project_name || item?.name || "",
      zone: item?.zone || item?.zone_name || "",
      rm_users: users,
      rm_ids: users.map((user) => String(user.user_id)),
      rm_name: (item?.rm_name || rmNames.join(", ")).trim(),
    };
  };

  const loadZones = async () => {
    if (!hasCookie("token")) return;
    try {
      const zones = await getZoneList(authHeader());
      setZoneList(zones.filter((zone) => zone.status !== false && zone.zone_name));
    } catch (error) {
      setZoneList([]);
      toast.error(error?.response?.data?.message || "Failed to load zones", { autoClose: 2500 });
    }
  };

  const loadProjectsByZone = async (zone) => {
    setProjectList([]);
    setSelectedProjectIds([]);
    if (!zone?.zone_id && !zone?.zone_name) return;
    if (!hasCookie("token")) return;
    setProjectsLoading(true);
    try {
      const query = zone.zone_id
        ? `zone_id=${zone.zone_id}`
        : `zone=${encodeURIComponent(zone.zone_name)}`;
      const { data } = await axios.get(`${PROJECT_MASTER_API}?${query}`, authHeader());
      const raw = Array.isArray(data?.data) ? data.data : [];
      setProjectList(raw.map(normalizeProject).filter((project) => project.project_id && project.project_name));
    } catch (error) {
      setProjectList([]);
      toast.error(error?.response?.data?.message || "Failed to load projects", { autoClose: 2500 });
    } finally {
      setProjectsLoading(false);
    }
  };

  const loadCpAssignments = async (userId) => {
    if (!userId || !hasCookie("token")) return [];
    try {
      const { data } = await axios.get(`${CP_PROJECT_ASSIGN_API}?user_id=${userId}`, authHeader());
      const assignments = Array.isArray(data?.data?.assignments) ? data.data.assignments : [];
      applyAssignments(userId, assignments);
      return assignments;
    } catch (error) {
      return [];
    }
  };

  const openAssignRm = (userCode) => {
    const row = dataList?.find((item) => item?.user_code === userCode);
    const userId = row?.user_id || "";
    setAssignRmUserId(userId);
    setSelectedZone(null);
    setProjectList([]);
    setSelectedProjectIds([]);
    setCurrentAssignments([]);
    setShowAssignRm(true);
    loadZones();
    if (userId) loadCpAssignments(userId);
  };

  const closeAssignRm = () => {
    setShowAssignRm(false);
    setAssignRmUserId("");
    setSelectedZone(null);
    setProjectList([]);
    setSelectedProjectIds([]);
    setCurrentAssignments([]);
  };

  const selectedProjects = projectList.filter((project) =>
    selectedProjectIds.map(String).includes(String(project.project_id))
  );

  const assignRmHandler = async () => {
    if (!assignRmUserId) {
      toast.error("Channel Partner not found", { autoClose: 2500 });
      return;
    }
    if (!selectedZone) {
      toast.error("Zone is required", { autoClose: 2500 });
      return;
    }
    if (!selectedProjects.length) {
      toast.error("Select at least one project", { autoClose: 2500 });
      return;
    }
    if (!hasCookie("token")) return;

    setAssignRmSaving(true);
    let lastAssignments = null;
    const failed = [];
    try {
      const assignedNames = [];
      for (const project of selectedProjects) {
        try {
          const response = await axios.post(
            `${Baseurl}/db/channel/cp-project-assign/round-robin`,
            {
              user_id: Number(assignRmUserId),
              zone_id: Number(selectedZone.zone_id),
              project_id: Number(project.project_id),
            },
            authHeader()
          );
          lastAssignments = response?.data?.data?.assignments || lastAssignments;
          const rmName = response?.data?.data?.assigned_rm?.name;
          if (rmName) assignedNames.push(rmName);
        } catch (error) {
          failed.push(error?.response?.data?.message || project.project_name);
        }
      }
      if (lastAssignments) applyAssignments(assignRmUserId, lastAssignments);
      if (failed.length) {
        toast.error(failed.join(". "), { autoClose: 3500 });
      } else {
        const name = assignedNames[assignedNames.length - 1];
        toast.success(name ? `Assigned to ${name}.` : "Project assigned to Channel Partner", { autoClose: 2500 });
        setSelectedProjectIds([]);
      }
    } finally {
      setAssignRmSaving(false);
    }
  };

  const removeAssignment = async (projectId) => {
    if (!assignRmUserId || !projectId || !hasCookie("token")) return;
    try {
      const response = await axios.delete(
        `${CP_PROJECT_ASSIGN_API}?user_id=${assignRmUserId}&project_id=${projectId}`,
        authHeader()
      );
      const assignments = response?.data?.data?.assignments || [];
      applyAssignments(assignRmUserId, assignments);
      toast.success(response?.data?.message || "Project removed from Channel Partner", { autoClose: 2500 });
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to remove project", { autoClose: 2500 });
    }
  };

  useEffect(() => {
    if (!(isBstProfile || isRmRole(userInfo?.role_id)) || !Array.isArray(dataList) || !dataList.length || !hasCookie("token")) return;
    let cancelled = false;
    const loadAll = async () => {
      const entries = await Promise.all(
        dataList.map(async (cp) => {
          if (!cp?.user_id) return null;
          try {
            const { data } = await axios.get(
              `${CP_PROJECT_ASSIGN_API}?user_id=${cp.user_id}`,
              authHeader()
            );
            const assignments = Array.isArray(data?.data?.assignments) ? data.data.assignments : [];
            return [cp.user_id, assignments];
          } catch (error) {
            return null;
          }
        })
      );
      if (cancelled) return;
      setAssignmentMap((prev) => {
        const next = { ...prev };
        entries.filter(Boolean).forEach(([userId, assignments]) => {
          next[userId] = formatAssignmentNames(assignments);
        });
        return next;
      });
      setAssignmentDetails((prev) => {
        const next = { ...prev };
        entries.filter(Boolean).forEach(([userId, assignments]) => {
          next[userId] = assignments;
        });
        return next;
      });
    };
    loadAll();
    return () => {
      cancelled = true;
    };
  }, [dataList, isBstProfile, userInfo?.role_id]);

  const columns = [


    {
      name: 'user_code',
      label: "Account ID",
      options: {
        filter: false,
        customHeadRender: (columnMeta, updateDirection) => (
          <th className="text-center" style={{ background: clientBtnColor ? clientBtnColor : `#293790`, color: 'white', paddingLeft: "15px" }}   >
            {columnMeta.label}
          </th>
        ),
        customBodyRender: (value, tableMeta, updateValue) => {
          return (
            <div className='status_box fw-bold text-center' style={{ color: "#293790" }} >
              {value}
            </div>
          )
        }
      }
    },
    {
      name: 'user',
      label: "Account Name",
      options: {
        filter: false,
        customHeadRender: (columnMeta, updateDirection) => (
          <th className="text-center" style={{ background: clientBtnColor ? clientBtnColor : `#293790`, color: 'white', paddingLeft: "15px" }}   >
            {columnMeta.label}
          </th>
        ),
        customBodyRender: (value, tableMeta, updateValue) => {
          return (
            <div className='status_box text-center' style={{ color: "#293790" }}>
              <Link href={`/partner/ChannelPartnersDetails?id=${tableMeta?.rowData[0]}&mode=view`} className='fw-bold text-decoration-underline'>
                {value}
              </Link>
            </div>
          )
        }
      },

    },
    {
      name: "operating_location",
      label: "Operating Location",
      options: {
        filter: false,
        customHeadRender: (columnMeta) => (
          <th
            className="text-center"
            style={{
              background: clientBtnColor ? clientBtnColor : "#293790",
              color: "white",
              paddingLeft: "15px"
            }}
          >
            {columnMeta.label}
          </th>
        ),
        customBodyRender: (value) => {
          return (
            <div className="status_box text-center" style={{ color: "#293790" }}>
              {value || "-"}
            </div>
          );
        }
      }
    },
    {
      name: "zone_name",
      label: "Zone",
      options: {
        filter: false,
        customHeadRender: (columnMeta) => (
          <th
            className="text-center"
            style={{
              background: clientBtnColor ? clientBtnColor : "#293790",
              color: "white",
              paddingLeft: "15px"
            }}
          >
            {columnMeta.label}
          </th>
        ),
        customBodyRender: (value) => {
          return (
            <div className="status_box text-center" style={{ color: "#293790" }}>
              {value || "-"}
            </div>
          );
        }
      }
    },
    //city
    {
      name: "db_city.city_name",
      label: "City",
      options: {
        filter: false,
        customHeadRender: (columnMeta) => (
          <th
            className="text-center"
            style={{
              background: clientBtnColor ? clientBtnColor : "#293790",
              color: "white",
              paddingLeft: "15px"
            }}
          >
            {columnMeta.label}
          </th>
        ),
        customBodyRender: (value, tableMeta) => {
          return (
            <div className="status_box text-center" style={{ color: "#293790" }}>
              <Link
                href={`/partner/ChannelPartnersDetails?id=${tableMeta?.rowData[0]}&mode=view`}
                className="fw-bold text-decoration-underline"
              >
                {value}
              </Link>
            </div>
          );
        }
      }
    },
    //State
    {
      name: "db_state.state_name",
      label: "State",
      options: {
        filter: false,
        customHeadRender: (columnMeta) => (
          <th
            className="text-center"
            style={{
              background: clientBtnColor ? clientBtnColor : "#293790",
              color: "white",
              paddingLeft: "15px"
            }}
          >
            {columnMeta.label}
          </th>
        ),
        customBodyRender: (value, tableMeta) => {
          return (
            <div className="status_box text-center" style={{ color: "#293790" }}>
              <Link
                href={`/partner/ChannelPartnersDetails?id=${tableMeta?.rowData[0]}&mode=view`}
                className="fw-bold text-decoration-underline"
              >
                {value}
              </Link>
            </div>
          );
        }
      }
    },
    {
      name: 'createdAt',
      label: "Created Date",
      options: {
        filter: false,
        customHeadRender: (columnMeta, updateDirection) => (
          <th className="text-center" style={{ background: clientBtnColor ? clientBtnColor : `#293790`, color: 'white', paddingLeft: "15px" }}   >
            {columnMeta.label}
          </th>
        ),
        customBodyRender: (value, tableMeta, updateValue) => {
          if (!value) {
            return (
              <div className='status_box text-center' style={{ color: "#667799" }}>
                ---------
              </div>
            )
          }
          const date = new Date(value);
          if (isNaN(date.getTime())) {
            return (
              <div className='status_box text-center' style={{ color: "#667799" }}>
                ---------
              </div>
            )
          }
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
          const year = date.getFullYear();
          return (
            <div className='status_box text-center' style={{ color: "#667799" }}>
              {`${day}/${month}/${year}`}
            </div>
          )
        }

      }
    },
    // {
    //   name: 'lead_count',
    //   label: "Leads Count",
    //   options: {
    //     filter: false,
    //     customHeadRender: (columnMeta, updateDirection) => (
    //       <th className="text-center" style={{ background: clientBtnColor ? clientBtnColor : `#293790`, color: 'white', paddingLeft: "15px" }}   >
    //         {columnMeta.label}
    //       </th>
    //     ),
    //     customBodyRender: (value, tableMeta, updateValue) => {
    //       return (
    //         <div className='status_box text-center' style={{ color: "#667799" }}>
    //           {value}
    //         </div>
    //       )
    //     }
    //   }
    // },
    {
      name: 'cp_lead_count',
      label: "C.P Leads Count",
      options: {
        display: (userInfo?.role_id != 1 && selectedOption != 'Channel Partner') ? true : false,
        filter: false,
        customHeadRender: (columnMeta, updateDirection) => (
          <th className="text-center" style={{ background: clientBtnColor ? clientBtnColor : `#293790`, color: 'white', paddingLeft: "15px" }}   >
            {columnMeta.label}
          </th>
        ),
        customBodyRender: (value, tableMeta, updateValue) => {
          return (
            <div className='status_box text-center' style={{ color: "#667799" }}>
              {value}
            </div>
          )
        }
      }
    },
    // {
    //   name: 'booking_count',
    //   label: "Bookings Count",
    //   options: {
    //     filter: false,
    //     customHeadRender: (columnMeta, updateDirection) => (
    //       <th className="text-center" style={{ background: clientBtnColor ? clientBtnColor : `#293790`, color: 'white', paddingLeft: "15px" }}   >
    //         {columnMeta.label}
    //       </th>
    //     ),
    //     customBodyRender: (value, tableMeta, updateValue) => {
    //       return (
    //         <div className='status_box text-center' style={{ color: "#667799" }}>
    //           {value}
    //         </div>
    //       )
    //     }
    //   }
    // },
    {
      name: 'reportToUser',
      label: "Assigned to",
      options: {
        filter: true,
        customHeadRender: (columnMeta, updateDirection) => (
          <th className="text-center" style={{ background: clientBtnColor ? clientBtnColor : `#293790`, color: 'white', paddingLeft: "15px" }}   >
            {columnMeta.label}
          </th>
        ),
        customBodyRender: (value, tableMeta, updateValue) => {
          return (
            <div className='status_box fw-bold text-center' style={{ color: "#293790" }}>
              {value && <span  >{value}</span>}
              {/* {value && <span  >{value}</span>} */}
              {/* {userInfo?.user==value?.user ? "" : value?.user} */}
            </div>
          )
        }
      }
    },
    {
      name: 'assignedToRm',
      label: "Assigned TO RM",
      options: {
        filter: true,
        display: selectedOption === "Channel Partner",
        customHeadRender: (columnMeta) => (
          <th className="text-center" style={{ background: clientBtnColor ? clientBtnColor : `#293790`, color: 'white', paddingLeft: "15px" }}   >
            {columnMeta.label}
          </th>
        ),
        customBodyRender: (value, tableMeta) => {
          const names = String(value || "")
            .split(",")
            .map((name) => name.trim())
            .filter(Boolean);
          if (!names.length) {
            return (
              <div className='status_box fw-bold text-center' style={{ color: "#293790" }}>
                -
              </div>
            );
          }
          const userCode = tableMeta?.rowData?.[0];
          const cp = dataList?.find((item) => item?.user_code === userCode);
          return (
            <div className='status_box fw-bold text-center' style={{ color: "#293790" }}>
              {names.map((name, index) => (
                <span key={`${name}-${index}`}>
                  {index > 0 ? ", " : ""}
                  <button
                    type="button"
                    onClick={() => openRmDetails(cp?.user_id, name)}
                    className="fw-bold text-decoration-underline border-0 bg-transparent p-0"
                    style={{ color: "#293790" }}
                  >
                    {name}
                  </button>
                </span>
              ))}
            </div>
          );
        }
      }
    },
    {
      name: 'user_status',
      label: "Status",
      options: {
        filter: true,
        customHeadRender: (columnMeta, updateDirection) => (
          <th className="text-center" style={{ background: clientBtnColor ? clientBtnColor : `#293790`, color: 'white', paddingLeft: "15px" }}   >
            {columnMeta.label}
          </th>
        ),
        customBodyRender: (value, tableMeta, updateValue) => {
          return (
            <div className='status_box text-center'>
              {value === "active" ? <span className='active status_btn'>active</span> :
                <span className='inactive status_btn'>inactive</span>}
            </div>
          )
        }
      }
    },
    {
      name: 'db_user_profile',
      label: "Designation",
      options: {
        filter: true,
        customHeadRender: (columnMeta, updateDirection) => (
          <th className="text-center" style={{ background: clientBtnColor ? clientBtnColor : `#293790`, color: 'white', paddingLeft: "15px" }}   >
            {columnMeta.label}
          </th>
        ),
        customBodyRender: (value, tableMeta, updateValue) => {
          return (
            <div className='status_box fw-bold text-center' style={{ color: "#293790" }} >
              {value}
            </div>
          )
        }
      }
    },
    //group
    {
      name: 'group',
      label: "Group",
      options: {
        filter: true,
        customHeadRender: (columnMeta, updateDirection) => (
          <th className="text-center" style={{ background: clientBtnColor ? clientBtnColor : `#293790`, color: 'white', paddingLeft: "15px" }}   >
            {columnMeta.label}
          </th>
        ),
        customBodyRender: (value, tableMeta, updateValue) => {
          return (
            <div className='status_box fw-bold text-center' style={{ color: "#293790" }} >
              {value}
            </div>
          )
        }
      }
    },
    {
      name: 'cpt_id',
      label: "Partner Type",
      options: {
        filter: false,
        customHeadRender: (columnMeta, updateDirection) => (
          <th className="text-center" style={{ background: clientBtnColor ? clientBtnColor : `#293790`, color: 'white', paddingLeft: "15px" }}   >
            {columnMeta.label}
          </th>
        ),
        customBodyRender: (value, tableMeta, updateValue) => {
          const partnerType = partnerTypes?.find(data => data.cpt_id === value);
          return (
            <div className='status_box fw-bold text-center' style={{ color: "#293790" }} >
              {partnerType ? partnerType.name : value || 'N/A'}
            </div>
          )
        }
      }
    },
    {
      name: 'user_code',
      label: "Action",
      options: {
        filter: false,
        download: false,
        viewColumns: false,
        display: (
          ((userInfo?.role_id == null || userInfo?.role_id == 3) && (selectedOption == "Channel Partner" || (selectedOption == "BST" && userInfo?.role_id == null)))
          || (isBstProfile && selectedOption === "Channel Partner")
          || (isRmProfile && selectedOption === "Channel Partner")
        ) ? true : false,
        customHeadRender: (columnMeta, updateDirection) => (
          <th className="text-center" style={{ background: clientBtnColor ? clientBtnColor : `#293790`, color: 'white', paddingLeft: "15px" }}   >
            {columnMeta.label}
          </th>
        ),
        customBodyRender: (value, tableMeta, updateValue) => {
          if (isRmProfile) {
            const row = dataList?.find((item) => item?.user_code === value);
            const canSchedule = row?.cpl_id != null && row?.cpl_id !== "";
            return (
              <div className="table_btns justify-content-center align-items-center">
                <button
                  className="action_btn"
                  title={canSchedule ? "Schedule Visit" : "Lead record not found"}
                  disabled={!canSchedule}
                  onClick={() => canSchedule && openScheduleVisit(value)}
                >
                  <EditIcon />
                </button>
              </div>
            );
          }
          if (isBstProfile) {
            return (
              <div className="table_btns justify-content-center align-items-center">
                <button
                  onClick={() => openAssignRm(value)}
                  style={{ background: clientBtnColor ? clientBtnColor : `#293790`, color: "white", padding: "6px", borderRadius: "20px", border: "white" }}
                  className='pe-3 ps-3'
                  title='Assign TO RM'>
                  Assign TO RM
                </button>
              </div>
            )
          }
          const row = dataList?.find((item) => item?.user_code === value);
          return (
            <div className="table_btns justify-content-center align-items-center">
              <button
                onClick={() => { setShowAssignTo(value); setAssignPrefill(row?.reportToUser?.user_id ?? row?.report_to ?? "") }}
                style={{ background: clientBtnColor ? clientBtnColor : `#293790`, color: "white", padding: "6px", borderRadius: "20px", border: "white" }}
                className='pe-3 ps-3'
                title='Assign - To'>
                Assign to
              </button>
            </div>
          )
        }
      }
    },
    {
      name: 'reportToUserId',
      label: "ReportToUserId",
      options: {
        filter: false,
        viewColumns: false,
        download: false,
        display: false
      }
    },
  ];



  const CustomToolbar = () => {
    return (
      <div className=' d-flex justify-content-start gap-3 align-items-center '>
        <p className='fw-bold ' style={{ fontSize: "18px" }} >{title}</p>
        {/* <DateRange value={value} setValue={setValue} getData={getDataList} filterType={"Channel_Partner"} /> */}
        {/* {
                hasCookie("channel") &&(userInfo?.role_id==null || userInfo?.role_id==3) &&(
                    <div style={{ marginBottom: '0' }}>
        <select 
          value={selectedOption} 
          onChange={handleChange} 
          style={{
            display: 'block',
            width: '100%',
            padding: '10px 10px',
            fontSize: '1rem',
            fontWeight: '400',
            lineHeight: '1.5',
            color: '#495057',
            backgroundColor: '#fff',
            backgroundClip: 'padding-box',
            border: '1px solid #ced4da',
            borderRadius: '.25rem',
            transition: 'border-color .15s ease-in-out,box-shadow .15s ease-in-out',
            marginTop: '8px'
          }}
        >
          <option value="Channel Partner">Channel Partner</option>
          <option value="BST">BST</option>
          <option value="Director">Director</option>
        </select>
      </div>
                )
               } */}

      </div>
    );
  }
  const handleChange = (event) => {
    const value = event.target.value;
    setCookie("cp_selected", value)
    setSelectedOption(value);
    console.log(`Selected option: ${value}`);
    // Add any additional logic you want to handle on selection change
  };
  // const handleRowClick = async (rowData, rowMeta, val) => {
  //     console.log(rowData,"rowMeta",rowMeta, val)
  //     const data = rowMeta?.reduce((accu, value) => {
  //         accu.push(dataList[value.dataIndex].user_code);
  //         return accu; // Return the accumulator
  //     }, []);
  //     setUserData([...data]);
  //    )}

  const handleDelete = async (rowsDeleted) => {
    let toastShown = false;
    const deletedIndices = rowsDeleted.data.map((row) => row.dataIndex);
    const userIds = deletedIndices.map((index) => dataList[index].user_id);

    if (hasCookie("token")) {
      const token = getCookie("token");
      const db_name = getCookie("db_name");

      const headers = {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        db: db_name,
        pass: "pass",
      };

      try {
        // Send a single request with all user IDs
        const response = await axios.put(
          `${Baseurl}/db/users/delete`,
          { user_ids: userIds }, // Send all IDs in one payload
          { headers }
        );
        if (response.status === 200 || response.status === 201) {
          if (!toastShown) {
            toast.success(response?.data?.message, { autoClose: 2500 });
            toastShown = true;
          }
          getDataList();
        } // Refresh the data list after successful deletion
      } catch (error) {
        console.error(error?.response?.data?.message || "Something went wrong!");
        if (error?.response?.data?.status === 422) {
          if (!toastShown) {
            toast.error(error?.response?.data?.message, { autoClose: 2500 });
            toastShown = true;
          }
        } else if (error?.response?.data?.message) {
          if (!toastShown) {
            toast.error(error?.response?.data?.message, { autoClose: 2500 });
            toastShown = true;
          }
        } else {
          if (!toastShown) {
            toast.error("Something went wrong!", { autoClose: 2500 });
            toastShown = true;
          }
        }
      }
    }
  };
  function formatDate(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${day}/${month}/${year}`;
  }

  const matchDateSearch = (dateValue, searchQuery) => {
    if (dateValue === null || dateValue === undefined || dateValue === '') return false;
    if (!searchQuery?.trim()) return false;

    const q = searchQuery.trim().toLowerCase();
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return String(dateValue).toLowerCase().includes(q);

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = String(d.getFullYear());
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

    const variants = [
      formatDate(dateValue),
      `${day}/${month}/${year}`,
      `${day}-${month}-${year}`,
      `${day}/${month}`,
      `${day}-${month}`,
      `${month}/${year}`,
      year,
      day,
      months[d.getMonth()],
      dateValue.toString(),
    ].map((v) => v.toLowerCase());

    return variants.some((v) => v.includes(q));
  };

  const customTableSearch = (searchQuery, currentRow, columns) => {
    if (!searchQuery?.trim()) return true;
    const q = searchQuery.toLowerCase().trim();

    for (let i = 0; i < columns.length; i++) {
      const colName = columns[i]?.name;
      const cell = currentRow[i];

      if (cell == null || cell === '') continue;

      if (colName === 'createdAt') {
        if (matchDateSearch(cell, searchQuery)) return true;
        continue;
      }

      if (colName === 'cpt_id') {
        const partnerType = partnerTypes?.find(
          (data) => data.cpt_id === cell || data.cpt_id === Number(cell)
        );
        const partnerName = partnerType?.name || '';
        if (
          partnerName.toLowerCase().includes(q) ||
          String(cell).toLowerCase().includes(q)
        ) {
          return true;
        }
        continue;
      }

      const searchText = Array.isArray(cell)
        ? cell.filter((v) => v != null && v !== '').join(' ')
        : String(cell);

      if (searchText.toLowerCase().includes(q)) return true;
    }

    return false;
  };

  const options = {
    enableNestedDataAccess: ".",
    selectableRows: userInfo?.isDB ? 'multiple' : 'none',
    responsive: "standard",
    // onRowSelectionChange : handleRowClick,
    onRowsDelete: handleDelete,
    downloadOptions: { filename: "ChannelPartnerList" },
    enableNestedDataAccess: ".",
    filterType: 'multiselect',
    viewColumns: false,
    customSearch: customTableSearch,
    onDownload: (buildHead, buildBody, columns, data) => {
      const workbook = XLSX.utils.book_new();
      let range;
      if (hasCookie("Channel_PartnerFilter")) {
        range = JSON.parse(getCookie("Channel_PartnerFilter"))
      }
      const filteredColumns = columns.slice(0, -2); // Remove the last two columns

      // Find the index of cpt_id column
      const cptIdColumnIndex = filteredColumns.findIndex(col => col.name === 'cpt_id');

      const filteredData = data.map(row => {
        const rowData = filteredColumns.map((col, index) => {
          let cellValue = row.data[index];

          // If this is the cpt_id column, map the value to partner type name
          if (index === cptIdColumnIndex && cellValue !== null && cellValue !== undefined) {
            const partnerType = partnerTypes?.find(pt => pt.cpt_id === cellValue || pt.cpt_id === Number(cellValue));
            return partnerType ? partnerType.name : cellValue;
          }

          return cellValue;
        });
        return rowData;
      });

      const customData = [
        ["Partner Report"],
        [],
        [`Filter by:`],
        [],
        [`Date Range: ${range?.f_date ? formatDate(range?.f_date) : formatDate(start)} to ${range?.t_date ? formatDate(range?.t_date) : formatDate(end)}`],
        [],
        [],
        filteredColumns.map(col => col.label || col.name),
        ...filteredData,
      ];

      const worksheet = XLSX.utils.aoa_to_sheet(customData);

      worksheet['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 1, c: filteredColumns.length - 1 } }, // Merge A1 and A2 for the title
        { s: { r: 2, c: 0 }, e: { r: 3, c: filteredColumns.length - 1 } }, // Merge A3 for the date range
        { s: { r: 4, c: 0 }, e: { r: 4, c: filteredColumns.length - 1 } }, // Merge A3 for the date range
        { s: { r: 5, c: 0 }, e: { r: 6, c: filteredColumns.length - 1 } }, // Merge A3 for the date range

      ];
      worksheet['!cols'] = [
        { wch: 14 },
        { wch: 20 },
        { wch: 22 },
        { wch: 12 },
        { wch: 14 },
        { wch: 18 },
        { wch: 14 },
        { wch: 24 },
        { wch: 20 },
      ];
      XLSX.utils.book_append_sheet(workbook, worksheet, "PartnerReport");
      XLSX.writeFile(workbook, "PartnerReport.xlsx");
      return false;
    }
  };



  const updateUserHandler = async () => {
    let toastShown = false;
    const assignTo = getSelectedAssignTo();
    for (const element of userData) {
      if (!hasCookie("token")) return;

      const token = getCookie("token");
      const db_name = getCookie("db_name");

      const header = {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          db: db_name,
          pass: "pass"
        },
      };

      try {
        const response = await axios.put(`${Baseurl}/db/users`, {
          db_name: db_name,
          user_code: element,
          report_to: assignTo,
          isAssigned: true
        }, header);

        if (response.status === 200 || response.status === 201) {
          if (!toastShown) {
            toast.success(response?.data?.message, { autoClose: 2500 });
            toastShown = true;
          }
          setoldAssignTo('');
          setoldAssignToRm?.('');
          setShowModal(false);
          setUserData([])
          if (channelPartnerFilter) {
            getDataList(channelPartnerFilter)
          }
          else {

            getDataList();
          }
        }
      } catch (error) {
        console.log(error)
        if (error?.response?.data?.status === 422) {
          if (!toastShown) {
            toast.error(error?.response?.data?.message, { autoClose: 2500 });
            toastShown = true;
          }
        } else if (error?.response?.data?.message) {
          if (!toastShown) {
            toast.error(error?.response?.data?.message, { autoClose: 2500 });
            toastShown = true;
          }
        } else {
          if (!toastShown) {
            toast.error("Something went wrong!", { autoClose: 2500 });
            toastShown = true;
          }
        }
      }
    }
  };
  const mappedDataList = dataList?.map(list => ({
    ...list,
    cpt_id: list?.cpt_id, // Preserve the actual cpt_id value, don't overwrite with role_name
    reportToUser: [list?.reportToUser?.user]?.filter(d => d !== null && d !== undefined),
    assignedToRm: assignmentMap[list?.user_id] || rmNamesFromUser(list) || "",
    user_status: list?.user_status ? "active" : "inactive",
    db_user_profile: [list?.db_user_profile?.db_designation?.designation]?.filter(d => d !== null && d !== undefined),
    reportToUserId: list?.reportToUser?.user_id,
    zone_name: list?.zone_name || list?.zone?.zone_name || list?.db_zone?.zone_name || "",
  }))

  return (
    <>
      {
        loader ? <div className="miuiTable channelTable"><Loader /></div>
          :
          (
            <div className="miuiTable channelTable">
              <MUIDataTable
                title={<CustomToolbar />}
                data={mappedDataList}
                // data={mappedDataList}
                columns={columns}
                // options={options}
                options={{
                  ...options,
                  customFilterDialogFooter: () => (
                    <div
                      style={{
                        minWidth: "400px", // Set consistent width
                      }}
                    />
                  ),
                }}
              />
              <div>
                {userData.length ?
                  <div className="table_btns d-flex align-items-center justify-content-center gap-3 mt-4">


                    <button onClick={() => { setActionMode('Cancel'); setShowModal(false); setUserData([]) }} className=" btn btn-danger rounded-5">
                      Cancel
                    </button>
                    <button onClick={() => { setActionMode('Assignto'); setShowModal(true) }} style={{ backgroundColor: clientBtnColor }} className="btn  rounded-5 text-white" >
                      Assign to
                    </button>

                  </div>
                  : <></>
                }
              </div>
            </div>
          )
      }


      <Modal className="commonModal" show={showModal} onHide={() => { setShowModal(false); setoldAssignTo(''); setoldAssignToRm?.(''); }} style={{}}>
        <Modal.Header closeButton>
          <Modal.Title>  Assign To </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="add_user_form">
            <div className="row">
              {selectedOption === "Channel Partner" ? (
                <>
                  <div className="col-xl-12 col-md-12 col-sm-12 col-12">
                    <div className="input_box">
                      <label className="form-label">Assign To (BST)</label>
                      <Select
                        id="select-bst"
                        isSearchable={true}
                        isClearable={true}
                        placeholder="Search and select BST user..."
                        noOptionsMessage={() => "No BST users found"}
                        filterOption={userSearchFilterOption}
                        options={getBstUserOptions()}
                        value={getSelectValue(oldAssignTo)}
                        onChange={(e) => {
                          setoldAssignTo(e?.value || "")
                          if (e?.value) setoldAssignToRm?.("")
                        }}
                        styles={{
                          control: (base) => ({
                            ...base,
                            minHeight: '38px',
                          }),
                          menu: (base) => ({
                            ...base,
                            zIndex: 9999,
                          }),
                        }}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="col-xl-12 col-md-12 col-sm-12 col-12">
                  <div className="input_box">
                    <label className="form-label">Assign To</label>
                    <Select
                      id="select"
                      defaultValue={""}
                      isSearchable={true}
                      isClearable={true}
                      placeholder="Search and select user..."
                      noOptionsMessage={() => "No users found"}
                      filterOption={userSearchFilterOption}
                      options={userListFilterBasisOfRole(selectedOption, usersList)}
                      value={getSelectValue(oldAssignTo)}
                      onChange={(e) => {
                        setoldAssignTo(e?.value || "")
                      }}
                      styles={{
                        control: (base) => ({
                          ...base,
                          minHeight: '38px',
                        }),
                        menu: (base) => ({
                          ...base,
                          zIndex: 9999,
                        }),
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button className=" btn btn-danger rounded-5" onClick={() => { setShowModal(false); setoldAssignTo(''); setoldAssignToRm?.(''); }}>Cancel</button>
          <button style={{ background: clientBtnColor }} className='btn rounded-5 text-white' onClick={updateUserHandler} >
            Submit
          </button>
        </Modal.Footer>
      </Modal>

      <Modal className="commonModal" show={showAssignRm} onHide={closeAssignRm}>
        <Modal.Header closeButton>
          <Modal.Title>Assign TO RM</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="add_user_form">
            <div className="row">
              <div className="col-xl-12 col-md-12 col-sm-12 col-12">
                <div className="input_box">
                  <label className="form-label">Zone</label>
                  <Select
                    id="assign-rm-zone"
                    isSearchable={true}
                    isClearable={true}
                    placeholder="Select Zone"
                    noOptionsMessage={() => "No zones found"}
                    options={zoneList.map((zone) => ({
                      value: String(zone.zone_id),
                      label: zone.zone_name,
                      zone,
                    }))}
                    value={
                      selectedZone
                        ? { value: String(selectedZone.zone_id), label: selectedZone.zone_name }
                        : null
                    }
                    onChange={(option) => {
                      const zone = option?.zone || null;
                      setSelectedZone(zone);
                      loadProjectsByZone(zone);
                    }}
                    styles={{
                      control: (base) => ({ ...base, minHeight: "38px" }),
                      menu: (base) => ({ ...base, zIndex: 9999 }),
                    }}
                  />
                </div>
              </div>
              <div className="col-xl-12 col-md-12 col-sm-12 col-12 mt-3">
                <div className="input_box">
                  <label className="form-label">Project</label>
                  <Select
                    id="assign-rm-project"
                    isMulti
                    closeMenuOnSelect={false}
                    hideSelectedOptions={false}
                    components={{ Option: CheckboxOption }}
                    isSearchable={true}
                    isClearable={true}
                    isDisabled={!selectedZone || projectsLoading}
                    isLoading={projectsLoading}
                    placeholder={
                      !selectedZone
                        ? "Select Zone first"
                        : projectsLoading
                          ? "Loading projects..."
                          : "Select Project"
                    }
                    noOptionsMessage={() => "No projects found for this zone"}
                    options={projectList.map((project) => ({
                      value: String(project.project_id),
                      label: project.rm_users?.length
                        ? project.project_name
                        : `${project.project_name} (No RM)`,
                      isDisabled: !project.rm_users?.length,
                    }))}
                    value={selectedProjects.map((project) => ({
                      value: String(project.project_id),
                      label: project.project_name,
                    }))}
                    onChange={(options) => {
                      const ids = (options || []).map((option) => String(option.value));
                      setSelectedProjectIds(ids);
                    }}
                    styles={{
                      control: (base) => ({ ...base, minHeight: "38px" }),
                      menu: (base) => ({ ...base, zIndex: 9999 }),
                    }}
                  />
                </div>
              </div>
              {currentAssignments.length ? (
                <div className="col-12 mt-3">
                  <label className="form-label">Assigned</label>
                  {currentAssignments.map((item) => (
                    <div
                      key={item.project_id}
                      className="d-flex justify-content-between align-items-center gap-2 mb-2"
                    >
                      <div style={{ color: "#293790" }}>
                        <div className="fw-bold">{item.project || item.project_name}</div>
                        <div>{item.rm_name || formatAssignmentNames([item]) || "-"}</div>
                      </div>
                      <button
                        type="button"
                        className="btn btn-danger rounded-5"
                        onClick={() => removeAssignment(item.project_id)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button className="btn btn-danger rounded-5" onClick={closeAssignRm} disabled={assignRmSaving}>
            Cancel
          </button>
          <button
            style={{ background: clientBtnColor }}
            className="btn rounded-5 text-white"
            onClick={assignRmHandler}
            disabled={assignRmSaving}
          >
            {assignRmSaving ? "Submitting..." : "Submit"}
          </button>
        </Modal.Footer>
      </Modal>

      <Modal show={showVisitModal} onHide={() => setShowVisitModal(false)} className="commonModal">
        <Modal.Header closeButton>
          <Modal.Title>Update info</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={submitScheduleVisit}>
            <Form.Group className="mb-2">
              <Form.Label>First Name</Form.Label>
              <Form.Control
                name="first_name"
                value={visitForm.first_name}
                onChange={handleVisitInput}
              />
              {visitErrors.first_name && <Form.Text className="text-danger">{visitErrors.first_name}</Form.Text>}
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Last Name</Form.Label>
              <Form.Control
                name="last_name"
                value={visitForm.last_name}
                onChange={handleVisitInput}
              />
              {visitErrors.last_name && <Form.Text className="text-danger">{visitErrors.last_name}</Form.Text>}
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Contact</Form.Label>
              <Form.Control
                name="contact"
                value={visitForm.contact}
                maxLength={10}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, "").slice(0, 10);
                  setVisitForm((prev) => ({ ...prev, contact: value }));
                }}
              />
              {visitErrors.contact && <Form.Text className="text-danger">{visitErrors.contact}</Form.Text>}
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={visitForm.email}
                onChange={handleVisitInput}
              />
              {visitErrors.email && <Form.Text className="text-danger">{visitErrors.email}</Form.Text>}
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Registration Date</Form.Label>
              <Form.Control
                readOnly
                value={visitForm.createdAt ? moment(visitForm.createdAt).format("DD-MM-YYYY") : ""}
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Stage</Form.Label>
              <Form.Control as="select" name="stage" value="VISIT" disabled>
                <option value="VISIT">VISIT</option>
              </Form.Control>
            </Form.Group>
            {(visitForm.stage === "FOLLOW UP" || visitForm.stage === "VISIT") && (
              <Form.Group className="mb-2">
                <Form.Label>{visitForm.stage === "VISIT" ? "Scheduled Date*" : "Date*"}</Form.Label>
                <Form.Control
                  type="date"
                  name={visitForm.stage === "VISIT" ? "schedule_visit_date" : "follow_up_date"}
                  value={
                    visitForm.stage === "VISIT"
                      ? String(visitForm.schedule_visit_date || "").slice(0, 10)
                      : String(visitForm.follow_up_date || "").slice(0, 10)
                  }
                  min={moment().format("YYYY-MM-DD")}
                  onChange={handleVisitInput}
                />
                {visitErrors.follow_up_date && (
                  <Form.Text className="text-danger">{visitErrors.follow_up_date}</Form.Text>
                )}
              </Form.Group>
            )}
            {visitForm.stage === "VISIT" && showScheduleTimeField && (
              <Form.Group className="mb-2">
                <Form.Label>Scheduled Time*</Form.Label>
                <Form.Control
                  type="time"
                  name="schedule_visit_time"
                  value={visitForm.schedule_visit_time || ""}
                  min={
                    String(visitForm.schedule_visit_date || "").slice(0, 10) === moment().format("YYYY-MM-DD")
                      ? moment().format("HH:mm")
                      : undefined
                  }
                  onChange={handleVisitInput}
                />
                {visitErrors.schedule_visit_time && (
                  <Form.Text className="text-danger">{visitErrors.schedule_visit_time}</Form.Text>
                )}
              </Form.Group>
            )}
            {visitForm.stage === "VISIT" && (
              <>
                <Form.Group className="mb-2">
                  <Form.Label>Project*</Form.Label>
                  <Form.Control
                    as="select"
                    name="project_id"
                    value={visitForm.project_id || ""}
                    onChange={(e) => {
                      const selected = visitProjectList?.find((project) => {
                        const id = project?.Id || project?.id || project?.project_id;
                        return String(id) === String(e.target.value);
                      });
                      const projectName = selected?.Project_Name__c || selected?.project_name || selected?.project || selected?.name || "";
                      setVisitForm((prev) => ({
                        ...prev,
                        project_id: e.target.value,
                        project_name: projectName,
                      }));
                    }}
                  >
                    <option value="" disabled>Select Project</option>
                    {visitProjectList?.map((project) => {
                      const id = project?.Id || project?.id || project?.project_id;
                      const name = project?.Project_Name__c || project?.project_name || project?.project || project?.name;
                      return (
                        <option key={id} value={id}>
                          {name}
                        </option>
                      );
                    })}
                  </Form.Control>
                  {visitErrors.project_id && <Form.Text className="text-danger">{visitErrors.project_id}</Form.Text>}
                </Form.Group>
                <Form.Group className="mb-2">
                  <Form.Label>Visit Type*</Form.Label>
                  <Form.Control
                    as="select"
                    name="visit_type"
                    value={visitForm.visit_type || ""}
                    onChange={handleVisitInput}
                  >
                    <option value="" disabled>Select Visit Type</option>
                    {visitTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Form.Control>
                  {visitErrors.visit_type && <Form.Text className="text-danger">{visitErrors.visit_type}</Form.Text>}
                </Form.Group>
              </>
            )}
            <Form.Group className="mb-2">
              <Form.Label>Remarks</Form.Label>
              <Form.Control
                name="remarks"
                value={visitForm.remarks || ""}
                onChange={handleVisitInput}
                placeholder="Enter Remarks"
              />
            </Form.Group>
            <Button
              type="button"
              className="float-end mt-3"
              style={{ background: "#ff5722", borderColor: "#ff5722" }}
              disabled={visitSaving}
              onClick={submitScheduleVisit}
            >
              {visitSaving ? "Saving..." : visitForm.stage === "VISIT" ? "Schedule Visit" : "Update"}
            </Button>
          </Form>
        </Modal.Body>
      </Modal>

      <Modal show={rmDetailsShow} onHide={() => setRmDetailsShow(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>RM Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead style={{ background: "#f5f7fb" }}>
                <tr>
                  <th>User ID</th>
                  <th>Name</th>
                  <th>Zone</th>
                  <th>State</th>
                  <th>city</th>
                </tr>
              </thead>
              <tbody>
                {rmDetailsRows.length ? (
                  rmDetailsRows.map((rm, idx) => (
                    <tr key={`${rm.user_id}-${idx}`}>
                      <td>{rm.user_id}</td>
                      <td>{rm.name}</td>
                      <td>{rm.zone || "-"}</td>
                      <td>{rm.state || "-"}</td>
                      <td>{rm.city || "-"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-3">
                      No RM details found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Modal.Body>
      </Modal>

    </>

  )
}

export default ManageUsersTable 