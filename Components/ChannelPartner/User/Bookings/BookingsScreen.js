import React, { useEffect, useState } from 'react'
import Link from 'next/link';
import PlusIcon from '../../../Svg/PlusIcon';
import axios from 'axios';
import { hasCookie, getCookie, setCookie } from 'cookies-next';
import { toast } from 'react-toastify';

import { useSelector } from 'react-redux';
// import Modal from "react-bootstrap/Modal";
// import { Button, Form } from 'react-bootstrap';
import { Modal, Button, Form, Row, Col, Dropdown } from 'react-bootstrap';
import dynamic from 'next/dynamic'
import Papa from "papaparse";
import { Baseurl } from '../../../../Utils/Constants';
import ConfirmBox from '../../../Basics/ConfirmBox';
import { useRouter } from 'next/router';
import Select from 'react-select';
import { fetchData } from '../../../../Utils/getReq';
import Daterange from '../../../DateRangeCustom/Daterange';
import Loader from '../../../Loader/Loader';
import DateRange from '../../../DateRangeCustom/Daterange';
const DynamicTable = dynamic(
    () => import('./ManageUsersTable'),
    { ssr: false }
)

const BookingsScreen = () => {
    const sideView = useSelector((state) => state.sideView.value);
    const router = useRouter()
    const {cp_id} =router.query;
    const {status_id} =router.query;
    const [cpId,setCpId] =useState(hasCookie("BookingcpId") ? getCookie("BookingcpId"):'')
    const [statusId,setStatusId] =useState(hasCookie("BookingstatusId") ? getCookie("BookingstatusId"):'')
    const [dataList, setDataList] = useState([])
    const [disableShowConfirm, setdisableShowConfirm] = useState(false)
    const [deleteshowConfirm, setdeleteshowConfirm] = useState(false)
    const [confirmText, setconfirmText] = useState('')
    const [show, setShow] = useState(false);
    const [showAssignTo, setShowAssignTo] = useState("");
    const [oldAssignTo, setoldAssignTo] = useState("");
    const [showDateFilter, setShowDateFilter] = useState(false);
    const [excelData, setexcelData] = useState([]);
    const [errorToast, setErrorToast] = useState(false);
    const [usersList, setUsersList] = useState([]);
    const [DateEvent, seDateEvent] = useState({
        type: 'Custom',
        fDate: '',
        eDate: ''
    });
    const [currObj, setcurrObj] = useState({
        id: '',
        action: ''
    })

   const clientBtnColor=hasCookie("clientBtnColor") ? getCookie("clientBtnColor") : "#293790"
   const[loader,setLoader]=useState(false)

   let statusArray=[{id:"",label:"All"},{id:"Payment Initiated",label:"Payment Initiated"},{id:"Payment Received",label:"Payment Received"},{id:"Payment Rejected",label:"Payment Rejected"},{id:"Booking Done",label:"Booking Done"},{id:"Eligible for brokerage bill",label:"Eligible for brokerage bill"},{id:"Agreement Verified",label:"Agreement Verified"},{id:"Bill Received",label:"Bill Received"},{id:"Bill sent",label:"Bill sent"}]

     const userInfo=hasCookie("userInfo") ? JSON.parse(getCookie("userInfo")):null
     
       async function getUsersList() {
         await fetchData("/db/users", setUsersList, errorToast, setErrorToast);
       }
     
       useEffect(()=>{
         getUsersList()
       },[])
   

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
     const [value, setValue] = useState(getCurrentWeekDates());
     

   useEffect(()=>{
    if(status_id){
        setStatusId(status_id)
    }
    
  },[status_id])
  useEffect(()=>{
    if(cp_id){
      setCpId(cp_id)
    }
   
  },[cp_id])

    function disableConfirm(value, type) {
        if (type == 1) {
            setconfirmText('enable')
        } else {
            setconfirmText('Disable')
        }
        setcurrObj({
            id: value,
            action: type
        })
        setdisableShowConfirm(true)
    }

    const handleClose = () => {
        setShow(false);
        setexcelData([])
    };

    const handleShow = () => setShow(true);

    function deleteConfirm(value) {
        setcurrObj({
            id: value,
            action: 'delete'
        })
        setdeleteshowConfirm(true)
    }

    const goto = (url) => {
        router.push(url)
    }




    const importHandler = (event, type) => {
        // Passing file data (event.target.files[0]) to parse using Papa.parse
        Papa.parse(event.target.files[0], {
            header: true,
            skipEmptyLines: true,
            complete: function (results) {
                setexcelData(results.data)

            },

        });

    };



    const getDataList = async (queryObjLeads) => {
      setLoader(true)
      let url = `/db/channel/booking`;
      let params = {};

      // Build query params
      if (cp_id) {
        params.cp_id = cp_id;
      }
      if (cpId) {
        params.cp_id = cpId;  // This will override cp_id if both are present
      }
      if (status_id) {
        params.status_id = status_id;
      }
      if (statusId) {
        params.status_id = statusId;
      }

      const queryString = new URLSearchParams(params).toString();
      if (queryString) {
        url += `?${queryString}`;
      }
      
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
                const response = await axios.get(Baseurl + url, {
                  ...header,
                  params: queryObjLeads,
                });
                if(response?.status === 200 || response?.status === 201){
                  setLoader(false)
                  setDataList(response.data.data);
                }
            } catch (error) {
                if (error?.response?.data?.message) {
                  setLoader(false)
                    toast.error(error?.response?.data?.message,{autoClose:2500});
                } else {
                  setLoader(false)
                    toast.error("Something went wrong!",{autoClose:2500});
                }
            }
        }
    }

    async function disableHandler() {

        const reqInfo = { user_code: currObj.id, user_status: currObj.action == 1 ? true : false }

        if (hasCookie('token')) {
            let token = (getCookie('token'));
            let db_name = (getCookie('db_name'));

            let header = {
                headers: {
                    Accept: "application/json",
                    Authorization: "Bearer ".concat(token),
                    db: db_name,
                    m_id: 79
                }
            }

            try {
                const response = await axios.put(Baseurl + `/db/users`, reqInfo, header);
                if (response.status === 204 || response.status === 200) {
                    toast.success(response?.data?.message,{autoClose:2500})
                    setdisableShowConfirm(false)
                    setcurrObj({
                        id: '',
                        action: ''
                    })
                    getDataList();
                }
            } catch (error) {
                toast.error(error?.response?.data?.message,{autoClose:2500});
            }
        }
    }

    async function deleteHandler() {
        setdeleteshowConfirm(false)

        if (hasCookie('token')) {
            let token = (getCookie('token'));
            let db_name = (getCookie('db_name'));

            let header = {
                headers: {
                    Accept: "application/json",
                    Authorization: "Bearer ".concat(token),
                    db: db_name,
                    m_id: 80
                }
            }

            try {
                const response = await axios.delete(Baseurl + `/db/users?id=${currObj.id}`, header);
                if (response.status === 204 || response.status === 200) {
                    toast.success(response?.data?.message,{autoClose:2500})
                    setdeleteshowConfirm(false)
                    setcurrObj({
                        id: '',
                        action: ''
                    })
                    getDataList();
                }
            } catch (error) {
                toast.error(error?.response?.data?.message,{autoClose:2500})
            }
        }

    }

    async function csvSubmitHandler() {
        if (excelData.length <= 0) {
            toast.error('No Data Found Please Check and try Again',{autoClose:2500})
        } else {
            if (hasCookie("token")) {
                let token = getCookie("token");
                let db_name = getCookie("db_name");

                let header = {
                    headers: {
                        Accept: "application/json",
                        Authorization: "Bearer ".concat(token),
                        db: db_name,
                        pass: 'pass'
                    },
                };
                try {
                    const response = await axios.post(Baseurl + `/db/users/owner`, excelData, header);
                    if (response.status === 204 || response.status === 200) {
                        toast.success(response?.data?.message,{autoClose:2500});
                        getDataList();
                        handleClose();
                    }
                } catch (error) {
                    if (error?.response?.data?.message) {
                        toast.error(error?.response?.data?.message,{autoClose:2500});
                    } else {
                        toast.error("Something went wrong!",{autoClose:2500});
                    }
                }
            }
        }

    }
    const updateUserhandler = async () => {
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
          const response = await axios.put(`${Baseurl}/db/users`, {
            db_name: db_name,
            user_code: showAssignTo,
            report_to: oldAssignTo,
          }, header);
          if (response.status === 200 || response.status === 201) {
            toast.success(response?.data?.message,{autoClose:2500});
            setoldAssignTo('')
            setShowAssignTo('')
            toast.success(response?.message,{autoClose:2500})
            getDataList();
          }
        } catch (error) {
          if (error?.response?.data?.status === 422) {
                toast.error(error?.response?.data?.message,{autoClose:2500})
                
          }
          if (error?.response?.data?.message) {
            toast.error(error?.response?.data?.message,{autoClose:2500});
          } else {
            toast.error("Something went wrong!",{autoClose:2500});
          }
        }
    };


    const bookingsFilter=hasCookie("BookingsFilter") ? JSON.parse(getCookie("BookingsFilter")) : null;
    useEffect(()=>{
      if(bookingsFilter){
        getDataList(bookingsFilter)
      }
      else{
        getDataList()
      }
    },[cp_id,cpId,statusId,status_id])


    return (
      <>
     
      <div className="w-100 ps-4 pe-4 overflow-auto Visit">
          <div className="main_content">
            <div className="table_screen">
            <div className="top_btn_sec mb-3 " style={{paddingRight:"0px"}}>
            <div className="col-12 d-flex flex-wrap justify-content-center justify-content-md-end flex-md-nowrap align-items-center gap-3 mt-3 mt-md-0">
            {
                                  (userInfo?.isDB || userInfo?.role_id=="3") && (
                                    <div className='fix-width-1 text-start'>
                                    <label className='fw-bold' style={{ fontSize: '16px' }}>Channel Partner</label>
                                    <Select 
                                      placeholder="Select"
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
              <div className='fix-width-2 text-start'>
              <label className='fw-bold' style={{ fontSize: '16px' }}>Date</label>
              <DateRange value={value} setValue={setValue} getData={getDataList} filterType={"Bookings"} />
              </div>
               
                                <div className='fix-width-3 text-start'>
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
                                </div>
            </div>
            </div>
              <DynamicTable
                title="Bookings"
                dataList={dataList}
                disableConfirm={disableConfirm}
                loader={loader}
                deleteConfirm={deleteConfirm}
                setShowAssignTo={setShowAssignTo}
                setoldAssignTo={setoldAssignTo}
                oldAssignTo={oldAssignTo}
                setShowDateFilter={setShowDateFilter}
                usersList={usersList}
                getDataList={getDataList}
                cpId={cpId}
                setCpId={setCpId}
                statusId={statusId}
                setStatusId={setStatusId}
                start={value?.startDate}
                end={value?.endDate}
              />
            </div>
          </div>
        </div>
        

        <Modal className="commonModal" show={show} onHide={handleClose}>
          <Modal.Header closeButton>
            <Modal.Title> Import CSV </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="add_user_form">
              <div className="row">
                <div className="col-xl-12 col-md-12 col-sm-12 col-12">
                  <div className="input_box">
                    <label htmlFor="AttendenceFile">Select File</label>
                    <input
                      type="file"
                      name="AttendenceFile"
                      id="AttendenceFile"
                      accept=".csv"
                      onChange={importHandler}
                      className="form-control"
                    />
                  </div>
                </div>
                <div className="demoLink text-end py-2">
                  <a
                    className="text-decoration-underline text-primary"
                    href="/Docs/demoUser.csv"
                    download="user-Sample-File.csv"
                  >
                    Views Sample File{" "}
                  </a>
                </div>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <button className="btn btn-cancel me-2" onClick={handleClose}>
              Cancel
            </button>
            <Button variant="primary" onClick={csvSubmitHandler}>
              SUBMIT
            </Button>
          </Modal.Footer>
        </Modal>

        <Modal
          className="w-100"
          size="xl"
          show={showDateFilter}
          onHide={() => setShowDateFilter(false)}
        >
          <Modal.Header closeButton>
            <Modal.Title> Assign to </Modal.Title>
          </Modal.Header>
          <Modal.Body className="mx-auto">
            <Daterange />
          </Modal.Body>
          <Modal.Footer>
            <button
              className="btn btn-cancel me-2"
              onClick={() => setShowDateFilter(false)}
            >
              Cancel
            </button>
            <Button variant="primary">SUBMIT</Button>
          </Modal.Footer>
        </Modal>
      </>
    );
}

export default BookingsScreen