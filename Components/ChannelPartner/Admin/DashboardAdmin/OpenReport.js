import { getCookie, hasCookie } from 'cookies-next';
import MUIDataTable from 'mui-datatables';
import React, { useEffect, useState } from 'react'
import { toast } from 'react-toastify';
import { Baseurl } from '../../../../Utils/Constants';
import axios from 'axios';
import Link from 'next/link';
import * as XLSX from "xlsx";

export const OpenReport = (startDate) => {
    const [loader, setLoader] = useState(false);
    const [dataList, setDataList] = useState([])
      const clientBtnColor=hasCookie("clientBtnColor") ? getCookie("clientBtnColor") : "#293790"
      const userInfo=hasCookie("userInfo")?JSON.parse(getCookie("userInfo")):null;
      const getDataList = async (queryObjLeads) => {
        let db_name = (getCookie('db_name'));
        let url = `/db/channelPartnerLeads?db_name=${db_name}`;
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
                const response = await axios.get(Baseurl +url, {
                    ...header,
                    // params: queryObjLeads,
                    params: {
                      f_date: queryObjLeads?.startDate,
                      t_date: queryObjLeads?.endDate,
                      status_id: "OPEN"
                    },
                  });
                if(response?.status === 200 || response?.status === 201){
                    setLoader(false);
                    setDataList(response.data.data);
                }
            } catch (error) {
                if (error?.response?.data?.message) {
                    setLoader(false);
                    toast.error(error?.response?.data?.message,{autoClose:2500});
                } else {
                    setLoader(false);
                    toast.error("Something went wrong!",{autoClose:2500});
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
          name: "first_name",
          label: "First Name",
          options: {
            filter: false,
            customHeadRender: (columnMeta, updateDirection) => (
              <th className="text-center" style={{background:clientBtnColor? clientBtnColor:`#293790`, color: 'white',padding:"15px"}}   >
                {columnMeta.label}
              </th>
            ),
    
            customBodyRender: (value, tableMeta, updateValue) => {
              return (
              <span
              className="fw-bold"
              style={{color: '#293790'}}
              >
                {value}
            </span>
              )
            },
          },
        },
        {
          name: "last_name",
          label: "Last Name",
          options: {
            filter: false,
            customHeadRender: (columnMeta, updateDirection) => (
              <th className="text-center" style={{background:clientBtnColor? clientBtnColor:`#293790`, color: 'white',padding:"15px"}}   >
                {columnMeta.label}
              </th>
            ),
            customBodyRender: (value, tableMeta, updateValue) => {
              return (
              <span
              className="fw-bold"
              style={{color: '#293790'}}
              >
                {value}
            </span>
              )
            },
          },
        },
        {
          name: "email",
          label: "Email",
          options: {
            filter: false,
            customHeadRender: (columnMeta, updateDirection) => (
              <th className="text-center" style={{background:clientBtnColor? clientBtnColor:`#293790`, color: 'white',padding:"15px"}}   >
                {columnMeta.label}
              </th>
            ),
            customBodyRender: (value, tableMeta, updateValue) => {
              return (
              <span
              className="fw-bold"
              style={{color: '#293790'}}
              >
                {value}
            </span>
              )
            },
          },
        },
        {
          name: "contact",
          label: "Contact",
          options: {
            filter: false,
            customHeadRender: (columnMeta, updateDirection) => (
              <th className="text-center" style={{background:clientBtnColor? clientBtnColor:`#293790`, color: 'white',padding:"15px"}}   >
                {columnMeta.label}
              </th>
            ),
            customBodyRender: (value, tableMeta, updateValue) => {
              return (
              <span
              className="fw-bold"
              style={{color: '#293790'}}
              >
                {value}
            </span>
              )
            },
          },
        },
        {
          name: "createdAt",
          label: "Registration Date",
          options: {
            filter: false,
            customHeadRender: (columnMeta, updateDirection) => (
              <th className="text-center" style={{background:clientBtnColor? clientBtnColor:`#293790`, color: 'white',padding:"15px"}}   >
                {columnMeta.label}
              </th>
            ),
            customBodyRender: (value, tableMeta, updateValue) => {
              return (
              <span
              className=""
              style={{color: '#667799'}}
              >
                {formatDate(value)}
            </span>
              )
            },
          },
        },
        {
          name: "stage",
          label: "Status",
          options: {
            filter: true,
            customHeadRender: (columnMeta, updateDirection) => (
              <th className="text-center" style={{background:clientBtnColor? clientBtnColor:`#293790`, color: 'white',padding:"15px"}}   >
                {columnMeta.label}
              </th>
            ),
            customBodyRender: (value, tableMeta, updateValue) => {
              return (
              <span
              className="fw-bold"
              style={{color: '#293790'}}
              >
                {value}
            </span>
              )
            },
          },
        },
        {
          name: "user",
          label: "Assigned To",
          options: {
            filter: true,
            display:userInfo?.isDB ? true:false,
            customHeadRender: (columnMeta, updateDirection) => (
              <th className="text-center" style={{background:clientBtnColor? clientBtnColor:`#293790`, color: 'white',padding:"15px"}}   >
                {columnMeta.label}
              </th>
            ),
            customBodyRender: (value, tableMeta, updateValue) => {
              return (
              <span
              className="fw-bold"
              style={{color: '#293790'}}
              >
                {value}
            </span>
              )
            },
          },
        },
        {
          name: 'asssigned_to',
          label: "AssignedToId",
          options: {
            display:false,
              filter: false,
              download:false,
              viewColumns:false,
              customHeadRender: (columnMeta, updateDirection) => (
                <th className="text-center" style={{background:clientBtnColor? clientBtnColor:`#293790`, color: 'white',padding:"15px"}}   >
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
      }
      ];
    
    const options = {
        enableNestedDataAccess: ".",
        selectableRows: 'none',
        responsive: "standard",
        // onRowSelectionChange : handleRowClick,
        // onRowsDelete: handleDelete,
        downloadOptions:{
          filename:"ChannelPartnerList",
          filterOptions: { useDisplayedRowsOnly: true },
        },
        // enableNestedDataAccess:".",
        // filterType:'multiselect',
        viewColumns: true,
        onDownload: (buildHead, buildBody, columns, data) => {
              const workbook = XLSX.utils.book_new();
              let range;
              if(hasCookie("cpleadsFilter")){
                range= JSON.parse(getCookie("cpleadsFilter"))
              }
              const filteredColumns = columns.slice(0, -1); // Remove the last two columns
              const filteredData = data.map(row => {
                return filteredColumns.map((col, index) => row.data[index]);
              });
              
              const customData = [
                ["Channel Partner Open Report"], 
                [], 
                [`Filter by:`],
                [],
                [`Date Range: ${startDate?.startDate ? formatDate(startDate?.startDate): null} to ${startDate?.endDate ? formatDate(startDate?.endDate):null}`],
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
                { wch: 16 }, 
                { wch: 16 },
                { wch: 32 },
                { wch: 12 },
                { wch: 20 },
                { wch: 14 },
                { wch: 18 },
              ];
              XLSX.utils.book_append_sheet(workbook, worksheet, "CPOpenReport");
              XLSX.writeFile(workbook, "CPOpenReport.xlsx");
              return false;
            }
    };

  return (
   <>
      <div className="miuiTable channelTable">
                      <MUIDataTable
                          title={"Open Report"}
                          data={dataList}
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
                   
                  </div>
   </>
  )
}
