import fs from "fs";
import path from "path";

const dataFile = path.join(process.cwd(), "data", "public-zones.json");

const readStore = () => {
  try {
    return JSON.parse(fs.readFileSync(dataFile, "utf8"));
  } catch {
    return { latest: [], byDb: {} };
  }
};

const writeStore = (store) => {
  fs.mkdirSync(path.dirname(dataFile), { recursive: true });
  fs.writeFileSync(dataFile, JSON.stringify(store, null, 2));
};

export const activeZones = (zones = []) =>
  zones.filter(
    (zone) =>
      zone?.zone_name &&
      zone?.status !== false &&
      zone?.status !== 0 &&
      !zone?.deletedAt
  );

export const savePublicZones = (dbName, zones = []) => {
  const active = activeZones(zones).map((zone) => ({
    zone_id: zone.zone_id,
    zone_name: zone.zone_name,
    description: zone.description || "",
    status: true,
  }));
  const store = readStore();
  store.latest = active;
  if (dbName) {
    store.byDb = store.byDb || {};
    store.byDb[dbName] = active;
  }
  writeStore(store);
  return active;
};

export const readPublicZones = (dbName) => {
  const store = readStore();
  if (dbName && Array.isArray(store.byDb?.[dbName]) && store.byDb[dbName].length) {
    return store.byDb[dbName];
  }
  return Array.isArray(store.latest) ? store.latest : [];
};
