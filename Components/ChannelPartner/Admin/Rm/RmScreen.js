import React, { useEffect, useState } from "react";
import axios from "axios";
import MUIDataTable from "mui-datatables";
import { getCookie, hasCookie } from "cookies-next";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { Baseurl } from "../../../../Utils/Constants";
import Loader from "../../../Loader/Loader";

const RmScreen = () => {
  const sideView = useSelector((state) => state.sideView.value);
  const clientBtnColor = hasCookie("clientBtnColor") ? getCookie("clientBtnColor") : "#293790";
  const [dataList, setDataList] = useState([]);
  const [loader, setLoader] = useState(false);

  const headerCell = (label) => (
    <th style={{ background: clientBtnColor, color: "white", padding: "8px 15px" }}>
      {label}
    </th>
  );

  const columns = [
    {
      name: "user",
      label: "Name",
      options: {
        filter: true,
        customHeadRender: (columnMeta) => headerCell(columnMeta.label),
      },
    },
    {
      name: "user_l_name",
      label: "Last Name",
      options: {
        filter: true,
        customHeadRender: (columnMeta) => headerCell(columnMeta.label),
      },
    },
    {
      name: "email",
      label: "Email",
      options: {
        filter: true,
        customHeadRender: (columnMeta) => headerCell(columnMeta.label),
      },
    },
    {
      name: "contact_number",
      label: "Contact No",
      options: {
        filter: true,
        customHeadRender: (columnMeta) => headerCell(columnMeta.label),
      },
    },
    {
      name: "user_code",
      label: "User Code",
      options: {
        filter: true,
        customHeadRender: (columnMeta) => headerCell(columnMeta.label),
      },
    },
    {
      name: "reportTo",
      label: "Report/Assign To",
      options: {
        filter: true,
        customHeadRender: (columnMeta) => headerCell(columnMeta.label),
      },
    },
    {
      name: "group",
      label: "Group",
      options: {
        filter: true,
        customHeadRender: (columnMeta) => headerCell(columnMeta.label),
      },
    },
    {
      name: "statusLabel",
      label: "Status",
      options: {
        filter: true,
        customHeadRender: (columnMeta) => headerCell(columnMeta.label),
        customBodyRender: (value) => (
          <div className="status_box">
            {value === "active" ? (
              <span className="active status_btn">active</span>
            ) : (
              <span className="inactive status_btn">inactive</span>
            )}
          </div>
        ),
      },
    },
  ];

  const getDataList = async () => {
    if (!hasCookie("token")) return;
    setLoader(true);
    const token = getCookie("token");
    const db_name = getCookie("db_name");
    const header = {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        db: db_name,
        pass: "pass",
      },
    };
    try {
      const response = await axios.get(`${Baseurl}/db/channel/rm`, header);
      const payload = response?.data?.data;
      const rows = Array.isArray(payload) ? payload : Array.isArray(payload?.rows) ? payload.rows : [];
      setDataList(
        rows.map((user) => ({
          user: user?.user || user?.name || user?.first_name || "",
          user_l_name: user?.user_l_name || user?.last_name || "",
          email: user?.email || "",
          contact_number: user?.contact_number || user?.contact || user?.mobile || "",
          user_code: user?.user_code || "",
          reportTo: user?.reportToUser?.user || user?.report_to_name || user?.assigned_to || "",
          group: user?.group || "",
          statusLabel: user?.user_status === false || user?.user_status === 0 || String(user?.status || "").toLowerCase() === "inactive" ? "inactive" : "active",
        }))
      );
    } catch (error) {
      setDataList([]);
      toast.error(error?.response?.data?.message || "Failed to load RM list", { autoClose: 2500 });
    } finally {
      setLoader(false);
    }
  };

  useEffect(() => {
    getDataList();
  }, []);

  return (
    <div className={`main_Box w-100 ${sideView}`}>
      <div className="main_content">
        {loader ? (
          <Loader />
        ) : (
          <div className="miuiTable channelTable">
            <MUIDataTable
              title={<p className="fw-bold mb-0" style={{ fontSize: "18px" }}>RM</p>}
              data={dataList}
              columns={columns}
              options={{
                selectableRows: "none",
                responsive: "standard",
                filterType: "multiselect",
                viewColumns: false,
                downloadOptions: {
                  filename: "RmList",
                  filterOptions: { useDisplayedRowsOnly: true },
                },
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default RmScreen;
