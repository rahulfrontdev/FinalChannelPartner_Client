import React, { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import { getCookie, hasCookie } from "cookies-next";
import { toast } from "react-toastify";
import { Baseurl } from "../../../../Utils/Constants";
import Loader from "../../../Loader/Loader";

const show = (value) => {
  if (value === null || value === undefined || value === "") return "---------";
  return value;
};

const RmDetailsScreen = () => {
  const router = useRouter();
  const { user_code } = router.query;
  const clientBtnColor = hasCookie("clientBtnColor") ? getCookie("clientBtnColor") : "#293790";
  const [rm, setRm] = useState(null);
  const [loader, setLoader] = useState(false);

  const getRm = async (code) => {
    if (!code || !hasCookie("token")) return;
    setLoader(true);
    const token = getCookie("token");
    const db_name = getCookie("db_name");
    try {
      const response = await axios.get(`${Baseurl}/db/channel/rm`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          db: db_name,
          pass: "pass",
        },
      });
      const payload = response?.data?.data;
      const rows = Array.isArray(payload) ? payload : Array.isArray(payload?.rows) ? payload.rows : [];
      const match = rows.find((item) => String(item?.user_code) === String(code));
      setRm(match || null);
      if (!match) toast.error("RM not found", { autoClose: 2500 });
    } catch (error) {
      setRm(null);
      toast.error(error?.response?.data?.message || "Failed to load RM details", { autoClose: 2500 });
    } finally {
      setLoader(false);
    }
  };

  useEffect(() => {
    if (!router.isReady) return;
    getRm(user_code);
  }, [router.isReady, user_code]);

  const projectName = Array.isArray(rm?.projects) && rm.projects.length
    ? rm.projects.map((item) => item?.project_name).filter(Boolean).join(", ")
    : rm?.project_name || "";

  const fields = rm
    ? [
        ["User Code", rm.user_code],
        ["Name", rm.user || rm.first_name],
        ["Last Name", rm.user_l_name || rm.last_name],
        ["Email", rm.email],
        ["Contact No", rm.contact_number || rm.contact],
        ["Operating Location", rm.operating_location],
        ["Zone", rm.zone_name || rm.zone],
        ["City", rm.city],
        ["State", rm.state],
        ["Registration Date", rm.registration_date || rm.date],
        ["Onboarding Date", rm.onboarding_date],
        ["Status", rm.status || (rm.user_status ? "ACTIVE" : "INACTIVE")],
        ["Designation", rm.designation],
        ["Group", rm.group],
        ["Project", projectName],
        ["Report/Assign To", rm.assign_to || rm.reportToUser?.user],
        ["CP Count", rm.cp_count],
      ].filter(([label, value]) => label === "Project" || (value !== null && value !== undefined && String(value).trim() !== ""))
    : [];

  return (
    <div className="w-100 bg-white overflow-auto">
      <section className="Channel-profile pt-2 pb-4">
        <div className="container mt-2 mb-5">
          <div className="profile-text mb-3">RM / RM Detail</div>
          {loader ? (
            <Loader />
          ) : (
            <div className="lead-detail-sec overflow-hidden bg-white border rounded">
              <div className="px-3 py-2 text-white fw-bold" style={{ background: clientBtnColor }}>
                {show(rm?.user_code)}
              </div>
              <div className="row g-0 p-3">
                {fields.map(([label, value]) => (
                  <div className="col-12 col-md-6 mb-3" key={label}>
                    <div className="row">
                      <div className="col-5">
                        <span className="fw-semibold" style={{ color: "#667799" }}>{label}</span>
                      </div>
                      <div className="col-7">
                        <span className="fw-bold" style={{ color: "#293790" }}>{show(value)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="details-btn d-flex justify-content-center gap-4 mt-4 mt-md-5">
            <button
              type="button"
              className="d-flex align-items-center justify-content-center text-white border-0"
              style={{
                background: clientBtnColor,
                width: "116px",
                height: "32px",
                padding: "6px 15px 6px 14px",
                borderRadius: "40px",
                fontSize: "14px",
                fontWeight: 600,
              }}
              onClick={() => router.push("/partner/Rm")}
            >
              Back
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default RmDetailsScreen;
