import React, { useEffect, useRef, useState } from 'react'
import MUIDataTable from "mui-datatables";
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Button, Modal } from 'react-bootstrap';
import Select from 'react-select';
import axios from 'axios';
import { Baseurl } from '../../../../Utils/Constants';
import { getCookie, hasCookie, setCookie } from 'cookies-next';
import { toast } from 'react-toastify';
import PlusIcon from '../../../Svg/PlusIcon';
import DateRange from '../../../DateRangeCustom/Daterange';
import { ForkLeft } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { startButtonLoading, stopButtonLoading } from '../../../../store/buttonLoaderSlice';
import Loader from '../../../Loader/Loader';
import { Delete } from "@mui/icons-material";
import { fetchData } from '../../../../Utils/getReq';
import * as XLSX from "xlsx";
import { formatDate } from '../../../../Utils/common';

const canCreateBrokerageBill = (status) =>
  status === "Eligible for brokerage bill" ||
  status === "Payment Rejected" ||
  status === "Agreement Verified";

const ManageUsersTable = ({start, end, deleteConfirm, disableConfirm, dataList, openEdtMdl, title, setShowAssignTo, oldAssignTo, setoldAssignTo, setShowDateFilter, getDataList,loader,cpId,setCpId,statusId,setStatusId }) => {
  const router = useRouter()
  const [data, setData] = useState([])
  const [userData, setUserData] = useState([])
  const [actionMode, setActionMode] = useState('')
  const [showModal, setShowModal] = useState(false)
  const dispatch=useDispatch();
  const {isButtonLoading}=useSelector((state)=>state.buttonLoader)
  const fileRef = useRef()
  const getCurrentWeekDates = () => {
    const startDate = new Date(new Date().setDate(new Date().getDate() - new Date().getDay() + 1));
      const endDate = new Date(new Date().setDate(startDate.getDate() + 6));
      if(hasCookie("BookingsFilter")){
          
        let data=JSON.parse(getCookie("BookingsFilter"))
         return {startDate:data?.f_date,endDate:data?.t_date}
       }
       else{
         return { startDate, endDate };
       }
  };
  const [errorToast, setErrorToast] = useState(false);
  const [usersList, setUsersList] = useState([]);
  const userInfoCheck=hasCookie("userInfo")?JSON.parse(getCookie("userInfo")):null;

  async function getUsersList() {
    await fetchData("/db/users", setUsersList, errorToast, setErrorToast);
  }

  useEffect(()=>{
    getUsersList()
  },[])

const [value, setValue] = useState(getCurrentWeekDates());
  const[brokerageBill,setBrokerageBill]=useState({
    booking_id:'',
    file:null,
    file_name:null,
    amount:"",
    date:"",
    status:""
  })
  const userInfo=hasCookie("userInfo") ? JSON.parse(getCookie("userInfo")):null
  const clientBtnColor=hasCookie("clientBtnColor") ? getCookie("clientBtnColor") : "#293790"
 
  const columns = [
    {
      name: 'booking_id',
      label: "Booking ID",
      options: {
        display:false,
        filter: false,
        download:false,
        viewColumns:false,
        customHeadRender: (columnMeta, updateDirection) => (
          <th style={{ background:`${clientBtnColor}`, color: 'white', paddingLeft:"15px",padding:"8px" }}   >
            {columnMeta.label}
          </th>
        ),
        customBodyRender: (value, tableMeta, updateValue) => {
          return (
            <div className='status_box fw-bold' style={{ color: "#293790" }} >
              {value}
            </div>
          )
        }

      }
    },
    {
      name: 'booking_code',
      label: "Booking ID",
      options: {
        filter: false,
        customHeadRender: (columnMeta, updateDirection) => (
          <th style={{ background:`${clientBtnColor}`, color: 'white', paddingLeft:"15px",padding:"8px" }}   >
            {columnMeta.label}
          </th>
        ),
        customBodyRender: (value, tableMeta, updateValue) => {
          return (
            <div className='status_box fw-bold' style={{ color: "#293790" }} >
              {value}
            </div>
          )
        }

      }
    },
    {
      name: 'booking_name',
      label: "Booking Name",
      options: {
        filter: false,
        customHeadRender: (columnMeta, updateDirection) => (
          <th style={{ background:`${clientBtnColor}`, color: 'white', paddingLeft:"15px",padding:"8px" }}   >
            {columnMeta.label}
          </th>
        ),
        customBodyRender: (value, tableMeta, updateValue) => {
          return (
            <Link href={`/partner/BookingDetails?booking_id=${tableMeta?.rowData[0]}`} className='status_box fw-bold text-decoration-underline' style={{ color: "#293790" }}>
              {value}
            </Link>
          )
        }
      },

    },
    {
      name: 'email',
      label: "Email",
      options: {
        filter: false,
        customHeadRender: (columnMeta, updateDirection) => (
          <th style={{ background:`${clientBtnColor}`, color: 'white', paddingLeft:"15px",padding:"8px" }}   >
            {columnMeta.label}
          </th>
        ),
        customBodyRender: (value, tableMeta, updateValue) => {

          return (
            <div className='status_box fw-bold' style={{ color: "#293790" }}>
              {value}
            </div>
          )
        }

      }
    },
    {
      name: 'contact_no',
      label: "Contact No.",
      options: {
        filter: false,
        customHeadRender: (columnMeta, updateDirection) => (
          <th style={{ background:`${clientBtnColor}`, color: 'white', paddingLeft:"15px",padding:"8px" }}   >
            {columnMeta.label}
          </th>
        ),
        customBodyRender: (value, tableMeta, updateValue) => {
          return (
            <div className='status_box' style={{ color: "#667799" }}>
              +91-{value}
            </div>
          )
        }
      }
    },
    {
      name: 'BookingprojectData',
      label: "Project",
      options: {
        filter: false,
        customHeadRender: (columnMeta, updateDirection) => (
          <th style={{ background:`${clientBtnColor}`, color: 'white', paddingLeft:"15px",padding:"8px" }}   >
            {columnMeta.label}
          </th>
        ),
        customBodyRender: (value, tableMeta, updateValue) => {
          return (
            <div className='status_box' style={{ color: "#667799" }}>
              {/* {value?.project} */}
              {value}
            </div>
          )
        }
      }
    },
    {
      name: 'Location',
      label: "Location",
      options: {
        filter: true,
        customHeadRender: (columnMeta, updateDirection) => (
          <th style={{ background:`${clientBtnColor}`, color: 'white', paddingLeft:"15px",padding:"8px" }}   >
            {columnMeta.label}
          </th>
        ),
        customBodyRender: (value, tableMeta, updateValue) => {
          return (
            <div className='status_box' style={{ color: "#667799" }}>
              {value}
            </div>
          )
        }
      }
    },
    {
      name: 'status',
      label: "Booking Status",
      options: {
        filter: true,
        customHeadRender: (columnMeta, updateDirection) => (
          <th style={{ background:`${clientBtnColor}`, color: 'white', paddingLeft:"15px",padding:"8px" }}   >
            {columnMeta.label}
          </th>
        ),
        customBodyRender: (value, tableMeta, updateValue) => {
          return (
            <div
              style={{ 
                background:value==="Payment Initiated" ? "#FFA825" : value==="Payment Received" ?"#84CA4D" : value==="Booking Done" ? "#17B4E7" : value==="Eligible for brokerage bill" ? "#186EBC" : value==="Agreement Verified" ? "#0D9488" : value==="Bill Received" ? "#FCCC37" : value==="VISIT DONE NOT BOOKED" ? "#d43953" :"violet"
                , color: "white", padding: "6px", borderRadius: "20px", border: "white", width: "fit-content"}}
              className='pe-3 ps-3'>
              {value}
            </div>
          )
        }
      }
    },
    {
      name: 'BrokerageBookingList',
      label: "Brokerage Bill",
      options: {
        filter: false,
        download:false,
        display:userInfo?.role_id==1 ? true:false,
        customHeadRender: (columnMeta, updateDirection) => (
          <th style={{ background:`${clientBtnColor}`, color: 'white', paddingLeft:"15px",padding:"8px" }}   >
            {columnMeta.label}
          </th>
        ),
        customBodyRender: (value, tableMeta, updateValue) => {
          return (
            <div className="table_btns">
              <button
                onClick={() => {
                  setShowModal(true);
                  setBrokerageBill({
                    ...brokerageBill,
                    booking_id: tableMeta.rowData[0],
                  })
                }}
                style={{
                  // background:value?.length === 0 && tableMeta?.rowData[7] == "Eligible for brokerage bill" ? clientBtnColor :"#9C9AA5",
                  background:canCreateBrokerageBill(tableMeta?.rowData[7]) ? clientBtnColor :"#9C9AA5",
                  color: "white",
                  padding: "6px",
                  borderRadius: "20px",
                  border: "white",
                  cursor: "pointer",
                }}
                // disabled={value?.length == 0 && tableMeta?.rowData[7] == "Eligible for brokerage bill" ? false:true }
                disabled={ !canCreateBrokerageBill(tableMeta?.rowData[7]) }
                className="pe-3 ps-3 "
              >
                + Create
              </button>
            </div>
          );
        }
      }
    },
  ];

  let statusArray=[{id:"",label:"All"},{id:"Payment Initiated",label:"Payment Initiated"},{id:"Payment Received",label:"Payment Received"},{id:"Payment Rejected",label:"Payment Rejected"},{id:"Booking Done",label:"Booking Done"},{id:"Eligible for brokerage bill",label:"Eligible for brokerage bill"},{id:"Agreement Verified",label:"Agreement Verified"},{id:"Bill Received",label:"Bill Received"},{id:"Bill sent",label:"Bill sent"}]


  const CustomToolbar = () => {
    return (
      <div className=' d-flex justify-content-start gap-3 align-items-center '>
        <p className='fw-bold ' style={{ fontSize: "18px" }} >{title}</p>
        {/* <DateRange value={value} setValue={setValue} getData={getDataList} filterType={title} /> */}
        {/* {
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
                          setCookie("BookingcpId",e.value)
                          router.push("/partner/Bookings")
                          setCpId(e.value)
                        }
                        else{
                          setCookie("BookingcpId",e.value)
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
                        setCookie("BookingstatusId",e.value)
                        router.push("/partner/Bookings")
                        setStatusId(e.value)
                      }
                      else{
                        setCookie("BookingstatusId",e.value)
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

  const handleFileChange = (e) => {
    console.log("e.target.value",e.target.value);
    if (e.target.files[0]) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBrokerageBill({
          ...brokerageBill,
          file:e.target.files[0],
          file_name:e.target.files[0].name
        });
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  }; 

  const handleDeleteClick = () => {
    console.log(fileRef,'Before update:', brokerageBill);
    const data = {
      ...brokerageBill, 
      file: null, file_name: null 
    }
    setBrokerageBill(data);
    fileRef.current.value = ''
  };

  const isValidPdfFile = (file) => {
    return file && file.type === 'application/pdf';
  };

  const createBrokerageBill =  async() => {
    if(brokerageBill.file==null){
      return toast.error("Pls Upload Bill",{autoClose:2500})
    }
   
    if (!isValidPdfFile(brokerageBill.file)) {
      return toast.error("Please upload Bill in PDF", { autoClose: 2500 }); 
    }
   
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

      const formData=new FormData();
      for (const [key, value] of Object.entries(brokerageBill)) {
        formData.append(key, value);
      }
      try {
        dispatch(startButtonLoading())
        const response = await axios.post(`${Baseurl}/db/channel/brokerage`,formData, header);
        if (response.status === 200 || response.status === 201) {
          toast.success(response?.data?.message,{autoClose:2500});
          dispatch(stopButtonLoading())
          setBrokerageBill("")
          setShowModal(false)
          getDataList()
        }
      } catch (error) {
        console.log(error)
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
  }

  const updateBrokerageBill =  async() => {
    if(brokerageBill.file==null){
      return toast.error("Pls Upload Bill",{autoClose:2500})
    }
   
    if (!isValidPdfFile(brokerageBill.file)) {
      return toast.error("Please upload Bill in PDF", { autoClose: 2500 }); 
    }
   
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

      let newBrokerageBill={...brokerageBill}
      newBrokerageBill={
        ...newBrokerageBill,
        brokerage_id:dataList?.find((item)=>item?.booking_id==brokerageBill?.booking_id)?.BrokerageBookingList[0]?.brokerage_id,
        status:dataList?.find((item)=>item?.booking_id==brokerageBill?.booking_id)?.status=="Payment Rejected" && "Bill sent"
      }

      const formData=new FormData();
      for (const [key, value] of Object.entries(newBrokerageBill)) {
        formData.append(key, value);
      }
      try {
        dispatch(startButtonLoading())
        const response = await axios.put(`${Baseurl}/db/channel/brokerage`,formData, header);
        if (response.status === 200 || response.status === 201) {
          toast.success(response?.data?.message,{autoClose:2500});
          dispatch(stopButtonLoading())
          setBrokerageBill("")
          setShowModal(false)
          getDataList()
        }
      } catch (error) {
        console.log(error)
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
  }

  const options = {
    selectableRows: 'none',
    responsive: "standard",
    onRowSelectionChange: handleRowClick,
    downloadOptions:{filename:"ChannelBookings"},
    filterType:'multiselect',
    viewColumns: false,
    onDownload: (buildHead, buildBody, columns, data) => {
              const workbook = XLSX.utils.book_new();
              let range;
              if(hasCookie("BookingsFilter")){
                range= JSON.parse(getCookie("BookingsFilter"))
              }
              let filteredColumns = columns.slice(0, -1); // Remove the last two columns
              const filteredData = data.map(row => {
                return filteredColumns.map((col, index) => row.data[index]);
              });
              
              const customData = [
                ["Channel Bookings Report"], 
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
                { wch: 10 }, 
                { wch: 12 },
                { wch: 18 },
                { wch: 30 },
                { wch: 14 },
                { wch: 24 },
                { wch: 22 },
                { wch: 22 },
              ];
              XLSX.utils.book_append_sheet(workbook, worksheet, "ChannelBookings");
              XLSX.writeFile(workbook, "ChannelBookings.xlsx");
              return false;
            }         
  };

  const mappedDataList=dataList?.map(list=>({
      booking_id:list?.booking_id,
      booking_code:list?.booking_code,
      booking_name:list?.booking_name,
      email:list?.email,
      contact_no:list?.contact_no,
      BookingprojectData:list?.BookingleadData?.sales_project_name,
      Location:[list?.Location]?.filter(d => d !== null && d !== undefined),
      status:list?.status,
      BrokerageBookingList:list?.BrokerageBookingList
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
            // data={dataList}
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
        className="commonModal"
        centered
        show={showModal}
        onHide={() => {
          if(isButtonLoading==false){
            setShowModal(false);
          setBrokerageBill("")
          }
        }}
        size="lg"
      >
        <Modal.Body>
          <section
            className="Sign-In pt-4 Create-New-Lead Create-Brokerage-Bill"
            style={{ padding: "0 16px" }}
          >
            <div className="container">
              <div className="row">
                <h3 className=" Perfect-Home text-center ">
                  Create Brokerage Bill
                </h3>
                <div className="col-12 mt-md-5">
                  <div className="Sign-In_Sign-Up Register w-100">
                    <div className="perfect-home-form pt-1">
                      <section className="Details_Form">
                        <div className="pt-3">
                          <form id="survey-form" onSubmit={(e)=>{
                            e.preventDefault();
                            (dataList?.find((item)=>item?.booking_id==brokerageBill?.booking_id)?.status=="Eligible for brokerage bill" || dataList?.find((item)=>item?.booking_id==brokerageBill?.booking_id)?.status=="Agreement Verified") && createBrokerageBill()
                            dataList?.find((item)=>item?.booking_id==brokerageBill?.booking_id)?.status=="Payment Rejected" && updateBrokerageBill()
                          }}>
                            <div className="d-lg-flex justify-content-lg-around">
                              <div className="d-flex flex-column gap-3 gap-md-4 gap-lg-5 Leads-form-details">
                                <div className="rowTab">
                                  <div className="labels">
                                    <label htmlFor="project" className="pb-1">
                                      Booking
                                    </label>
                                    <span className="star">*</span>
                                  </div>
                                  <div className="rightTab d-flex gap-2">
                                    <select
                                      name
                                      className="form-select dropdown"
                                      style={{

                                        marginLeft: "auto",
                                      }}
                                      value={dataList.find((list)=>(
                                          list?.booking_id === brokerageBill?.booking_id ? list?.booking_name : null
                                      ))}
                                      onChange={(e)=>{
                                        setBrokerageBill({
                                          ...brokerageBill,
                                          booking_id: e.target.value
                                        })
                                      }}
                                    >
                                      {
                                        dataList?.map((list)=>(
                                          <option
                                          key={list?.booking_id}
                                          value={list?.booking_id}
                                        >
                                          {list?.booking_name}
                                        </option>
                                        ))
                                      }
                                     
                                    </select>
                                  </div>
                                </div>
                                <div className="rowTab">
                                  <div className="labels">
                                    <label htmlFor="name" className="pb-1">
                                      Amount
                                    </label>
                                    <span className="star">*</span>
                                  </div>
                                  <div className="rightTab">
                                    <input
                                      autofocus
                                      type="number"
                                      name="name"
                                      value={brokerageBill?.amount}
                                      onChange={(e)=>{
                                        setBrokerageBill({
                                          ...brokerageBill,
                                          amount:e.target.value
                                        })
                                      }}
                                      className="input-field"
                                      placeholder
                                      required
                                    />
                                  </div>
                                </div>
                              </div>
                              <div className="d-flex flex-column  gap-3 gap-md-4 gap-lg-5 Leads-form-details">
                                <div className="rowTab mt-3 mt-md-4 mt-lg-0">
                                  <div className="labels">
                                    <label htmlFor="Location" className="pb-1">
                                      Date
                                    </label>
                                    <span className="star">*</span>
                                  </div>
                                  <div className="rightTab">
                                    {/* <input
                                      autofocus
                                      type="date"
                                      name="name"
                                      onKeyDown={(e)=>e.preventDefault()}
                                      onPaste={(e)=>e.preventDefault()}
                                      value={brokerageBill?.date}
                                      onChange={(e)=>{
                                        setBrokerageBill({...brokerageBill,date:e.target.value})
                                      }}
                                      className="input-field"
                                      placeholder
                                      required
                                    /> */}
                                    <input
                                      autofocus
                                      type="date"
                                      name="name"
                                      min={new Date().toISOString().split("T")[0]}  // Sets the minimum date to today
                                      onKeyDown={(e) => e.preventDefault()}
                                      onPaste={(e) => e.preventDefault()}
                                      value={brokerageBill?.date}
                                      onChange={(e) => {
                                        setBrokerageBill({ ...brokerageBill, date: e.target.value });
                                      }}
                                      className="input-field"
                                      required
                                    />

                                  </div>
                                </div>
                                <div className="rowTab">
                                  <div className="labels">
                                    <label
                                      id="name-label"
                                      htmlFor="name"
                                      className="pb-1"
                                    >
                                      Bill
                                    </label>
                                    <span className="star">*</span>
                                  </div>
                                  <div className="rightTab">
                                    {
                                      brokerageBill?.file!==null ?
                                      (
                                    //     <div className="relative w-73">
                                    //     <div  >{brokerageBill?.file_name}</div>
                                    //     <span className="absolute top-0 right-0" onClick={handleDeleteClick}>
                                    //         <Delete style={{color: 'red',cursor:"pointer"}}/>
                                    //     </span>
                                    // </div>
                                    <div className="relative w-73">
                                      <div className="truncate" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {brokerageBill?.file_name}
                                      </div>
                                      <span className="absolute top-0 right-0" onClick={handleDeleteClick}>
                                        <Delete style={{ color: 'red', cursor: "pointer" }} />
                                      </span>
                                    </div>

                                      ) 
                                      :
                                      (
                                        <label
                                      htmlFor="adh"
                                      className="form-control cursor-pointer d-flex flex-row-reverse justify-content-between align-items-center"
                                      style={{
                                        width: 162,
                                        height: 35,
                                        background: clientBtnColor,
                                      }}
                                    >
                                      Upload Bill
                                      <img
                                        src="/ChannelPartner/upload-file.svg"
                                        alt
                                        style={{ height: 16 }}
                                      />
                                    </label>
                                      ) 
                                    }
                                    
                                    {/* <input
                                      type="file"
                                      id="adh"
                                      ref={fileRef}
                                      onChange={(e)=>handleFileChange(e)}
                                      className="input-field"
                                      style={{ display: "none" }}
                                      
                                    /> */}
                                    <input
                                      type="file"
                                      accept="application/pdf"
                                      id="adh"
                                      ref={fileRef}
                                      onChange={(e) => handleFileChange(e)}
                                      className="input-field"
                                      style={{ display: "none" }}
                                    />

                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="new-leades-btn d-flex justify-content-center gap-4">
                              <button
                                type="button"
                                disabled={isButtonLoading}
                                className="btn btn-danger rounded-5 text-white"
                                onClick={() =>{ setShowModal(false); setBrokerageBill("");}}
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                className="btn text-white rounded-5"
                                style={{ background: clientBtnColor }}
                              >
                               {isButtonLoading ? (
                                  <>
                                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                    &nbsp;Submit
                                  </>
                                ) : (
                                  'Submit'
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
    </>
  );
}

export default ManageUsersTable 