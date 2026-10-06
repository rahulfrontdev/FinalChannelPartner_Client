import axios from "axios";
import { Baseurl } from "./Constants";

const ZONE_MASTER_API = `${Baseurl}/db/channel/zone-master`;

export const normalizeZone = (item = {}) => ({
  zone_id: item?.zone_id ?? item?.id ?? "",
  zone_name: String(item?.zone_name || item?.zone || item?.name || "").trim(),
  description: item?.description ?? "",
  status: item?.status !== false && item?.status !== 0,
  created_by: item?.created_by ?? "",
  createdAt: item?.createdAt || "",
  updatedAt: item?.updatedAt || "",
});

const extractList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.records)) return payload.records;
  if (Array.isArray(payload?.zones)) return payload.zones;
  return [];
};

const publishZones = (zones, config) => {
  if (typeof window === "undefined") return;
  const active = zones.filter((zone) => zone.status !== false);
  try {
    localStorage.setItem("zone-master-list", JSON.stringify(active));
  } catch (error) {
    // ignore storage failures
  }
  const dbName = config?.headers?.db || "";
  axios
    .post("/api/public-zones/", { db_name: dbName, zones: active })
    .catch(() => {});
};

export async function getZoneList(config) {
  const { data } = await axios.get(ZONE_MASTER_API, config);
  const zones = extractList(data?.data ?? data)
    .map(normalizeZone)
    .filter((zone) => zone.zone_id !== "" && zone.zone_name);
  publishZones(zones, config);
  return zones;
}

export async function getZoneById(zoneId, config) {
  const { data } = await axios.get(`${ZONE_MASTER_API}?zone_id=${zoneId}`, config);
  const record = data?.data && !Array.isArray(data.data) ? data.data : data;
  return normalizeZone(record);
}

export async function createZone(payload, config) {
  return axios.post(ZONE_MASTER_API, payload, config);
}

export async function updateZone(payload, config) {
  return axios.put(ZONE_MASTER_API, payload, config);
}

export async function removeZone(zoneId, config) {
  return axios.delete(`${ZONE_MASTER_API}?zone_id=${zoneId}`, config);
}
