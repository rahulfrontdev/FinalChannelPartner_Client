import { getCookie, hasCookie } from 'cookies-next';
import MUIDataTable from 'mui-datatables';
import React, { useEffect, useState } from 'react'
import { toast } from 'react-toastify';
import { Baseurl } from '../../../../Utils/Constants';
import axios from 'axios';
import Link from 'next/link';
import * as XLSX from "xlsx";

export const VisitReport = (startDate, endDate, dateFilter) => {
  const clientBtnColor=hasCookie("clientBtnColor") ? getCookie("clientBtnColor") : "#293790"      
  function formatTime(timeString) {
    const timeParts = (timeString || '').split(':');
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
      const columns = [
        {
          name: 'visit_id',
          label: "Visit ID",
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
      },
          {
              name: 'visit_code',
              label: "Visit ID",
              options: {
                  filter: false,
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
          },
          {
              name: 'leadDataName',
              label: "Lead Name",
              options: {
                  filter: false,
                  customHeadRender: (columnMeta, updateDirection) => (
                    <th className="text-center" style={{background:clientBtnColor? clientBtnColor:`#293790`, color: 'white',padding:"15px"}}   >
                      {columnMeta.label}
                    </th>
                  ),
                    customBodyRender: (value, tableMeta, updateValue) => {
                      return (
                          <Link href={`/partner/VisitDetails?id=${tableMeta?.rowData[0]}`}  className='status_box fw-bold text-decoration-underline' style={{color:"#293790"}}>
                              {value}
                          </Link>
                      )
                  }
              },
  
          },
          {
              name: 'leadDataEmail',
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
                          <div className='status_box fw-bold' style={{color:"#293790"}}>
                              {/* {value.email_id} */}
                              {value}
                          </div>
                      )
                  }
                  
              }
          },
          {
              name: 'leadDataContact',
              label: "Contact No.",
              options: {
                  filter: false,
                  customHeadRender: (columnMeta, updateDirection) => (
                    <th className="text-center" style={{background:clientBtnColor? clientBtnColor:`#293790`, color: 'white',padding:"15px"}}   >
                      {columnMeta.label}
                    </th>
                  ),
                  customBodyRender: (value, tableMeta, updateValue) => {
                      return (
                          <div className='status_box' style={{color:"#667799"}}>
                              {/* +91-{value.p_contact_no} */}
                              +91-{value}
                          </div>
                      )
                  }
              }
          },
          {
              name: 'leadDataProject',
              label: "Project",
              options: {
                  filter: false,
                  customHeadRender: (columnMeta, updateDirection) => (
                    <th className="text-center" style={{background:clientBtnColor? clientBtnColor:`#293790`, color: 'white',padding:"15px"}}   >
                      {columnMeta.label}
                    </th>
                  ),
                  customBodyRender: (value, tableMeta, updateValue) => {
                      return (
                          <div className='status_box' style={{color:"#667799"}}>
                              {/* {value?.projectData?.project} */}
                              {value}
                          </div>
                      )
                  }
              }
          },
          {
            name: 'assigning_date',
            label: "Assign Date",
            options: {
                filter: false,
                customHeadRender: (columnMeta, updateDirection) => (
                    <th className="text-center" style={{background:clientBtnColor? clientBtnColor:`#293790`, color: 'white',padding:"15px"}}   >
                      {columnMeta.label}
                    </th>
                  ),
                  customBodyRender: (value, tableMeta, updateValue) => {
                    return (
                        <div className='status_box text-center' style={{color:"#667799"}}>
                            {formatDate(value)}
                        </div>
                    )
                }
            }
        },
        {
          name: 'completed_date',
          label: "Completed Date",
          options: {
              filter: false,
              customHeadRender: (columnMeta, updateDirection) => (
                <th className="text-center" style={{background:clientBtnColor? clientBtnColor:`#293790`, color: 'white',padding:"15px"}}   >
                  {columnMeta.label}
                </th>
              ),
              customBodyRender: (value, tableMeta, updateValue) => {
                  return (
                      <div className='status_box' style={{color:"#667799"}}>
                          {value ? formatDate(value):""}
                      </div>
                  )
              }
          }
        },
          {
              name: 'p_visit_date',
              label: "Visit Date",
              options: {
                  filter: false,
                  customHeadRender: (columnMeta, updateDirection) => (
                    <th className="text-center" style={{background:clientBtnColor? clientBtnColor:`#293790`, color: 'white',padding:"15px"}}   >
                      {columnMeta.label}
                    </th>
                  ),
                  customBodyRender: (value, tableMeta, updateValue) => {
                      return (
                          <div className='status_box' style={{color:"#667799"}}>
                              {formatDate(value)}
                          </div>
                      )
                  }
              }
          },
          {
              name: 'p_visit_time',
              label: "Visit Time",
              options: {
                  filter: false,
                  customHeadRender: (columnMeta, updateDirection) => (
                    <th className="text-center" style={{background:clientBtnColor? clientBtnColor:`#293790`, color: 'white',padding:"15px"}}   >
                      {columnMeta.label}
                    </th>
                  ),
                  customBodyRender: (value, tableMeta, updateValue) => {
                      return (
                          <div
                          style={{background:"violet", color:"white",padding:"6px", borderRadius:"20px",border:"white", width:"fit-content"}}
                          className='pe-3 ps-3 cursor-pointer'
                          title='Visit Time'>
                              {formatTime(value)}
                      </div>
                      )
                  }
              }
          },
         
          {
            name: 'cpName',
            label: "C.P Name",
            options: {
                filter: false,
                customHeadRender: (columnMeta, updateDirection) => (
                  <th className="text-center" style={{background:clientBtnColor? clientBtnColor:`#293790`, color: 'white',padding:"15px"}}   >
                    {columnMeta.label}
                  </th>
                ),
                customBodyRender: (value, tableMeta, updateValue) => {
                    return (
                      <div className='status_box fw-bold' style={{color:"#293790"}}>
                      {value}
                  </div>
                    )
                }
            }
        },
        {
            name: 'status',
            label: "Remarks",
            options: {
                filter: true,
                customHeadRender: (columnMeta, updateDirection) => (
                  <th className="text-center" style={{background:clientBtnColor? clientBtnColor:`#293790`, color: 'white',padding:"15px"}}   >
                    {columnMeta.label}
                  </th>
                ),
                customBodyRender: (value, tableMeta, updateValue) => {
                    return (
                        <div className="">
                            {/* <div
                                style={{padding:"6px", color:"white",background:value==="Completed" ?"#84CA4d":value==="Requested" ?"#FEC925":value==="Scheduled" ? "#17B4E7":"",borderRadius:"20px",border:"white"}}
                                className='pe-3 ps-3 btn-warning btn '
                                title='Visit Status'>
                                   {value}
                            </div> */}
                            <div
                              style={{
                                  padding: "6px",
                                  color: "white",
                                  background: value === "Completed" 
                                    ? "#84CA4d" 
                                    : value === "Requested" 
                                    ? "#FEC925" 
                                    : value === "Scheduled" 
                                    ? "#17B4E7"
                                    : value === "Rejected"
                                    ? "#D9534F" 
                                    : value === "Rescheduled"
                                    ? "#FF6F61"  // or any color of your choice
                                    : value === "VISIT NOT DONE"
                                    ? "#d43953"  // or any color of your choice
                                    : "",
                                  borderRadius: "20px",
                                  border: "white"
                              }}
                              className='pe-3 ps-3 btn-warning btn'
                              title='Visit Status'
                          >
                              {value}
                          </div>

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
        downloadOptions:{
          filename:"ChannelPartnerList",
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
                ["Channel Visits Report"], 
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
                { s: { r: 0, c: 0 }, e: { r: 1, c: filteredColumns.length-1} }, // Merge A1 and A2 for the title
                { s: { r: 2, c: 0 }, e: { r: 3, c: filteredColumns.length-1 } }, // Merge A3 for the date range
                { s: { r: 4, c: 0 }, e: { r: 4, c: filteredColumns.length-1 } }, // Merge A3 for the date range
                { s: { r: 5, c: 0 }, e: { r: 6, c: filteredColumns.length-1} }, // Merge A3 for the date range
                
              ];
              worksheet['!cols'] = [
                { wch: 8 }, 
                { wch: 12 },
                { wch: 18 },
                { wch: 30 },
                { wch: 14 },
                { wch: 24 },
                { wch: 22 },
                { wch: 22 },
                { wch: 18 },
                { wch: 12 },
                { wch: 18 },
                { wch: 18 },
              ];
              XLSX.utils.book_append_sheet(workbook, worksheet, "ChannelVisits");
              XLSX.writeFile(workbook, "ChannelVisits.xlsx");
              return false;
            }          
    };
        const[loader,setLoader]=useState(false)
    
    const [dataList, setDataList] = useState([])
    const getVisitList = async (queryObjLeads) => {
        setLoader(true)
        let url = `/db/channel/visit`;
     
      let params = {};
        console.log({queryObjLeads})
        // const queryString = new URLSearchParams().toString();
        // if (queryString) {
        //   url += `?${queryString}`;
        // }
        
        
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
                    params: {
                        f_date: queryObjLeads?.startDate,
                        t_date: queryObjLeads?.endDate
                    },
                  });
                  if(response?.status === 200 || response?.status === 201){
                    setLoader(false)
                  setDataList(response?.data?.data);
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
    const visitsFilter=hasCookie("VisitsFilter") ? JSON.parse(getCookie("VisitsFilter")) : dateFilter;

        useEffect(()=>{
            if(startDate){
              getVisitList(startDate)
            }
            else{
              getVisitList()
            }
          },[startDate])
          
    const mappedDataList=dataList?.map(list=>({
        visit_id:list?.visit_id,
        visit_code:list?.visit_code,
        leadDataName:list?.leadData?.lead_name,
        leadDataEmail:list?.leadData?.email_id,
        leadDataContact:list?.leadData?.p_contact_no,
        leadDataProject:list?.leadData?.sales_project_name,
        p_visit_date:list?.p_visit_date,
        p_visit_time:list?.p_visit_time,
        status:list?.status,
        assigning_date: list?.createdAt,
        completed_date: list?.status === "Completed" ? list?.updatedAt : "",
        cpName: list?.leadData?.leadOwner?.user ?? ""
      }))
        
  return (
   <>
      <div className="miuiTable channelTable">
                      <MUIDataTable
                          title={"Visit Report"}
                        //   data={[]}
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
