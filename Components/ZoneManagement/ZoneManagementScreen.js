import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Modal, Button, Form } from "react-bootstrap";
import { getCookie, hasCookie } from "cookies-next";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import ConfirmBox from "../Basics/ConfirmBox";
import ZoneManagementTable from "./ZoneManagementTable";
import {
  getZoneList,
  getZoneById,
  createZone,
  updateZone,
  removeZone,
} from "../../Utils/zoneMasterApi";

const EMPTY_FORM = {
  zone_id: "",
  zone_name: "",
  description: "",
  status: true,
};

const toForm = (zone = {}) => ({
  zone_id: zone.zone_id || "",
  zone_name: zone.zone_name || "",
  description: zone.description || "",
  status: zone.status !== false,
});

const ZoneManagementScreen = () => {
  const sideView = useSelector((state) => state.sideView.value);
  const [show, setShow] = useState(false);
  const [mode, setMode] = useState("create");
  const [loader, setLoader] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dataList, setDataList] = useState([]);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const authHeader = () => {
    const token = getCookie("token");
    const db_name = getCookie("db_name");
    return {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        db: db_name,
        pass: "pass",
      },
    };
  };

  const getZones = async () => {
    if (!hasCookie("token")) return;
    setLoader(true);
    try {
      const list = await getZoneList(authHeader());
      setDataList(list);
    } catch (error) {
      setDataList([]);
      toast.error(error?.response?.data?.message || "Failed to load zones", {
        autoClose: 2500,
      });
    } finally {
      setLoader(false);
    }
  };

  useEffect(() => {
    getZones();
  }, []);

  const modalTitle = useMemo(() => {
    if (mode === "edit") return "Edit Zone";
    if (mode === "view") return "View Zone";
    return "Create Zone";
  }, [mode]);

  const openCreateModal = () => {
    setMode("create");
    setFormData(EMPTY_FORM);
    setErrors({});
    setShow(true);
  };

  const openEditModal = async (row, viewOnly = false) => {
    setMode(viewOnly ? "view" : "edit");
    setFormData(toForm(row));
    setErrors({});
    setShow(true);
    if (!row?.zone_id) return;
    try {
      const zone = await getZoneById(row.zone_id, authHeader());
      setFormData(toForm(zone));
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load zone", {
        autoClose: 2500,
      });
    }
  };

  const handleClose = () => {
    setShow(false);
    setFormData(EMPTY_FORM);
    setErrors({});
    setMode("create");
  };

  const validate = () => {
    const next = {};
    const name = formData.zone_name?.trim();
    if (!name) {
      next.zone_name = "Zone Name is required";
    } else {
      const duplicate = dataList.some(
        (zone) =>
          String(zone.zone_id) !== String(formData.zone_id) &&
          String(zone.zone_name).toLowerCase() === name.toLowerCase()
      );
      if (duplicate) next.zone_name = "Zone name already exists";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (mode === "view") return;
    if (!validate()) return;
    if (!hasCookie("token")) return;

    setSaving(true);
    const isEdit = mode === "edit" && formData.zone_id;
    const zoneName = formData.zone_name.trim();
    const description = formData.description?.trim() ? formData.description.trim() : null;

    try {
      const response = isEdit
        ? await updateZone(
            {
              zone_id: Number(formData.zone_id),
              zone_name: zoneName,
              description,
              status: !!formData.status,
            },
            authHeader()
          )
        : await createZone(
            {
              zone_name: zoneName,
              ...(description ? { description } : {}),
            },
            authHeader()
          );

      if (response?.status === 200 || response?.status === 201) {
        toast.success(
          response?.data?.message ||
            (isEdit ? "Zone master updated" : "Zone master created successfully"),
          { autoClose: 2500 }
        );
        handleClose();
        getZones();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to save zone", {
        autoClose: 2500,
      });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (row) => {
    setDeleteTarget(row);
    setDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget?.zone_id || !hasCookie("token")) return;
    setDeleteConfirm(false);
    try {
      const response = await removeZone(deleteTarget.zone_id, authHeader());
      toast.success(response?.data?.message || "Zone master deleted", {
        autoClose: 2500,
      });
      getZones();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to delete zone", {
        autoClose: 2500,
      });
    } finally {
      setDeleteTarget(null);
    }
  };

  const isReadOnly = mode === "view";

  return (
    <div className={`main_Box ${sideView}`}>
      <div className="bread_head">
        <h3 className="content_head">ZONE MANAGEMENT</h3>
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              <Link href="/setting">Home</Link>
            </li>
            <li className="breadcrumb-item active" aria-current="page">
              Zone Management
            </li>
          </ol>
        </nav>
      </div>

      <div className="main_content">
        <div className="table_screen">
          <div className="top_btn_sec d-flex justify-content-end mb-3">
            <button
              className="btn btn-primary Add_btn"
              style={{ background: "#2563eb", borderColor: "#2563eb" }}
              onClick={openCreateModal}
            >
              CREATE ZONE
            </button>
          </div>

          <ZoneManagementTable
            dataList={dataList}
            loader={loader}
            onView={(row) => openEditModal(row, true)}
            onEdit={(row) => openEditModal(row, false)}
            onDelete={confirmDelete}
          />
        </div>
      </div>

      <Modal show={show} onHide={handleClose} centered>
        <Modal.Header closeButton>
          <Modal.Title>{modalTitle}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Zone Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter Zone Name"
              disabled={isReadOnly}
              value={formData.zone_name}
              onChange={(e) => setFormData({ ...formData, zone_name: e.target.value })}
            />
            {errors.zone_name && (
              <Form.Text className="text-danger">{errors.zone_name}</Form.Text>
            )}
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Enter Description"
              disabled={isReadOnly}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </Form.Group>
          {mode !== "create" && (
            <Form.Group>
              <Form.Label>Status</Form.Label>
              <Form.Select
                disabled={isReadOnly}
                value={formData.status ? "true" : "false"}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value === "true" })
                }
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </Form.Select>
            </Form.Group>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="outline-primary"
            onClick={handleClose}
            style={{ borderColor: "#2563eb", color: "#2563eb" }}
          >
            CLOSE
          </Button>
          {!isReadOnly && (
            <Button
              variant="primary"
              disabled={saving}
              onClick={handleSubmit}
              style={{ background: "#2563eb", borderColor: "#2563eb" }}
            >
              {saving ? "Saving..." : mode === "edit" ? "UPDATE" : "CREATE"}
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      <ConfirmBox
        showConfirm={deleteConfirm}
        setshowConfirm={setDeleteConfirm}
        actionType={handleDelete}
        title="Delete Zone?"
      />
    </div>
  );
};

export default ZoneManagementScreen;
