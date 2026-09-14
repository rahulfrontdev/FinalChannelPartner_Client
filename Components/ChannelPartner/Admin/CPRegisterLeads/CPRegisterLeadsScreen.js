import React, { useEffect, useState } from 'react'
import Link from 'next/link';
import axios from 'axios';
import { Baseurl } from '../../../../Utils/Constants';
import { hasCookie, getCookie, setCookie } from 'cookies-next';
import { toast } from 'react-toastify';
import ConfirmBox from "../../../Basics/ConfirmBox";
import { useSelector } from 'react-redux';
import Modal from "react-bootstrap/Modal";
import { Button } from 'react-bootstrap';
import dynamic from 'next/dynamic'
import Papa from "papaparse";
import Loader from '../../../Loader/Loader';
import { useRouter } from 'next/router';
import DateRange from '../../../DateRangeCustom/Daterange';
const DynamicTable = dynamic(
  () => import('./CPRegisterLeadsTable'),
  { ssr: false }
)
import Select from 'react-select';
import { fetchData } from '../../../../Utils/getReq';


const CPRegisterLeadsScreen = () => {
  const sideView = useSelector((state) => state.sideView.value);
  const router = useRouter()
  const { bst_id } = router.query;
  const { status_id } = router.query;
  const [bstId, setBstId] = useState(hasCookie("bstId") ? getCookie("bstId") : '')
  const [statusId, setStatusId] = useState(hasCookie("cpLeadstatusId") ? getCookie("cpLeadstatusId") : '')
  const [dataList, setDataList] = useState([])
  const [disableShowConfirm, setdisableShowConfirm] = useState(false)
  const [deleteshowConfirm, setdeleteshowConfirm] = useState(false)
  const [confirmText, setconfirmText] = useState('')
  const [show, setShow] = useState(false);
  const [excelData, setexcelData] = useState([]);
  const [currObj, setcurrObj] = useState({
    cpl_id: '',
    db_name: ''
  })
  const [loader, setLoader] = useState(false);

  const [usersList, setUsersList] = useState([]);
  const userInfoCheck = hasCookie("userInfo") ? JSON.parse(getCookie("userInfo")) : null;

  async function getUsersList() {
    await fetchData("/db/users", setUsersList, null, null);
  }

  useEffect(() => {
    getUsersList()
  }, [])

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

  let statusArray = [{ id: "", label: "All" }, { id: "OPEN", label: "OPEN" }, { id: "CONTACTED", label: "CONTACTED" }, { id: "LINK SENT", label: "LINK SENT" }, { id: "ONBOARDED", label: "ONBOARDED" }, { id: "NOT INTERESTED", label: "NOT INTERESTED" }, { id: "CALL", label: "CALL" }, , { id: "VISIT", label: "VISIT" }, { id: "FOLLOW UP", label: "FOLLOW UP" }, { id: "Accept", label: "Accepted" }, { id: "Reject", label: "Rejected" }]

  useEffect(() => {
    if (status_id) {
      setStatusId(status_id)
    }

  }, [status_id])
  useEffect(() => {
    if (bst_id) {
      setBstId(bst_id)
    }

  }, [bst_id])

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


  const getDataList = async (queryObjLeads) => {
    let db_name = (getCookie('db_name'));
    let url = `/db/channelPartnerLeads?db_name=${db_name}`;
    let params = {};
    if (bst_id) {
      params.bst_id = bst_id;
    }
    if (bstId) {
      params.bst_id = bstId;
    }
    if (status_id) {
      params.status_id = status_id;
    }
    if (statusId) {
      params.status_id = statusId;
    }
    const queryString = new URLSearchParams(params).toString();
    if (queryString) {
      url += `&${queryString}`;  // Append with '&' instead of '?' since db_name is already there
    }
    setLoader(true);
    if (hasCookie('token')) {
      let token = (getCookie('token'));

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
        console.log("response ", response.data.data)
        if (response?.status === 200 || response?.status === 201) {
          setLoader(false);
          setDataList(response?.data?.data?.leads || []);
        }
      } catch (error) {
        if (error?.response?.data?.message) {
          setLoader(false);
          toast.error(error?.response?.data?.message, { autoClose: 2500 });
        } else {
          setLoader(false);
          toast.error("Something went wrong!", { autoClose: 2500 });
        }
      }
    }
  }

  async function csvSubmitHandler() {
    if (excelData.length <= 0) {
      toast.error('No Data Found Please Check and try Again', { autoClose: 2500 })
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
            toast.success(response?.data?.message, { autoClose: 2500 });
            getDataList();
            handleClose();
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
        const response = await axios.delete(Baseurl + `/db/channelPartnerLeads?cpl_id=${currObj.cpl_id}&db_name=${db_name}`, header);
        if (response.status === 204 || response.status === 200) {
          toast.success(response?.data?.message, { autoClose: 2500 })
          setdeleteshowConfirm(false)
          setcurrObj({
            cpl_id: '',
            db_name: ''
          })
          getDataList();
        }
      } catch (error) {
        toast.error(error?.response?.data?.message, { autoClose: 2500 })
      }
    }

  }


  const cpleadsFilter = hasCookie("cpleadsFilter") ? JSON.parse(getCookie("cpleadsFilter")) : null;

  useEffect(() => {
    if (cpleadsFilter) {
      getDataList(cpleadsFilter)
    }
    else {
      getDataList()
    }
  }, [bstId, statusId])

  return (
    <>
      <ConfirmBox
        showConfirm={deleteshowConfirm}
        setshowConfirm={setdeleteshowConfirm}
        actionType={deleteHandler}
        title={"Are You Sure you want to Delete ?"}
      />
      <div className="w-100 ps-4 pe-4 pb-4 overflow-scroll" >

        <div className="main_content">
          <div className="table_screen">
            <div className="top_btn_sec ">
              <div className="d-flex flex-wrap flex-md-nowrap align-items-center gap-3">
                <div className='col-6 col-md-3 mt-4 mt-md-2'>
                  <DateRange value={value} setValue={setValue} getData={getDataList} filterType={"cpleads"} />
                </div>
                {
                  userInfoCheck?.isDB && (
                    <div className='col-6 col-md-5 mb-3 text-start'>
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
                          usersList?.filter(item => item?.role_id == 2)?.map((item) => {
                            if (bstId == item?.user_id) {
                              return {
                                value: item?.user_id,
                                label: item?.user
                              }
                            }
                          })
                        }
                        onChange={(e) => {
                          if (e.value == "") {
                            setCookie("bstId", e.value)
                            router.push("/partner/CPRegisterLeads")
                            setBstId(e.value)
                          }
                          else {
                            setCookie("bstId", e.value)
                            setBstId(e.value)
                          }

                        }}
                      />
                    </div>
                  )
                }

                <div className='col-5 col-md-4 mb-3 text-start'>
                  <label className='fw-bold' style={{ fontSize: '16px' }}>Status</label>
                  <Select
                    placeholder="Select Stage"
                    options={statusArray?.map((item) => {
                      return {
                        value: item.id,
                        label: item.label
                      }
                    })}
                    value={
                      statusArray?.map((item) => {
                        if (statusId == item?.id) {
                          return {
                            value: item.id,
                            label: item.label
                          }
                        }
                      })
                    }
                    onChange={(e) => {
                      if (e.value == "") {
                        setCookie("cpLeadstatusId", e.value)
                        router.push("/partner/CPRegisterLeads")
                        setStatusId(e.value)
                      }
                      else {
                        setCookie("cpLeadstatusId", e.value)
                        setStatusId(e.value)
                      }

                    }}
                  />
                </div>
              </div>
            </div>
            <DynamicTable
              title='Channel Partner Registration Leads'
              dataList={dataList}
              loader={loader}
              setdeleteshowConfirm={setdeleteshowConfirm}
              disableConfirm={disableConfirm}
              deleteConfirm={deleteConfirm}
              getDataList={getDataList}
              setcurrObj={setcurrObj}
              currObj={currObj}
              bstId={bstId}
              setBstId={setBstId}
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
          <Modal.Title>  Import CSV </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="add_user_form">
            <div className="row">
              <div className="col-xl-12 col-md-12 col-sm-12 col-12">
                <div className="input_box">
                  <label htmlFor="AttendenceFile">Select File</label>
                  <input type="file"
                    name="AttendenceFile"
                    id="AttendenceFile"
                    accept=".csv"
                    onChange={importHandler}
                    className="form-control" />
                </div>
              </div>
              <div className="demoLink text-end py-2">
                <a className="text-decoration-underline text-primary" href="/Docs/demoUser.csv" download='user-Sample-File.csv'>Views Sample File </a>
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button className="btn btn-cancel me-2" onClick={handleClose}>Cancel</button>
          <Button variant="primary" onClick={csvSubmitHandler}>
            SUBMIT
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}

export default CPRegisterLeadsScreen