import React from "react";
import Loader from "../Loader/Loader";

const ZoneManagementTable = ({ dataList = [], loader, onView, onEdit, onDelete }) => {
  return (
    <div className="table-responsive bg-white rounded border">
      {loader ? (
        <div className="p-4">
          <Loader />
        </div>
      ) : (
        <table className="table align-middle mb-0">
          <thead style={{ background: "#f5f7fb" }}>
            <tr>
              <th style={{ minWidth: 180 }}>Zone Name</th>
              <th style={{ minWidth: 220 }}>Description</th>
              <th style={{ minWidth: 120 }}>Status</th>
              <th style={{ minWidth: 220 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {dataList.length ? (
              dataList.map((row, index) => (
                <tr key={row.zone_id || index}>
                  <td className="fw-semibold">{row.zone_name || "---------"}</td>
                  <td>{row.description || "---------"}</td>
                  <td>{row.status ? "Active" : "Inactive"}</td>
                  <td>
                    <div className="d-flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="btn btn-sm text-white"
                        style={{ background: "#2563eb", minWidth: 70 }}
                        onClick={() => onView(row)}
                      >
                        VIEW
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm"
                        style={{
                          border: "1px solid #2563eb",
                          color: "#2563eb",
                          background: "#fff",
                          minWidth: 70,
                        }}
                        onClick={() => onEdit(row)}
                      >
                        EDIT
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm"
                        style={{
                          border: "1px solid #dc2626",
                          color: "#dc2626",
                          background: "#fff",
                          minWidth: 70,
                        }}
                        onClick={() => onDelete(row)}
                      >
                        DELETE
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="text-center py-4">
                  No zones found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ZoneManagementTable;
