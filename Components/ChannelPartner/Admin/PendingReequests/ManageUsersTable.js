import React, { useState } from "react";
import MUIDataTable from "mui-datatables";
import Link from "next/link";
import { Baseurl, filesUrl } from "../../../../Utils/Constants";
import { Button, Modal } from "react-bootstrap";
import { getCookie, hasCookie } from "cookies-next";
import { toast } from "react-toastify";
import axios from "axios";
import Loader from "../../../Loader/Loader";
import * as XLSX from "xlsx";
import { formatDate } from "../../../../Utils/common";

const ManageUsersTable = ({
  deleteConfirm,
  disableConfirm,
  dataList,
  openEdtMdl,
  title,
  getDataList,
  loader,
  start,
  end
}) => {

  const [userData, setUserData] =  useState([])
  const [actionMode, setActionMode] =  useState('')
  const [showModal, setShowModal] =  useState(false)
  const [showModalSingle, setShowModalSingle] =  useState(false)
  const[id,setId]=useState("")
  const [userInfo, setUserInfo ] =  useState({
    user_code: '',
    reject_reason: ''
  })
  const clientBtnColor=hasCookie("clientBtnColor") ? getCookie("clientBtnColor") : "#61E25E"
  const userInfoCheck=hasCookie("userInfo")?JSON.parse(getCookie("userInfo")):null;


  const channelUserStatus = (key) => {
    switch (key) {
      case 0:
        return "Pending";
        break;
      case 1:
        return "Under Process";
        break;
      case 3:
        return "Rejected";
        break;
      default:
        return "Completed";
        break;
    }
  };

  const channelUserStatusColor = (key) => {
    switch (key) {
      case "Pending":
        return 'text-primary';
        break;
      case "Under Process":
        return 'text-warning';
        break;
      case "Rejected":
        return 'text-danger';
        break;
      default:
        return 'text-success';
        break;
    }
  };

  const resendEmail =  async(id,email,report_to) => {

    
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
        const response = await axios.post(`${Baseurl}/db/users/resendEmailToPendingUser`,{
          email:email,
          user_id:id,
          report_to:report_to,
          client_url: "http://18.61.246.105",
        }, header);
        if (response.status === 200 || response.status === 201) {
          toast.success(response?.data?.message,{autoClose:2500});
          getDataList()
        }
      } catch (error) {
        console.log(error)
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



  const columns = [
    {
      name: "user_code",
      label: "Account Name",
      options: {
        filter: false,
        customHeadRender: (columnMeta, updateDirection) => (
          <th className="text-center" style={{ background:clientBtnColor? clientBtnColor:`#61E25E`, color: "white", paddingLeft: '15px' }} >
            {columnMeta.label}
          </th>
        ),

        customBodyRender: (value, tableMeta, updateValue) => {
          return (
          <div
          className="fw-bold text-center"
          style={{color: '#293790'}}
          >
            {value}
        </div>
          )
        },
      },
    },
    {
      name: "user",
      label: "Name",
      options: {
        filter: false,
        customHeadRender: (columnMeta, updateDirection) => (
          <th className="text-center" style={{ background:clientBtnColor? clientBtnColor:`#61E25E`, color: "white", paddingLeft: '15px' }} >
            {columnMeta.label}
          </th>
        ),
        customBodyRender: (value, tableMeta, updateValue) => {
          return (
          <div
          className="fw-bold text-center"
          style={{color: '#293790'}}
          
          >
            <Link className="text-decoration-underline" href={`/partner/PendingRequestsDetail?id=${tableMeta.rowData[0]}&mode=view`}>
            {value}
            </Link>
        </div>
          )
        }
      },
    },
    {
      name: "createdAt",
      label: "Request Date",
      options: {
        filter: false,
        customHeadRender: (columnMeta, updateDirection) => (
          <th className="text-center" style={{ background:clientBtnColor? clientBtnColor:`#61E25E`, color: "white", paddingLeft: '15px'  }} >
            {columnMeta.label}
          </th>
        ),

        customBodyRender: (value, tableMeta, updateValue) => {
          return (
          <div
          className="text-center"
          style={{color: '#667799'}}
          >
            {value?.split('T')[0]?.split('-')?.reverse()?.join('/')}
        </div>
          )
        },
      },
    },
    {
      name: "db_user_profile",
      label: "Aadhar",
      options: {
        download:false,
        filter: false,
        customHeadRender: (columnMeta, updateDirection) => (
          <th className="text-center" style={{ background:clientBtnColor? clientBtnColor:`#61E25E`, color: "white", paddingLeft: '15px' }} >
            {columnMeta.label}
          </th>
        ),
        customBodyRender: (value, tableMeta, updateValue) => {
          return (
            <div className="text-center">
                <Link
          className="text-decoration-underline "
          style={{color: '#293790'}}
          target="_blank"
          href={`${filesUrl}/adh/images${value?.aadhar_file}`}
          >
            {value?.aadhar_file ? 'Aadhar': ''}
            
        </Link>
            </div>
          )
        },
      },
    },
    {
      name: "db_user_profile",
      label: "PAN",
      options: {
        download:false,
        filter: false,
        customHeadRender: (columnMeta, updateDirection) => (
          <th className="text-center" style={{ background:clientBtnColor? clientBtnColor:`#61E25E`, color: "white", paddingLeft: '15px' }} >
            {columnMeta.label}
          </th>
        ),
        customBodyRender: (value, tableMeta, updateValue) => {
          return (
            <div className="text-center">
          <Link
          className="text-decoration-underline "
          style={{color: '#293790'}}
          target="_blank"
          href={`${filesUrl}/pan/images${value?.pan_file}`}
          >
            {value?.pan_file ? 'PAN': ''}
            
        </Link>
            </div>
          
          )
        },
      },
    },
    {
      name: "db_user_profile",
      label: "Rera License",
      options: {
        filter: false,
        download:false,
        customHeadRender: (columnMeta, updateDirection) => (
          <th className="text-center" style={{ background:clientBtnColor? clientBtnColor:`#61E25E`, color: "white", paddingLeft: '15px' }} >
            {columnMeta.label}
          </th>
        ),
        customBodyRender: (value, tableMeta, updateValue) => {
          return (
            <div className="text-center">
                <Link
          className="text-decoration-underline "
          style={{color: '#293790'}}
          target="_blank"
          href={`${filesUrl}/rera/images${value?.rera_file}`}
          >
            {value?.rera_file ? 'Rera': ''}
        </Link>
            </div>
          
          )
        },
      },
    },
    {
      name: "db_user_profile",
      label: "Cancelled Cheque",
      options: {
        filter: false,
        download:false,
        customHeadRender: (columnMeta, updateDirection) => (
          <th className="text-center" style={{ background:clientBtnColor? clientBtnColor:`#61E25E`, color: "white", paddingLeft: '15px' }} >
            {columnMeta.label}
          </th>
        ),
        customBodyRender: (value, tableMeta, updateValue) => {
          return (
            <div className="text-center">
                <Link
          className="text-decoration-underline "
          style={{color: '#293790'}}
          target="_blank"
          href={`${filesUrl}/cheque/images${value?.c_cheque_file}`}
          >
            {value?.c_cheque_file ? 'Cancelled Cheque': ''}
            
        </Link>
            </div>
          )
        },
      },
    },
    {
      name: "reportToUser",
      label: "Assigned to",
      options: {
        filter: true,
        customHeadRender: (columnMeta, updateDirection) => (
          <th className="text-center" style={{ background:clientBtnColor? clientBtnColor:`#61E25E`, color: "white", paddingLeft: '15px' }} >
            {columnMeta.label}
          </th>
        ),
        customBodyRender: (value, tableMeta, updateValue) => {
          return (
              <div className='status_box fw-bold text-center' style={{color:"#293790"}}>
                  {value && <span  >{value}</span>}
              </div>
          )
      }
      },
    },
    {
      name: "doc_verification",
      label: "Status",
      options: {
        filter: true,
        customHeadRender: (columnMeta, updateDirection) => (
          <th className="text-center" style={{ background:clientBtnColor? clientBtnColor:`#61E25E`, color: "white", paddingLeft: '15px' }} >
            {columnMeta.label}
          </th>
        ),
        customBodyRender: (value, tableMeta, updateValue) => {
          return <div className={`status_box ${channelUserStatusColor(value)} text-center `}>{value}</div>;
        },
      },
    },
    {
      name: "user_code",
      label: "Action",
      options: {
        filter: false,
        download:false,
        customHeadRender: (columnMeta, updateDirection) => (
          <th
            style={{ background:clientBtnColor? clientBtnColor:`#61E25E`, color: "white",  paddingLeft: '65px' }}
          >
            {columnMeta.label}
          </th>
        ),
        customBodyRender: (value, tableMeta, updateValue) => {
          let user=dataList?.find((user)=>(user?.user_code==value))
          return (
              <div className="d-flex justify-content-center align-items-center">
              {(tableMeta?.rowData[8]==="Pending" || tableMeta?.rowData[8]==="Rejected" )&& (
                <button  onClick={()=>{
                  // let user=dataList?.find((user)=>(user?.user_code==value))
                  resendEmail(user?.user_id,user?.email, user?.report_to ?? null)
                  }} style={{backgroundColor:"green"}} className="btn text-white rounded-5" >
                Resend
              </button>
              )}
              {tableMeta?.rowData[8]=="Under Process" && userInfoCheck?.isDB ?
              <>  
              <div className="table_btns d-flex align-items-center justify-content-start gap-3">
              <button  onClick={()=>{setActionMode('Accept'); setShowModalSingle(true);  setUserInfo({
                ...userInfo, user_code: value, report_to: user?.report_to ?? null
              })}} style={{backgroundColor: clientBtnColor? clientBtnColor:`#61E25E`}} className="btn text-white rounded-5" >
                Accept
              </button>
  
              <button onClick={()=>{setActionMode('Reject'); setShowModalSingle(true); setUserInfo({
                ...userInfo, user_code: value, report_to: user?.report_to ?? null
              })}} className=" btn btn-danger rounded-5">
                Reject
              </button>
          </div>
              </>
              
            :
            <div className="text-center"></div> }

           {tableMeta?.rowData[8]=="Under Process" && dataList?.find(item=>item?.user_code==value)?.bst_response==false && userInfoCheck?.role_id==2 ?
              <>  
              <div className="table_btns d-flex align-items-center justify-content-start gap-3">
              <button  onClick={()=>{setActionMode('Accept'); setShowModalSingle(true);  setUserInfo({
                ...userInfo, user_code: value, report_to: user?.report_to ?? null
              })}} style={{backgroundColor: clientBtnColor? clientBtnColor:`#61E25E`}} className="btn text-white rounded-5" >
                Accept
              </button>
  
              <button onClick={()=>{setActionMode('Reject'); setShowModalSingle(true); setUserInfo({
                ...userInfo, user_code: value, report_to: user?.report_to ?? null
              })}} className=" btn btn-danger rounded-5">
                Reject
              </button>
          </div>
              </>
              
            :
            <div className="text-center"></div> }

            {tableMeta?.rowData[8]=="Under Process" && dataList?.find(item=>item?.user_code==value)?.director_response==false && userInfoCheck?.role_id==3 ?
              <>  
              <div className="table_btns d-flex align-items-center justify-content-start gap-3">
              <button  onClick={()=>{setActionMode('Accept'); setShowModalSingle(true);  setUserInfo({
                ...userInfo, user_code: value, report_to: user?.report_to ?? null
              })}} style={{backgroundColor: clientBtnColor? clientBtnColor:`#61E25E`}} className="btn text-white rounded-5" >
                Accept
              </button>
  
              <button onClick={()=>{setActionMode('Reject'); setShowModalSingle(true); setUserInfo({
                ...userInfo, user_code: value, report_to: user?.report_to ?? null
              })}} className=" btn btn-danger rounded-5">
                Reject
              </button>
          </div>
              </>
              
            :
            <div className="text-center"></div> }
              </div>
          );
        },
      },
    },
  ];

//   const handleRowClick = (rowData, rowMeta) => {
//     const data = rowMeta?.reduce((accu, value) => {
//         accu.push(dataList[value.dataIndex].user_code);
//         return accu; // Return the accumulator
//     }, []);
//     setUserData([...data]);
// };
async function handleDelete(rowsDeleted) {
  const deletedIndices = rowsDeleted.data.map((row) => row.dataIndex);
  const userIds = deletedIndices.map((index) => dataList[index].user_id);
  if (hasCookie('token')) {
      let token = (getCookie('token'));
      let db_name = (getCookie('db_name'));

      let header = {
          headers: {
              Accept: "application/json",
              Authorization: "Bearer ".concat(token),
              db: db_name,
              pass: "pass",
              // m_id: 79
          }
      }
      try {
          const response = await axios.put(Baseurl + `/db/users/delete`, { user_ids: userIds }, header);
          if (response.status === 204 || response.status === 200) {
              toast.success(response?.data?.message,{autoClose:2500})
              getDataList();
          }
      } catch (error) {
          toast.error(error?.response?.data?.message,{autoClose:2500});
      }
  }
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

      const searchText = Array.isArray(cell)
        ? cell.filter((v) => v != null && v !== '').join(' ')
        : typeof cell === 'object'
          ? ''
          : String(cell);

      if (searchText.toLowerCase().includes(q)) return true;
    }

    return false;
  };

  const options = {
    selectableRows: userInfoCheck?.isDB ? 'multiple' : 'none',
    responsive: "standard",
    // onRowSelectionChange : handleRowClick,
    onRowsDelete: handleDelete,
    downloadOptions:{filename:"PendingRequestList"},
    filterType:'multiselect',
    viewColumns: false,
    customSearch: customTableSearch,
     onDownload: (buildHead, buildBody, columns, data) => {
                  const workbook = XLSX.utils.book_new();
                  const filteredColumns = columns.slice(0, -1); // Remove the last two columns
                  const filteredData = data.map(row => {
                    return filteredColumns.map((col, index) => row.data[index]);
                  });
                  
                  const customData = [
                    ["Pending Sign Up Requests Report"], 
                    [], 
                    [`Filter by:`],
                    [],
                    [`Date Range: All`],
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
                    { wch: 14 }, 
                    { wch: 16 },
                    { wch: 22 },
                    { wch: 18 },
                    { wch: 16 },
                    { wch: 22 },
                    { wch: 18 },
                    { wch: 16 },
                    { wch: 16 },
                  ];
                  XLSX.utils.book_append_sheet(workbook, worksheet, "PendingSignUpRequests");
                  XLSX.writeFile(workbook, "PendingSignUpRequests.xlsx");
                  return false;
                }
  };

  const updateUserhandler = async () => {

    if (!hasCookie("token")) return;
    if (actionMode !== 'Accept' && userInfo.reject_reason === "") {
      return toast.error("Please enter a reason",{autoClose:2500});
    }
    const token = getCookie("token");
    const db_name = getCookie("db_name");
    const header = {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        pass: "pass",
      },
    };

    try {
      const response = await axios.put(
        `${Baseurl}/db/users`,
        {
          doc_verification: actionMode === 'Accept' ? 2 : 3,
          reject_reason: userInfo?.reject_reason,
          user_code: userInfo?.user_code,
          isCHANNEL:userInfo?.reject_reason ? false : true,
          forApproval:true,
          report_to: userInfo?.report_to
        },
        header
      );
      if (response.status === 200 || response.status === 201) {
        toast.success(response?.data?.message,{autoClose:2500});
        getDataList()
      }
    } catch (error) {
      if (error?.response?.data?.message) {
        toast.error(error?.response?.data?.message,{autoClose:2500});
      } else {
        toast.error("Something went wrong!",{autoClose:2500});
      }
    }
  };

  const updateBunchUserhandler = async () => {

    let toastShown=false;
    for(const element of userData){

      if (!hasCookie("token")) return;
      if (actionMode !== 'Accept' && userInfo.reject_reason === "") {
        return toast.error("Please enter a reason",{autoClose:2500});
      }
      const token = getCookie("token");
      const db_name = getCookie("db_name");
      const header = {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          pass: "pass",
        },
      };

    try {
      const response = await axios.put(
        `${Baseurl}/db/users`,
        {
          doc_verification: actionMode === 'Accept' ? 2 : 3,
          reject_reason: userInfo?.reject_reason,
          user_code: element,
          isCHANNEL:userInfo?.reject_reason ? false : true,
          forApproval:true,
          report_to: userInfo?.report_to
        },
        header
      );
      if (response.status === 200 || response.status === 201) {
        if (!toastShown) {
          toast.success(response?.data?.message,{autoClose:2500});
          toastShown = true;
        }
        getDataList()
      }
    } catch (error) {
      if (error?.response?.data?.message) {
        if(!toastShown){
          toast.error(error?.response?.data?.message,{autoClose:2500});
          toastShown=true
        }
      } else {
        if(!toastShown){
          toast.error("Something went wrong!",{autoClose:2500});
          toastShown=true
        }
      }
    }
    }
    setUserData([])
  };
  
  const mappedDataList = dataList.map((data) => ({
    ...data,
    doc_verification: channelUserStatus(data?.doc_verification),
    reportToUser: [data?.reportToUser?.user]?.filter((d)=> d != null && d != undefined)
    // dataList?.find((user)=>(user?.user_code==value))
    ,
  }));
  return (
    <>
    {
      loader ?  <div className="miuiTable channelTable"><Loader/></div>
      :
      (
        <div className="miuiTable channelTable">
        <MUIDataTable
          title={<span style={{ color: "black", fontWeight:"bold", fontSize:"17px" }}>{title}</span>}
          data={mappedDataList}
          columns={columns}
          // options={options}
          options={{
            ...options,
            customFilterDialogFooter: () => (
              <div
                style={{
                  minWidth: "300px", // Set consistent width
                }}
              />
            ),
          }}
        />
        <div>
          {userData.length ?
          <div className="table_btns d-flex align-items-center justify-content-center gap-3 mt-4">
              
              

              <button onClick={()=>{setActionMode('Reject'); setShowModal(true)}} className=" btn btn-danger rounded-5">
                Reject
              </button>

              <button onClick={()=>{setActionMode('Accept'); setShowModal(true)}} style={{backgroundColor: clientBtnColor}} className="btn  rounded-5 text-white" >
                Accept
              </button>
            
          </div>
          : <></>
        }
        </div>
      </div>
      )
    }
      

      <Modal
        className="commonModal"
        show={showModal}
        // onHide={handleClose}
      >
       
        <Modal.Body>
          <div className="add_user_form">
            <div className="row">
              <div className="col-xl-12 col-md-12 col-sm-12 col-12">
                <div className="input_box text-center">
                  <label htmlFor="email">
                    Are you sure you want to {actionMode} this request?
                  </label>
                  {actionMode !== 'Accept' ?
                  <input
                    type="text"
                    placeholder="Enter Reason"
                    className="form-control"
                    onChange={(e) => {
                      setUserInfo({
                        ...userInfo, reject_reason: e.target.value
                      })
                    }}
                    value={userInfo.reject_reason}
                  />
                  : <> </>
                }
                </div>
                <div className="d-flex align-items-center justify-content-center gap-2">
              
          <Button
            variant="primary"
            type="button"
            className="rounded-5"
            onClick={() => {

              updateBunchUserhandler();
              setActionMode("");
              setShowModal(false)
            }}
          >
            Yes
          </Button>

          <Button
            variant="secondary"
            type="button"
            className="rounded-5 "
            onClick={() => {
              setActionMode("");
              setShowModal(false)
              setUserInfo({
                ...userInfo,
                reject_reason: "",
              });
            }}
          >
            No
          </Button>
                </div>
              </div>
            </div>
          </div>
        </Modal.Body>
      
      </Modal>
      <Modal
        className="commonModal"
        show={showModalSingle}
        // onHide={handleClose}
      >
       
        <Modal.Body>
          <div className="add_user_form">
            <div className="row">
              <div className="col-xl-12 col-md-12 col-sm-12 col-12">
                <div className="input_box text-center">
                  <label htmlFor="email">
                    Are you sure you want to {actionMode} this request?
                  </label>
                  {actionMode !== 'Accept' ?
                  <input
                    type="text"
                    placeholder="Enter Reason"
                    className="form-control"
                    onChange={(e) => {
                      setUserInfo({
                        ...userInfo, reject_reason: e.target.value
                      })
                    }}
                    value={userInfo.reject_reason}
                  />
                  : <> </>
                }
                </div>
                <div className="d-flex align-items-center justify-content-center gap-2">
              
          <Button
            variant="primary"
            type="button"
            className="rounded-5"
            onClick={() => {
              
              updateUserhandler();
              setActionMode("");
              setShowModalSingle(false)
            }}
          >
            Yes
          </Button>

          <Button
            variant="secondary"
            type="button"
            className="rounded-5 "
            onClick={() => {
              setActionMode("");
              setShowModalSingle(false)
              setUserInfo({
                ...userInfo,
                reject_reason: "",
              });
            }}
          >
            No
          </Button>
                </div>
              </div>
            </div>
          </div>
        </Modal.Body>
      
      </Modal>
    </>
  );
};

export default ManageUsersTable;
