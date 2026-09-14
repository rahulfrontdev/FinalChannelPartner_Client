import React, { useEffect, useState } from 'react'
import MUIDataTable from "mui-datatables";
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Button, Modal } from 'react-bootstrap';
import Select from 'react-select';
import axios from 'axios';
import { Baseurl, isRmRole, isBstRole } from '../../../../Utils/Constants';
import { getCookie, hasCookie, setCookie } from 'cookies-next';
import { toast } from 'react-toastify';
import DateRange from '../../../DateRangeCustom/Daterange';
import Loader from '../../../Loader/Loader';
import { Form } from 'react-bootstrap';
import { fetchData } from '../../../../Utils/getReq';
import * as XLSX from "xlsx";
import DeleteIcon from "../../../Svg/DeleteIcon";
import EditIcon from "../../../Svg/EditIcon";
import ViewIcon from "../../../Svg/ViewIcon";



const ManageUsersTable = ({ start, end, deleteConfirm, disableConfirm, dataList, openEdtMdl, title, setShowAssignTo, oldAssignTo, setoldAssignTo, oldAssignToRm, setoldAssignToRm, setShowDateFilter, usersList, getDataList, loader, selectedOption, setSelectedOption, channelPartnerFilter }) => {
  const router = useRouter()
  const [data, setData] = useState([])
  const [userData, setUserData] = useState([])
  const [actionMode, setActionMode] = useState('')
  const [showModal, setShowModal] = useState(false)
  const userInfo = hasCookie("userInfo") ? JSON.parse(getCookie("userInfo")) : null;
  const getCurrentWeekDates = () => {
    const startDate = new Date(new Date().setDate(new Date().getDate() - new Date().getDay() + 1));
    const endDate = new Date(new Date().setDate(startDate.getDate() + 6));
    if (hasCookie("Channel_PartnerFilter")) {
      let data = JSON.parse(getCookie("Channel_PartnerFilter"))
      return { startDate: data?.f_date, endDate: data?.t_date }
    }
    else {
      return { startDate, endDate };
    }

  };

  const [value, setValue] = useState(getCurrentWeekDates());
  const clientBtnColor = hasCookie("clientBtnColor") ? getCookie("clientBtnColor") : "#293790"
  const [partnerTypes, setPartnerTypes] = useState([])
  const [errorToast, setErrorToast] = useState(false);


  async function getPartnerTypes() {
    await fetchData("/db/users/channelPartnerType", setPartnerTypes, errorToast, setErrorToast);
  }

  useEffect(() => {
    getPartnerTypes()
  }, [])

  const mapUserOption = (data) => ({
    value: data?.user_id,
    label: (
      <>
        {data?.user ?? ""}{" "}
        {data?.user_status ? (
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
  });

  const getBstUserOptions = () => [
    { value: userInfo?.user_id, label: "N.A" },
    ...(usersList?.filter(user => isBstRole(user.role_id))?.map(mapUserOption) || []),
  ];

  const getRmUserOptions = () => [
    { value: userInfo?.user_id, label: "N.A" },
    ...(usersList?.filter(user => isRmRole(user.role_id))?.map(mapUserOption) || []),
  ];

  const userListFilterBasisOfRole = (selectedOption, usersList) => {
    if (selectedOption === "BST") {
      return [{ value: userInfo?.user_id, label: "N.A" }, ...usersList
        ?.filter(user => user.role_id === 3)
        ?.map(mapUserOption)];
    }
    return [];
  };

  const getSelectValue = (assignId) => {
    if (assignId === "" || assignId == null) return null;
    if (assignId === userInfo?.user_id) {
      return { value: userInfo?.user_id, label: "N.A" };
    }
    const user = usersList?.find(u => u.user_id === assignId);
    return user ? mapUserOption(user) : null;
  };

  const userSearchFilterOption = (option, inputValue) => {
    if (!inputValue) return true;
    const user = usersList?.find(u => u.user_id === option.value);
    if (!user) return option.label?.toString()?.toLowerCase()?.includes(inputValue.toLowerCase());
    const searchTerm = inputValue.toLowerCase();
    return (
      user.user?.toLowerCase().includes(searchTerm) ||
      user.email?.toLowerCase().includes(searchTerm) ||
      String(user.contact_number || "").includes(searchTerm)
    );
  };

  const setAssignPrefill = (assignedId) => {
    const id = assignedId ?? "";
    const assignedUser = usersList?.find(u => u.user_id === id);
    if (isRmRole(assignedUser?.role_id)) {
      setoldAssignToRm?.(id);
      setoldAssignTo?.("");
    } else {
      setoldAssignTo?.(id);
      setoldAssignToRm?.("");
    }
  };

  const getSelectedAssignTo = () => {
    if (oldAssignTo !== "" && oldAssignTo != null) return oldAssignTo;
    if (oldAssignToRm !== "" && oldAssignToRm != null) return oldAssignToRm;
    return null;
  };

  const columns = [


    {
      name: 'user_code',
      label: "Account ID",
      options: {
        filter: false,
        customHeadRender: (columnMeta, updateDirection) => (
          <th className="text-center" style={{ background: clientBtnColor ? clientBtnColor : `#293790`, color: 'white', paddingLeft: "15px" }}   >
            {columnMeta.label}
          </th>
        ),
        customBodyRender: (value, tableMeta, updateValue) => {
          return (
            <div className='status_box fw-bold text-center' style={{ color: "#293790" }} >
              {value}
            </div>
          )
        }
      }
    },
    {
      name: 'user',
      label: "Account Name",
      options: {
        filter: false,
        customHeadRender: (columnMeta, updateDirection) => (
          <th className="text-center" style={{ background: clientBtnColor ? clientBtnColor : `#293790`, color: 'white', paddingLeft: "15px" }}   >
            {columnMeta.label}
          </th>
        ),
        customBodyRender: (value, tableMeta, updateValue) => {
          return (
            <div className='status_box text-center' style={{ color: "#293790" }}>
              <Link href={`/partner/ChannelPartnersDetails?id=${tableMeta?.rowData[0]}&mode=view`} className='fw-bold text-decoration-underline'>
                {value}
              </Link>
            </div>
          )
        }
      },

    },
    {
      name: "operating_location",
      label: "Operating Location",
      options: {
        filter: false,
        customHeadRender: (columnMeta) => (
          <th
            className="text-center"
            style={{
              background: clientBtnColor ? clientBtnColor : "#293790",
              color: "white",
              paddingLeft: "15px"
            }}
          >
            {columnMeta.label}
          </th>
        ),
        customBodyRender: (value) => {
          return (
            <div className="status_box text-center" style={{ color: "#293790" }}>
              {value || "-"}
            </div>
          );
        }
      }
    },
    //city
    {
      name: "db_city.city_name",
      label: "City",
      options: {
        filter: false,
        customHeadRender: (columnMeta) => (
          <th
            className="text-center"
            style={{
              background: clientBtnColor ? clientBtnColor : "#293790",
              color: "white",
              paddingLeft: "15px"
            }}
          >
            {columnMeta.label}
          </th>
        ),
        customBodyRender: (value, tableMeta) => {
          return (
            <div className="status_box text-center" style={{ color: "#293790" }}>
              <Link
                href={`/partner/ChannelPartnersDetails?id=${tableMeta?.rowData[0]}&mode=view`}
                className="fw-bold text-decoration-underline"
              >
                {value}
              </Link>
            </div>
          );
        }
      }
    },
    //State
    {
      name: "db_state.state_name",
      label: "State",
      options: {
        filter: false,
        customHeadRender: (columnMeta) => (
          <th
            className="text-center"
            style={{
              background: clientBtnColor ? clientBtnColor : "#293790",
              color: "white",
              paddingLeft: "15px"
            }}
          >
            {columnMeta.label}
          </th>
        ),
        customBodyRender: (value, tableMeta) => {
          return (
            <div className="status_box text-center" style={{ color: "#293790" }}>
              <Link
                href={`/partner/ChannelPartnersDetails?id=${tableMeta?.rowData[0]}&mode=view`}
                className="fw-bold text-decoration-underline"
              >
                {value}
              </Link>
            </div>
          );
        }
      }
    },
    {
      name: 'createdAt',
      label: "Created Date",
      options: {
        filter: false,
        customHeadRender: (columnMeta, updateDirection) => (
          <th className="text-center" style={{ background: clientBtnColor ? clientBtnColor : `#293790`, color: 'white', paddingLeft: "15px" }}   >
            {columnMeta.label}
          </th>
        ),
        customBodyRender: (value, tableMeta, updateValue) => {
          if (!value) {
            return (
              <div className='status_box text-center' style={{ color: "#667799" }}>
                ---------
              </div>
            )
          }
          const date = new Date(value);
          if (isNaN(date.getTime())) {
            return (
              <div className='status_box text-center' style={{ color: "#667799" }}>
                ---------
              </div>
            )
          }
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
          const year = date.getFullYear();
          return (
            <div className='status_box text-center' style={{ color: "#667799" }}>
              {`${day}/${month}/${year}`}
            </div>
          )
        }

      }
    },
    // {
    //   name: 'lead_count',
    //   label: "Leads Count",
    //   options: {
    //     filter: false,
    //     customHeadRender: (columnMeta, updateDirection) => (
    //       <th className="text-center" style={{ background: clientBtnColor ? clientBtnColor : `#293790`, color: 'white', paddingLeft: "15px" }}   >
    //         {columnMeta.label}
    //       </th>
    //     ),
    //     customBodyRender: (value, tableMeta, updateValue) => {
    //       return (
    //         <div className='status_box text-center' style={{ color: "#667799" }}>
    //           {value}
    //         </div>
    //       )
    //     }
    //   }
    // },
    {
      name: 'cp_lead_count',
      label: "C.P Leads Count",
      options: {
        display: (userInfo?.role_id != 1 && selectedOption != 'Channel Partner') ? true : false,
        filter: false,
        customHeadRender: (columnMeta, updateDirection) => (
          <th className="text-center" style={{ background: clientBtnColor ? clientBtnColor : `#293790`, color: 'white', paddingLeft: "15px" }}   >
            {columnMeta.label}
          </th>
        ),
        customBodyRender: (value, tableMeta, updateValue) => {
          return (
            <div className='status_box text-center' style={{ color: "#667799" }}>
              {value}
            </div>
          )
        }
      }
    },
    // {
    //   name: 'booking_count',
    //   label: "Bookings Count",
    //   options: {
    //     filter: false,
    //     customHeadRender: (columnMeta, updateDirection) => (
    //       <th className="text-center" style={{ background: clientBtnColor ? clientBtnColor : `#293790`, color: 'white', paddingLeft: "15px" }}   >
    //         {columnMeta.label}
    //       </th>
    //     ),
    //     customBodyRender: (value, tableMeta, updateValue) => {
    //       return (
    //         <div className='status_box text-center' style={{ color: "#667799" }}>
    //           {value}
    //         </div>
    //       )
    //     }
    //   }
    // },
    {
      name: 'reportToUser',
      label: "Assigned to",
      options: {
        filter: true,
        customHeadRender: (columnMeta, updateDirection) => (
          <th className="text-center" style={{ background: clientBtnColor ? clientBtnColor : `#293790`, color: 'white', paddingLeft: "15px" }}   >
            {columnMeta.label}
          </th>
        ),
        customBodyRender: (value, tableMeta, updateValue) => {
          return (
            <div className='status_box fw-bold text-center' style={{ color: "#293790" }}>
              {value && <span  >{value}</span>}
              {/* {value && <span  >{value}</span>} */}
              {/* {userInfo?.user==value?.user ? "" : value?.user} */}
            </div>
          )
        }
      }
    },
    {
      name: 'user_status',
      label: "Status",
      options: {
        filter: true,
        customHeadRender: (columnMeta, updateDirection) => (
          <th className="text-center" style={{ background: clientBtnColor ? clientBtnColor : `#293790`, color: 'white', paddingLeft: "15px" }}   >
            {columnMeta.label}
          </th>
        ),
        customBodyRender: (value, tableMeta, updateValue) => {
          return (
            <div className='status_box text-center'>
              {value === "active" ? <span className='active status_btn'>active</span> :
                <span className='inactive status_btn'>inactive</span>}
            </div>
          )
        }
      }
    },
    {
      name: 'db_user_profile',
      label: "Designation",
      options: {
        filter: true,
        customHeadRender: (columnMeta, updateDirection) => (
          <th className="text-center" style={{ background: clientBtnColor ? clientBtnColor : `#293790`, color: 'white', paddingLeft: "15px" }}   >
            {columnMeta.label}
          </th>
        ),
        customBodyRender: (value, tableMeta, updateValue) => {
          return (
            <div className='status_box fw-bold text-center' style={{ color: "#293790" }} >
              {value}
            </div>
          )
        }
      }
    },
    //group
    {
      name: 'group',
      label: "Group",
      options: {
        filter: true,
        customHeadRender: (columnMeta, updateDirection) => (
          <th className="text-center" style={{ background: clientBtnColor ? clientBtnColor : `#293790`, color: 'white', paddingLeft: "15px" }}   >
            {columnMeta.label}
          </th>
        ),
        customBodyRender: (value, tableMeta, updateValue) => {
          return (
            <div className='status_box fw-bold text-center' style={{ color: "#293790" }} >
              {value}
            </div>
          )
        }
      }
    },
    {
      name: 'cpt_id',
      label: "Partner Type",
      options: {
        filter: false,
        customHeadRender: (columnMeta, updateDirection) => (
          <th className="text-center" style={{ background: clientBtnColor ? clientBtnColor : `#293790`, color: 'white', paddingLeft: "15px" }}   >
            {columnMeta.label}
          </th>
        ),
        customBodyRender: (value, tableMeta, updateValue) => {
          const partnerType = partnerTypes?.find(data => data.cpt_id === value);
          return (
            <div className='status_box fw-bold text-center' style={{ color: "#293790" }} >
              {partnerType ? partnerType.name : value || 'N/A'}
            </div>
          )
        }
      }
    },
    {
      name: 'user_code',
      label: "Action",
      options: {
        filter: false,
        download: false,
        viewColumns: false,
        display: (userInfo?.role_id == null || userInfo?.role_id == 3) && (selectedOption == "Channel Partner" || (selectedOption == "BST" && userInfo?.role_id == null)) ? true : false,
        customHeadRender: (columnMeta, updateDirection) => (
          <th className="text-center" style={{ background: clientBtnColor ? clientBtnColor : `#293790`, color: 'white', paddingLeft: "15px" }}   >
            {columnMeta.label}
          </th>
        ),
        customBodyRender: (value, tableMeta, updateValue) => {
          return (
            <div className="table_btns justify-content-center align-items-center">
              <button
                onClick={() => { setShowAssignTo(value); setAssignPrefill(tableMeta?.tableData[tableMeta?.rowIndex][11] ?? "") }}
                style={{ background: clientBtnColor ? clientBtnColor : `#293790`, color: "white", padding: "6px", borderRadius: "20px", border: "white" }}
                className='pe-3 ps-3'
                title='Assign - To'>
                Assign to
              </button>
            </div>
          )
        }
      }
    },
    {
      name: 'reportToUserId',
      label: "ReportToUserId",
      options: {
        filter: false,
        viewColumns: false,
        download: false,
        display: false
      }
    },
  ];



  const CustomToolbar = () => {
    return (
      <div className=' d-flex justify-content-start gap-3 align-items-center '>
        <p className='fw-bold ' style={{ fontSize: "18px" }} >{title}</p>
        {/* <DateRange value={value} setValue={setValue} getData={getDataList} filterType={"Channel_Partner"} /> */}
        {/* {
                hasCookie("channel") &&(userInfo?.role_id==null || userInfo?.role_id==3) &&(
                    <div style={{ marginBottom: '0' }}>
        <select 
          value={selectedOption} 
          onChange={handleChange} 
          style={{
            display: 'block',
            width: '100%',
            padding: '10px 10px',
            fontSize: '1rem',
            fontWeight: '400',
            lineHeight: '1.5',
            color: '#495057',
            backgroundColor: '#fff',
            backgroundClip: 'padding-box',
            border: '1px solid #ced4da',
            borderRadius: '.25rem',
            transition: 'border-color .15s ease-in-out,box-shadow .15s ease-in-out',
            marginTop: '8px'
          }}
        >
          <option value="Channel Partner">Channel Partner</option>
          <option value="BST">BST</option>
          <option value="Director">Director</option>
        </select>
      </div>
                )
               } */}

      </div>
    );
  }
  const handleChange = (event) => {
    const value = event.target.value;
    setCookie("cp_selected", value)
    setSelectedOption(value);
    console.log(`Selected option: ${value}`);
    // Add any additional logic you want to handle on selection change
  };
  // const handleRowClick = async (rowData, rowMeta, val) => {
  //     console.log(rowData,"rowMeta",rowMeta, val)
  //     const data = rowMeta?.reduce((accu, value) => {
  //         accu.push(dataList[value.dataIndex].user_code);
  //         return accu; // Return the accumulator
  //     }, []);
  //     setUserData([...data]);
  //    )}

  const handleDelete = async (rowsDeleted) => {
    let toastShown = false;
    const deletedIndices = rowsDeleted.data.map((row) => row.dataIndex);
    const userIds = deletedIndices.map((index) => dataList[index].user_id);

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
          `${Baseurl}/db/users/delete`,
          { user_ids: userIds }, // Send all IDs in one payload
          { headers }
        );
        if (response.status === 200 || response.status === 201) {
          if (!toastShown) {
            toast.success(response?.data?.message, { autoClose: 2500 });
            toastShown = true;
          }
          getDataList();
        } // Refresh the data list after successful deletion
      } catch (error) {
        console.error(error?.response?.data?.message || "Something went wrong!");
        if (error?.response?.data?.status === 422) {
          if (!toastShown) {
            toast.error(error?.response?.data?.message, { autoClose: 2500 });
            toastShown = true;
          }
        } else if (error?.response?.data?.message) {
          if (!toastShown) {
            toast.error(error?.response?.data?.message, { autoClose: 2500 });
            toastShown = true;
          }
        } else {
          if (!toastShown) {
            toast.error("Something went wrong!", { autoClose: 2500 });
            toastShown = true;
          }
        }
      }
    }
  };
  function formatDate(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${day}/${month}/${year}`;
  }

  const matchDateSearch = (dateValue, searchQuery) => {
    if (dateValue === null || dateValue === undefined || dateValue === '') return false;
    if (!searchQuery?.trim()) return false;

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
      const colName = columns[i]?.name;
      const cell = currentRow[i];

      if (cell == null || cell === '') continue;

      if (colName === 'createdAt') {
        if (matchDateSearch(cell, searchQuery)) return true;
        continue;
      }

      if (colName === 'cpt_id') {
        const partnerType = partnerTypes?.find(
          (data) => data.cpt_id === cell || data.cpt_id === Number(cell)
        );
        const partnerName = partnerType?.name || '';
        if (
          partnerName.toLowerCase().includes(q) ||
          String(cell).toLowerCase().includes(q)
        ) {
          return true;
        }
        continue;
      }

      const searchText = Array.isArray(cell)
        ? cell.filter((v) => v != null && v !== '').join(' ')
        : String(cell);

      if (searchText.toLowerCase().includes(q)) return true;
    }

    return false;
  };

  const options = {
    enableNestedDataAccess: ".",
    selectableRows: userInfo?.isDB ? 'multiple' : 'none',
    responsive: "standard",
    // onRowSelectionChange : handleRowClick,
    onRowsDelete: handleDelete,
    downloadOptions: { filename: "ChannelPartnerList" },
    enableNestedDataAccess: ".",
    filterType: 'multiselect',
    viewColumns: false,
    customSearch: customTableSearch,
    onDownload: (buildHead, buildBody, columns, data) => {
      const workbook = XLSX.utils.book_new();
      let range;
      if (hasCookie("Channel_PartnerFilter")) {
        range = JSON.parse(getCookie("Channel_PartnerFilter"))
      }
      const filteredColumns = columns.slice(0, -2); // Remove the last two columns

      // Find the index of cpt_id column
      const cptIdColumnIndex = filteredColumns.findIndex(col => col.name === 'cpt_id');

      const filteredData = data.map(row => {
        const rowData = filteredColumns.map((col, index) => {
          let cellValue = row.data[index];

          // If this is the cpt_id column, map the value to partner type name
          if (index === cptIdColumnIndex && cellValue !== null && cellValue !== undefined) {
            const partnerType = partnerTypes?.find(pt => pt.cpt_id === cellValue || pt.cpt_id === Number(cellValue));
            return partnerType ? partnerType.name : cellValue;
          }

          return cellValue;
        });
        return rowData;
      });

      const customData = [
        ["Partner Report"],
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
        { wch: 14 },
        { wch: 20 },
        { wch: 22 },
        { wch: 12 },
        { wch: 14 },
        { wch: 18 },
        { wch: 14 },
        { wch: 24 },
        { wch: 20 },
      ];
      XLSX.utils.book_append_sheet(workbook, worksheet, "PartnerReport");
      XLSX.writeFile(workbook, "PartnerReport.xlsx");
      return false;
    }
  };



  const updateUserHandler = async () => {
    let toastShown = false;
    const assignTo = getSelectedAssignTo();
    for (const element of userData) {
      if (!hasCookie("token")) return;

      const token = getCookie("token");
      const db_name = getCookie("db_name");

      const header = {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          db: db_name,
          pass: "pass"
        },
      };

      try {
        const response = await axios.put(`${Baseurl}/db/users`, {
          db_name: db_name,
          user_code: element,
          report_to: assignTo,
          isAssigned: true
        }, header);

        if (response.status === 200 || response.status === 201) {
          if (!toastShown) {
            toast.success(response?.data?.message, { autoClose: 2500 });
            toastShown = true;
          }
          setoldAssignTo('');
          setoldAssignToRm?.('');
          setShowModal(false);
          setUserData([])
          if (channelPartnerFilter) {
            getDataList(channelPartnerFilter)
          }
          else {

            getDataList();
          }
        }
      } catch (error) {
        console.log(error)
        if (error?.response?.data?.status === 422) {
          if (!toastShown) {
            toast.error(error?.response?.data?.message, { autoClose: 2500 });
            toastShown = true;
          }
        } else if (error?.response?.data?.message) {
          if (!toastShown) {
            toast.error(error?.response?.data?.message, { autoClose: 2500 });
            toastShown = true;
          }
        } else {
          if (!toastShown) {
            toast.error("Something went wrong!", { autoClose: 2500 });
            toastShown = true;
          }
        }
      }
    }
  };
  const mappedDataList = dataList?.map(list => ({
    ...list,
    cpt_id: list?.cpt_id, // Preserve the actual cpt_id value, don't overwrite with role_name
    reportToUser: [list?.reportToUser?.user]?.filter(d => d !== null && d !== undefined),
    user_status: list?.user_status ? "active" : "inactive",
    db_user_profile: [list?.db_user_profile?.db_designation?.designation]?.filter(d => d !== null && d !== undefined),
    reportToUserId: list?.reportToUser?.user_id
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
                // data={mappedDataList}
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
                {userData.length ?
                  <div className="table_btns d-flex align-items-center justify-content-center gap-3 mt-4">


                    <button onClick={() => { setActionMode('Cancel'); setShowModal(false); setUserData([]) }} className=" btn btn-danger rounded-5">
                      Cancel
                    </button>
                    <button onClick={() => { setActionMode('Assignto'); setShowModal(true) }} style={{ backgroundColor: clientBtnColor }} className="btn  rounded-5 text-white" >
                      Assign to
                    </button>

                  </div>
                  : <></>
                }
              </div>
            </div>
          )
      }


      <Modal className="commonModal" show={showModal} onHide={() => { setShowModal(false); setoldAssignTo(''); setoldAssignToRm?.(''); }} style={{}}>
        <Modal.Header closeButton>
          <Modal.Title>  Assign To </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="add_user_form">
            <div className="row">
              {selectedOption === "Channel Partner" ? (
                <>
                  <div className="col-xl-12 col-md-12 col-sm-12 col-12">
                    <div className="input_box">
                      <label className="form-label">Assign To (BST)</label>
                      <Select
                        id="select-bst"
                        isSearchable={true}
                        isClearable={true}
                        placeholder="Search and select BST user..."
                        noOptionsMessage={() => "No BST users found"}
                        filterOption={userSearchFilterOption}
                        options={getBstUserOptions()}
                        value={getSelectValue(oldAssignTo)}
                        onChange={(e) => {
                          setoldAssignTo(e?.value || "")
                          if (e?.value) setoldAssignToRm?.("")
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
                  <div className="col-xl-12 col-md-12 col-sm-12 col-12 mt-3">
                    <div className="input_box">
                      <label className="form-label">Assign To (RM)</label>
                      <Select
                        id="select-rm"
                        isSearchable={true}
                        isClearable={true}
                        placeholder="Search and select RM user..."
                        noOptionsMessage={() => "No RM users found"}
                        filterOption={userSearchFilterOption}
                        options={getRmUserOptions()}
                        value={getSelectValue(oldAssignToRm)}
                        onChange={(e) => {
                          setoldAssignToRm?.(e?.value || "")
                          if (e?.value) setoldAssignTo?.("")
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
                </>
              ) : (
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
                      filterOption={userSearchFilterOption}
                      options={userListFilterBasisOfRole(selectedOption, usersList)}
                      value={getSelectValue(oldAssignTo)}
                      onChange={(e) => {
                        setoldAssignTo(e?.value || "")
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
              )}
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button className=" btn btn-danger rounded-5" onClick={() => { setShowModal(false); setoldAssignTo(''); setoldAssignToRm?.(''); }}>Cancel</button>
          <button style={{ background: clientBtnColor }} className='btn rounded-5 text-white' onClick={updateUserHandler} >
            Submit
          </button>
        </Modal.Footer>
      </Modal>

    </>

  )
}

export default ManageUsersTable 