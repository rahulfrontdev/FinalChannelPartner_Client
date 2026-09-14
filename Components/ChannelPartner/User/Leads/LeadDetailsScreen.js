import axios from 'axios';
import { getCookie, hasCookie } from 'cookies-next';
import Link from 'next/link'
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react'
import { Modal } from 'react-bootstrap'
import { Baseurl } from '../../../../Utils/Constants';
import { toast } from 'react-toastify';
import moment from 'moment';
import { useDispatch, useSelector } from 'react-redux';
import { startButtonLoading, stopButtonLoading } from '../../../../store/buttonLoaderSlice';

const LeadDetailsScreen = () => {
  const [showAssignTo, setShowAssignTo] = useState("");
  const router=useRouter();
  const {id}=router.query;
  const DateNow = moment(new Date().toISOString()).format("YYYY-MM-DDTHH:mm");
  const [errorData, setErrorData] = useState({})
  const userInfo=hasCookie("userInfo") ? JSON.parse(getCookie("userInfo")):null
  const dispatch=useDispatch();
    const {isButtonLoading}=useSelector((state)=>state.buttonLoader)

  const [lead,setLead]=useState({
    lead_code:"",
    lead_id:"",
    lead_name: "", 
    email_id: "",
    p_contact_no: "", 
    address: "", 
    pincode: "", 
    p_visit_date: "",
    p_visit_time: "", 
    project_id:"",
    project_name:"",
    created_on:DateNow,
    updated_on:DateNow
  })
 
  const [projectList,setProjectList]=useState([])
  const [locationList,setLocationList]=useState([])
  const [maxDate,setMaxDate]=useState()
  const clientBtnColor=hasCookie("clientBtnColor") ? getCookie("clientBtnColor") : "#293790"
  const daysToAdd = 10;
  // const maxDate = moment().add(daysToAdd, 'days').format('YYYY-MM-DD');

  const getMaxDate = async () => {
      if (hasCookie("token")) {
        let token = getCookie("token");
        let db_name = getCookie("db_name");
  
        let header = {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
            db: db_name,
            m_id: 76,
          },
        };
  
        try {
          const { data } = await axios.get(
            Baseurl + `/db/settings/generalSettings`,
            header
          );
          setMaxDate(moment().add(Number(data?.data[0]?.setting_value), 'days').format('YYYY-MM-DD')); 
        } catch (error) {
          if (error?.response?.data?.message) {
            toast.error(error?.response?.data?.message,{autoClose:2500});
          } else {
            toast.error("Something went wrong!",{autoClose:2500});
          }
        }
      }
    };

  useEffect(()=>{
    if(id){
      getDataListById();
      getMaxDate()
    }
  },[id])

  const getDataListById = async () => {
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
            
            const leads = await axios.get(Baseurl + `/db/channel/lead?lead_id=${id}`, header);
            const projects = await axios.get(Baseurl + `/db/channel/lead/projects`, header);
            const locations = await axios.get(Baseurl + `/db/channel/lead/location`, header);
            setLead({
              ...lead,
              lead_id:leads?.data?.data?.lead_id,
              lead_code:leads?.data?.data?.lead_code,
              lead_name: leads?.data?.data?.lead_name, 
              email_id: leads?.data?.data?.email_id,
              p_contact_no: leads?.data?.data?.p_contact_no, 
              address: leads?.data?.data?.address, 
              pincode: leads?.data?.data?.pincode, 
              p_visit_date: leads?.data?.data?.p_visit_date,
              p_visit_time: leads?.data?.data?.p_visit_time, 
              project_id:leads?.data?.data?.sales_project_id,
              project_name:leads?.data?.data?.sales_project_name,
              created_on:leads?.data?.data?.createdAt?.split("T"),
              createdBy:leads?.data?.data?.leadOwner?.user || ""
            });
            setProjectList(projects?.data?.data?.records);
            setLocationList(locations?.data?.data)
        } catch (error) {
          console.log(error)
            if (error?.response?.data?.message) {
                toast.error(error?.response?.data?.message,{autoClose:2500});
            } else {
                toast.error("Something went wrong!",{autoClose:2500});
            }
        }
    }
  }
  
  const editLead =  async(e) => {
  e.preventDefault();
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
     
     let updatedLeads={...lead,updated_on:DateNow}
    
     try {
      dispatch(startButtonLoading())
       const response = await axios.put(`${Baseurl}/db/channel/lead`,updatedLeads, header);
       if (response.status === 200 || response.status === 201) {
         toast.success(response?.data?.message,{autoClose:2500});
        dispatch(stopButtonLoading())
         setShowAssignTo(false)
         toast.success(response?.message,{autoClose:2500})
         getDataListById();
       }
     } catch (error) {
      console.log(error)
       if (error?.response?.data?.status === 422) {
            //  toast.error(error?.response?.data?.message,{autoClose:2500})
             const taskObject = {}
             const array = error?.response?.data?.data;
             for (let i = 0; i < array.length; i++) {
              const key = Object.keys(array[i])[0];
              const value = Object.values(array[i])[0];
              taskObject[key] = value;
          }
          dispatch(stopButtonLoading())
          setErrorData(taskObject);
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

 function formatTime(timeString) {
  const timeParts = timeString.split(':');
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



  return (
    <div className="w-100 bg-white overflow-auto">
      <section className="Channel-profile Booking-Detail Visit-Details bg-white pt-4 pb-2">
        <div className="container mt-4 mb-4">
          <div className="row gx-4">
            <div className="profile-text mb-2 mb-md-4">Leads/ Lead Detail</div>
            <div className="col-12  col-lg-12">
              <div className="lead-detail-sec overflow-hidden">
                <ul className="list-group General-list h-auto rounded-0 m-0">
                  <li
                    style={{ background: `${clientBtnColor}` }}
                    className="list-group-item list-group-item-action text-white d-flex justify-content-between"
                    aria-current="true"
                  >
                    <span className="lead-id text-white">{lead?.lead_code}</span>
                    {
                      userInfo?.role_id==1 && (
                        <img
                        className=' cursor-pointer'
                        src="/ChannelPartner/profile-edit-white.svg"
                        onClick={() => setShowAssignTo(true)}
                        alt
                      />
                      )
                    }
                  </li>
                </ul>
                <div className="row bg-white">
                  <div className="col-12 col-lg-6">
                    <div className="list-group General-list d-flex flex-column gap-4 bg-white leads-content h-auto m-0 border-lg-0">
                      <div className="row">
                        <div className="col-5 col-md-5">
                          <div className="list-group-item list-group-item-action p-0 border-0">
                            <span className="list-left">Lead Name</span>
                          </div>
                        </div>
                        <div className="col-7 col-md-6">
                          <div className="list-group-item list-group-item-action p-0 border-0">
                            <span className="list-right">
                              {lead?.lead_name}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="row">
                        <div className="col-5 col-md-5">
                          <div className="list-group-item list-group-item-action p-0 border-0">
                            <span className="list-left">Email</span>
                          </div>
                        </div>
                        <div className="col-7 col-md-6">
                          <div className="list-group-item list-group-item-action p-0 border-0">
                            <span className="list-right">{lead?.email_id}</span>
                          </div>
                        </div>
                      </div>
                      <div className="row">
                        <div className="col-5 col-md-5">
                          <div className="list-group-item list-group-item-action p-0 border-0">
                            <span className="list-left">Contact No.</span>
                          </div>
                        </div>
                        <div className="col-7 col-md-6">
                          <div className="list-group-item list-group-item-action p-0 border-0">
                            <span className="list-right">
                              {lead?.p_contact_no}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="row">
                        <div className="col-5 col-md-5">
                          <div className="list-group-item list-group-item-action p-0 border-0">
                            <span className="list-left">Project</span>
                          </div>
                        </div>
                        <div className="col-7 col-md-6">
                          <div className="list-group-item list-group-item-action p-0 border-0">
                            <span className="list-right">
                              {lead?.project_name || "------"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="row">
                        <div className="col-5 col-md-5">
                          <div className="list-group-item list-group-item-action p-0 border-0">
                            <span className="list-left">Created At</span>
                          </div>
                        </div>
                        <div className="col-7 col-md-6">
                          <div className="list-group-item list-group-item-action p-0 border-0">
                            <span className="list-right">
                              {formatDate(lead?.created_on)=="NaN/NaN/NaN"? "":formatDate(lead?.created_on)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-12 col-lg-6">
                    <div className="list-group General-list d-flex flex-column gap-4 bg-white leads-content h-auto m-0">
                      <div className="row">
                        <div className="col-5 col-md-5">
                          <div className="list-group-item list-group-item-action p-0 border-0">
                            <span className="list-left">Location</span>
                          </div>
                        </div>
                        <div className="col-7 col-md-6">
                          <div className="list-group-item list-group-item-action p-0 border-0">
                            <span className="list-right">{lead?.address}</span>
                          </div>
                        </div>
                      </div>
                      <div className="row">
                        <div className="col-5 col-md-5">
                          <div className="list-group-item list-group-item-action p-0 border-0">
                            <span className="list-left">Pincode</span>
                          </div>
                        </div>
                        <div className="col-7 col-md-6">
                          <div className="list-group-item list-group-item-action p-0 border-0">
                            <span className="list-right">{lead?.pincode}</span>
                          </div>
                        </div>
                      </div>
                      <div className="row">
                        <div className="col-5 col-md-5">
                          <div className="list-group-item list-group-item-action p-0 border-0">
                            <span className="list-left">
                              Schedule Visit Date
                            </span>
                          </div>
                        </div>
                        <div className="col-7 col-md-6">
                          <div className="list-group-item list-group-item-action p-0 border-0">
                            <span className="list-right">
                              {formatDate(lead.p_visit_date)=="NaN/NaN/NaN"? "":formatDate(lead.p_visit_date)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="row">
                        <div className="col-5 col-md-5">
                          <div className="list-group-item list-group-item-action p-0 border-0">
                            <span className="list-left">
                            Schedule Visit Time
                            </span>
                          </div>
                        </div>
                        <div className="col-7 col-md-6">
                          <div className="list-group-item list-group-item-action p-0 border-0">
                            <span className="list-right">
                              {lead?.p_visit_time
                                ? formatTime(lead?.p_visit_time)
                                : ""}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="row">
                        <div className="col-5 col-md-5">
                          <div className="list-group-item list-group-item-action p-0 border-0">
                            <span className="list-left">
                            Created By
                            </span>
                          </div>
                        </div>
                        <div className="col-7 col-md-6">
                          <div className="list-group-item list-group-item-action p-0 border-0">
                            <span className="list-right">
                              {lead?.createdBy? lead?.createdBy: "----------"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <Link
            href={"/partner/Leads"}
            className="details-btn d-flex justify-content-center gap-4 mt-4 mt-md-5"
          >
            <button
              style={{ background: `${clientBtnColor}` }}
              className="back-to-lead d-flex align-items-center justify-content-center text-white border-0"
            >
              Back to Leads
            </button>
          </Link>
        </div>
      </section>
      <Modal
        className="w-100"
        show={!showAssignTo ? false : true}
        onHide={() =>{ 
            if(isButtonLoading==false){
              setShowAssignTo("")}}
            }
        size="xl"
        centered
      >
        <Modal.Body>
          <section
            className="Sign-In pt-4 Create-New-Lead"
            style={{ padding: "0 16px" }}
          >
            <div className="container">
              <div className="row">
                <h3 className=" Perfect-Home text-center ">
                  Edit Lead Details
                </h3>
                <div className="col-12 mt-md-5">
                  <div className="Sign-In_Sign-Up Register w-100">
                    <div className="perfect-home-form pt-1">
                      <section className="Details_Form">
                        <div className="">
                          <form
                            id="survey-form"
                            method="post"
                            onSubmit={(e) => {
                              editLead(e);
                            }}
                          >
                            <div className="row">
                              <div className="col col-xl-6 col-md-6 col-sm-12 my-2">
                                <div className="row ">
                                  <div className="col-3">
                                    <label htmlFor="name" className="pb-1">
                                      Lead Name
                                      <span className="star text-danger">
                                        *
                                      </span>
                                    </label>
                                  </div>
                                  <div className="col-9">
                                    <input
                                      autofocus
                                      value={lead?.lead_name}
                                      onChange={(e) => {
                                        setLead({
                                          ...lead,
                                          lead_name: e.target.value,
                                        });
                                      }}
                                      type="text"
                                      name="name"
                                      className="input-field"
                                      placeholder
                                      required
                                    />
                                    <span className='errorText text-danger'>
                                          {errorData?.lead_name ? errorData.lead_name:""}
                                      </span>
                                  </div>
                                </div>
                              </div>

                              <div className='col col-xl-6 col-md-6 col-sm-12 my-2'>
                                <div className='row '>
                                  <div className="col-3">
                                      <label htmlFor="name" className="pb-1">Location<span className="star text-danger">*</span></label>
                                    </div>
                                    <div className="col-9">
                                    <select required name 
                                    value={lead?.address}
                                    onChange={(e) => {
                                      
                                      const location_name = locationList?.find((l) => l?.name === e.target.value)?.name
                                      setLead((lead) => ({
                                        ...lead,
                                        address: location_name,
                                      }));
                                    }} 
                                    className="form-select dropdown" style={{paddingTop: 12, paddingBottom: 12}}>
                                      <option value selected disabled>Select</option>
                                      {
                                        locationList?.map((location)=>(
                                          <option key={location?.lead_location_id} value={location?.name} className="dropdown-item" >
                                            {location?.name}
                                          </option>
                                        ))
                                      }
                                    </select>
                                    <span className='errorText text-danger'>
                                          {errorData?.address ? errorData.address:""}
                                      </span>
                                    </div>
                                </div>
                              </div>

                              <div className="col col-xl-6 col-md-6 col-sm-12 my-2">
                                <div className="row ">
                                  <div className="col-3">
                                    <label htmlFor="name" className="pb-1">
                                      Email
                                      <span className="star text-danger">
                                        *
                                      </span>
                                    </label>
                                  </div>
                                  <div className="col-9">
                                    <input
                                      autofocus
                                      value={lead?.email_id}
                                      onChange={(e) => {
                                        setLead({
                                          ...lead,
                                          email_id: e.target.value,
                                        });
                                      }}
                                      type="text"
                                      name="name"
                                      className="input-field"
                                      placeholder
                                      required
                                    />
                                    <span className='errorText text-danger'>
                                          {errorData?.email_id ? errorData.email_id:""}
                                      </span>
                                  </div>
                                </div>
                              </div>

                              <div className="col col-xl-6 col-md-6 col-sm-12 my-2">
                                <div className="row ">
                                  <div className="col-3">
                                    <label htmlFor="name" className="pb-1">
                                      Pincode
                                      <span className="star text-danger">
                                        *
                                      </span>
                                    </label>
                                  </div>
                                  <div className="col-9">
                                    <input
                                      autofocus
                                      value={lead?.pincode}
                                      onChange={(e) => {
                                        setLead({
                                          ...lead,
                                          pincode: e.target.value,
                                        });
                                      }}
                                      type="text"
                                      name="name"
                                      className="input-field"
                                      placeholder
                                      required
                                    />
                                    <span className='errorText text-danger'>
                                          {errorData?.pincode ? errorData.pincode:""}
                                      </span>
                                  </div>
                                </div>
                              </div>

                              <div className="col col-xl-6 col-md-6 col-sm-12 my-2">
                                <div className="row ">
                                  <div className="col-3">
                                    <label htmlFor="name" className="pb-1">
                                      Contact No
                                      <span className="star text-danger">
                                        *
                                      </span>
                                    </label>
                                  </div>
                                  <div className="col-9">
                                    <input
                                      autofocus
                                      value={lead?.p_contact_no}
                                      onChange={(e) => {
                                        setLead({
                                          ...lead,
                                          p_contact_no: e.target.value,
                                        });
                                      }}
                                      type="text"
                                      name="name"
                                      className="input-field"
                                      placeholder
                                      required
                                    />
                                    <span className='errorText text-danger'>
                                          {errorData?.p_contact_no ? errorData.p_contact_no:""}
                                      </span>
                                  </div>
                                </div>
                              </div>

                              <div className="col col-xl-6 col-md-6 col-sm-12 my-2">
                                <div className="row ">
                                  <div className="col-3">
                                    <label htmlFor="name" className="pb-1">
                                      Visit Date
                                      <span className="star text-danger">
                                        *
                                      </span>
                                    </label>
                                  </div>
                                  <div className="col-9">
                                    <input
                                      autofocus
                                      min={moment().format("YYYY-MM-DD")}
                                      max={maxDate}
                                      value={lead?.p_visit_date}
                                      onChange={(e) => {
                                        setLead({
                                          ...lead,
                                          p_visit_date: e.target.value,
                                        });
                                      }}
                                      type="Date"
                                      name="name"
                                      className="input-field"
                                      placeholder
                                      required
                                    />
                                    <span className='errorText text-danger'>
                                          {errorData?.p_visit_date ? errorData.p_visit_date:""}
                                      </span>
                                  </div>
                                </div>
                              </div>

                              <div className="col col-xl-6 col-md-6 col-sm-12 my-2">
                                <div className="row ">
                                  <div className="col-3">
                                    <label htmlFor="name" className="pb-1">
                                      Project
                                      <span className="star text-danger">
                                        *
                                      </span>
                                    </label>
                                  </div>
                                  <div className="col-9">
                                    <select
                                      name
                                      value={lead?.project_id}
                                      onChange={(e) => {
                                        setLead({
                                          ...lead,
                                          project_id: e.target.value,
                                        });
                                      }}
                                      className="form-select dropdown"
                                      style={{
                                        paddingTop: 12,
                                        paddingBottom: 12,
                                      }}
                                    >
                                      <option value selected disabled>
                                        Select
                                      </option>
                                      {projectList?.map((project) => (
                                        <option
                                          key={project?.Id}
                                          value={project?.Id}
                                          className="dropdown-item"
                                          href="#"
                                        >
                                          {project?.Project_Name__c}
                                        </option>
                                      ))}
                                    </select>
                                    <span className='errorText text-danger'>
                                          {errorData?.project_id ? errorData.project_id:""}
                                      </span>
                                  </div>
                                </div>
                              </div>

                              <div className="col col-xl-6 col-md-6 col-sm-12 my-2">
                                <div className="row ">
                                  <div className="col-3">
                                    <label htmlFor="name" className="pb-1">
                                      Visit Time
                                      <span className="star text-danger">
                                        *
                                      </span>
                                    </label>
                                  </div>
                                  <div className="col-9">
                                    <input
                                      autofocus
                                      value={lead?.p_visit_time}
                                      onChange={(e) => {
                                        setLead({
                                          ...lead,
                                          p_visit_time: e.target.value,
                                        });
                                      }}
                                      type="time"
                                      name="name"
                                      className="input-field"
                                      placeholder
                                      required
                                    />
                                    <span className='errorText text-danger'>
                                          {errorData?.p_visit_time ? errorData.p_visit_time:""}
                                      </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="new-leades-btn d-flex justify-content-center gap-4 mt-4 mt-md-5">
                              <button 
                              type='button'
                              disabled={isButtonLoading}
                                className="btn btn-danger text-white rounded-5"
                                onClick={() => {
                                  setShowAssignTo("");
                                }}
                                style={{
                                  borderColor: clientBtnColor,
                                  color: clientBtnColor
                                    ? clientBtnColor
                                    : "#293790",
                                }}
                              >
                                Cancel
                              </button>
                              <button className="btn rounded-5 text-white" style={{background:clientBtnColor}}>
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
    </div>
  );
}

export default LeadDetailsScreen