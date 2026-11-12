const fs = require("fs");
const path = require("path");
const axios = require("axios");

const loadServerEnv = () => {
  const envPath = path.resolve(
    process.cwd(),
    "../FinalChannelPartner_Server/FinalChannelPartner_Server/.env"
  );
  if (!fs.existsSync(envPath)) return;
  const text = fs.readFileSync(envPath, "utf8");
  text.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const idx = trimmed.indexOf("=");
    if (idx < 1) return;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (key && process.env[key] === undefined) process.env[key] = value;
  });
};

loadServerEnv();

const APP_API = process.env.NEXT_PUBLIC_API_BASE || "https://admin.theprosperity.in/api/v1";
const SF_TOKEN_URL = "https://nk-realtors.my.salesforce.com/services/oauth2/token";
const SF_BROKERAGE_BILL_URL =
  "https://nk-realtors.my.salesforce.com/services/data/v61.0/sobjects/Brokerage_Bill__c/";

const toDateOnly = (value) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value).slice(0, 10);
  return d.toISOString().slice(0, 10);
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ status: 405, message: "Method not allowed", data: null });
  }

  try {
    const brokerage_id = req.body?.brokerage_id;
    if (!brokerage_id) {
      return res.status(400).json({ status: 400, message: "brokerage_id is required", data: null });
    }

    const auth = req.headers.authorization;
    const db = req.headers.db;
    if (!auth) {
      return res.status(401).json({ status: 401, message: "No token Found", data: null });
    }

    const { data: brokerageRes } = await axios.get(
      `${APP_API}/db/channel/brokerage?brokerage_id=${brokerage_id}`,
      {
        headers: {
          Accept: "application/json",
          Authorization: auth,
          db,
          pass: "pass",
        },
      }
    );

    const brokerage = brokerageRes?.data;
    if (!brokerage) {
      return res.status(400).json({ status: 400, message: "Brokerage bill not found", data: null });
    }

    const booking = brokerage.BrokerageBookingtData || {};
    const project = booking.BookingprojectData || {};

    const tokenUrl = process.env.CLIENT_TOKEN_URL || SF_TOKEN_URL;
    const params = new URLSearchParams({
      grant_type: process.env.GRANTTYPE || "client_credentials",
      client_id:
        process.env.SALESFORCE_CLIENT_ID ||
        "3MVG9wt4IL4O5wvKA.DD4UEDV7FvsLg3qyqQ79PXw5xuClCPlZdbjRmsIP1fss4kc3sR65_v88yhzAfGClZWH",
      client_secret:
        process.env.SALESFORCE_CLIENT_PWD ||
        "AA9F650231890DF297256CF2A93DDFD8162C27A8596E216500583EB39E5F7BFA",
    });

    const { data: tokenData } = await axios.post(tokenUrl, params.toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    if (!tokenData?.access_token) {
      return res.status(400).json({
        status: 400,
        message: "Salesforce authentication failed",
        data: tokenData || null,
      });
    }

    const apiBase = SF_BROKERAGE_BILL_URL;

    const amount = Number(brokerage.amount || 0);
    const payload = {
      Bill_Date__c: toDateOnly(brokerage.date),
      Billing_Name__c: booking.booking_name || null,
      Brokerage_Recieved_Amount__c: amount,
      Project_Address__c: booking.Location || project.location || null,
      RERA_Number__c: project.rera_number || null,
      Is_CP_Brokerage_Bill__c: true,
      Booking__c: booking.sales_booking_id || process.env.SF_BROKERAGE_BOOKING_ID || null,
    };

    if (process.env.SF_BROKERAGE_COMPANY_ID) payload.Company__c = process.env.SF_BROKERAGE_COMPANY_ID;
    if (process.env.SF_BROKERAGE_USER_ID) {
      payload.User__c = process.env.SF_BROKERAGE_USER_ID;
      payload.OwnerId = process.env.SF_BROKERAGE_USER_ID;
    }
    if (process.env.SF_BROKERAGE_PROJECT_ID) payload.Project__c = process.env.SF_BROKERAGE_PROJECT_ID;
    if (process.env.SF_BROKERAGE_BOOKING_ID) payload.Booking__c = process.env.SF_BROKERAGE_BOOKING_ID;

    Object.keys(payload).forEach((key) => {
      if (payload[key] === null || payload[key] === undefined || payload[key] === "") {
        delete payload[key];
      }
    });

    const sfRes = await axios.post(apiBase, payload, {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        "Content-Type": "application/json",
      },
    });

    const salesforceBillId = String(sfRes?.data?.id || "").trim();
    if (!salesforceBillId) {
      return res.status(400).json({
        status: 400,
        message: "Salesforce did not return a bill id",
        data: sfRes.data || null,
      });
    }

    try {
      const formData = new FormData();
      formData.append("brokerage_id", brokerage_id);
      formData.append("salesforce_bill_id", salesforceBillId);
      if (brokerage.amount != null) formData.append("amount", brokerage.amount);
      if (brokerage.date) formData.append("date", brokerage.date);
      if (brokerage.status) formData.append("status", brokerage.status);
      if (booking.booking_id) formData.append("booking_id", booking.booking_id);
      if (brokerage.reject_remark != null) formData.append("reject_remark", brokerage.reject_remark);
      await axios.put(`${APP_API}/db/channel/brokerage`, formData, {
        headers: {
          Accept: "application/json",
          Authorization: auth,
          db,
          pass: "pass",
        },
      });
    } catch (_persistErr) {
      return res.status(200).json({
        status: 200,
        message: "Brokerage bill submitted to Salesforce",
        data: { id: salesforceBillId },
      });
    }

    return res.status(200).json({
      status: 200,
      message: "Brokerage bill submitted to Salesforce",
      data: sfRes.data,
    });
  } catch (error) {
    const sfData = error?.response?.data;
    const sfMessage = Array.isArray(sfData)
      ? sfData.map((e) => e.message).filter(Boolean).join(", ")
      : sfData?.[0]?.message || sfData?.error_description || sfData?.message || error.message;
    return res.status(400).json({
      status: 400,
      message: sfMessage || "Salesforce submit failed",
      data: sfData || null,
    });
  }
}
