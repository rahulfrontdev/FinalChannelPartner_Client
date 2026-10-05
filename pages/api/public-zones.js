import axios from "axios";
import { Baseurl } from "../../Utils/Constants";
import { readPublicZones, savePublicZones } from "../../Utils/publicZoneStore";

const parseCookie = (header = "") => {
  const cookies = {};
  header.split(";").forEach((part) => {
    const [key, ...rest] = part.trim().split("=");
    if (!key) return;
    try {
      cookies[key] = decodeURIComponent(rest.join("="));
    } catch (error) {
      cookies[key] = rest.join("=");
    }
  });
  return cookies;
};

const fetchRemoteZones = async (token, db) => {
  const { data } = await axios.get(`${Baseurl}/db/channel/zone-master`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      db,
      pass: "pass",
    },
  });
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data)) return data;
  return [];
};

export default async function handler(req, res) {
  if (req.method === "GET") {
    const cookies = parseCookie(req.headers.cookie || "");
    const db = req.query?.db || cookies.db_name || req.headers.db || "";
    const token = cookies.token;
    if (token) {
      try {
        const zones = await fetchRemoteZones(token, db);
        return res.status(200).json({ data: savePublicZones(db, zones) });
      } catch (error) {
        // The public form has no login token. Use the last list saved by Zone Management.
      }
    }
    return res.status(200).json({ data: readPublicZones(db) });
  }

  if (req.method === "POST") {
    const dbName = req.body?.db_name || req.headers.db || "";
    const zones = Array.isArray(req.body?.zones) ? req.body.zones : [];
    const saved = savePublicZones(dbName, zones);
    return res.status(200).json({ data: saved });
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ message: "Method not allowed" });
}
