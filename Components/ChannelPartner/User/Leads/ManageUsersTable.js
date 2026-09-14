import React, { useEffect, useState } from 'react'
import MUIDataTable from "mui-datatables";
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Button, Modal } from 'react-bootstrap';
import Select from 'react-select';
import axios from 'axios';
import { Baseurl } from '../../../../Utils/Constants';
import { getCookie, hasCookie, setCookie } from 'cookies-next';
import { toast } from 'react-toastify';
import DateRange from '../../../DateRangeCustom/Daterange';
import { ViewColumn, Visibility } from '@mui/icons-material';
import { useRef } from 'react';
import moment from 'moment';
import { useDispatch, useSelector } from 'react-redux';
import { startButtonLoading, stopButtonLoading } from '../../../../store/buttonLoaderSlice';
import Loader from '../../../Loader/Loader';
import { fetchData } from '../../../../Utils/getReq';
import e from 'cors';
import * as XLSX from "xlsx";


const ManageUsersTable = ({ start, end, deleteConfirm, disableConfirm, leadList, openEdtMdl, title, setShowAssignTo, oldAssignTo,setoldAssignTo, setShowDateFilter,getDataList,loader,maxDate,cpId,setCpId,statusId,setStatusId }) => {
    const router = useRouter()
    const [data, setData] = useState([])
    const [userData, setUserData] =  useState([])
    const [actionMode, setActionMode] =  useState('')
    const [showModal, setShowModal] =  useState(false)
    const [showModal2, setShowModal2] =  useState(false)
    const userInfo=hasCookie("userInfo")?JSON.parse(getCookie("userInfo")):null;

    const daysToAdd = 10;
    const minDate = moment().format("YYYY-MM-DD");
    // const maxDate = moment().add(daysToAdd, 'days').format('YYYY-MM-DD');

    const getCurrentWeekDates = () => {
      const startDate = new Date(new Date().setDate(new Date().getDate() - new Date().getDay() + 1));
        const endDate = new Date(new Date().setDate(startDate.getDate() + 6));
        if(hasCookie("LeadsFilter")){
          
         let data=JSON.parse(getCookie("LeadsFilter"))
          return {startDate:data?.f_date,endDate:data?.t_date}
        }
        else{
          return { startDate, endDate };
        }
      
    };
  
  const [value, setValue] = useState(getCurrentWeekDates());
  const[visitId,setVisitId]=useState("");
  // const [p_visit_date, setVisitDate] = useState(moment().format("YYYY-MM-DD"));
  const[p_visit_date,setVisitDate]=useState("");
  const[p_visit_time,setVisitTime]=useState("");
  const [errorToast, setErrorToast] = useState(false);
  const [usersList, setUsersList] = useState([]);
  const clientBtnColor=hasCookie("clientBtnColor") ? getCookie("clientBtnColor") : "#293790"
  const dispatch=useDispatch();
  const {isButtonLoading}=useSelector((state)=>state.buttonLoader)

  const currentDate = moment().format("YYYY-MM-DD");
  const currentTime = moment().format("HH:mm");

  // Determine the min time based on the selected date
  const minTime = p_visit_date === currentDate ? currentTime : '00:00';

  async function getUsersList() {
    await fetchData("/db/users", setUsersList, errorToast, setErrorToast);
  }

  useEffect(()=>{
    getUsersList()
  },[])

const getVisitInfo=async(visitId)=>{
    if (hasCookie('token')) {
        let token = (getCookie('token'));
        let db_name = (getCookie('db_name'));
        
        let header = {
            headers: {
                Accept: "application/json",
                Authorization: "Bearer ".concat(token),
                db: db_name,
                m_id: 76,
            }
        }
        
        try {
            
            const {data} = await axios.get(Baseurl + `/db/channel/lead?lead_id=${visitId}`, header);
            setVisitDate(data?.data?.p_visit_date)
            setVisitTime(data?.data?.p_visit_time)
        } catch (error) {
            if (error?.response?.data?.message) {
                toast.error(error?.response?.data?.message,{autoClose:2500});
            } else {
                toast.error("Something went wrong!",{autoClose:2500});
            }
        }
    }
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
    const d = moment(dateValue);
    if (!d.isValid()) return String(dateValue).toLowerCase().includes(q);

    const variants = [
      formatDate(dateValue),
      d.format("DD/MM/YYYY"),
      d.format("DD-MM-YYYY"),
      d.format("DD/MM"),
      d.format("DD-MM"),
      d.format("MM/YYYY"),
      d.format("YYYY"),
      d.format("DD"),
      d.format("MMM"),
      dateValue.toString(),
    ].map((v) => v.toLowerCase());

    return variants.some((v) => v.includes(q));
  };

  const customTableSearch = (searchQuery, currentRow, columns) => {
    if (!searchQuery?.trim()) return true;
    const q = searchQuery.toLowerCase().trim();

    for (let i = 0; i < columns.length; i++) {
      const cell = currentRow[i];
      if (cell == null || cell === '') continue;

      const colName = columns[i]?.name;
      if (colName === 'createdAt') {
        if (matchDateSearch(cell, searchQuery)) return true;
        continue;
      }

      if (colName === 'visitList') {
        if (getActionSearchText(cell).includes(q)) return true;
        continue;
      }

      const searchText = Array.isArray(cell)
        ? cell.filter((v) => v != null && v !== '').join(' ')
        : String(cell);

      if (searchText.toLowerCase().includes(q)) return true;
    }

    return false;
  };

  function formatTime(timeString) {
    const timeParts = (timeString || '').split(':');
    const hours = parseInt(timeParts[0]);
    const minutes = parseInt(timeParts[1]);
  
    const date = new Date(2000, 0, 1, hours, minutes);
  
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  }

  function getCurrentDateTime() {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    const hours = String(currentDate.getHours()).padStart(2, '0');
    const minutes = String(currentDate.getMinutes()).padStart(2, '0');
    const seconds = String(currentDate.getSeconds()).padStart(2, '0');
  
    const formattedDateTime = `${year}-${month}-${day}: ${hours}:${minutes}:${seconds}`;
    return formattedDateTime;
  }


  const permitVisit = (status, createdAt) => {
    const currentDate = new Date(); 
    const statusDate = new Date(createdAt); 
    switch (status) {
        case "Requested":
            statusDate.setDate(statusDate.getDate() + 1); 
            
            if (statusDate < currentDate) {
                return false;
            } else {
              
                return true;
            }
            break;
            case "VISIT NOT DONE":
              statusDate.setDate(statusDate.getDate() + 1); 
              
              if (statusDate < currentDate) {
                  return false;
              } else {
                
                  return true;
              }
              break;
        case "Scheduled":
          
            return true;
            break;

        case "Completed":
            statusDate.setDate(statusDate.getDate() + 90); 
            if (statusDate < currentDate) {
                return false;
            } else {
              
                return true;
            }
            break;

        default:
            return false;
            break;
    }
}

  const getActionSearchText = (visitList) => {
    const visit = Array.isArray(visitList) ? visitList[0] : null;
    if (!visit) return 'request visit';

    const isDisabled = permitVisit(visit?.status, visit?.createdAt);
    const buttonLabel =
      !isDisabled && visit?.status === 'VISIT NOT DONE'
        ? 'visit not done'
        : 'request visit';

    return [buttonLabel, visit?.status].filter(Boolean).join(' ').toLowerCase();
  };

    const columns = [
      {
        name: 'lead_id',
        label: "Lead ID",
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
            name: 'lead_code',
            label: "Lead ID",
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
            name: 'lead_name',
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
                        <Link href={`/partner/LeadDetails?id=${tableMeta?.rowData[0]}`}  className='status_box fw-bold text-decoration-underline' style={{color:"#293790"}}>
                            {value}
                        </Link>
                    )
                }
            },

        },
        {
            name: 'email_id',
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
                            {value}
                        </div>
                    )
                }
                
            }
        },
        {
            name: 'p_contact_no',
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
                            +91-{value}
                        </div>
                    )
                }
            }
        },
        {
          name: 'createdAt',
          label: "Created Date",
          options: {
              filter: false,
              customHeadRender: (columnMeta, updateDirection) => (
                  <th style={{background:`${clientBtnColor}`, color: 'white',paddingLeft:"15px",padding:"8px"}}   >
                    {columnMeta.label}
                  </th>
                ),
                customBodyRender: (value, tableMeta, updateValue) => {
                    
                  const date = new Date(value);
                  const day = String(date.getDate()).padStart(2, '0');
                  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
                  const year = date.getFullYear();
                  return (
                      <div className='status_box text-center' style={{color:"#667799"}}>
                          {`${day}/${month}/${year}`}
                      </div>
                  )
              }
          }
      },
      {
        name: 'assigned_lead',
        label: "C.P Name",
        options: {
            filter: true,
            customHeadRender: (columnMeta, updateDirection) => (
                <th style={{background:`${clientBtnColor}`, color: 'white',paddingLeft:"15px",padding:"8px"}}   >
                  {columnMeta.label}
                </th>
              ),
            customBodyRender: (value, tableMeta, updateValue) => {
                return (
                    <div className='status_box' style={{color:"#667799"}}>
                        {value}
                    </div>
                )
            }
        }
    },
   
 
        {
            name: 'sales_project_name',
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
                            {value}
                        </div>
                    )
                }
            }
        },
        {
          name: 'db_lead_stage',
          label: "Stages",
          options: {
              filter: true,
              customHeadRender: (columnMeta, updateDirection) => (
                  <th style={{background:`${clientBtnColor}`, color: 'white',paddingLeft:"15px",padding:"8px"}}   >
                    {columnMeta.label}
                  </th>
                ),
              customBodyRender: (value, tableMeta, updateValue) => {
                  return (
                      <div className='status_box' style={{color:"#667799"}}>
                          {value}
                      </div>
                  )
              }
          }
      },
        {
            name: 'visitList',
            label: "Action",
            options: {
                filter: false,
                download:false,
                display:userInfo?.role_id==1? true:false,
                viewColumns:false,
                customHeadRender: (columnMeta, updateDirection) => (
                    <th style={{background:`${clientBtnColor}`, color: 'white',paddingLeft:"15px",padding:"8px"}}   >
                      {columnMeta.label}
                    </th>
                  ),
                customBodyRender: (value, tableMeta, updateValue) => {
                  const isDisabled=permitVisit(value[0]?.status, value[0]?.createdAt);
                    return (
                        <div className="table_btns">
                            <button
                                onClick={()=>{getVisitInfo(tableMeta?.rowData[0]); setVisitId(tableMeta?.rowData[0]); setShowModal(true);}}
                                style={{background:isDisabled ? "#9C9AA5"  :`${clientBtnColor}`, color:"white",padding:"6px", borderRadius:"20px",border:"white"}}
                                className={`pe-3 ps-3 ${isDisabled && (value[0]?.status==="Requested" || value[0]?.status==="VISIT NOT DONE") ? "requested_hover" : isDisabled && value[0]?.status==="Scheduled" ? "scheduled_hover": isDisabled && value[0]?.status==="Completed" ?"completed_hover" :"" }` }
                                disabled={isDisabled}
                                >
                                  {!isDisabled && value[0]?.status==="VISIT NOT DONE" ? "VISIT NOT DONE" : "Request Visit"}
                            </button>
                            <div className=' hide_div1' >
                                <div className='d-flex justify-content-center fw-bold'>
                                <img style={{width:"20px",paddingRight:"2px"}} src='/ChannelPartner/error.png'/>
                                Cannot request visit.Last visit completed within 90 days
                                </div>
                            </div>
                            <div className=' hide_div2'>
                                <div className='d-flex justify-content-center fw-bold'>
                                <img style={{width:"20px",paddingRight:"2px"}} src='/ChannelPartner/error.png'/>
                                {
                                  value[0]?.status==="Scheduled" ? "Cannot request visit.Visit already scheduled" : "Cannot request visit.Last visit created within 24 hours"
                                }
                                
                                
                                </div>
                            </div>
                            
                            
                        </div>
                    )
                }
            }
        },
    ];

    let stageArray=[{id:"",label:"All"},{id:"1",label:"New"},{id:"2",label:"Visit Planned"},{id:"3",label:"Visit Completed"},{id:"4",label:"Close-Converted"},{id:"5",label:"Close-Converted"}]
    
    const CustomToolbar = () => {
        return (
            <div className=' d-flex justify-content-start gap-3 align-items-center '>
                <p className='fw-bold ' style={{fontSize:"18px"}} >{title}</p>
                {/* <DateRange value={value} setValue={setValue}  getData={getDataList} filterType={title} />
                {
                  (userInfo?.isDB || userInfo?.role_id=="3") && (
                    <div className='col-md-4 mb-3'>
                    <label className='fw-bold' style={{ fontSize: '16px' }}>Channel Partner</label>
                    <Select 
                      placeholder="Select Channel Partner"

                      options={[
                        { value: "", label: "All" },
                        ...(usersList || [])
                          .filter(item => {
                            if (userInfo?.isDB) {
                              return item?.role_id == 1;
                            }
                            // Combine logic for cpUnderBstForDirector
                            return (
                              item?.role_id == 1 &&
                              usersList?.some(i => i?.report_to == userInfo?.user_id && i?.user_id == item?.report_to)
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
                          setCookie("LeadcpId",e.value)
                          router.push("/partner/Leads")
                          setCpId(e.value)
                        }
                        else{
                          setCookie("LeadcpId",e.value)
                          setCpId(e.value)
                        }
                       
                      }}
                    />
                  </div>
                  )
                } */}
                
                {/* <div className='col-md-4 mb-3'>
                  <label className='fw-bold' style={{ fontSize: '16px' }}>Stages</label>
                  <Select 
                    placeholder="Select Stage"
                    options={stageArray?.map((item)=>{
                      return{
                        value:item.id,
                        label:item.label
                      }
                    })}
                    value={
                      stageArray?.map((item)=>{
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
                        setCookie("LeadstatusId",e.value)
                        router.push("/partner/Leads")
                      setStatusId(e.value)
                      }
                      else{
                        setCookie("LeadstatusId",e.value)
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
            accu.push(leadList[value.dataIndex].user_code);
            return accu;
        }, []);
        setUserData([...data]);
    };

    const handleDelete = async (rowsDeleted) => {
      let toastShown=false;
      const deletedIndices = rowsDeleted.data.map((row) => row.dataIndex);
      const leadIds = deletedIndices.map((index) => leadList[index].lead_id);
  
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
                  `${Baseurl}/db/channel/lead/delete`,
                  { l_id: leadIds }, // Send all IDs in one payload
                  { headers }
              );
              if (response.status === 200 || response.status === 201) {
              if (!toastShown) { 
                  toast.success(response?.data?.message,{autoClose:2500});
                  toastShown = true; 
              }    
              getDataList();
           } // Refresh the data list after successful deletion
          } catch (error) {
              console.error(error?.response?.data?.message || "Something went wrong!");
              if (error?.response?.data?.status === 422) {
                  if (!toastShown) { 
                      toast.error(error?.response?.data?.message,{autoClose:2500});
                      toastShown = true; 
                  }
              } else if (error?.response?.data?.message) {
                  if (!toastShown) { 
                      toast.error(error?.response?.data?.message,{autoClose:2500});
                      toastShown = true; 
                  }
              } else {
                  if (!toastShown) { 
                      toast.error("Something went wrong!",{autoClose:2500});
                      toastShown = true; 
                  }
              }
          }
      }
  };

    const options = {
        selectableRows: userInfo?.isDB ? 'multiple' : 'none',
        responsive: "standard",
        // onRowSelectionChange : handleRowClick,
        onRowsDelete: handleDelete,
        downloadOptions:{
          filename:"ChannelLeads",
          // filterOptions:{
          //   useDisplayedColumnsOnly:true,
          //   useDisplayedRowsOnly:true
          // }
        },
        filterType:'multiselect',
        viewColumns: false,
        customSearch: customTableSearch,
        onDownload: (buildHead, buildBody, columns, data) => {
              const workbook = XLSX.utils.book_new();
              let range;
              if(hasCookie("LeadsFilter")){
                range= JSON.parse(getCookie("LeadsFilter"))
              }
              let filteredColumns = columns.slice(0, -1); // Remove the last two columns
              const filteredData = data.map(row => {
                return filteredColumns.map((col, index) => row.data[index]);
              });
              
              const customData = [
                ["Channel Leads Report"], 
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
                { s: { r: 0, c: 0 }, e: { r: 1, c: filteredColumns.length-1 } }, // Merge A1 and A2 for the title
                { s: { r: 2, c: 0 }, e: { r: 3, c: filteredColumns.length-1 } }, // Merge A3 for the date range
                { s: { r: 4, c: 0 }, e: { r: 4, c: filteredColumns.length-1 } }, // Merge A3 for the date range
                { s: { r: 5, c: 0 }, e: { r: 6, c: filteredColumns.length-1 } }, // Merge A3 for the date range
                
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
              ];
              XLSX.utils.book_append_sheet(workbook, worksheet, "ChannelLeads");
              XLSX.writeFile(workbook, "ChannelLeads.xlsx");
              return false;
            }        
    };

    

    const updateUserHandler = async (e) => {
        e.preventDefault()
          if (!hasCookie("token")) return;
          
          const token = getCookie("token");
          const db_name = getCookie("db_name");
          
          const header = {
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
              db: db_name,
              m_id: 79,
            },
          };

          try {
            dispatch(startButtonLoading())
            const response = await axios.post(`${Baseurl}/db/channel/visit`, {
                lead_id:visitId,
                p_visit_date,
                p_visit_time,
                current_date:getCurrentDateTime()
              }, header);
            if (response.status === 200 || response.status === 201) {
              toast.success(response?.data?.message,{autoClose:2500});
              dispatch(stopButtonLoading())
              setShowModal(false)
              toast.success(response?.message,{autoClose:2500})
              getDataList()
            }
          } catch (error) {
            if (error?.response?.data?.status === 422) {
              dispatch(stopButtonLoading())
                  toast.error(error?.response?.data?.message,{autoClose:2500})
                  
            }
            if (error?.response?.data?.message) {
              dispatch(stopButtonLoading())
              toast.error(error?.response?.data?.message,{autoClose:2500});
            } else {
              dispatch(stopButtonLoading())
              toast.error("Something went wrong!",{autoClose:2500});
            }
          }
      
        
        
      };

      const mappedDataList=leadList?.map(list=>({
        lead_id:list?.lead_id,
        lead_code:list?.lead_code,
        lead_name:list?.lead_name,
        email_id:list?.email_id,
        p_contact_no:list?.p_contact_no,
        sales_project_name:list?.sales_project_name,
        visitList:list?.visitList,
        db_lead_stage:list?.db_lead_stage?.stage,
        createdAt:list?.createdAt,
        assigned_lead:`${list?.leadOwner?.user ?? ""} ${list?.leadOwner?.user_l_name ?? ""}`,
      
      }))
      
 

    return (
      <>
      {
        loader ? <div className="miuiTable channelTable"><Loader/></div>
        :
        (
          <div className="miuiTable channelTable">
          <MUIDataTable
            title={<CustomToolbar />}
            // data={leadList}
            data={mappedDataList}
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
          show={showModal}
          onHide={() => {
            if (!isButtonLoading) {
              setShowModal(false);
              setVisitDate("");
              setVisitTime("");
            }
          }}          
          size="lg"
          centered
        >
          <Modal.Body>
            <section
              className="Sign-In pt-4 Create-New-Lead Create-Brokerage-Bill Add-New-Visit-Date-and-Time Visit-Date-and-Time d-flex justify-content-center align-items-center"
              style={{ padding: "0 16px" }}
            >
              <div className="container p-0">
                <div className="row d-flex flex-column gap-3">
                  <h3 className=" Perfect-Home text-center text-black">
                    Visit Date and Time
                  </h3>
                  <div className>
                    <div className="Sign-In_Sign-Up Register w-100">
                      <div className="perfect-home-form pt-1">
                        <section className="Details_Form">
                          <div className>
                            <form
                              id="survey-form"
                              method="post"
                              action
                              className="d-flex flex-column gap-4"
                                onSubmit={(e)=>{
                                    updateUserHandler(e)
                                }}
                            >
                              <div className="d-flex align-items-center justify-content-lg-between gap-3">
                                <div className="d-flex flex-column gap-3 gap-md-4 gap-lg-5 Leads-form-details text-center text-lg-start">
                                  <div className="rowTab">
                                    <div className="labels">
                                      <span
                                        htmlFor="name"
                                        className="pb-1 label"
                                        style={{ color: "#9C9AA5" }}
                                      >
                                        Schedule Visit Date
                                      </span>
                                      <span className="star">*</span>
                                    </div>
                                    <div className="rightTab w-auto">
                                      <span
                                        style={{ color: "#293790" }}
                                        className="date fw-bold"
                                      >
                                       {formatDate(p_visit_date)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="d-flex flex-column  gap-3 gap-md-4 gap-lg-5 Leads-form-details text-center text-lg-start">
                                  <div className="rowTab">
                                    <div className="labels">
                                      <span
                                        htmlFor="name"
                                        className="pb-1 label"
                                        style={{ color: "#9C9AA5" }}
                                      >
                                        Schedule Visit Time
                                      </span>
                                      <span className="star">*</span>
                                    </div>
                                    <div className="rightTab w-auto">
                                      <span
                                        style={{ color: "#293790" }}
                                        className="date fw-bold"
                                      >
                                        {formatTime(p_visit_time)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="new-leades-btn d-flex justify-content-center gap-4 mt-2">
                                <div 

                                  className="btn rounded-5"
                                  style={{borderColor:clientBtnColor,color:clientBtnColor ? clientBtnColor:"white"}}
                                  onClick={() => {
                                    if(isButtonLoading==false){
                                      setShowModal2(true);
                                    }
                                  }}
                                >
                                  Change
                                </div>
                                <button disabled={isButtonLoading} className="btn text-white rounded-5" style={{background:clientBtnColor}}>
                                  {isButtonLoading ? (
                                  <>
                                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                    &nbsp;Confirm
                                  </>
                                ) : (
                                  'Confirm'
                                )}
                                </button>
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

        <Modal
          show={showModal2}
          onHide={() => setShowModal2(false)}
          size="lg"
          centered
        >
          <Modal.Body>
            <section
              className="Sign-In pt-4 Create-New-Lead Create-Brokerage-Bill Add-New-Visit-Date-and-Time"
              style={{ padding: "0 16px" }}
            >
              <div className="container">
                <div className="row">
                  <h3 className=" Perfect-Home text-center text-black">
                    Add New Visit Date and Time
                  </h3>
                  <div className="col-12 mt-md-5">
                    <div className="Sign-In_Sign-Up Register w-100">
                      <div className="perfect-home-form pt-1">
                        <section className="Details_Form">
                          <div className="pt-3">
                            <form id="survey-form" method='POST' onSubmit={(e)=>{
                              e.preventDefault(); 
                              setShowModal2(false)
                            }} >
                              <div className="d-lg-flex justify-content-lg-between">
                                <div className="d-flex flex-column gap-3 gap-md-4 gap-lg-5 Leads-form-details">
                                  <div className="rowTab">
                                    <div className="labels">
                                      <label htmlFor="name" className="pb-1">
                                        Schedule Visit Date
                                      </label>
                                      <span className="star">*</span>
                                    </div>
                                    <div className="rightTab">
                                      <input
                                        autofocus
                                        type="Date"
                                        min={minDate}
                                        max={maxDate}
                                        value={p_visit_date}
                                        onChange={(e)=>{
                                            setVisitDate(e.target.value)
                                        }}
                                        name="name"
                                        className="input-field"
                                        required
                                      />
                                    </div>
                                  </div>
                                </div>
                                <div className="d-flex flex-column  gap-3 gap-md-4 gap-lg-5 Leads-form-details">
                                  <div className="rowTab mt-3 mt-md-4 mt-lg-0">
                                    <div className="labels">
                                      <label
                                        htmlFor="Location"
                                        className="pb-1"
                                      >
                                        Schedule Visit Time
                                      </label>
                                      <span className="star">*</span>
                                    </div>
                                    <div className="rightTab">
                                      <input
                                        autofocus
                                        type="time"
                                        min={minTime}
                                        value={p_visit_time}
                                        onChange={(e)=>{
                                            setVisitTime(e.target.value)
                                        }}  
                                        name="name"
                                        className="input-field"
                                        required
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="new-leades-btn d-flex justify-content-center gap-4 mt-5">
                                <button 
                                type='button'
                                  className='btn btn-danger rounded-5 text-white'
                                  onClick={() =>{ 
                                    setShowModal2(false);
                                     setShowModal(false)
                                    }}
                                >
                                  Cancel
                                </button>
                                <button
                                type='submit'
                                className="btn rounded-5 text-white"
                                style={{background:clientBtnColor}}
                                // onClick={(e)=>{
                                //   e.preventDefault()
                                //     setShowModal2(false)
                                // }}
                                >
                                  Update
                                </button>
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
    );
}

export default ManageUsersTable 