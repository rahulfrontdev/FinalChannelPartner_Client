import React from "react";
import Loader from "../Loader/Loader";

const ProjectManagementTable = ({
  dataList = [],
  loader,
  onView,
  onEdit,
  onDelete,
  onRmClick,
}) => {
  const formatRmLabel = (row) => {
    const names = Array.isArray(row?.rm_names)
      ? row.rm_names.filter(Boolean)
      : String(row?.rm_name || row?.assigned_rm_name || "")
          .split(",")
          .map((n) => n.trim())
          .filter(Boolean);
    if (!names.length) return "---------";
    if (names.length === 1) return names[0];
    return `${names[0]} +${names.length - 1} more`;
  };

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
              <th style={{ minWidth: 180 }}>Project Name</th>
              <th>Zone</th>
              <th>Country</th>
              <th>State</th>
              <th>City</th>
              <th style={{ minWidth: 160 }}>RM</th>
              <th style={{ minWidth: 220 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {dataList.length ? (
              dataList.map((row, index) => {
                const rmLabel = formatRmLabel(row);
                const hasRm = rmLabel !== "---------";
                return (
                  <tr key={row.project_id || row.id || index}>
                    <td className="fw-semibold">{row.project_name || "---------"}</td>
                    <td>{row.zone || "---------"}</td>
                    <td>{row.country || "India"}</td>
                    <td>{row.state_name || row.state || "---------"}</td>
                    <td>{row.city_name || row.city || "---------"}</td>
                    <td>
                      {hasRm ? (
                        <button
                          type="button"
                          className="btn btn-link p-0 text-decoration-none fw-semibold"
                          style={{ color: "#1d4ed8" }}
                          onClick={() => onRmClick?.(row)}
                        >
                          {rmLabel}
                        </button>
                      ) : (
                        "---------"
                      )}
                    </td>
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
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="text-center py-4">
                  No projects found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ProjectManagementTable;
