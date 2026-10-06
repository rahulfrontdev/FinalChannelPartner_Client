import fs from "fs";
import path from "path";

const dataFile = path.join(process.cwd(), "data", "zone-master.json");

const readStore = () => {
  try {
    return JSON.parse(fs.readFileSync(dataFile, "utf8"));
  } catch {
    return {};
  }
};

const writeStore = (store) => {
  fs.mkdirSync(path.dirname(dataFile), { recursive: true });
  fs.writeFileSync(dataFile, JSON.stringify(store, null, 2));
};

const dbKey = (req) => String(req.headers.db || "default");

export default function handler(req, res) {
  if (!req.headers.authorization && !req.headers.db) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const db = dbKey(req);
  const store = readStore();
  const list = Array.isArray(store[db]) ? store[db] : [];

  if (req.method === "GET") {
    return res.status(200).json({ data: list });
  }

  if (req.method === "POST") {
    const zoneName = String(req.body?.zone_name || req.body?.zone || "").trim();
    if (!zoneName) {
      return res.status(400).json({ message: "Zone is required" });
    }
    const exists = list.some(
      (zone) => String(zone.zone_name).toLowerCase() === zoneName.toLowerCase()
    );
    if (exists) {
      return res.status(400).json({ message: "Zone already exists" });
    }
    const row = {
      zone_id: Date.now(),
      zone_name: zoneName,
      zone: zoneName,
    };
    store[db] = [...list, row];
    writeStore(store);
    return res.status(200).json({ message: "Zone created successfully", data: row });
  }

  if (req.method === "PUT") {
    const zoneId = req.body?.zone_id;
    const zoneName = String(req.body?.zone_name || req.body?.zone || "").trim();
    if (!zoneId) {
      return res.status(400).json({ message: "Zone id is required" });
    }
    if (!zoneName) {
      return res.status(400).json({ message: "Zone is required" });
    }
    const duplicate = list.some(
      (zone) =>
        String(zone.zone_id) !== String(zoneId) &&
        String(zone.zone_name).toLowerCase() === zoneName.toLowerCase()
    );
    if (duplicate) {
      return res.status(400).json({ message: "Zone already exists" });
    }
    const index = list.findIndex((zone) => String(zone.zone_id) === String(zoneId));
    if (index === -1) {
      return res.status(404).json({ message: "Zone not found" });
    }
    const row = { ...list[index], zone_id: list[index].zone_id, zone_name: zoneName, zone: zoneName };
    const next = [...list];
    next[index] = row;
    store[db] = next;
    writeStore(store);
    return res.status(200).json({ message: "Zone updated successfully", data: row });
  }

  if (req.method === "DELETE") {
    const zoneId = req.query?.zone_id;
    if (!zoneId) {
      return res.status(400).json({ message: "Zone id is required" });
    }
    const next = list.filter((zone) => String(zone.zone_id) !== String(zoneId));
    if (next.length === list.length) {
      return res.status(404).json({ message: "Zone not found" });
    }
    store[db] = next;
    writeStore(store);
    return res.status(200).json({ message: "Zone deleted successfully" });
  }

  res.setHeader("Allow", "GET, POST, PUT, DELETE");
  return res.status(405).json({ message: "Method not allowed" });
}
