import React, { useEffect, useState } from 'react'
import Link from 'next/link';
import PlusIcon from '../../../Svg/PlusIcon';
import axios from 'axios';
import { hasCookie, getCookie, setCookie } from 'cookies-next';
import { toast } from 'react-toastify';

import { useSelector } from 'react-redux';
import { Modal, Button, Form, Row, Col, Dropdown } from 'react-bootstrap';
import dynamic from 'next/dynamic'
import Papa from "papaparse";
import { Baseurl, isRmRole, isBstRole, isAdminUser } from '../../../../Utils/Constants';
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

const VisitsScreen = () => {
    const router = useRouter()
    const {cp_id} =router.query;
    const {status_id} =router.query;
    const userInfoCheck=hasCookie("userInfo")?JSON.parse(getCookie("userInfo")):null;
    const [cpId,setCpId] =useState(hasCookie("VisitcpId") ? getCookie("VisitcpId"):'')
    const [statusId,setStatusId] =useState(hasCookie("VisitstatusId") ? getCookie("VisitstatusId"):'')
    const [visitType, setVisitType] = useState(() => {
      // Channel Partner profile: always Client visits
      if (Number(userInfoCheck?.role_id) === 1) return "client";
      // RM / BST profile: always CP visits
      if (isRmRole(userInfoCheck?.role_id) || isBstRole(userInfoCheck?.role_id)) return "cp";
      return hasCookie("VisitTypeTab") ? getCookie("VisitTypeTab") : "client";
    })
    const [dataList, setDataList] = useState([])
    const [show, setShow] = useState(false);
    const[loader,setLoader]=useState(false)
    const [oldAssignTo, setoldAssignTo] = useState("");
    const [showDateFilter, setShowDateFilter] = useState(false);
    const [excelData, setexcelData] = useState([]);
    
    const clientBtnColor=hasCookie("clientBtnColor") ? getCookie("clientBtnColor") : "#293790"

    let statusArray=[{id:"",label:"All"},{id:"Requested",label:"Requested"},{id:"Scheduled",label:"Scheduled"},{id:"Rescheduled",label:"Rescheduled"},{id:"Completed",label:"Completed"},{id:"Rejected",label:"Rejected"}]

      const [usersList, setUsersList] = useState([]);
      
        async function getUsersList() {
          await fetchData("/db/users", setUsersList, null, null);
        }
      
        useEffect(()=>{
          getUsersList()
        },[])

        // Channel Partner: force Client visits (ignore leftover CP visit cookie)
        useEffect(() => {
          if (Number(userInfoCheck?.role_id) === 1 && visitType !== "client") {
            setVisitType("client");
            setCookie("VisitTypeTab", "client");
          }
        }, [userInfoCheck?.role_id, visitType])

        // RM profile: only CP visits (no Client visit tab)
        useEffect(() => {
          if (isRmRole(userInfoCheck?.role_id) && visitType !== "cp") {
            setVisitType("cp");
            setCookie("VisitTypeTab", "cp");
          }
        }, [userInfoCheck?.role_id, visitType])

        // BST profile: only CP visits (no Client visit tab)
        useEffect(() => {
          if (isBstRole(userInfoCheck?.role_id) && visitType !== "cp") {
            setVisitType("cp");
            setCookie("VisitTypeTab", "cp");
          }
        }, [userInfoCheck?.role_id, visitType])
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


    const getVisitList = async (queryObjLeads) => {
      setLoader(true)
      let url = `/db/channel/visit`;
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
                const response = await axios.get(Baseurl + url,{
                  ...header,
                  params: queryObjLeads,
                });
                if(response?.status === 200 || response?.status === 201){
                  setLoader(false)
                const visitData = response?.data?.data;
                setDataList(Array.isArray(visitData) ? visitData : []);
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

    const getCpVisitList = async (queryObjLeads) => {
      setLoader(true);
      const db_name = getCookie('db_name');
      // Admin & BST: visit_list=true only (no source)
      // RM: ONBOARDED_CP_VISIT | others: CP_LEAD_VISIT
      const isAdmin = isAdminUser(userInfoCheck);
      const isBst = isBstRole(userInfoCheck?.role_id);
      let url = `/db/channelPartnerLeads?db_name=${db_name}&visit_list=true`;
      if (isRmRole(userInfoCheck?.role_id)) {
        url += `&source=ONBOARDED_CP_VISIT`;
      } else if (!isAdmin && !isBst) {
        url += `&source=CP_LEAD_VISIT`;
      }

      if (hasCookie('token')) {
        const token = getCookie('token');
        const header = {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
            db: db_name,
            m_id: 76,
          }
        };

        try {
          const response = await axios.get(Baseurl + url, {
            ...header,
            params: queryObjLeads,
          });
          if (response?.status === 200 || response?.status === 201 || response?.status === 304) {
            setLoader(false);
            const visitData = response?.data?.data;
            const visits = Array.isArray(visitData)
              ? visitData
              : Array.isArray(visitData?.visits)
                ? visitData.visits
                : [];
            setDataList(visits);
          }
        } catch (error) {
          setLoader(false);
          if (error?.response?.data?.message) {
            toast.error(error?.response?.data?.message, { autoClose: 2500 });
          } else {
            toast.error("Something went wrong!", { autoClose: 2500 });
          }
        }
      }
    };

    const handleVisitTypeChange = (type) => {
      setCookie("VisitTypeTab", type);
      setVisitType(type);
    };

    const fetchVisitData = (filterParams) => {
      if (visitType === "cp") {
        getCpVisitList(filterParams);
      } else {
        getVisitList(filterParams);
      }
    };

    // Hide visit-type tabs for RM & BST (CP visits only; no Client visit)
    const showVisitTypeToggle =
      !isRmRole(userInfoCheck?.role_id) &&
      !isBstRole(userInfoCheck?.role_id) &&
      (userInfoCheck?.role_id == null || userInfoCheck?.role_id == 3 || userInfoCheck?.isDB);

    

   

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
                        getVisitList();
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
    
    const visitsFilter=hasCookie("VisitsFilter") ? JSON.parse(getCookie("VisitsFilter")) : null;
    useEffect(()=>{
      if(visitsFilter){
        fetchVisitData(visitsFilter)
      }
      else{
        fetchVisitData()
      }
    },[cp_id,cpId,statusId,status_id,visitType])

    return (
      <>
      
      <div className="w-100 ps-4 pe-4 overflow-auto Visit">
          <div className="main_content">
            <div className="table_screen">
            <div className="top_btn_sec mb-3 " style={{paddingRight:"0px"}}>
            <div className="col-12 d-flex flex-wrap flex-md-nowrap justify-content-center justify-content-md-end align-items-center gap-3 mt-3 mt-md-0">
            {
                                  showVisitTypeToggle && visitType === "client" && (userInfoCheck?.isDB || userInfoCheck?.role_id=="3" ) && (
                                    <div className='fix-width-1 text-start'>
                                    <label className='fw-bold' style={{ fontSize: '16px' }}>Channel Partner</label>
                                    <Select 
                                      placeholder="Select"
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
              <div className='fix-width-2 text-start'>
              <label className='fw-bold' style={{ fontSize: '16px' }}>Date</label>
              <DateRange value={value} setValue={setValue} getData={fetchVisitData} filterType={"Visits"} />
              </div>
               
                                {visitType === "client" && (
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
                                </div>
                                )}
            </div>
            </div>
              <DynamicTable
                title="Visits"
                dataList={dataList}
                disableConfirm={disableConfirm}
                deleteConfirm={deleteConfirm}
                loader={loader}
                setoldAssignTo={setoldAssignTo}
                oldAssignTo={oldAssignTo}
                setShowDateFilter={setShowDateFilter}
                getVisitList={fetchVisitData}
                cpId={cpId}
                setCpId={setCpId}
                statusId={statusId}
                setStatusId={setStatusId}
                visitType={visitType}
                setVisitType={handleVisitTypeChange}
                showVisitTypeToggle={showVisitTypeToggle}
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

export default VisitsScreen