import React, { useEffect, useState } from "react";
import MUIDataTable from "mui-datatables";
import Link from "next/link";
import { Baseurl, filesUrl, isRmRole, isBstRole, getVisitDateLabel, showCpVisitScheduleColumns } from "../../../../Utils/Constants";
import { Button, Modal, Form, Table } from "react-bootstrap";
import { getCookie, hasCookie, setCookie } from "cookies-next";
import { toast } from "react-toastify";
import axios from "axios";
import Loader from "../../../Loader/Loader";
import DeleteIcon from "../../../Svg/DeleteIcon";
import EditIcon from "../../../Svg/EditIcon";
import moment from "moment";
import DateRange from "../../../DateRangeCustom/Daterange";
import Select from 'react-select';
import { fetchData } from '../../../../Utils/getReq';
import ViewIcon from "../../../Svg/ViewIcon";
import { useRouter } from "next/router";
import * as XLSX from "xlsx";

const CPRegisterLeadsTable = ({
  deleteConfirm,
  disableConfirm,
  setcurrObj,
  currObj,
  setdeleteshowConfirm,
  dataList,
  openEdtMdl,
  title,
  getDataList,
  loader,
  start,
  end,
  bstId, setBstId, statusId, setStatusId
}) => {

  const [userData, setUserData] = useState([])
  const router = useRouter()
  const [actionMode, setActionMode] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showModal2, setShowModal2] = useState(false)
  const [id, setId] = useState("")
  const userInfo = hasCookie("userInfo") ? JSON.parse(getCookie("userInfo")) : null;
  const currentRoleId =
    userInfo?.role_id !== undefined && userInfo?.role_id !== null
      ? Number(userInfo?.role_id)
      : undefined;
  const isBst = currentRoleId === 2;
  // Admin (and DB users) / RM can edit contact/email. BST must not.
  const canEditContactEmail = !isBst && (userInfo?.isDB || currentRoleId === 3 || isRmRole(userInfo?.role_id));
  const showScheduleTimeField = showCpVisitScheduleColumns(userInfo);
  const [formData, setFormData] = useState({
    cpl_id: '',
    first_name: '',
    last_name: '',
    contact: '',
    email: '',
    stage: 'OPEN',
    createdAt: '',
    remarks: "",
    follow_up_date: "",
    schedule_visit_date: "",
    schedule_visit_time: "",
    project_id: "",
    project_name: "",
    visit_type: ""
  });
  const [projectList, setProjectList] = useState([]);
  const visitTypeOptions = [
    { value: "Video Visit", label: "Video Visit" },
    { value: "Site Visit", label: "Site Visit" },
    { value: "Out Visit", label: "Out Visit" },
  ];
  const [errors, setErrors] = useState({})
  const [historyData, setHistoryData] = useState([])
  const clientBtnColor = hasCookie("clientBtnColor") ? getCookie("clientBtnColor") : "#61E25E"
  const [errorToast, setErrorToast] = useState(false);
  const [usersList, setUsersList] = useState([]);
  const userInfoCheck = hasCookie("userInfo") ? JSON.parse(getCookie("userInfo")) : null;

  async function getUsersList() {
    await fetchData("/db/users", setUsersList, errorToast, setErrorToast);
  }

  const getProjectList = async () => {
    if (!hasCookie("token")) return;

    const token = getCookie("token");
    const db_name = getCookie("db_name");
    const header = {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        db: db_name,
        m_id: 76,
      },
    };

    try {
      const projects = await axios.get(Baseurl + `/db/channel/lead/projects`, header);
      setProjectList(projects?.data?.data?.records || []);
    } catch (error) {
      if (error?.response?.data?.message) {
        toast.error(error?.response?.data?.message, { autoClose: 2500 });
      } else {
        toast.error("Something went wrong!", { autoClose: 2500 });
      }
    }
  };

  useEffect(() => {
    getUsersList();
    getProjectList();
  }, []);

  const getCurrentWeekDates = () => {
    const startDate = new Date(new Date().setDate(new Date().getDate() - new Date().getDay() + 1));
    const endDate = new Date(new Date().setDate(startDate.getDate() + 6));
    if (hasCookie("cpleadsFilter")) {

      let data = JSON.parse(getCookie("cpleadsFilter"))
      return { startDate: data?.f_date, endDate: data?.t_date }
    }
    else {
      return { startDate, endDate };
    }

  };

  const [value, setValue] = useState(getCurrentWeekDates());

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${date.getDate()}/${months[date.getMonth()]}/${date.getFullYear()}`;
  };

  const matchDateSearch = (dateValue, searchQuery) => {
    if (!dateValue || !searchQuery?.trim()) return false;
    const q = searchQuery.trim().toLowerCase();
    const d = moment(dateValue);
    if (!d.isValid()) return dateValue.toString().toLowerCase().includes(q);

    const variants = [
      formatDate(dateValue),
      d.format("DD/MM/YYYY"),
      d.format("DD-MM-YYYY"),
      d.format("DD/MMM/YYYY"),
      d.format("DD-MMM-YYYY"),
      d.format("YYYY-MM-DD"),
      d.format("DD/MM"),
      d.format("DD-MM"),
      d.format("DD/MMM"),
      d.format("DD-MMM"),
      d.format("DD"),
      d.format("MMM"),
      d.format("YYYY"),
      dateValue.toString(),
    ].map((v) => v.toLowerCase());

    return variants.some((v) => v.includes(q));
  };

  const customTableSearch = (searchQuery, currentRow, columns) => {
    if (!searchQuery?.trim()) return true;
    const q = searchQuery.toLowerCase().trim();

    for (let i = 0; i < columns.length; i++) {
      const cell = currentRow[i];
      if (cell == null || cell === "") continue;

      const colName = columns[i]?.name;
      if (colName === "createdAt" || colName === "follow_up_date") {
        if (matchDateSearch(cell, searchQuery)) return true;
      } else if (cell.toString().toLowerCase().includes(q)) {
        return true;
      }
    }
    return false;
  };

  const [isUser, setIsUser] = useState(false);
  const [isUserData, setIsUserData] = useState(null);
  const addUserHandler = async (id, assignedToId) => {
    const object = dataList?.find((item) => item?.cpl_id == id);
    const db_name = getCookie("db_name");
    const token = getCookie("token");
    const payload = {
      contact_number: object?.contact,
      cpt_id: 1,
      db_name: db_name,
      email: object?.email,
      role_id: 1,
      user: object?.first_name,
      user_l_name: object?.last_name,
      report_to: assignedToId,
      client_url: "http://18.61.246.105",
    }
    if (!hasCookie("token")) return;

    const header = {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        pass: "pass"
      },
    };

    try {

      const response = await axios.post(
        `${Baseurl}/db/users`,
        payload,
        header
      );
      if (response.status === 200 || response.status === 201) {
        setIsUser(true)
        // await updateUserhandler(true)
        toast.success("Mail Sent for Onboarding", { autoClose: 2500 });
      }
    } catch (error) {
      if (error?.response?.data?.status === 422) {
        const taskObject = error.response.data.data.reduce((obj, item) => {
          const [key, value] = Object.entries(item)[0];
          obj[key] = value;
          return obj;
        }, {});
        setErrorData(taskObject);
      }
      if (error?.response?.data?.message) {
        if (error?.response?.data?.message == "user existed in this db") {
          setIsUserData(error?.response?.data?.userData);
          setIsUser(true);
          if (error?.response?.data?.userData?.doc_verification == 0) {
            toast.info("User Already Onboard. Please check the pending request and resend the verification mail", { autoClose: 4000 });
          }
        } else {
          toast.error(error?.response?.data?.message, { autoClose: 2500 });
        }
      } else {
        toast.error("Something went wrong!", { autoClose: 2500 });
      }
      // setisLoading(false);
    }
  };


  const updateUserhandler = async (onBoradStage = false, isUserData) => {
    let newErrors = validateForm();

    if (Object.keys(newErrors).length === 0) {
      if (!hasCookie("token")) return;

      const token = getCookie("token");
      const db_name = getCookie("db_name");
      const header = {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          pass: "pass",
        },
      };
      let newFormData;
      if (onBoradStage && isUserData) {
        newFormData = { ...formData, db_name: db_name, client_url: "http://18.61.246.105", stage: isUserData?.doc_verification == 0 ? "LINK SENT" : isUserData?.doc_verification == 2 ? "ONBOARDED" : "" }
        toast.warn("User Already OnBoarded")
      } else if (onBoradStage) {
        newFormData = { ...formData, db_name: db_name, client_url: "http://18.61.246.105", stage: "LINK SENT" }
      } else {
        newFormData = { ...formData, db_name: db_name, client_url: "http://18.61.246.105" }
      }

      // Backend expects schedule_visit_date / schedule_visit_time for VISIT.
      // Keep follow_up_date independent — do not send/overwrite it on schedule updates.
      if (newFormData?.stage === "VISIT") {
        const visitDate = String(newFormData.schedule_visit_date || "").slice(0, 10);
        newFormData.schedule_visit_date = visitDate;
        if (showScheduleTimeField) {
          const timeValue = newFormData.schedule_visit_time || "";
          newFormData.schedule_visit_time = timeValue.length === 5 ? `${timeValue}:00` : timeValue;
        } else {
          delete newFormData.schedule_visit_time;
        }
        // Prevent backend from syncing/overwriting scheduled visit from these fields
        delete newFormData.follow_up_date;
        delete newFormData.visit_date;
        delete newFormData.schedule_visit_at;
        delete newFormData.scheduled_at;
      } else {
        delete newFormData.schedule_visit_date;
        delete newFormData.schedule_visit_time;
      }
      // const newFormData={...formData,db_name:db_name,}
      try {
        const response = await axios.put(
          `${Baseurl}/db/channelPartnerLeads`,
          newFormData,
          header
        );
        if (response.status === 200 || response.status === 201) {
          // toast.success(response?.data?.message,{autoClose:2500});
          await getDataList();
        }
      } catch (error) {
        if (error?.response?.data?.message) {
          toast.error(error?.response?.data?.message, { autoClose: 2500 });
        } else {
          toast.error("Something went wrong!", { autoClose: 2500 });
        }
      }
      console.log('Form data submitted:', formData);
      setShowModal(false);
      setShowAssignTo(false);
    } else {
      setErrors(newErrors);
    }

  };

  useEffect(() => {

    if (isUser) {
      async function fetchData() {
        // You can await here
        await updateUserhandler(true, isUserData);
        // ...
      }
      fetchData();

    }
  }, [isUser, isUserData])

  const getCplHistoryData = async (cpl_id) => {
    let db_name = (getCookie('db_name'));
    let url = `/db/channelPartnerLeads/getLeadDetails?db_name=${db_name}&cpl_id=${cpl_id}`;

    if (hasCookie('token')) {
      let token = (getCookie('token'));

      let header = {
        headers: {
          Accept: "application/json",
          Authorization: "Bearer ".concat(token),
          db: db_name,
          pass: "pass",
        }
      }

      try {
        const response = await axios.get(Baseurl + url, header);
        if (response?.status === 200 || response?.status === 201) {
          setShowModal2(true)
          setHistoryData(response?.data?.data)
        }
      } catch (error) {
        if (error?.response?.data?.message) {
          toast.error(error?.response?.data?.message, { autoClose: 2500 });
        } else {
          toast.error("Something went wrong!", { autoClose: 2500 });
        }
      }
    }
  }
  const [showAssignTo, setShowAssignTo] = useState("");
  const [oldAssignTo, setOldAssignTo] = useState("")
  const [selectedOption, setSelectedOption] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const assignChangeHandler = (e) => {
    setSelectedOption(e)
    setOldAssignTo(e)
  }

  // Function to fetch history for a single lead
  const fetchLeadHistory = async (cpl_id) => {
    let db_name = getCookie('db_name');
    let url = `/db/channelPartnerLeads/getLeadDetails?db_name=${db_name}&cpl_id=${cpl_id}`;

    if (hasCookie('token')) {
      let token = getCookie('token');
      let header = {
        headers: {
          Accept: "application/json",
          Authorization: "Bearer ".concat(token),
          db: db_name,
          pass: "pass",
        }
      }

      try {
        const response = await axios.get(Baseurl + url, header);
        if (response?.status === 200 || response?.status === 201) {
          return response?.data?.data || [];
        }
      } catch (error) {
        console.log("Error fetching history for cpl_id:", cpl_id);
        return [];
      }
    }
    return [];
  };

  // Custom download function with all history remarks
  const handleCustomDownload = async () => {
    setIsDownloading(true);
    toast.info("Fetching all history data. Please wait...", { autoClose: 2000 });

    try {
      // Fetch history for all leads
      const leadsWithHistory = await Promise.all(
        dataList.map(async (lead) => {
          const history = await fetchLeadHistory(lead.cpl_id);

          // Get latest remark (first item in history is usually the latest)
          const latestRemarkItem = history.find(item => item.remarks);
          const latestRemarks = latestRemarkItem ? latestRemarkItem.remarks : (lead.remarks || "");

          // Combine all remarks from history with date (excluding the latest one for history)
          const allRemarks = history
            .filter(item => item.remarks)
            .map(item => `${moment(item.follow_up_date).format("DD/MM/YY")}: ${item.remarks}`)
            .join(" | ");

          return {
            ...lead,
            latest_remarks: latestRemarks,
            all_remarks: allRemarks || lead.remarks || ""
          };
        })
      );

      // Create Excel workbook
      const workbook = XLSX.utils.book_new();
      let range;
      if (hasCookie("cpleadsFilter")) {
        range = JSON.parse(getCookie("cpleadsFilter"));
      }

      // Prepare data for Excel with proper column alignment
      const excelData = leadsWithHistory.map(lead => [
        lead.first_name || "",
        lead.last_name || "",
        lead.email || "",
        lead.contact || "",
        formatDate(lead.createdAt),
        lead.follow_up_date ? formatDate(lead.follow_up_date) : "",
        lead.operating_location || "",
        lead.zone_name || lead.zone?.zone_name || lead.db_zone?.zone_name || "",
        lead.city || "",
        lead.state || "",
        lead.group || "",
        lead.designation || "",
        lead.stage || "",
        lead.user || "",
        lead.latest_remarks || "",
        lead.all_remarks || "",
      ]);

      const customData = [
        ["Channel Partner Registration Report"],
        [],
        [`Filter by:`],
        [],
        [`Date Range: ${range?.f_date ? formatDate(range?.f_date) : formatDate(start)} to ${range?.t_date ? formatDate(range?.t_date) : formatDate(end)}`],
        [],
        [],
        ["First Name", "Last Name", "Email", "Contact", "Registration Date", "Date", "Operating Location", "Zone", "City", "State", "group", "Designation", "Status", "Assigned To", "Latest Remarks", "Remarks (All History)"],
        ...excelData,
      ];

      const worksheet = XLSX.utils.aoa_to_sheet(customData);

      worksheet['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 1, c: 9 } },
        { s: { r: 2, c: 0 }, e: { r: 3, c: 9 } },
        { s: { r: 4, c: 0 }, e: { r: 4, c: 9 } },
        { s: { r: 5, c: 0 }, e: { r: 6, c: 9 } },
      ];
      worksheet['!cols'] = [
        { wch: 12 },
        { wch: 12 },
        { wch: 30 },
        { wch: 12 },
        { wch: 20 },
        { wch: 20 },
        { wch: 20 }, // operating location
        { wch: 18 }, // zone
        { wch: 15 }, // city
        { wch: 15 }, // state
        { wch: 15 }, // group
        { wch: 15 }, // Degisnation
        { wch: 15 }, // status
        { wch: 20 }, // assigned
        { wch: 30 }, // latest remarks
        { wch: 60 }, // history remarks
      ];

      XLSX.utils.book_append_sheet(workbook, worksheet, "CPRegistrationList");
      XLSX.writeFile(workbook, "CPRegistrationList.xlsx");
      toast.success("Download completed!", { autoClose: 2000 });
    } catch (error) {
      console.log("Download error:", error);
      toast.error("Error downloading file", { autoClose: 2500 });
    } finally {
      setIsDownloading(false);
    }
  };
  const headerCellStyle = {
    background: clientBtnColor,
    color: "white",
    padding: "12px 16px",
    textAlign: "left",
    verticalAlign: "middle",
    border: "none",
  };

  const columns = [
    {
      name: "first_name",
      label: "First Name",
      options: {
        filter: false,
        customHeadRender: (columnMeta, updateDirection) => (
          <th style={headerCellStyle}>
            {columnMeta.label}
          </th>
        ),

        customBodyRender: (value, tableMeta, updateValue) => {
          return (
            <span
              className="fw-bold"
              style={{ color: '#293790' }}
            >
              {value}
            </span>
          )
        },
      },
    },
    {
      name: "last_name",
      label: "Last Name",
      options: {
        filter: false,
        customHeadRender: (columnMeta, updateDirection) => (
          <th style={headerCellStyle}>
            {columnMeta.label}
          </th>
        ),

        customBodyRender: (value, tableMeta, updateValue) => {
          return (
            <span
              className="fw-bold"
              style={{ color: '#293790' }}
            >
              {value}
            </span>
          )
        },
      },
    },
    {
      name: "email",
      label: "Email",
      options: {
        filter: false,
        customHeadRender: (columnMeta, updateDirection) => (
          <th style={headerCellStyle}>
            {columnMeta.label}
          </th>
        ),

        customBodyRender: (value, tableMeta, updateValue) => {
          return (
            <span
              className="fw-bold"
              style={{ color: '#293790' }}
            >
              {value}
            </span>
          )
        },
      },
    },
    {
      name: "contact",
      label: "Contact",
      options: {
        filter: false,
        customHeadRender: (columnMeta, updateDirection) => (
          <th style={headerCellStyle}>
            {columnMeta.label}
          </th>
        ),

        customBodyRender: (value, tableMeta, updateValue) => {
          return (
            <span
              className="fw-bold"
              style={{ color: '#293790' }}
            >
              {value}
            </span>
          )
        },
      },
    },
    {
      name: "operating_location",
      label: "Operating Location",
      options: {
        filter: false,
        customHeadRender: (columnMeta, updateDirection) => (
          <th style={headerCellStyle}>
            {columnMeta.label}
          </th>
        ),

        customBodyRender: (value, tableMeta, updateValue) => {
          return (
            <span
              className="fw-bold"
              style={{ color: '#293790' }}
            >
              {value || "-"}
            </span>
          )
        },
      },
    },
    {
      name: "zone_name",
      label: "Zone",
      options: {
        filter: false,
        customHeadRender: (columnMeta, updateDirection) => (
          <th style={headerCellStyle}>
            {columnMeta.label}
          </th>
        ),

        customBodyRender: (value, tableMeta, updateValue) => {
          return (
            <span
              className="fw-bold"
              style={{ color: '#293790' }}
            >
              {value || "-"}
            </span>
          )
        },
      },
    },
    // city
    {
      name: "city",
      label: "City",
      options: {
        filter: false,
        customHeadRender: (columnMeta, updateDirection) => (
          <th style={headerCellStyle}>
            {columnMeta.label}
          </th>
        ),

        customBodyRender: (value, tableMeta, updateValue) => {
          return (
            <span
              className="fw-bold"
              style={{ color: '#293790' }}
            >
              {value}
            </span>
          )
        },
      },
    },
    // state 
    {
      name: "state",
      label: "State",
      options: {
        filter: false,
        customHeadRender: (columnMeta, updateDirection) => (
          <th style={headerCellStyle}>
            {columnMeta.label}
          </th>
        ),

        customBodyRender: (value, tableMeta, updateValue) => {
          return (
            <span
              className="fw-bold"
              style={{ color: '#293790' }}
            >
              {value}
            </span>
          )
        },
      },
    },
    {
      name: "createdAt",
      label: "Registration Date",
      options: {
        filter: false,
        customHeadRender: (columnMeta, updateDirection) => (
          <th style={headerCellStyle}>
            {columnMeta.label}
          </th>
        ),

        customBodyRender: (value, tableMeta, updateValue) => {
          return (
            <span
              className=""
              style={{ color: '#667799' }}
            >
              {formatDate(value)}
            </span>
          )
        },
      },
    },
    {
      name: "follow_up_date",
      label: "Date",
      options: {
        filter: false,
        customHeadRender: (columnMeta, updateDirection) => (
          <th style={headerCellStyle}>
            {columnMeta.label}
          </th>
        ),

        customBodyRender: (value, tableMeta, updateValue) => {
          return (
            <span
              className=""
              style={{ color: '#667799' }}
            >
              {value ? formatDate(value) : ""}
            </span>
          )
        },
      },
    },
    {
      name: "stage",
      label: "Status",
      options: {
        filter: true,
        customHeadRender: (columnMeta, updateDirection) => (
          <th style={headerCellStyle}>
            {columnMeta.label}
          </th>
        ),

        customBodyRender: (value, tableMeta, updateValue) => {
          return (
            <span
              className="fw-bold"
              style={{ color: '#293790' }}
            >
              {value}
            </span>
          )
        },
      },
    },
    // Designation
    {
      name: "designation",
      label: "Designation",
      options: {
        filter: true,
        customHeadRender: (columnMeta, updateDirection) => (
          <th style={headerCellStyle}>
            {columnMeta.label}
          </th>
        ),

        customBodyRender: (value, tableMeta, updateValue) => {
          return (
            <span
              className="fw-bold"
              style={{ color: '#293790' }}
            >
              {value}
            </span>
          )
        },
      },
    },
    // Group
    {
      name: "group",
      label: "Group",
      options: {
        filter: true,
        customHeadRender: (columnMeta, updateDirection) => (
          <th style={headerCellStyle}>
            {columnMeta.label}
          </th>
        ),

        customBodyRender: (value, tableMeta, updateValue) => {
          return (
            <span
              className="fw-bold"
              style={{ color: '#293790' }}
            >
              {value}
            </span>
          )
        },
      },
    },
    {
      name: "user",
      label: "Assigned To",
      options: {
        filter: true,
        display: (userInfo?.isDB || userInfo?.role_id == 3) ? true : false,
        customHeadRender: (columnMeta, updateDirection) => (
          <th style={headerCellStyle}>
            {columnMeta.label}
          </th>
        ),

        customBodyRender: (value, tableMeta, updateValue) => {
          return (
            <span
              className="fw-bold"
              style={{ color: '#293790' }}
            >
              {value}
            </span>
          )
        },
      },
    },
    // {
    //   name: "remarks",
    //   label: "Remarks",
    //   options: {
    //     filter: false,
    //     customHeadRender: (columnMeta, updateDirection) => (
    //       <th style={{ background: `${clientBtnColor}`, color: "white", paddingLeft: '15px', padding: "7px" }} >
    //         {columnMeta.label}
    //       </th>
    //     ),

    //     customBodyRender: (value, tableMeta, updateValue) => {
    //       return (
    //         <span
    //           className=""
    //           style={{ color: '#667799' }}
    //         >
    //           {value || ""}
    //         </span>
    //       )
    //     },
    //   },
    // },
    {
      name: "cpl_id",
      label: "Action",
      options: {
        filter: false,
        download: false,
        customHeadRender: (columnMeta, updateDirection) => (
          <th style={{ ...headerCellStyle, textAlign: "center" }}>
            {columnMeta.label}
          </th>
        ),
        customBodyRender: (value, tableMeta, updateValue) => {
          const leadData = dataList?.find((item) => item?.cpl_id == value);
          const stage = leadData?.stage;

          return (
            <>
              <div
                className="table_btns"
                style={{
                  display: "flex",
                  flexDirection: "row",
                  flexWrap: "nowrap",
                  alignItems: "center",
                  minWidth: 220,
                }}
              >
                <>
                  <button
                    className="action_btn"
                    title="Edit"
                    onClick={() => {
                      const newData = dataList?.find((item) => item?.cpl_id == value)
                      const scheduleDate = String(
                        newData?.schedule_visit_date || ""
                      ).slice(0, 10);
                      setFormData({
                        ...newData,
                        project_id: newData?.project_id || newData?.sales_project_id || "",
                        project_name: newData?.project_name || newData?.sales_project_name || "",
                        visit_type: newData?.visit_type || "",
                        follow_up_date: newData?.follow_up_date || "",
                        schedule_visit_date: scheduleDate,
                        schedule_visit_time: newData?.schedule_visit_time
                          ? String(newData.schedule_visit_time).slice(0, 5)
                          : "",
                      })
                      setErrors({})
                      setShowModal(true)
                    }}
                  >
                    <EditIcon />
                  </button>
                  <button
                    className="action_btn"
                    title="History"
                    onClick={() => {
                      getCplHistoryData(value)
                    }}
                  >
                    <ViewIcon />
                  </button>
                  <button className="action_btn" onClick={() => {
                    setcurrObj({ ...currObj, cpl_id: value })
                    setdeleteshowConfirm(true)
                  }} title='Remove'>
                    <DeleteIcon />
                  </button>
                </>
                {userInfo?.isDB && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      flexWrap: "nowrap",
                      alignItems: "center",
                      gap: "8px",
                      marginLeft: "6px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <button
                      onClick={() => {
                        const newData = dataList?.find((item) => item?.cpl_id == value)
                        setFormData(newData);
                        setShowAssignTo(value);
                        setOldAssignTo(leadData?.user)
                      }}
                      style={{
                        background: clientBtnColor ? clientBtnColor : `#293790`,
                        color: "white",
                        padding: "6px 12px",
                        borderRadius: "20px",
                        border: "white",
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                      }}
                      title='Assign - To'>
                      Assign to
                    </button>
                  </div>
                )}
                {
                  stage === "CONTACTED" && (
                    <button
                      className="btn text-white rounded-5" style={{ backgroundColor: clientBtnColor ? clientBtnColor : "#61E25E" }}
                      onClick={async () => {
                        const newData = dataList?.find((item) => item?.cpl_id == value);
                        if (newData) {
                          setFormData({ ...newData, cpl_id: value });
                          await addUserHandler(value, newData?.asssigned_to);
                        }
                      }}
                      title='Onboard For Channel Partner'>
                      Onboard
                    </button>
                  )
                }

              </div>
            </>
          );
        },
      },
    },
    {
      name: 'asssigned_to',
      label: "AssignedToId",
      options: {
        display: false,
        filter: false,
        download: false,
        viewColumns: false,
        customHeadRender: (columnMeta, updateDirection) => (
          <th style={{ background: `${clientBtnColor}`, color: "white", paddingLeft: '15px', padding: "7px" }} >
            {columnMeta.label}
          </th>
        ),
        customBodyRender: (value, tableMeta, updateValue) => {
          // console.log("tableMeta", tableMeta)
          return (
            <div className='status_box fw-bold' style={{ color: "#293790" }} >
              {value}
            </div>
          )
        }

      }
    }
  ];


  const options = {
    selectableRows: 'none',
    responsive: "standard",
    downloadOptions: { filename: "CPRegistrationList" },
    filterType: 'multiselect',
    viewColumns: false,
    customSearch: customTableSearch,
    customFilterDialogFooter: () => (
      <div style={{ minWidth: "400px" }} />
    ),
    // Use original download icon but trigger custom download
    onDownload: () => {
      handleCustomDownload();
      return false; // Prevent default download
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.first_name) newErrors.first_name = "First name is required";
    if (!formData.last_name) newErrors.last_name = "Last name is required";
    if (formData?.stage == "CALL" || formData?.stage == "FOLLOW UP" || formData?.stage == "VISIT") {
      const dateValue =
        formData?.stage === "VISIT"
          ? String(formData.schedule_visit_date || "").slice(0, 10)
          : formData.follow_up_date;
      if (!dateValue) {
        newErrors.follow_up_date = formData?.stage === "VISIT"
          ? (showScheduleTimeField
              ? "Scheduled date is required"
              : (isBstRole(userInfo?.role_id) ? "Activation date is required" : "Visit date is required"))
          : "Date is required";
      }
    }
    if (formData?.stage === "VISIT") {
      if (!formData.project_id) newErrors.project_id = "Project is required";
      if (!formData.visit_type) newErrors.visit_type = "Visit Type is required";
      if (showScheduleTimeField && !formData.schedule_visit_time) {
        newErrors.schedule_visit_time = "Scheduled time is required";
      }
    }
    if (!formData.contact || formData.contact.toString().length !== 10) newErrors.contact = "Contact must be 10 digits";
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Valid email is required";
    return newErrors;
  };


  const handleInputChange = (event) => {
    const { name, value } = event.target;
    const updatedFormData = {
      ...formData,
      [name]: value
    };

    if (name === "stage" && value !== "VISIT") {
      updatedFormData.project_id = "";
      updatedFormData.project_name = "";
      updatedFormData.visit_type = "";
      updatedFormData.schedule_visit_date = "";
      updatedFormData.schedule_visit_time = "";
    }

    setFormData(updatedFormData);
  };

  let statusArray = [{ id: "", label: "All" }, { id: "OPEN", label: "OPEN" }, { id: "CONTACTED", label: "CONTACTED" }, { id: "LINK SENT", label: "LINK SENT" }, { id: "ONBOARDED", label: "ONBOARDED" }, { id: "NOT INTERESTED", label: "NOT INTERESTED" }, { id: "CALL", label: "CALL" }, , { id: "VISIT", label: "VISIT" }, { id: "FOLLOW UP", label: "FOLLOW UP" }]

  const CustomToolbar = () => {
    return (
      <div className=' d-flex justify-content-start gap-3 align-items-center '>
        <p className='fw-bold ' style={{ fontSize: "18px" }} >{title}</p>
        {/* <DateRange value={value} setValue={setValue}  getData={getDataList} filterType={"cpleads"} />  */}

        {/* {
                  userInfoCheck?.isDB && (
                    <div className='col-md-4 mb-3'>
                    <label className='fw-bold' style={{ fontSize: '16px' }}>BST</label>
                    <Select 
                      placeholder="Select BST"
                      options={[{ value: "", label: "All" }, 
                        ...usersList?.filter(item => item?.role_id == 2)?.map((item) => {
                          return {
                            value: item?.user_id,
                            label: item?.user
                          };
                        })
                      ]}
                      
                      value={
                        usersList?.filter(item=>item?.role_id==2)?.map((item) => {
                          if(bstId==item?.user_id){
                            return{
                              value: item?.user_id,
                            label: item?.user
                            }
                          }
                        })
                      }
                      onChange={(e)=>{
                        if(e.value==""){
                          setCookie("bstId",e.value)
                          router.push("/partner/CPRegisterLeads")
                          setBstId(e.value)
                        }
                        else{
                          setCookie("bstId",e.value)
                          setBstId(e.value)
                        }
                        
                      }}
                    />
                  </div>
                  )
                }

            <div className='col-md-4 mb-3'>
                  <label className='fw-bold' style={{ fontSize: '16px' }}>Status</label>
                  <Select 
                    placeholder="Select Stage"
                    options={statusArray?.map((item)=>{
                      return{
                        value:item.id,
                        label:item.label
                      }
                    })}
                    value={
                      statusArray?.map((item)=>{
                        if(statusId==item?.id){
                          return{
                            value:item.id,
                            label:item.label
                          }
                        }
                      })
                    }
                    onChange={(e)=>{
                      if(e.value==""){
                        setCookie("cpLeadstatusId",e.value)
                        router.push("/partner/CPRegisterLeads")
                        setStatusId(e.value)
                      }
                      else{
                        setCookie("cpLeadstatusId",e.value)
                      setStatusId(e.value)
                      }
                      
                    }}
                  />
                </div> */}
      </div>
    );
  }


  return (
    <>
      {
        loader ? <div className="miuiTable channelTable"><Loader /></div>
          :
          (
            <div className="miuiTable channelTable">
              <MUIDataTable
                title={<CustomToolbar />}
                data={(Array.isArray(dataList) ? dataList : []).map((lead) => ({
                  ...lead,
                  zone_name: lead?.zone_name || lead?.zone?.zone_name || lead?.db_zone?.zone_name || "",
                }))}
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

            </div>
          )
      }


      <Modal
        className="commonModal"
        show={showModal}
        onHide={() => {
          setErrors({})
          setShowModal(false);
        }}
      >
        <Modal.Header closeButton>
          <Modal.Title>Update Info</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={(e) => {
            e.preventDefault()
            updateUserhandler()
          }}>
            <Form.Group controlId="firstName">
              <Form.Label>First Name</Form.Label>
              <Form.Control
                type="text"
                name="first_name"
                disabled={true}
                value={formData.first_name}
                onChange={(e) => {
                  // Allow only alphabetic characters
                  const value = e.target.value.replace(/[^a-zA-Z]/g, '');
                  setFormData({
                    ...formData,
                    first_name: value
                  });
                }}
                placeholder="Enter first name"
              />
              {errors.first_name && <Form.Text className="text-danger">{errors.first_name}</Form.Text>}
            </Form.Group>

            <Form.Group controlId="lastName">
              <Form.Label>Last Name</Form.Label>
              <Form.Control
                type="text"
                name="last_name"
                disabled={true}
                value={formData.last_name}
                onChange={(e) => {
                  // Allow only alphabetic characters
                  const value = e.target.value.replace(/[^a-zA-Z]/g, '');
                  setFormData({
                    ...formData,
                    last_name: value
                  });
                }}
                placeholder="Enter last name"
              />
              {errors.last_name && <Form.Text className="text-danger">{errors.last_name}</Form.Text>}
            </Form.Group>

            <Form.Group controlId="contact">
              <Form.Label>Contact</Form.Label>
              <Form.Control
                type="text"
                name="contact"
                disabled={!canEditContactEmail}
                value={formData.contact}
                onChange={(e) => {
                  // Allow only numeric characters and limit to 10 digits
                  const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                  setFormData({
                    ...formData,
                    contact: value
                  });
                }}
                placeholder="Enter contact number"
                maxLength={10}
              />
              {errors.contact && <Form.Text className="text-danger">{errors.contact}</Form.Text>}
            </Form.Group>

            <Form.Group controlId="email">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                disabled={!canEditContactEmail}
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter email"
              />
              {errors.email && <Form.Text className="text-danger">{errors.email}</Form.Text>}
            </Form.Group>



            <Form.Group controlId="registrationDate">
              <Form.Label>Registration Date</Form.Label>
              <Form.Control
                type="text"
                name="registration_date"
                value={moment(formData.createdAt).format("DD-MM-YYYY ")}
                readOnly
              />
            </Form.Group>

            <Form.Group controlId="stage">
              <Form.Label>Stage</Form.Label>
              <Form.Control
                as="select"
                name="stage"
                value={formData.stage}
                onChange={handleInputChange}
              >
                {isRmRole(userInfo?.role_id) ? (
                  <>
                    <option hidden value="OPEN">OPEN</option>
                    <option hidden value="LINK SENT">LINK SENT</option>
                    <option hidden value="ONBOARDED">ONBOARDED</option>
                    <option hidden value="CALL">CALL</option>
                    <option hidden value="CONTACTED">CONTACTED</option>
                    <option hidden value="NOT INTERESTED">NOT INTERESTED</option>
                    <option value="FOLLOW UP">FOLLOW UP</option>
                    <option value="VISIT">VISIT</option>
                  </>
                ) : (
                  <>
                    <option hidden value="OPEN">OPEN</option>
                    <option hidden value="LINK SENT">LINK SENT</option>
                    <option hidden value="ONBOARDED">ONBOARDED</option>
                    <option value="CALL">CALL</option>
                    <option value="FOLLOW UP">FOLLOW UP</option>
                    <option value="VISIT">VISIT</option>
                    <option value="CONTACTED">CONTACTED</option>
                    <option value="NOT INTERESTED">NOT INTERESTED</option>
                  </>
                )}
              </Form.Control>
            </Form.Group>
            {
              (formData.stage == "CALL" || formData.stage == "FOLLOW UP" || formData.stage == "VISIT" || formData.stage == "CONTACTED") && <Form.Group controlId="followUpDate">
                <Form.Label>
                  {formData.stage === "VISIT"
                    ? (showScheduleTimeField
                        ? "Scheduled Date*"
                        : getVisitDateLabel(userInfo?.role_id, { required: true }))
                    : "Date*"}
                </Form.Label>
                <Form.Control
                  key={`${formData.cpl_id}-${formData.stage}-date`}
                  type="date"
                  name={formData.stage === "VISIT" ? "schedule_visit_date" : "follow_up_date"}
                  value={
                    formData.stage === "VISIT"
                      ? String(formData.schedule_visit_date || "").slice(0, 10)
                      : String(formData.follow_up_date || "").slice(0, 10)
                  }
                  min={
                    formData.stage === "VISIT"
                      ? (() => {
                          const today = moment().format("YYYY-MM-DD");
                          const existing = String(formData.schedule_visit_date || "").slice(0, 10);
                          // Allow existing past schedule dates to display/edit
                          if (existing && existing < today) return existing;
                          return today;
                        })()
                      : undefined
                  }
                  onPaste={(e) => e.preventDefault()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") e.preventDefault();
                  }}
                  onChange={(e) => {
                    if (formData.stage === "VISIT") {
                      setFormData({
                        ...formData,
                        schedule_visit_date: e.target.value,
                      });
                    } else {
                      setFormData({
                        ...formData,
                        follow_up_date: e.target.value,
                      });
                    }
                  }}
                />
                {errors.follow_up_date && <Form.Text className="text-danger">{errors.follow_up_date}</Form.Text>}
              </Form.Group>
            }

            {
              formData.stage === "VISIT" && (
                <>
                  {showScheduleTimeField && (
                    <Form.Group controlId="scheduleVisitTime">
                      <Form.Label>Scheduled Time*</Form.Label>
                      <Form.Control
                        type="time"
                        name="schedule_visit_time"
                        value={formData.schedule_visit_time || ""}
                        min={
                          formData.schedule_visit_date &&
                          String(formData.schedule_visit_date).slice(0, 10) === moment().format("YYYY-MM-DD")
                            ? moment().format("HH:mm")
                            : undefined
                        }
                        onChange={(e) => setFormData({
                          ...formData,
                          schedule_visit_time: e.target.value,
                        })}
                      />
                      {errors.schedule_visit_time && (
                        <Form.Text className="text-danger">{errors.schedule_visit_time}</Form.Text>
                      )}
                    </Form.Group>
                  )}

                  <Form.Group controlId="project">
                    <Form.Label>Project*</Form.Label>
                    <Form.Control
                      as="select"
                      name="project_id"
                      value={formData.project_id || ""}
                      onChange={(e) => {
                        const p_name = projectList?.find((p) => p?.Id === e.target.value)?.Project_Name__c || "";
                        setFormData({
                          ...formData,
                          project_id: e.target.value,
                          project_name: p_name,
                        });
                      }}
                    >
                      <option value="" disabled>Select Project</option>
                      {projectList?.map((project) => (
                        <option key={project?.Id} value={project?.Id}>
                          {project?.Project_Name__c}
                        </option>
                      ))}
                    </Form.Control>
                    {errors.project_id && <Form.Text className="text-danger">{errors.project_id}</Form.Text>}
                  </Form.Group>

                  <Form.Group controlId="visitType">
                    <Form.Label>Visit Type*</Form.Label>
                    <Form.Control
                      as="select"
                      name="visit_type"
                      value={formData.visit_type || ""}
                      onChange={handleInputChange}
                    >
                      <option value="" disabled>Select Visit Type</option>
                      {visitTypeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Form.Control>
                    {errors.visit_type && <Form.Text className="text-danger">{errors.visit_type}</Form.Text>}
                  </Form.Group>
                </>
              )
            }

            <Form.Group controlId="remarks">
              <Form.Label>Remarks</Form.Label>
              <Form.Control
                type="text"
                name="remarks"
                value={formData.remarks}
                onChange={(e) => {
                  // Allow only alphabetic characters
                  // const value = e.target.value.replace(/[^a-zA-Z]/g, '');
                  setFormData({
                    ...formData,
                    remarks: e.target.value
                  });
                }}
                placeholder="Enter Remarks"
              />
              {errors.remarks && <Form.Text className="text-danger">{errors.remarks}</Form.Text>}
            </Form.Group>

            <Button variant="primary" type="submit" className=" float-end mt-4">
              {formData.stage === "VISIT" ? "Schedule Visit" : "Update"}
            </Button>
          </Form>
        </Modal.Body>
      </Modal>

      <Modal
        className=""
        show={showModal2}
        onHide={() => setShowModal2(false)}
        size="xl"
      >
        <Modal.Header closeButton>
          <Modal.Title>History</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div style={{ maxHeight: 'calc(5 * 45px)', overflowY: 'auto' }}>
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {historyData.map((item, index) => (
                  <tr key={index} style={{ height: '45px' }}>
                    <td>{item.stage}</td>
                    <td>
                      {item.follow_up_date
                        ? moment(item.follow_up_date).format("DD MMM YYYY")
                        : ""}
                    </td>
                    <td>{item.remarks || ""}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Modal.Body>
      </Modal>

      <Modal className="commonModal" show={!showAssignTo ? false : true} onHide={() => setShowAssignTo("")} style={{}}>
        <Modal.Header closeButton>
          <Modal.Title>  Assign To  </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="add_user_form">
            <div className="row">
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
                    filterOption={(option, inputValue) => {
                      if (!inputValue) return true;
                      const user = usersList?.find(u => u.user_id === option.value);
                      if (!user) return false;
                      const searchTerm = inputValue.toLowerCase();
                      return (
                        user.user?.toLowerCase().includes(searchTerm) ||
                        user.email?.toLowerCase().includes(searchTerm) ||
                        String(user.contact_number || "").includes(searchTerm)
                      );
                    }}
                    options={[
                      ...usersList?.filter(item => item?.role_id === 2)?.map((item) => {
                        return {
                          value: item?.user_id,
                          label: (
                            <>
                              {item?.user ?? ""}{" "}
                              {item?.user_status ? (
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
                        };
                      }),
                    ]}

                    value={
                      usersList?.filter(item => item?.role_id == 2)?.map((item) => {
                        if (oldAssignTo === item.user_id) {
                          return {
                            value: item?.user_id,
                            label: item?.user
                          }
                        }
                      })
                    }
                    onChange={(e) => {
                      assignChangeHandler(e?.value || "");
                      setFormData({
                        ...formData,
                        asssigned_to: e?.value || ""
                      });
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
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button className=" btn btn-danger rounded-5"
            onClick={() => setShowAssignTo("")}
          >Cancel</button>
          <div style={{ background: clientBtnColor }} className='btn rounded-5 text-white'
            onClick={() => updateUserhandler(false)}
          >
            SUBMIT
          </div>
        </Modal.Footer>
      </Modal>

    </>
  );
};

export default CPRegisterLeadsTable;
