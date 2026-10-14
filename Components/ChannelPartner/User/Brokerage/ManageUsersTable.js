import React, { useEffect, useState } from 'react'
import MUIDataTable from "mui-datatables";
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Button, Modal } from 'react-bootstrap';
import Select from 'react-select';
import axios from 'axios';
import { Baseurl, filesUrl } from '../../../../Utils/Constants';
import { getCookie, hasCookie, setCookie } from 'cookies-next';
import { toast } from 'react-toastify';
import PlusIcon from '../../../Svg/PlusIcon';
import DateRange from '../../../DateRangeCustom/Daterange';
import { saveAs } from 'file-saver';
import Loader from '../../../Loader/Loader';
import { fetchData } from '../../../../Utils/getReq';
import * as XLSX from "xlsx";





const ManageUsersTable = ({ start, end, deleteConfirm, disableConfirm, dataList, openEdtMdl, title, setShowAssignTo, oldAssignTo, setoldAssignTo, setShowDateFilter, getDataList, loader, cpId, setCpId, statusId, setStatusId }) => {
  const router = useRouter()
  const [data, setData] = useState([])
  const [userData, setUserData] = useState([])
  const [actionMode, setActionMode] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showModal2, setShowModal2] = useState(false)
  const [userInfo, setUserInfo] = useState({
    user_code: '',
    reject_reason: ''
  })
  const [roleId, setRoleId] = useState()

  const getCurrentWeekDates = () => {
    const startDate = new Date(new Date().setDate(new Date().getDate() - new Date().getDay() + 1));
    const endDate = new Date(new Date().setDate(startDate.getDate() + 6));
    if (hasCookie("BrokerageFilter")) {

      let data = JSON.parse(getCookie("BrokerageFilter"))
      return { startDate: data?.f_date, endDate: data?.t_date }
    }
    else {
      return { startDate, endDate };
    }
  };

  const [value, setValue] = useState(getCurrentWeekDates());
  const [errorToast, setErrorToast] = useState(false);
  const [usersList, setUsersList] = useState([]);
  const userInfoCheck = hasCookie("userInfo") ? JSON.parse(getCookie("userInfo")) : null;

  async function getUsersList() {
    await fetchData("/db/users", setUsersList, errorToast, setErrorToast);
  }

  useEffect(() => {
    getUsersList()
  }, [])

  const clientBtnColor = hasCookie("clientBtnColor") ? getCookie("clientBtnColor") : "#293790"
  const [brokerageId, setBrokerageId] = useState("")
  const [rejectRemark, setRejectRemark] = useState(false)
  const [updateBill, setUpdateBill] = useState({
    date: "",
    amount: "",
    booking_id: "",
    brokerage_id: "",
    file: null,
    booking_name: "",
    status: "",
    bill_file: "",
    reject_remark: null
  })

  const resetUpdateData = () => {
    setUpdateBill({
      date: "",
      amount: "",
      booking_id: "",
      brokerage_id: "",
      file: null,
      booking_name: "",
      status: "",
      bill_file: "",
      reject_remark: null
    })
    setRejectRemark(false)
  }


  const getDataListById = async (brokerageId) => {

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
        const response = await axios.get(Baseurl + `/db/channel/brokerage?brokerage_id=${brokerageId}`, header);
        setUpdateBill({
          ...updateBill,
          booking_name: response?.data?.data?.BrokerageBookingtData?.booking_name,
          amount: response?.data?.data?.amount,
          status: response?.data?.data?.status === 'Bill sent' ? 'Bill Received' : response?.data?.data?.status,
          date: response?.data?.data?.date,
          file: response?.data?.data?.bill_file,
          booking_id: response?.data?.data?.BrokerageBookingtData?.booking_id,
          brokerage_id: response?.data?.data?.brokerage_id,
          reject_remark: response?.data?.data?.reject_remark,
        })
      } catch (error) {
        if (error?.response?.data?.message) {
          toast.error(error?.response?.data?.message, { autoClose: 2500 });
        } else {
          toast.error("Something went wrong!", { autoClose: 2500 });
        }
      }
    }
  }

  useEffect(() => {
    if (brokerageId) {
      getDataListById();
    }
  }, [brokerageId])

  useEffect(() => {
    if (hasCookie("userInfo")) {
      const userInfoData = JSON.parse(getCookie("userInfo"));
      // Ensure role_id is numeric because UI uses `roleId === 2`
      setRoleId(Number(userInfoData.role_id))
    }
  }, []);

  const updateBrokerageBill = async () => {
    if (updateBill?.status == "Payment Rejected" && updateBill?.reject_remark == "") {
      return toast.warning("Please Enter Reject Remark", { autoClose: 2500 })
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

    const formData = new FormData();
    for (const [key, value] of Object.entries(updateBill)) {
      formData.append(key, value);
    }
    try {
      const response = await axios.put(`${Baseurl}/db/channel/brokerage`, formData, header);
      if (response.status === 200 || response.status === 201) {
        toast.success(response?.data?.message, { autoClose: 2500 });
        setShowModal2(false)
        resetUpdateData()
        getDataList()

      }
    } catch (error) {
      console.log(error)
      if (error?.response?.data?.status === 422) {
        toast.error(error?.response?.data?.message, { autoClose: 2500 })

      }
      if (error?.response?.data?.message) {
        toast.error(error?.response?.data?.message, { autoClose: 2500 });
      } else {
        toast.error("Something went wrong!", { autoClose: 2500 });
      }
    }
  };

  const columns = [
    {
      name: 'brokerage_id',
      label: "Booking ID",
      options: {
        filter: false,
        display: false,
        download: false,
        viewColumns: false,
        customHeadRender: (columnMeta, updateDirection) => (
          <th style={{ background: `${clientBtnColor}`, color: 'white', paddingLeft: "15px", padding: "8px" }}   >
            {columnMeta.label}
          </th>
        ),
        customBodyRender: (value, tableMeta, updateValue) => {
          return (
            <div className='status_box fw-bold' style={{ color: "#293790" }} >
              NK12647
            </div>
          )
        }

      }
    },
    {
      name: 'brokerage_code',
      label: "Booking ID",
      options: {
        filter: false,
        customHeadRender: (columnMeta, updateDirection) => (
          <th style={{ background: `${clientBtnColor}`, color: 'white', paddingLeft: "15px", padding: "8px" }}   >
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
      name: 'BrokerageBookingtDataName',
      label: "Booking Name",
      options: {
        filter: false,
        customHeadRender: (columnMeta, updateDirection) => (
          <th style={{ background: `${clientBtnColor}`, color: 'white', paddingLeft: "15px", padding: "8px" }}   >
            {columnMeta.label}
          </th>
        ),
        customBodyRender: (value, tableMeta, updateValue) => {
          return (
            <div className='status_box fw-bold ' style={{ color: "#293790" }}>
              {/* {value?.booking_name} */}
              {value}
            </div>
          )
        }
      },

    },
    {
      name: 'BrokerageBookingtDataEmail',
      label: "Email",
      options: {
        filter: false,
        customHeadRender: (columnMeta, updateDirection) => (
          <th style={{ background: `${clientBtnColor}`, color: 'white', paddingLeft: "15px", padding: "8px" }}   >
            {columnMeta.label}
          </th>
        ),
        customBodyRender: (value, tableMeta, updateValue) => {

          return (
            <div className='status_box fw-bold' style={{ color: "#293790" }}>
              {/* {value?.email} */}
              {value}
            </div>
          )
        }

      }
    },
    {
      name: 'BrokerageBookingtDataContact',
      label: "Contact No.",
      options: {
        filter: false,
        customHeadRender: (columnMeta, updateDirection) => (
          <th style={{ background: `${clientBtnColor}`, color: 'white', paddingLeft: "15px", padding: "8px" }}   >
            {columnMeta.label}
          </th>
        ),
        customBodyRender: (value, tableMeta, updateValue) => {
          return (
            <div className='status_box' style={{ color: "#667799" }}>
              {/* +91-{value?.contact_no} */}
              +91-{value}
            </div>
          )
        }
      }
    },
    {
      name: 'BrokerageBookingtDataProject',
      label: "Project",
      options: {
        filter: false,
        customHeadRender: (columnMeta, updateDirection) => (
          <th style={{ background: `${clientBtnColor}`, color: 'white', paddingLeft: "15px", padding: "8px" }}   >
            {columnMeta.label}
          </th>
        ),
        customBodyRender: (value, tableMeta, updateValue) => {
          return (
            <div className='status_box' style={{ color: "#667799" }}>
              {/* {value?.BookingprojectData?.project} */}
              {value}
            </div>
          )
        }
      }
    },
    {
      name: 'BrokerageBookingtDataLocation',
      label: "Location",
      options: {
        filter: true,
        customHeadRender: (columnMeta, updateDirection) => (
          <th style={{ background: `${clientBtnColor}`, color: 'white', paddingLeft: "15px", padding: "8px" }}   >
            {columnMeta.label}
          </th>
        ),
        customBodyRender: (value, tableMeta, updateValue) => {
          return (
            <div className='status_box' style={{ color: "#667799" }}>
              {/* {value?.Location} */}
              {value}
            </div>
          )
        }
      }
    },
    {
      name: 'status',
      label: "Brokerage Status",
      options: {
        filter: true,
        customHeadRender: (columnMeta, updateDirection) => (
          <th style={{ background: `${clientBtnColor}`, color: 'white', paddingLeft: "15px", padding: "8px" }}   >
            {columnMeta.label}
          </th>
        ),
        customBodyRender: (value, tableMeta, updateValue) => {
          return (
            <div
              style={{ background: "violet", width: "fit-content", color: "white", padding: "6px", borderRadius: "20px", border: "white" }}
              className='pe-3 ps-3'
              title='Assign - To'>

              {
                value == "Bill sent" ? "Bill Received" : value
              }
            </div>
          )
        }
      }
    },
    {
      name: '',
      label: "Brokerage Bill",
      options: {
        filter: false,
        download: false,
        customHeadRender: (columnMeta, updateDirection) => (
          <th style={{ background: `${clientBtnColor}`, color: 'white', paddingLeft: "15px", padding: "8px" }}   >
            {columnMeta.label}
          </th>
        ),
        customBodyRender: (value, tableMeta, updateValue) => {

          return (
            <div className="table_btns">
              <button
                onClick={() => {
                  setShowModal(true);
                  //  setBrokerageId(tableMeta?.rowData[0]);
                  getDataListById(tableMeta.rowData[0])
                }}
                style={{ background: clientBtnColor, color: "white", padding: "6px", borderRadius: "20px", border: "white" }}
                className='pe-3 ps-3 justify-content-center align-items-center d-flex '
                title='view'>
                <img style={{ width: "22px" }} src="/ChannelPartner/view-icon.png" alt='view Icon' />
                View
              </button>

            </div>
          )
        }
      }
    },
  ];

  let statusArray = [{ id: "", label: "All" }, { id: "Payment Initiated", label: "Payment Initiated" }, { id: "Payment Received", label: "Payment Received" }, { id: "Payment Rejected", label: "Payment Rejected" }, { id: "Bill sent", label: "Bill Received" }]

  const CustomToolbar = () => {
    return (
      <div className=' d-flex justify-content-start gap-3 align-items-center '>
        <p className='fw-bold ' style={{ fontSize: "18px" }} >{title}</p>
        {/* <DateRange value={value} setValue={setValue} getData={getDataList} filterType={title} /> */}
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
                          setCookie("BrokeragecpId",e.value)
                          router.push("/partner/Brokerage")
                          setCpId(e.value)
                        }
                        else{
                          setCookie("BrokeragecpId",e.value)
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
                        setCookie("BrokeragestatusId",e.value)
                        router.push("/partner/Brokerage")
                      setStatusId(e.value)
                      }
                      else{
                        setCookie("BrokeragestatusId",e.value)
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
  function formatDate(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${day}/${month}/${year}`;
  }

  const options = {
    selectableRows: 'none',
    responsive: "standard",
    onRowSelectionChange: handleRowClick,
    downloadOptions: {
      filename: "ChannelBrokerage",
      filterOptions: { useDisplayedRowsOnly: true },
    },
    filterType: 'multiselect',
    viewColumns: false,
    onDownload: (buildHead, buildBody, columns, data) => {
      const workbook = XLSX.utils.book_new();
      let range;
      if (hasCookie("BrokerageFilter")) {
        range = JSON.parse(getCookie("BrokerageFilter"))
      }
      let filteredColumns = columns; // Remove the last two columns
      const filteredData = data.map(row => {
        return filteredColumns.map((col, index) => row.data[index]);
      });

      const customData = [
        ["Channel Brokerage Report"],
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
        { wch: 10 },
        { wch: 12 },
        { wch: 22 },
        { wch: 30 },
        { wch: 14 },
        { wch: 24 },
        { wch: 22 },
        { wch: 22 },
        { wch: 18 },

      ];
      XLSX.utils.book_append_sheet(workbook, worksheet, "ChannelBrokerage");
      XLSX.writeFile(workbook, "ChannelBrokerage.xlsx");
      return false;
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUpdateBill({
          ...updateBill,
          file: e.target.files[0],
          bill_file: e.target.files[0].name,
        });
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const mappedDataList = dataList?.map(list => ({
    brokerage_id: list?.brokerage_id,
    brokerage_code: list?.brokerage_code,
    BrokerageBookingtDataName: list?.BrokerageBookingtData?.booking_name,
    BrokerageBookingtDataEmail: list?.BrokerageBookingtData?.email,
    BrokerageBookingtDataContact: list?.BrokerageBookingtData?.contact_no,
    BrokerageBookingtDataProject: list?.BrokerageLeadData?.sales_project_name,
    BrokerageBookingtDataLocation: [list?.BrokerageBookingtData?.Location]?.filter(d => d !== null && d !== undefined),
    status: list?.status == "Bill sent" ? "Bill Received" : list?.status
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
                // data={dataList}
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

              </div>
            </div>
          )
      }



      {/* Brokerage Bill Modal */}
      <Modal className="" centered show={showModal} onHide={() => { setShowModal(false); setBrokerageId("") }} size="lg">
        <Modal.Body>
          <section className="Sign-In pt-4 Create-New-Lead Create-Brokerage-Bill" style={{ padding: '0 16px' }}>
            <div className='d-flex justify-content-end align-items-center pb-2'>
              {
                (roleId !== 2) &&
                (
                  <img
                    className=' cursor-pointer'
                    src="/ChannelPartner/profile-edit.svg"
                    onClick={() => {
                      setShowModal(false)
                      setShowModal2(true)
                    }}
                    alt
                  />
                )
              }
              <img
                className='ms-4 cursor-pointer'
                onClick={() => {
                  setShowModal(false)
                  setBrokerageId("")
                  resetUpdateData()
                }}
                style={{ width: "29px" }}
                src="/ChannelPartner/cross-icon.png"
                alt
              />
            </div>
            <div className="container">
              <div className="row">
                <h3 className=" Perfect-Home text-center ">Brokerage Bill</h3>
                <div className="col-12 mt-md-5">
                  <div className="Sign-In_Sign-Up Register w-100">
                    <div className="perfect-home-form pt-1">
                      <section className="Details_Form">
                        <div className="">
                          <form id="survey-form" >
                            <div className="d-lg-flex justify-content-lg-around pb-5">
                              <div className="d-flex flex-column gap-3 gap-md-4 gap-lg-5 Leads-form-details">
                                <div className="rowTab">
                                  <div className="labels">
                                    <label htmlFor="name" className="pb-1">Booking</label>
                                    <span className="star">*</span>
                                  </div>
                                  <div className="rightTab fw-semibold" style={{ color: "#293790" }}>
                                    {updateBill?.booking_name}
                                  </div>
                                </div>
                                <div className="rowTab">
                                  <div className="labels">
                                    <label htmlFor="name" className="pb-1">Amount</label>
                                    <span className="star">*</span>
                                  </div>
                                  <div className="rightTab fw-semibold" style={{ color: "#293790" }}>
                                    ₹ {updateBill?.amount}.00
                                  </div>
                                </div>
                                <div className="rowTab">
                                  <div className="labels">
                                    <label htmlFor="name" className="pb-1">Status</label>
                                    <span className="star">*</span>
                                  </div>
                                  <div className="rightTab fw-semibold" style={{ color: "#293790" }}>
                                    {updateBill?.status}
                                  </div>
                                </div>
                              </div>
                              <div className="d-flex flex-column  gap-3 gap-md-4 gap-lg-5 Leads-form-details">
                                <div className="rowTab">
                                  <div className="labels">
                                    <label htmlFor="name" className="pb-1">Date</label>
                                    <span className="star">*</span>
                                  </div>
                                  <div className="rightTab fw-semibold" style={{ color: "#293790" }}>
                                    {formatDate(updateBill?.date)}
                                  </div>
                                </div>
                                <div className="rowTab">
                                  <div className="labels">
                                    <label htmlFor="name" className="pb-1">Bill</label>
                                    <span className="star">*</span>
                                  </div>

                                  <a

                                    //  href={`${filesUrl}/brokerage/images${updateBill?.file}`}
                                    onClick={() => {
                                      saveAs(`${filesUrl}/brokerage/images${updateBill?.file}`, "Brokerage-Bill")
                                    }}

                                    target='_black' className="rightTab cursor-pointer fw-semibold text-decoration-underline" style={{ color: "#293790" }}>
                                    {updateBill?.file}
                                  </a>
                                </div>
                                {
                                  updateBill?.status === "Payment Rejected" ? (
                                    <div className="rowTab">
                                      <div className="labels">
                                        <label htmlFor="name" className="pb-1">Reject Remark</label>
                                        <span className="star"></span>
                                      </div>
                                      <div className="rightTab fw-semibold" style={{ color: "#293790" }}>
                                        {updateBill?.reject_remark}
                                      </div>
                                    </div>
                                  ) : ""
                                }
                                <div>
                                  {(roleId !== 2 && (
                                    <button
                                      type="button"
                                      className="btn text-white"
                                      style={{ background: "red" }}
                                      onClick={() => {
                                        setShowModal(false);
                                        setShowModal2(true);
                                      }}
                                    >
                                      Edit
                                    </button>
                                  ))}
                                </div>
                              </div>


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

      {/* Create/Update Brokerage Bill Modal */}
      <Modal className="commonModal" centered show={showModal2} onHide={() => { setShowModal2(false); setBrokerageId(""); resetUpdateData() }} size="lg">
        <Modal.Body>
          <section className="Sign-In pt-4 Create-New-Lead Create-Brokerage-Bill" style={{ padding: '0 16px' }}>
            <div className="container">
              <div className="row">
                <h3 className=" Perfect-Home text-center ">Update Brokerage Bill</h3>
                <div className="col-12 mt-md-5">
                  <div className="Sign-In_Sign-Up Register w-100">
                    <div className="perfect-home-form pt-1">
                      <section className="Details_Form">
                        <div className="pt-3">
                          <form id="survey-form" >
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
                                      // disabled
                                      className="form-select dropdown"
                                      style={{

                                        marginLeft: "auto",
                                      }}
                                      value={dataList.find((list) => (
                                        list?.BrokerageBookingtData?.booking_id === updateBill?.booking_id ? list?.BrokerageBookingtData?.booking_name : null
                                      ))}
                                      onChange={(e) => {
                                        setUpdateBill({
                                          ...updateBill,
                                          booking_id: e.target.value
                                        })
                                      }}
                                    >
                                      {
                                        dataList?.map((list, i) => (
                                          <option
                                            key={i}
                                            value={list?.BrokerageBookingtData?.booking_id}
                                          >
                                            {list?.BrokerageBookingtData?.booking_name}
                                          </option>
                                        ))
                                      }

                                    </select>
                                  </div>
                                </div>
                                <div className="rowTab">
                                  <div className="labels" >
                                    <label htmlFor="name" className="pb-1">Amount</label>
                                    <span className="star">*</span>
                                  </div>
                                  <div className="rightTab">
                                    <input autofocus type="number" value={updateBill?.amount}
                                      onChange={(e) => setUpdateBill({ ...updateBill, amount: e.target.value })} name="name" className="" placeholder required />
                                  </div>
                                </div>
                                <div className="rowTab">
                                  <div className="labels">
                                    <label htmlFor="project" className="pb-1">Status</label>
                                    <span className="star">*</span>
                                  </div>
                                  <div className="rightTab d-flex gap-2">
                                    <select className="form-select dropdown cursor-pointer"
                                      value={updateBill.status}
                                      onChange={(e) => {
                                        setUpdateBill({
                                          ...updateBill,
                                          status: e.target.value
                                        }); e.target.value === 'Payment Rejected' ? setRejectRemark(true) : setRejectRemark(false)
                                      }}
                                    >
                                      <option className="dropdown-item" >Bill Received
                                      </option>
                                      <option className="dropdown-item" >Payment Initiated
                                      </option>
                                      <option className="dropdown-item" >Payment Received
                                      </option>
                                      <option className="dropdown-item" >Payment Rejected
                                      </option>

                                    </select>
                                  </div>
                                </div>
                              </div>
                              <div className="d-flex flex-column  gap-3 gap-md-4 gap-lg-5 Leads-form-details">
                                <div className="rowTab mt-3 mt-md-4 mt-lg-0">
                                  <div className="labels">
                                    <label htmlFor="Location" className="pb-1">Date</label>
                                    <span className="star">*</span>
                                  </div>
                                  <div className="rightTab">
                                    <input
                                      //  style={{ background: "#E9ECEF" }} 
                                      autofocus type="date" value={updateBill?.date} onChange={(e) => {
                                        setUpdateBill({
                                          ...updateBill,
                                          date: e.target.value
                                        })
                                      }} name="name" className="input-field" placeholder required />
                                  </div>
                                </div>
                                <div className="rowTab">
                                  <div className="labels">
                                    <label id="name-label" htmlFor="name" className="pb-1">Bill</label>
                                    <span className="star">*</span>
                                  </div>
                                  <div className="rightTab">
                                    {updateBill?.file ? (
                                      <div className="d-flex align-items-center gap-2">
                                        <div className="file-info py-2 ps-1 pe-2 rounded border d-flex justify-content-center align-items-center" style={{ background: "#E9EcEf" }}>
                                          <span
                                            onClick={() => {
                                              saveAs(`${filesUrl}/brokerage/images${updateBill?.file}`, "Brokerage-Bill")
                                            }}
                                            className='text-sm cursor-pointer' style={{ color: clientBtnColor }}
                                          >
                                            {updateBill?.bill_file ? updateBill?.bill_file : updateBill?.file}
                                          </span>
                                        </div>

                                        <button
                                          type="button"
                                          onClick={() => {
                                            setUpdateBill({
                                              ...updateBill,
                                              file: null,
                                              bill_file: null
                                            })
                                          }}
                                          style={{
                                            border: "1px solid #e5e5e5",
                                            background: "#fff",
                                            padding: 0,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            cursor: "pointer",
                                            width: 28,
                                            height: 28,
                                            borderRadius: 999,
                                            flexShrink: 0
                                          }}
                                        >
                                          <img
                                            src="/ChannelPartner/cross-icon.png"
                                            alt="Delete"
                                            style={{ width: 18, height: 18 }}
                                          />
                                          {/* <span>Delete </span> */}
                                        </button>
                                      </div>
                                    ) : (
                                      <label htmlFor="adh" className="form-control d-flex flex-row-reverse justify-content-between align-items-center" style={{ width: 162, height: 35, background: clientBtnColor }}>
                                        Upload Bill
                                        <img src="/ChannelPartner/upload-file.svg" alt="Upload" style={{ height: 16 }} />
                                      </label>
                                    )}
                                    <input autoFocus type="file" name="name" id="adh" className="input-field" placeholder="enter your aadhar number" style={{ display: 'none' }} onChange={handleFileChange} required />
                                  </div>
                                </div>
                                {
                                  // rejectRemark && (
                                  updateBill?.status === 'Payment Rejected' && (
                                    <div className="rowTab mt-3 mt-md-4 mt-lg-0">
                                      <div className="labels">
                                        <label htmlFor="Location" className="pb-1">Remark</label>
                                        <span className="star">*</span>
                                      </div>
                                      <div className="rightTab">
                                        <input autofocus type="text" value={updateBill?.reject_remark} onChange={(e) => {
                                          setUpdateBill({
                                            ...updateBill,
                                            reject_remark: e.target.value
                                          })
                                        }} name="name" className="input-field" placeholder required />
                                      </div>
                                    </div>
                                  )
                                }

                              </div>
                            </div>
                            <div className="new-leades-btn d-flex justify-content-center gap-4">
                              <div className="btn btn-danger rounded-5 text-white" onClick={() => {
                                setShowModal2(false)
                                resetUpdateData()
                              }} >Cancel</div>
                              <button type='button' className="btn text-white rounded-5" style={{ background: clientBtnColor }} onClick={(e) => {
                                e.preventDefault()
                                updateBrokerageBill()

                              }}>Update</button>
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