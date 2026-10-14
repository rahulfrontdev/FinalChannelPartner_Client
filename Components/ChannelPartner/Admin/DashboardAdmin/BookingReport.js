import { getCookie, hasCookie } from 'cookies-next';
import MUIDataTable from 'mui-datatables';
import React, { useEffect, useState } from 'react'
import { toast } from 'react-toastify';
import { Baseurl } from '../../../../Utils/Constants';
import axios from 'axios';
import Link from 'next/link';
import * as XLSX from "xlsx";

export const BookingReport = (startDate) => {
  const [loader, setLoader] = useState(false);
  const [dataList, setDataList] = useState([])
  const clientBtnColor = hasCookie("clientBtnColor") ? getCookie("clientBtnColor") : "#293790"
  const getDataList = async (queryObjLeads) => {
    setLoader(true)
    let url = `/db/channel/booking`;

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
          params: {
            f_date: queryObjLeads?.startDate,
            t_date: queryObjLeads?.endDate,
          },
        });
        if (response?.status === 200 || response?.status === 201) {
          setLoader(false)
          setDataList(response.data.data);
        }
      } catch (error) {
        if (error?.response?.data?.message) {
          setLoader(false)
          toast.error(error?.response?.data?.message, { autoClose: 2500 });
        } else {
          setLoader(false)
          toast.error("Something went wrong!", { autoClose: 2500 });
        }
      }
    }
  }
  useEffect(() => {
    if (startDate) {
      getDataList(startDate)
    }
    else {
      getDataList()
    }
  }, [startDate]);
  function formatDate(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${day}/${month}/${year}`;
  }
  const columns = [
    {
      name: 'createdAt',
      label: "Booking Date",
      options: {
        filter: false,
        customHeadRender: (columnMeta, updateDirection) => (
          <th className="text-center" style={{ background: clientBtnColor ? clientBtnColor : `#293790`, color: 'white', padding: "15px" }}   >
            {columnMeta.label}
          </th>
        ),
        customBodyRender: (value, tableMeta, updateValue) => {
          return (
            <div className='status_box' style={{ color: "#667799" }}>
              {/* {value?.projectData?.project} */}
              {formatDate(value)}
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
          <th className="text-center" style={{ background: clientBtnColor ? clientBtnColor : `#293790`, color: 'white', padding: "15px" }}   >
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
          <th className="text-center" style={{ background: clientBtnColor ? clientBtnColor : `#293790`, color: 'white', padding: "15px" }}   >
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
          <th className="text-center" style={{ background: clientBtnColor ? clientBtnColor : `#293790`, color: 'white', padding: "15px" }}   >
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
          <th className="text-center" style={{ background: clientBtnColor ? clientBtnColor : `#293790`, color: 'white', padding: "15px" }}   >
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
          <th className="text-center" style={{ background: clientBtnColor ? clientBtnColor : `#293790`, color: 'white', padding: "15px" }}   >
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
          <th className="text-center" style={{ background: clientBtnColor ? clientBtnColor : `#293790`, color: 'white', padding: "15px" }}   >
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
    // {
    //   name: 'visit_id',
    //   label: "Booking ID",
    //   options: {
    //     display: false,
    //     filter: false,
    //     download: false,
    //     viewColumns: false,
    //     customHeadRender: (columnMeta, updateDirection) => (
    //       <th className="text-center" style={{ background: clientBtnColor ? clientBtnColor : `#293790`, color: 'white', padding: "15px" }}   >
    //         {columnMeta.label}
    //       </th>
    //     ),
    //     customBodyRender: (value, tableMeta, updateValue) => {
    //       return (
    //         <div className='status_box fw-bold' style={{ color: "#293790" }} >
    //           {value}
    //         </div>
    //       )
    //     }

    //   }
    // },
    {
      name: 'cpName',
      label: "C.P Name",
      options: {
        filter: false,
        customHeadRender: (columnMeta, updateDirection) => (
          <th className="text-center" style={{ background: clientBtnColor ? clientBtnColor : `#293790`, color: 'white', padding: "15px" }}   >
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
    // {
    //     name: 'leadDataName',
    //     label: "Contacted",
    //     options: {
    //         filter: false,
    //         customHeadRender: (columnMeta, updateDirection) => (
    //           <th className="text-center" style={{background:clientBtnColor? clientBtnColor:`#293790`, color: 'white',padding:"15px"}}   >
    //             {columnMeta.label}
    //           </th>
    //         ),
    //           customBodyRender: (value, tableMeta, updateValue) => {
    //             return (
    //                 <Link href={`/partner/VisitDetails?id=${tableMeta?.rowData[0]}`}  className='status_box fw-bold text-decoration-underline' style={{color:"#293790"}}>
    //                     {/* {value.lead_name} */}
    //                     {value}
    //                 </Link>
    //             )
    //         }
    //     },

    // },
    {
      name: 'status',
      label: "Brokerage Status",
      options: {
        filter: false,
        customHeadRender: (columnMeta, updateDirection) => (
          <th className="text-center" style={{ background: clientBtnColor ? clientBtnColor : `#293790`, color: 'white', padding: "15px" }}   >
            {columnMeta.label}
          </th>
        ),
        customBodyRender: (value, tableMeta, updateValue) => {

          return (
            <div className='status_box fw-bold' style={{ color: "#293790" }}>
              {/* {value.email_id} */}
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
        customHeadRender: (columnMeta, updateDirection) => (
          <th className="text-center" style={{ background: clientBtnColor ? clientBtnColor : `#293790`, color: 'white', padding: "15px" }}   >
            {columnMeta.label}
          </th>
        ),
        customBodyRender: (value, tableMeta, updateValue) => {
          return (
            <div className='status_box' style={{ color: "#667799" }}>
              {/* +91-{value.p_contact_no} */}
              {value}
            </div>
          )
        }
      }
    },
  ];

  const options = {
    enableNestedDataAccess: ".",
    selectableRows: 'none',
    responsive: "standard",
    // onRowSelectionChange : handleRowClick,
    // onRowsDelete: handleDelete,
    downloadOptions: {
      filename: "ChannelPartnerList",
      filterOptions: { useDisplayedRowsOnly: true },
    },
    // enableNestedDataAccess:".",
    // filterType:'multiselect',
    viewColumns: true,
    onDownload: (buildHead, buildBody, columns, data) => {
      const workbook = XLSX.utils.book_new();
      let filteredColumns = columns // Remove the last two columns
      const filteredData = data.map(row => {
        return filteredColumns.map((col, index) => row.data[index]);
      });

      const customData = [
        ["Channel Booking Report"],
        [],
        [`Filter by:`],
        [],
        [`Date Range: ${startDate?.startDate ? formatDate(startDate?.startDate) : null} to ${startDate?.endDate ? formatDate(startDate?.endDate) : null}`],
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
        { wch: 23 },
        { wch: 12 },
        { wch: 18 },
        { wch: 30 },
        { wch: 14 },
        { wch: 24 },
        { wch: 22 },
        { wch: 22 },
        { wch: 18 },
        { wch: 12 },
        { wch: 22 },
        { wch: 20 },
      ];
      XLSX.utils.book_append_sheet(workbook, worksheet, "ChannelBooking");
      XLSX.writeFile(workbook, "ChannelBooking.xlsx");
      return false;
    }
  };
  const mappedDataList = dataList?.map((list) => {
    return (
      {
        ...list,
        BookingprojectData: list?.BookingleadData?.sales_project_name,
        Location: [list?.Location]?.filter(d => d !== null && d !== undefined),
        BrokerageBookingList: list?.BrokerageBookingList?.reduce((sum, item) => sum + (item?.amount || 0), 0),
        cpName: list?.BookingleadData?.leadOwner?.user
      }
    )

  })
  return (
    <>
      <div className="miuiTable channelTable">
        <MUIDataTable
          title={"Booking Report"}
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
    </>
  )
}
