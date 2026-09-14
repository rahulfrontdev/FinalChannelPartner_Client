import React, { useEffect, useState } from 'react'
import MUIDataTable from "mui-datatables";
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Button, Modal } from 'react-bootstrap';
import Select from 'react-select';
import axios from 'axios';
import { Baseurl, getVisitDateLabel, showCpVisitScheduleColumns } from '../../../../Utils/Constants';
import { getCookie, hasCookie, setCookie } from 'cookies-next';
import { toast } from 'react-toastify';
import PlusIcon from '../../../Svg/PlusIcon';
import DateRange from '../../../DateRangeCustom/Daterange';
import Loader from '../../../Loader/Loader';
import { fetchData } from '../../../../Utils/getReq';
import * as XLSX from "xlsx";





const ManageUsersTable = ({ start, end, deleteConfirm, disableConfirm, dataList, openEdtMdl, title, setShowAssignTo, oldAssignTo,setoldAssignTo, setShowDateFilter,getVisitList,loader,cpId,setCpId,statusId,setStatusId, visitType = "client", setVisitType, showVisitTypeToggle = false }) => {
    const router = useRouter()
    const [data, setData] = useState([])
    const [userData, setUserData] =  useState([])
    const [actionMode, setActionMode] =  useState('')
    const [showModal, setShowModal] =  useState(false)
    const [userInfo, setUserInfo ] =  useState({
    user_code: '',
    reject_reason: ''
  })
  const [errorToast, setErrorToast] = useState(false);
  const [usersList, setUsersList] = useState([]);
  const userInfoCheck=hasCookie("userInfo")?JSON.parse(getCookie("userInfo")):null;
  const visitDateLabel = getVisitDateLabel(userInfoCheck?.role_id);
  const showScheduleColumns = showCpVisitScheduleColumns(userInfoCheck);

  async function getUsersList() {
    await fetchData("/db/users", setUsersList, errorToast, setErrorToast);
  }

  useEffect(()=>{
    getUsersList()
  },[])


  const getCurrentWeekDates = () => {
    const startDate = new Date(new Date().setDate(new Date().getDate() - new Date().getDay() + 1));
      const endDate = new Date(new Date().setDate(startDate.getDate() + 6));
      if(hasCookie("VisitsFilter")){
          
        let data=JSON.parse(getCookie("VisitsFilter"))
         return {startDate:data?.f_date,endDate:data?.t_date}
       }
       else{
         return { startDate, endDate };
       }
  };

const [value, setValue] = useState(getCurrentWeekDates());

  const clientBtnColor=hasCookie("clientBtnColor") ? getCookie("clientBtnColor") : "#293790"
  
  function formatTime(timeString) {
    const timeParts = (timeString || '').split(':');
    const hours = parseInt(timeParts[0]);
    const minutes = parseInt(timeParts[1]);
  
    const date = new Date(2000, 0, 1, hours, minutes);
  
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  }
  
  function formatDate(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${day}/${month}/${year}`;
  }

  const matchDateSearch = (dateValue, searchQuery) => {
    if (!dateValue || !searchQuery?.trim()) return false;
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

  const matchTimeSearch = (timeValue, searchQuery) => {
    if (!timeValue || !searchQuery?.trim()) return false;
    // Normalize spaces (locale may use NBSP before AM/PM)
    const normalize = (s) =>
      String(s)
        .toLowerCase()
        .replace(/[\u00a0\u202f]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    const q = normalize(searchQuery);
    const formatted = normalize(formatTime(timeValue));
    const raw = normalize(timeValue);

    const variants = [formatted, raw, formatted.replace(/^0/, "")];
    const timeParts = String(timeValue).split(":");
    if (timeParts.length >= 2) {
      const hours = parseInt(timeParts[0], 10);
      const minutes = parseInt(timeParts[1], 10);
      if (!isNaN(hours) && !isNaN(minutes)) {
        const h12 = hours % 12 || 12;
        const ampm = hours >= 12 ? "pm" : "am";
        const mm = String(minutes).padStart(2, "0");
        variants.push(
          `${h12}:${mm}`,
          `${h12}:${mm} ${ampm}`,
          `${h12}:${mm}${ampm}`,
          `${String(hours).padStart(2, "0")}:${mm}`,
          `${String(hours).padStart(2, "0")}:${mm}:00`,
        );
      }
    }

    return variants.map(normalize).some((v) => v.includes(q));
  };

  const customTableSearch = (searchQuery, currentRow, columns) => {
    if (!searchQuery?.trim()) return true;
    const q = searchQuery.toLowerCase().trim();

    for (let i = 0; i < columns.length; i++) {
      const cell = currentRow[i];
      if (cell == null || cell === '') continue;

      const colName = columns[i]?.name;
      // Date columns only — do NOT put time fields here (they would skip matchTimeSearch)
      if (
        colName === 'assigning_date' ||
        colName === 'completed_date' ||
        colName === 'p_visit_date' ||
        colName === 'follow_up_date' ||
        colName === 'scheduled_date' ||
        colName === 'activation_date'
      ) {
        if (matchDateSearch(cell, searchQuery)) return true;
        continue;
      }

      if (colName === 'p_visit_time' || colName === 'scheduled_time' || colName === 'activation_time') {
        if (matchTimeSearch(cell, searchQuery)) return true;
        continue;
      }

      if (String(cell).toLowerCase().includes(q)) return true;
    }

    return false;
  };

    const columns = [
      {
        name: 'visit_id',
        label: "Visit ID",
        options: {
          display:false,
            filter: false,
            download:false,
            viewColumns:false,
            customHeadRender: (columnMeta, updateDirection) => (
                <th style={{background:`${clientBtnColor}`, color: 'white',paddingLeft:"15px",padding:"8px"}}   >
                  {columnMeta.label}
                </th>
              ),
              customBodyRender: (value, tableMeta, updateValue) => {
                return (
                    <div  className='status_box fw-bold' style={{color:"#293790"}} >
                        {value}
                    </div>
                )
            }
              
        }
    },
        {
            name: 'visit_code',
            label: "Visit ID",
            options: {
                filter: false,
                customHeadRender: (columnMeta, updateDirection) => (
                    <th style={{background:`${clientBtnColor}`, color: 'white',paddingLeft:"15px",padding:"8px"}}   >
                      {columnMeta.label}
                    </th>
                  ),
                  customBodyRender: (value, tableMeta, updateValue) => {
                    return (
                        <div  className='status_box fw-bold' style={{color:"#293790"}} >
                            {value}
                        </div>
                    )
                }
                  
            }
        },
        {
            name: 'leadDataName',
            label: "Lead Name",
            options: {
                filter: false,
                customHeadRender: (columnMeta, updateDirection) => (
                    <th style={{background:`${clientBtnColor}`, color: 'white',paddingLeft:"15px",padding:"8px"}}   >
                      {columnMeta.label}
                    </th>
                  ),
                  customBodyRender: (value, tableMeta, updateValue) => {
                    return (
                        <Link href={`/partner/VisitDetails?id=${tableMeta?.rowData[0]}`}  className='status_box fw-bold text-decoration-underline' style={{color:"#293790"}}>
                            {/* {value.lead_name} */}
                            {value}
                        </Link>
                    )
                }
            },

        },
        {
            name: 'leadDataEmail',
            label: "Email",
            options: {
                filter: false,
                customHeadRender: (columnMeta, updateDirection) => (
                    <th style={{background:`${clientBtnColor}`, color: 'white',paddingLeft:"15px",padding:"8px"}}   >
                      {columnMeta.label}
                    </th>
                  ),
                  customBodyRender: (value, tableMeta, updateValue) => {
                    
                    return (
                        <div className='status_box fw-bold' style={{color:"#293790"}}>
                            {/* {value.email_id} */}
                            {value}
                        </div>
                    )
                }
                
            }
        },
        {
            name: 'leadDataContact',
            label: "Contact No.",
            options: {
                filter: false,
                customHeadRender: (columnMeta, updateDirection) => (
                    <th style={{background:`${clientBtnColor}`, color: 'white',paddingLeft:"15px",padding:"8px"}}   >
                      {columnMeta.label}
                    </th>
                  ),
                customBodyRender: (value, tableMeta, updateValue) => {
                    return (
                        <div className='status_box' style={{color:"#667799"}}>
                            {/* +91-{value.p_contact_no} */}
                            +91-{value}
                        </div>
                    )
                }
            }
        },
        {
            name: 'leadDataProject',
            label: "Project",
            options: {
                filter: false,
                customHeadRender: (columnMeta, updateDirection) => (
                    <th style={{background:`${clientBtnColor}`, color: 'white',paddingLeft:"15px",padding:"8px"}}   >
                      {columnMeta.label}
                    </th>
                  ),
                customBodyRender: (value, tableMeta, updateValue) => {
                    return (
                        <div className='status_box' style={{color:"#667799"}}>
                            {/* {value?.projectData?.project} */}
                            {value}
                        </div>
                    )
                }
            }
        },
        {
          name: 'assigning_date',
          label: "Assign Date",
          options: {
              filter: false,
              customHeadRender: (columnMeta, updateDirection) => (
                  <th style={{background:`${clientBtnColor}`, color: 'white',paddingLeft:"15px",padding:"8px"}}   >
                    {columnMeta.label}
                  </th>
                ),
                customBodyRender: (value, tableMeta, updateValue) => {
                  return (
                      <div className='status_box text-center' style={{color:"#667799"}}>
                          {formatDate(value)}
                      </div>
                  )
              }
          }
      },
      {
        name: 'completed_date',
        label: "Completed Date",
        options: {
            filter: false,
            customHeadRender: (columnMeta, updateDirection) => (
                <th style={{background:`${clientBtnColor}`, color: 'white',paddingLeft:"15px",padding:"8px"}}   >
                  {columnMeta.label}
                </th>
              ),
            customBodyRender: (value, tableMeta, updateValue) => {
                return (
                    <div className='status_box' style={{color:"#667799"}}>
                        {value ? formatDate(value):""}
                    </div>
                )
            }
        }
      },
        {
            name: 'p_visit_date',
            label: visitDateLabel,
            options: {
                filter: false,
                customHeadRender: (columnMeta, updateDirection) => (
                    <th style={{background:`${clientBtnColor}`, color: 'white',paddingLeft:"15px",padding:"8px"}}   >
                      {columnMeta.label}
                    </th>
                  ),
                customBodyRender: (value, tableMeta, updateValue) => {
                    return (
                        <div className='status_box' style={{color:"#667799"}}>
                            {formatDate(value)}
                        </div>
                    )
                }
            }
        },
        {
            name: 'p_visit_time',
            label: "Visit Time",
            options: {
                filter: false,
                customHeadRender: (columnMeta, updateDirection) => (
                    <th style={{background:`${clientBtnColor}`, color: 'white',paddingLeft:"15px",padding:"8px"}}   >
                      {columnMeta.label}
                    </th>
                  ),
                customBodyRender: (value, tableMeta, updateValue) => {
                    return (
                        <div
                        style={{background:"violet", color:"white",padding:"6px", borderRadius:"20px",border:"white", width:"fit-content"}}
                        className='pe-3 ps-3 cursor-pointer'
                        title='Visit Time'>
                            {formatTime(value)}
                    </div>
                    )
                }
            }
        },
        {
            name: 'status',
            label: "Visit Status",
            options: {
                filter: true,
                customHeadRender: (columnMeta, updateDirection) => (
                    <th style={{background:`${clientBtnColor}`, color: 'white',paddingLeft:"15px",padding:"8px"}}   >
                      {columnMeta.label}
                    </th>
                  ),
                customBodyRender: (value, tableMeta, updateValue) => {
                    return (
                        <div className="">
                            {/* <div
                                style={{padding:"6px", color:"white",background:value==="Completed" ?"#84CA4d":value==="Requested" ?"#FEC925":value==="Scheduled" ? "#17B4E7":"",borderRadius:"20px",border:"white"}}
                                className='pe-3 ps-3 btn-warning btn '
                                title='Visit Status'>
                                   {value}
                            </div> */}
                            <div
                              style={{
                                  padding: "6px",
                                  color: "white",
                                  background: value === "Completed" 
                                    ? "#84CA4d" 
                                    : value === "Requested" 
                                    ? "#FEC925" 
                                    : value === "Scheduled" 
                                    ? "#17B4E7"
                                    : value === "Rejected"
                                    ? "#D9534F" 
                                    : value === "Rescheduled"
                                    ? "#FF6F61"  // or any color of your choice
                                    : value === "VISIT NOT DONE"
                                    ? "#d43953"  // or any color of your choice
                                    : "",
                                  borderRadius: "20px",
                                  border: "white"
                              }}
                              className='pe-3 ps-3 btn-warning btn'
                              title='Visit Status'
                          >
                              {value}
                          </div>

                        </div>
                    )
                }
            }
        },
    ];

    const cpVisitColumns = [
      {
        name: 'cpl_id',
        label: "Lead ID",
        options: {
          filter: false,
          customHeadRender: (columnMeta) => (
            <th style={{ background: `${clientBtnColor}`, color: 'white', paddingLeft: "15px", padding: "8px" }}>
              {columnMeta.label}
            </th>
          ),
          customBodyRender: (value) => (
            <div className='status_box fw-bold' style={{ color: "#293790" }}>{value}</div>
          ),
        },
      },
      {
        name: 'leadName',
        label: "CP Lead Name",
        options: {
          filter: false,
          customHeadRender: (columnMeta) => (
            <th style={{ background: `${clientBtnColor}`, color: 'white', paddingLeft: "15px", padding: "8px" }}>
              {columnMeta.label}
            </th>
          ),
          customBodyRender: (value) => (
            <div className='status_box fw-bold' style={{ color: "#293790" }}>{value}</div>
          ),
        },
      },
      {
        name: 'email',
        label: "Email",
        options: {
          filter: false,
          customHeadRender: (columnMeta) => (
            <th style={{ background: `${clientBtnColor}`, color: 'white', paddingLeft: "15px", padding: "8px" }}>
              {columnMeta.label}
            </th>
          ),
          customBodyRender: (value) => (
            <div className='status_box fw-bold' style={{ color: "#293790" }}>{value}</div>
          ),
        },
      },
      {
        name: 'contact',
        label: "Contact No.",
        options: {
          filter: false,
          customHeadRender: (columnMeta) => (
            <th style={{ background: `${clientBtnColor}`, color: 'white', paddingLeft: "15px", padding: "8px" }}>
              {columnMeta.label}
            </th>
          ),
          customBodyRender: (value) => (
            <div className='status_box' style={{ color: "#667799" }}>+91-{value}</div>
          ),
        },
      },
      {
        name: 'cpl_id',
        label: "Action",
        options: {
          filter: false,
          sort: false,
          download: false,
          print: false,
          customHeadRender: (columnMeta) => (
            <th style={{ background: `${clientBtnColor}`, color: 'white', paddingLeft: "15px", padding: "8px" }}>
              {columnMeta.label}
            </th>
          ),
          customBodyRender: (value) => (
            <Link
              href={`/partner/VisitDetails?id=${value}&type=cp`}
              className="btn btn-sm text-white"
              style={{ background: clientBtnColor, borderRadius: "20px", padding: "6px 16px" }}
            >
              View Detail
            </Link>
          ),
        },
      },
    ];

    let statusArray=[{id:"",label:"All"},{id:"Requested",label:"Requested"},{id:"Scheduled",label:"Scheduled"},{id:"Rescheduled",label:"Rescheduled"},{id:"Completed",label:"Completed"},{id:"Rejected",label:"Rejected"}]
  
    const CustomToolbar = () => {
        const visitBtnStyle = {
          background: "#293790",
          color: "#fff",
          padding: "6px",
          borderRadius: "20px",
          border: "1px solid #293790",
        };

        return (
            <div className='customToolHead visit-type-btns d-flex justify-content-start gap-2 align-items-center'>
                <p className='fw-bold' style={{fontSize:"18px"}} >{title}</p>
                {showVisitTypeToggle && (
                  <div className="d-flex gap-2 align-items-center">
                    <button
                      type="button"
                      className="pe-3 ps-3 visit-type-btn"
                      style={visitBtnStyle}
                      onClick={() => setVisitType?.("client")}
                    >
                      Client visit
                    </button>
                    <button
                      type="button"
                      className="pe-3 ps-3 visit-type-btn"
                      style={visitBtnStyle}
                      onClick={() => setVisitType?.("cp")}
                    >
                      CP visit
                    </button>
                  </div>
                )}
                {/* <DateRange value={value} setValue={setValue} getData={getVisitList} filterType={title} /> */}
                {/* {
                  (userInfoCheck?.isDB || userInfoCheck?.role_id=="3" ) && (
                    <div className='col-md-4 mb-3'>
                    <label className='fw-bold' style={{ fontSize: '16px' }}>Channel Partner</label>
                    <Select 
                      placeholder="Select Channel Partner"
                      options={[
                        { value: "", label: "All" },
                        ...(usersList || [])
                          .filter(item => {
                            if (userInfoCheck?.isDB) {
                              return item?.role_id == 1;
                            }
                            // Combine logic for cpUnderBstForDirector
                            return (
                              item?.role_id == 1 &&
                              usersList?.some(i => i?.report_to == userInfoCheck?.user_id && i?.user_id == item?.report_to)
                            );
                          })
                          .map(item => ({
                            value: item?.user_id,
                            label: item?.user
                          }))
                      ]}
                      
                      value={
                        usersList?.filter(item=>item?.role_id==1)?.map((item) => {
                          if(cpId==item?.user_id){
                            return{
                              value: item?.user_id,
                            label: item?.user
                            }
                          }
                        })
                      }
                      onChange={(e)=>{
                        if(e.value==""){
                          setCookie("VisitcpId",e.value)
                          router.push("/partner/Visits")
                          setCpId(e.value)
                        }
                        else{
                          setCookie("VisitcpId",e.value)
                          setCpId(e.value)
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
                        setCookie("VisitstatusId",e.value)
                        router.push("/partner/Visits")
                        setStatusId(e.value)

                      }
                      else{
                        setCookie("VisitstatusId",e.value)
                        setStatusId(e.value)
                      }
                     
                    }}
                  />
                </div> */}
            </div>
        );
    }

    const handleRowClick = (rowData, rowMeta) => {
        const data = rowMeta?.reduce((accu, value) => {
            accu.push(dataList[value.dataIndex].user_code);
            return accu; // Return the accumulator
        }, []);
        setUserData([...data]); 
    };

    const downloadCpVisitReport = async () => {
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

      const leadMap = {};
      (Array.isArray(dataList) ? dataList : []).forEach((list) => {
        const cplId = list?.cpl_id;
        if (cplId == null || leadMap[cplId]) return;
        leadMap[cplId] = {
          cpl_id: cplId,
          leadName:
            list?.name ||
            `${list?.first_name || ""} ${list?.last_name || ""}`.trim() ||
            "",
          email: list?.email || "",
          contact: list?.contact || "",
          registration_date: list?.createdAt || list?.registration_date || "",
        };
      });

      const leads = Object.values(leadMap);
      if (!leads.length) {
        toast.error("No CP visit records found", { autoClose: 2500 });
        return;
      }

      toast.info("Generating CP Visits report...", { autoClose: 1500 });

      const reportRows = [];
      for (const lead of leads) {
        let history = [];
        let leadInfo = lead;
        try {
          const { data } = await axios.get(
            `${Baseurl}/db/channelPartnerLeads/getVisitHistory?cpl_id=${lead.cpl_id}`,
            header
          );
          history = Array.isArray(data?.data?.visit_history)
            ? data.data.visit_history
            : Array.isArray(data?.data)
              ? data.data
              : [];
          if (data?.data?.lead) {
            leadInfo = {
              ...lead,
              leadName:
                data.data.lead.name ||
                lead.leadName,
              email: data.data.lead.email || lead.email,
              contact: data.data.lead.contact || lead.contact,
              registration_date:
                data.data.lead.registration_date ||
                data.data.lead.createdAt ||
                lead.registration_date,
            };
          }
        } catch (error) {
          history = [];
        }

        const leadName = leadInfo.leadName || "";
        const email = leadInfo.email || "";
        const contact = leadInfo.contact ? `+91-${leadInfo.contact}` : "";
        const registrationDate = leadInfo.registration_date
          ? formatDate(leadInfo.registration_date)
          : "";

        if (!history.length) {
          reportRows.push([
            lead.cpl_id,
            leadName,
            email,
            contact,
            registrationDate,
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
          ]);
          continue;
        }

        history.forEach((item, index) => {
          const isFirst = index === 0;
          const assignedTo =
            item?.assigned_to_name ||
            item?.bst_name ||
            item?.user ||
            (typeof item?.assigned_to === "string" &&
            Number.isNaN(Number(item.assigned_to))
              ? item.assigned_to
              : "") ||
            "";
          const status =
            item?.visit_status ||
            item?.status ||
            item?.stage ||
            "";
          reportRows.push([
            isFirst ? lead.cpl_id : "",
            isFirst ? leadName : "",
            isFirst ? email : "",
            isFirst ? contact : "",
            isFirst ? registrationDate : "",
            item?.project_name || item?.sales_project_name || "",
            item?.schedule_visit_date || item?.follow_up_date
              ? formatDate(item?.schedule_visit_date || item?.follow_up_date)
              : "",
            item?.schedule_visit_time || item?.follow_up_time
              ? formatTime(item?.schedule_visit_time || item?.follow_up_time)
              : "",
            item?.activation_date ? formatDate(item.activation_date) : "",
            item?.activation_time ? formatTime(item.activation_time) : "",
            item?.visit_type || "",
            assignedTo,
            status,
          ]);
        });
      }

      let range;
      if (hasCookie("VisitsFilter")) {
        range = JSON.parse(getCookie("VisitsFilter"));
      }

      const headers = [
        "Lead ID",
        "CP Lead Name",
        "Email",
        "Contact No.",
        "Registration Date",
        "Project Name",
        "Scheduled Date",
        "Scheduled Time",
        "Activation Date",
        "Activation Time",
        "Visit Type",
        "Assigned To",
        "Status",
      ];

      const customData = [
        ["CP Visits Report"],
        [],
        ["Filter by:"],
        [],
        [
          `Date Range: ${
            range?.f_date ? formatDate(range?.f_date) : formatDate(start)
          } to ${
            range?.t_date ? formatDate(range?.t_date) : formatDate(end)
          }`,
        ],
        [],
        [],
        headers,
        ...reportRows,
      ];

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(customData);
      worksheet["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 1, c: headers.length - 1 } },
        { s: { r: 2, c: 0 }, e: { r: 3, c: headers.length - 1 } },
        { s: { r: 4, c: 0 }, e: { r: 4, c: headers.length - 1 } },
        { s: { r: 5, c: 0 }, e: { r: 6, c: headers.length - 1 } },
      ];
      worksheet["!cols"] = headers.map(() => ({ wch: 18 }));
      XLSX.utils.book_append_sheet(workbook, worksheet, "CPVisits");
      XLSX.writeFile(workbook, "CPVisits.xlsx");
      toast.success("CP Visits report downloaded", { autoClose: 2000 });
    };

    const options = {
        selectableRows: 'none',
        responsive: "standard",
        onRowSelectionChange : handleRowClick,
        downloadOptions:{filename:"ChannelVisits"},
        filterType:'multiselect',
        viewColumns: false,
        customSearch: customTableSearch,
        onDownload: (buildHead, buildBody, columns, data) => {
              if (visitType === "cp") {
                downloadCpVisitReport();
                return false;
              }
              const workbook = XLSX.utils.book_new();
              let range;
              if(hasCookie("VisitsFilter")){
                range= JSON.parse(getCookie("VisitsFilter"))
              }
              let filteredColumns = columns // Remove the last two columns
              const filteredData = data.map(row => {
                return filteredColumns.map((col, index) => row.data[index]);
              });
              
              const customData = [
                ["Channel Visits Report"], 
                [], 
                [`Filter by:`],
                [],
                [`Date Range: ${range?.f_date ? formatDate(range?.f_date):formatDate(start)} to ${range?.t_date ? formatDate(range?.t_date):formatDate(end)}`],
                [], 
                [], 
                filteredColumns.map(col => col.label || col.name), 
                ...filteredData,
              ];
            
              const worksheet = XLSX.utils.aoa_to_sheet(customData);
            
              worksheet['!merges'] = [
                { s: { r: 0, c: 0 }, e: { r: 1, c: filteredColumns.length-1} }, // Merge A1 and A2 for the title
                { s: { r: 2, c: 0 }, e: { r: 3, c: filteredColumns.length-1 } }, // Merge A3 for the date range
                { s: { r: 4, c: 0 }, e: { r: 4, c: filteredColumns.length-1 } }, // Merge A3 for the date range
                { s: { r: 5, c: 0 }, e: { r: 6, c: filteredColumns.length-1} }, // Merge A3 for the date range
                
              ];
              worksheet['!cols'] = [
                { wch: 8 }, 
                { wch: 12 },
                { wch: 18 },
                { wch: 30 },
                { wch: 14 },
                { wch: 24 },
                { wch: 22 },
                { wch: 22 },
                { wch: 18 },
                { wch: 12 },
                { wch: 18 },
              ];
              XLSX.utils.book_append_sheet(workbook, worksheet, "ChannelVisits");
              XLSX.writeFile(workbook, "ChannelVisits.xlsx");
              return false;
          }          
    };

    const safeDataList = Array.isArray(dataList) ? dataList : [];

    const mappedDataList=safeDataList.map(list=>({
      visit_id:list?.visit_id,
      visit_code:list?.visit_code,
      leadDataName:list?.leadData?.lead_name,
      leadDataEmail:list?.leadData?.email_id,
      leadDataContact:list?.leadData?.p_contact_no,
      leadDataProject:list?.leadData?.sales_project_name,
      p_visit_date:list?.p_visit_date,
      p_visit_time:list?.p_visit_time,
      status:list?.status,
      assigning_date: list?.createdAt,
      completed_date: list?.status === "Completed" ? list?.updatedAt : ""
    }))

    const mappedCpVisitList = (() => {
      const byLead = {};
      safeDataList.forEach((list) => {
        const cplId = list?.cpl_id;
        if (cplId == null) return;
        if (!byLead[cplId]) {
          byLead[cplId] = {
            cpl_id: cplId,
            leadName: list?.name || `${list?.first_name || ""} ${list?.last_name || ""}`.trim(),
            email: list?.email,
            contact: list?.contact,
          };
        }
      });
      return Object.values(byLead);
    })();

    const activeColumns = visitType === "cp" ? cpVisitColumns : columns;
    const activeData = visitType === "cp" ? mappedCpVisitList : mappedDataList;
    const downloadFileName = visitType === "cp" ? "CPVisits" : "ChannelVisits";
      
 
    return (
        <>
        {
        loader ? <div className="miuiTable channelTable"><Loader/></div>
        :
        (
          <div className="miuiTable channelTable">
                <MUIDataTable
                    title={<CustomToolbar/>}
                    data={activeData}
                    columns={activeColumns}
                    options={{
                      ...options,
                      downloadOptions: { filename: downloadFileName },
                      customFilterDialogFooter: () => (
                        <div
                          style={{
                            minWidth: "300px",
                          }}
                        />
                      ),
                    }}

                />
                <div>
          {userData.length ?
          <div className="table_btns d-flex align-items-center justify-content-center gap-3 mt-4">
              

              <button onClick={()=>{setActionMode('Cancel'); setShowModal(false);setUserData([])}} className=" btn btn-danger rounded-5">
                Cancel
              </button>
              <button onClick={()=>{setActionMode('Assignto'); setShowModal(true)}} style={{backgroundColor: '#293790'}} className="btn  rounded-5 text-white" >
                Assign to
              </button>
            
          </div>
          : <></>
        }
        </div>
            </div>
        )
      }
            
        
            <Modal className="commonModal"  show={showModal}   onHide={()=>{setShowModal(false)}} size="lg">
                
                <Modal.Body>
                <section className="Sign-In pt-4 Create-New-Lead Create-Brokerage-Bill" style={{padding: '0 16px'}}>
  <div className="container">
    <div className="row">
      <h3 className=" Perfect-Home text-center ">Create Brokerage Bill</h3>
      <div className="col-12 mt-md-5">
        <div className="Sign-In_Sign-Up Register w-100">
          <div className="perfect-home-form pt-1">
            <section className="Details_Form">
              <div className="pt-3">
                <form id="survey-form" method="GET" action>
                  <div className="d-lg-flex justify-content-lg-around">
                    <div className="d-flex flex-column gap-3 gap-md-4 gap-lg-5 Leads-form-details">
                      <div className="rowTab">
                        <div className="labels">
                          <label htmlFor="project" className="pb-1">Project</label>
                          <span className="star">*</span>
                        </div>
                        <div className="rightTab d-flex gap-2">
                          <select name className="form-select dropdown" style={{paddingTop: 12, paddingBottom: 12}}>
                            <option value selected disabled />
                            <option className="dropdown-item" href="#">Emerald Grove Gardens
                            </option>
                            <option className="dropdown-item" href="#">Harmony Hills Estates
                            </option>
                            <option className="dropdown-item" href="#">Horizon Vista Villas
                            </option>
                          </select>
                        </div>
                      </div>
                      <div className="rowTab">
                        <div className="labels">
                          <label htmlFor="name" className="pb-1">Amount</label>
                          <span className="star">*</span>
                        </div>
                        <div className="rightTab">
                          <input autofocus type="text" name="name" className="input-field" placeholder required />
                        </div>
                      </div>
                      {/* <div className="rowTab">
                        <div className="labels">
                          <label htmlFor="name" className="pb-1">Status</label>
                        </div>
                        <div className="rightTab">
                          <input autofocus type name="name" className="input-field" placeholder="Bill Sent" required />
                        </div>
                      </div> */}
                    </div>
                    <div className="d-flex flex-column  gap-3 gap-md-4 gap-lg-5 Leads-form-details">
                      <div className="rowTab mt-3 mt-md-4 mt-lg-0">
                        <div className="labels">
                          <label htmlFor="Location" className="pb-1">Date</label>
                          <span className="star">*</span>
                        </div>
                        <div className="rightTab">
                          <input autofocus type="text" name="name" className="input-field" placeholder required />
                        </div>
                      </div>
                      <div className="rowTab">
                        <div className="labels">
                          <label id="name-label" htmlFor="name" className="pb-1">Bill</label>
                          <span className="star">*</span>
                        </div>
                        <div className="rightTab">
                          <label htmlFor="adh" className="form-control d-flex flex-row-reverse justify-content-between align-items-center" style={{width: 227, height: 36}}>Upload Bill<img src="/ChannelPartner/upload-file.svg" alt="normal"style={{height: 16}} /></label>
                          <input autofocus type="file" name="name" id="adh" className="input-field" placeholder="enter your aadhar number" style={{display: 'none'}} required />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="new-leades-btn d-flex justify-content-center gap-4">
                    <div type="button" className="cancel-btn d-flex align-items-center justify-content-center bg-transparent" onClick={()=>setShowModal(false)}>Cancel</div>
                    <button type='submit' className="submit-btn d-flex align-items-center justify-content-center text-white border-0">Submit</button>
                  </div>
                </form>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

                </Modal.Body>
            </Modal>  
          
        </>

    )
}

export default ManageUsersTable 