import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { getCookie, hasCookie } from "cookies-next";
import { toast } from "react-toastify";
import { Baseurl } from "../../../../Utils/Constants";
import Loader from "../../../Loader/Loader";

const GROUP_ORDER = ["HOD", "BST", "Director", "ChannelPartner", "Manager", "Executive", "RM"];

const RmGroupReport = () => {
  const clientBtnColor = hasCookie("clientBtnColor") ? getCookie("clientBtnColor") : "#293790";
  const [rows, setRows] = useState([]);
  const [loader, setLoader] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!hasCookie("token")) return;
      setLoader(true);
      const header = {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${getCookie("token")}`,
          db: getCookie("db_name"),
          pass: "pass",
        },
      };
      try {
        const response = await axios.get(`${Baseurl}/db/channel/rm`, header);
        const payload = response?.data?.data;
        const list = Array.isArray(payload) ? payload : Array.isArray(payload?.rows) ? payload.rows : [];
        setRows(list);
      } catch (error) {
        setRows([]);
        toast.error(error?.response?.data?.message || "Failed to load RM report", { autoClose: 2500 });
      } finally {
        setLoader(false);
      }
    };
    load();
  }, []);

  const groups = useMemo(() => {
    const buckets = new Map();
    rows.forEach((user) => {
      const name = String(user?.group || "").trim() || "Unassigned";
      if (!buckets.has(name)) buckets.set(name, []);
      buckets.get(name).push(user);
    });
    const names = Array.from(buckets.keys()).sort((a, b) => {
      const aIndex = GROUP_ORDER.indexOf(a);
      const bIndex = GROUP_ORDER.indexOf(b);
      if (a === "Unassigned") return 1;
      if (b === "Unassigned") return -1;
      if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });
    return names.map((name) => ({ name, users: buckets.get(name) }));
  }, [rows]);

  if (loader) return <Loader />;

  return (
    <div className="rm_group_report px-2 pb-4">
      <label className="m-3 fw-bold d-block" style={{ fontSize: "24px", color: "#160354" }}>
        RM Report
      </label>
      {!groups.length ? (
        <div className="text-muted px-3">No RMs in this report</div>
      ) : (
        <>
          <div className="d-flex flex-wrap gap-2 mx-3 mb-3">
            {groups.map((group) => (
              <div
                key={group.name}
                className="bg-white border rounded px-3 py-2"
                style={{ minWidth: "140px" }}
              >
                <div className="text-muted" style={{ fontSize: "13px" }}>{group.name}</div>
                <div className="fw-bold" style={{ color: "#160354", fontSize: "22px" }}>{group.users.length}</div>
              </div>
            ))}
          </div>
          {groups.map((group) => (
            <div key={group.name} className="bg-white border rounded mx-3 mb-4">
              <div className="d-flex justify-content-between align-items-center px-3 py-2" style={{ background: "#f5f7fb" }}>
                <div className="fw-bold" style={{ color: "#160354" }}>{group.name}</div>
                <div className="text-muted">{group.users.length} RM</div>
              </div>
              <div className="table-responsive">
                <table className="table align-middle mb-0">
                  <thead>
                    <tr>
                      {["User Code", "Name", "Last Name", "Email", "Contact No", "Report/Assign To", "Group", "Project", "Status"].map((label) => (
                        <th key={label} style={{ background: clientBtnColor, color: "white", whiteSpace: "nowrap" }}>{label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {group.users.map((user) => {
                      const code = user?.user_code || "";
                      const active = !(user?.user_status === false || user?.user_status === 0 || String(user?.status || "").toLowerCase() === "inactive");
                      const project = Array.isArray(user?.projects) && user.projects.length
                        ? user.projects.map((item) => item?.project_name).filter(Boolean).join(", ")
                        : user?.project_name || user?.project || "";
                      return (
                        <tr key={code || `${user?.email}-${user?.user}`}>
                          <td className="fw-semibold">
                            {code ? (
                              <Link href={`/partner/RmDetails?user_code=${code}`} className="text-decoration-underline" style={{ color: "#293790" }}>
                                {code}
                              </Link>
                            ) : "---------"}
                          </td>
                          <td>{user?.user || user?.name || user?.first_name || "---------"}</td>
                          <td>{user?.user_l_name || user?.last_name || "---------"}</td>
                          <td>{user?.email || "---------"}</td>
                          <td style={{ whiteSpace: "nowrap" }}>{user?.contact_number || user?.contact || user?.mobile || "---------"}</td>
                          <td>{user?.reportToUser?.user || user?.assign_to || user?.report_to_name || user?.assigned_to || "---------"}</td>
                          <td>{user?.group || group.name}</td>
                          <td>{project || "---------"}</td>
                          <td>
                            <span className={active ? "active status_btn" : "inactive status_btn"}>
                              {active ? "active" : "inactive"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
};

export default RmGroupReport;
