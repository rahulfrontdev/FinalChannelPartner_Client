import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";
import Select, { components } from "react-select";
import { getCookie, hasCookie } from "cookies-next";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { Baseurl, RM_ROLE_ID, isRmRole } from "../../Utils/Constants";
import ConfirmBox from "../Basics/ConfirmBox";
import ProjectManagementTable from "./ProjectManagementTable";

const PROJECT_MASTER_API = `${Baseurl}/db/channel/project-master`;
const ZONE_OPTIONS = ["North", "South", "East", "West"];
const EMPTY_FORM = {
  project_id: "",
  project_name: "",
  zone: "",
  country: "India",
  country_id: 101,
  state_id: "",
  state_name: "",
  city_id: "",
  city_name: "",
  rm_ids: [],
};

const RmCheckboxOption = (props) => {
  const { isFocused, isSelected, children, innerProps, getStyles, isDisabled, ...rest } =
    props;
  let bg = "transparent";
  if (isFocused) bg = "#eee";
  if (isSelected) bg = "#B2D4FF";

  return (
    <components.Option
      {...rest}
      isDisabled={isDisabled}
      isFocused={isFocused}
      isSelected={isSelected}
      getStyles={getStyles}
      innerProps={{
        ...innerProps,
        style: {
          alignItems: "center",
          backgroundColor: bg,
          color: "inherit",
          display: "flex",
          gap: 8,
        },
      }}
    >
      <input type="checkbox" checked={isSelected} readOnly style={{ marginRight: 8 }} />
      {children}
    </components.Option>
  );
};

const extractList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.records)) return payload.records;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.projects)) return payload.projects;
  if (Array.isArray(payload?.states)) return payload.states;
  if (Array.isArray(payload?.cities)) return payload.cities;
  if (Array.isArray(payload?.cityData)) return payload.cityData;
  return [];
};

const ProjectManagementScreen = () => {
  const sideView = useSelector((state) => state.sideView.value);
  const [show, setShow] = useState(false);
  const [mode, setMode] = useState("create"); // create | edit | view
  const [loader, setLoader] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dataList, setDataList] = useState([]);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [stateList, setStateList] = useState([]);
  const [cityList, setCityList] = useState([]);
  const [rmList, setRmList] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [rmDetailsShow, setRmDetailsShow] = useState(false);
  const [rmDetailsRows, setRmDetailsRows] = useState([]);

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

  const normalizeProject = (item = {}) => {
    const rmUsers = Array.isArray(item?.bst_users)
      ? item.bst_users
      : Array.isArray(item?.rm_users)
        ? item.rm_users
        : [];
    const rmIds = Array.isArray(item?.rm_ids)
      ? item.rm_ids.map(String)
      : Array.isArray(item?.bst_ids)
        ? item.bst_ids.map(String)
        : item?.rm_id
          ? [String(item.rm_id)]
          : item?.assigned_rm
            ? [String(item.assigned_rm)]
            : rmUsers
                .map((u) => u?.user_id || u?.id)
                .filter(Boolean)
                .map(String);
    const rmNames = Array.isArray(item?.rm_names)
      ? item.rm_names
      : item?.rm_name
        ? String(item.rm_name).split(",").map((n) => n.trim()).filter(Boolean)
        : item?.assigned_rm_name
          ? [item.assigned_rm_name]
          : Array.isArray(item?.bst_names)
            ? item.bst_names
            : item?.bst_name
              ? String(item.bst_name).split(",").map((n) => n.trim()).filter(Boolean)
              : rmUsers
                  .map((u) => u?.user || u?.name || u?.email)
                  .filter(Boolean);

    const stateObj = item?.projectState || item?.state || null;
    const cityObj = item?.projectCity || item?.city || null;

    return {
      project_id: item?.project_id || item?.id || item?.p_id || item?.pm_id || "",
      project_name: item?.project_name || item?.project || item?.name || "",
      zone: item?.zone || item?.zone_name || "",
      country:
        item?.country ||
        item?.country_name ||
        (stateObj?.country_id === 101 ? "India" : "") ||
        "India",
      country_id: item?.country_id || stateObj?.country_id || 101,
      state_id: item?.state_id || stateObj?.state_id || "",
      state_name:
        item?.state_name ||
        (typeof item?.state === "string" ? item.state : "") ||
        stateObj?.state_name ||
        "",
      city_id: item?.city_id || cityObj?.city_id || "",
      city_name:
        item?.city_name ||
        (typeof item?.city === "string" ? item.city : "") ||
        cityObj?.city_name ||
        "",
      rm_ids: rmIds,
      rm_names: rmNames,
      rm_name: rmNames.join(", "),
      rm_users: rmUsers,
    };
  };

  const normalizeState = (item = {}) => ({
    state_id: item?.state_id || item?.id || "",
    state_name: item?.state_name || item?.name || item?.state || "",
  });

  const normalizeCity = (item = {}) => ({
    city_id: item?.city_id || item?.id || "",
    city_name: item?.city_name || item?.name || item?.city || "",
  });

  const getProjects = async () => {
    if (!hasCookie("token")) return;
    setLoader(true);
    try {
      const { data } = await axios.get(PROJECT_MASTER_API, authHeader());
      const list = extractList(data?.data ?? data).map(normalizeProject);
      setDataList(list);
    } catch (error) {
      setDataList([]);
      toast.error(
        error?.response?.data?.message || "Failed to load projects",
        { autoClose: 2500 }
      );
    } finally {
      setLoader(false);
    }
  };

  const getStates = async () => {
    if (!hasCookie("token")) return;
    try {
      // Use State Master (India) — same as Settings > State Management
      const { data } = await axios.get(
        `${Baseurl}/db/admin/state/available?country_id=101`,
        authHeader()
      );
      let list = extractList(data?.data ?? data).map(normalizeState);

      // Fallback to full State Master list if available endpoint is empty
      if (!list.length) {
        const res = await axios.get(
          `${Baseurl}/db/admin/state/list?country_id=101`,
          authHeader()
        );
        list = extractList(res?.data?.data ?? res?.data)
          .filter(
            (item) =>
              item?.is_enabled === true ||
              item?.is_enabled === 1 ||
              item?.is_available === true ||
              item?.is_available === 1 ||
              item?.status === true ||
              item?.active === true ||
              (item?.is_enabled == null && item?.is_available == null)
          )
          .map(normalizeState);
      }

      setStateList(list.filter((s) => s.state_id && s.state_name));
    } catch (error) {
      setStateList([]);
      toast.error(
        error?.response?.data?.message || "Failed to load states",
        { autoClose: 2500 }
      );
    }
  };

  const getCities = async (stateId) => {
    if (!stateId || !hasCookie("token")) {
      setCityList([]);
      return;
    }
    try {
      // City Master — only active/enabled cities (same as registration forms)
      let cities = [];
      try {
        const { data } = await axios.get(
          `${Baseurl}/db/area/city/active?state_id=${stateId}`,
          authHeader()
        );
        cities = extractList(data?.data ?? data);
      } catch (activeErr) {
        // Fallback to full City Master list, then keep enabled ones
        const { data } = await axios.get(
          `${Baseurl}/db/area/city?state_id=${stateId}`,
          authHeader()
        );
        cities = extractList(data?.data ?? data).filter(
          (item) =>
            item?.is_enabled === true ||
            item?.is_enabled === 1 ||
            item?.is_available === true ||
            item?.is_available === 1 ||
            item?.is_active === true ||
            item?.is_active === 1 ||
            (item?.is_enabled == null &&
              item?.is_available == null &&
              item?.is_active == null)
        );
      }

      setCityList(
        cities
          .map(normalizeCity)
          .filter((c) => c.city_id && c.city_name)
      );
    } catch (error) {
      setCityList([]);
      toast.error(
        error?.response?.data?.message || "Failed to load cities from City Master",
        { autoClose: 2500 }
      );
    }
  };

  const getRmUsers = async () => {
    if (!hasCookie("token")) return;
    try {
      const { data } = await axios.get(`${Baseurl}/db/users`, authHeader());
      const users = Array.isArray(data?.data) ? data.data : [];
      const rms = users.filter(
        (u) => isRmRole(u?.role_id) || Number(u?.role_id) === Number(RM_ROLE_ID)
      );
      setRmList(rms.length ? rms : users);
    } catch (error) {
      setRmList([]);
    }
  };

  useEffect(() => {
    getProjects();
    getStates();
    getRmUsers();
  }, []);

  useEffect(() => {
    if (formData.state_id) getCities(formData.state_id);
  }, [formData.state_id]);

  // Fill RM names from rmList when API returns only ids
  useEffect(() => {
    if (!rmList.length || !dataList.length) return;
    setDataList((prev) =>
      prev.map((row) => {
        const resolved = resolveRmDetails(row);
        const names = resolved.map((r) => r.name).filter(Boolean);
        if (!names.length) return row;
        return {
          ...row,
          rm_names: names,
          rm_name: names.join(", "),
          rm_ids:
            row.rm_ids?.length > 0
              ? row.rm_ids
              : resolved.map((r) => String(r.user_id)).filter(Boolean),
        };
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rmList]);

  const resolveRmDetails = (project = {}) => {
    const fallbackZone = project.zone || "-";
    const fallbackState = project.state_name || project.state || "-";
    const fallbackCity = project.city_name || project.city || "-";

    const fromUsers = Array.isArray(project.rm_users) ? project.rm_users : [];
    if (fromUsers.length) {
      return fromUsers.map((u) => ({
        user_id: u?.user_id || u?.id || "-",
        name: u?.user || u?.name || u?.email || "-",
        zone: u?.zone || u?.zone_name || fallbackZone || "-",
        state:
          u?.state_name ||
          u?.state ||
          (typeof u?.userState === "object" ? u?.userState?.state_name : "") ||
          fallbackState ||
          "-",
        city:
          u?.city_name ||
          u?.city ||
          (typeof u?.userCity === "object" ? u?.userCity?.city_name : "") ||
          fallbackCity ||
          "-",
      }));
    }

    const ids = Array.isArray(project.rm_ids) ? project.rm_ids.map(String) : [];
    if (!ids.length) return [];

    return ids.map((id) => {
      const u = rmList.find((user) => String(user.user_id) === String(id));
      return {
        user_id: id,
        name: u?.user || u?.name || u?.email || `User ${id}`,
        zone: u?.zone || u?.zone_name || fallbackZone || "-",
        state:
          u?.state_name ||
          u?.state ||
          (typeof u?.userState === "object" ? u?.userState?.state_name : "") ||
          fallbackState ||
          "-",
        city:
          u?.city_name ||
          u?.city ||
          (typeof u?.userCity === "object" ? u?.userCity?.city_name : "") ||
          fallbackCity ||
          "-",
      };
    });
  };

  const modalTitle = useMemo(() => {
    if (mode === "edit") return "Edit Project";
    if (mode === "view") return "View Project";
    return "Create Project";
  }, [mode]);

  const openCreateModal = () => {
    setMode("create");
    setFormData(EMPTY_FORM);
    setErrors({});
    setCityList([]);
    setShow(true);
  };

  const openEditModal = (row, viewOnly = false) => {
    setMode(viewOnly ? "view" : "edit");
    setFormData({
      ...EMPTY_FORM,
      ...row,
      country: row.country || "India",
      country_id: row.country_id || 101,
      rm_ids: Array.isArray(row.rm_ids) ? row.rm_ids.map(String) : [],
      rm_users: Array.isArray(row.rm_users) ? row.rm_users : [],
    });
    setErrors({});
    setShow(true);
  };

  const openRmDetails = (row) => {
    setRmDetailsRows(resolveRmDetails(row));
    setRmDetailsShow(true);
  };

  const handleClose = () => {
    setShow(false);
    setFormData(EMPTY_FORM);
    setErrors({});
    setMode("create");
  };

  const validate = () => {
    const next = {};
    if (!formData.project_name?.trim()) next.project_name = "Project Name is required";
    if (!formData.zone) next.zone = "Zone is required";
    if (!formData.country?.trim()) next.country = "Country is required";
    if (!formData.state_id) next.state_id = "State is required";
    if (!formData.city_id) next.city_id = "City is required";
    if (!formData.rm_ids?.length) next.rm_ids = "RM is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const selectedStateName =
    stateList.find((s) => String(s.state_id) === String(formData.state_id))?.state_name ||
    formData.state_name ||
    "";
  const selectedCityName =
    cityList.find((c) => String(c.city_id) === String(formData.city_id))?.city_name ||
    formData.city_name ||
    "";
  const rmOptions = rmList.map((user) => ({
    value: String(user.user_id),
    label: user.user || user.name || user.email || `User ${user.user_id}`,
  }));
  const selectedRmOptions = rmOptions.filter((opt) =>
    formData.rm_ids.map(String).includes(String(opt.value))
  );
  const selectedRmNames = selectedRmOptions.map((opt) => opt.label).filter(Boolean);

  const buildPayload = () => ({
    project_id: formData.project_id || undefined,
    project: formData.project_name.trim(),
    project_name: formData.project_name.trim(),
    zone: formData.zone,
    country: formData.country || "India",
    country_id: formData.country_id || 101,
    state_id: formData.state_id,
    state_name: selectedStateName,
    city_id: formData.city_id,
    city_name: selectedCityName,
    rm_ids: formData.rm_ids.map((id) => Number(id) || id),
    bst_ids: formData.rm_ids.map((id) => Number(id) || id),
    rm_names: selectedRmNames,
    db_name: getCookie("db_name"),
  });

  const handleSubmit = async () => {
    if (mode === "view") return;
    if (!validate()) return;
    if (!hasCookie("token")) return;

    setSaving(true);
    const payload = buildPayload();
    try {
      const isEdit = mode === "edit" && payload.project_id;
      const response = isEdit
        ? await axios.put(PROJECT_MASTER_API, payload, authHeader())
        : await axios.post(PROJECT_MASTER_API, payload, authHeader());

      if (response?.status === 200 || response?.status === 201) {
        toast.success(
          response?.data?.message ||
            (isEdit ? "Project updated successfully" : "Project created successfully"),
          { autoClose: 2500 }
        );
        handleClose();
        getProjects();
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to save project",
        { autoClose: 2500 }
      );
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (row) => {
    setDeleteTarget(row);
    setDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget?.project_id || !hasCookie("token")) return;
    setDeleteConfirm(false);
    try {
      const response = await axios.delete(
        `${PROJECT_MASTER_API}?project_id=${deleteTarget.project_id}`,
        authHeader()
      );
      toast.success(response?.data?.message || "Project deleted successfully", {
        autoClose: 2500,
      });
      getProjects();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to delete project",
        { autoClose: 2500 }
      );
    } finally {
      setDeleteTarget(null);
    }
  };

  const isReadOnly = mode === "view";
  const viewRmDetailsRows = mode === "view" ? resolveRmDetails(formData) : [];

  return (
    <div className={`main_Box ${sideView}`}>
      <div className="bread_head">
        <h3 className="content_head">PROJECT MANAGEMENT</h3>
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              <Link href="/setting">Home</Link>
            </li>
            <li className="breadcrumb-item active" aria-current="page">
              Project Management
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
              CREATE PROJECT
            </button>
          </div>

          <ProjectManagementTable
            dataList={dataList}
            loader={loader}
            onView={(row) => openEditModal(row, true)}
            onEdit={(row) => openEditModal(row, false)}
            onDelete={confirmDelete}
            onRmClick={openRmDetails}
          />
        </div>
      </div>

      <Modal show={show} onHide={handleClose} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>{modalTitle}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="g-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Project Name</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Project Name"
                  disabled={isReadOnly}
                  value={formData.project_name}
                  onChange={(e) =>
                    setFormData({ ...formData, project_name: e.target.value })
                  }
                />
                {errors.project_name && (
                  <Form.Text className="text-danger">{errors.project_name}</Form.Text>
                )}
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Zone</Form.Label>
                <Form.Select
                  disabled={isReadOnly}
                  value={formData.zone}
                  onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                >
                  <option value="">Select Zone</option>
                  {ZONE_OPTIONS.map((zone) => (
                    <option key={zone} value={zone}>
                      {zone}
                    </option>
                  ))}
                </Form.Select>
                {errors.zone && (
                  <Form.Text className="text-danger">{errors.zone}</Form.Text>
                )}
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Country</Form.Label>
                <Form.Control
                  type="text"
                  disabled={isReadOnly}
                  value={formData.country || "India"}
                  onChange={(e) =>
                    setFormData({ ...formData, country: e.target.value })
                  }
                />
                {errors.country && (
                  <Form.Text className="text-danger">{errors.country}</Form.Text>
                )}
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>State</Form.Label>
                <Form.Select
                  disabled={isReadOnly}
                  value={formData.state_id}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      state_id: e.target.value,
                      city_id: "",
                      city_name: "",
                    })
                  }
                >
                  <option value="">Select State</option>
                  {stateList.map((state) => (
                    <option key={state.state_id} value={state.state_id}>
                      {state.state_name}
                    </option>
                  ))}
                </Form.Select>
                {errors.state_id && (
                  <Form.Text className="text-danger">{errors.state_id}</Form.Text>
                )}
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>City</Form.Label>
                <Form.Select
                  disabled={isReadOnly || !formData.state_id}
                  value={formData.city_id}
                  onChange={(e) =>
                    setFormData({ ...formData, city_id: e.target.value })
                  }
                >
                  <option value="">Select City</option>
                  {cityList.map((city) => (
                    <option key={city.city_id} value={city.city_id}>
                      {city.city_name}
                    </option>
                  ))}
                </Form.Select>
                {errors.city_id && (
                  <Form.Text className="text-danger">{errors.city_id}</Form.Text>
                )}
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>RM</Form.Label>
                <Select
                  isMulti
                  isDisabled={isReadOnly}
                  closeMenuOnSelect={false}
                  hideSelectedOptions={false}
                  placeholder="Select RM"
                  options={rmOptions}
                  value={selectedRmOptions}
                  onChange={(options) => {
                    const values = Array.isArray(options)
                      ? options.map((opt) => String(opt.value))
                      : [];
                    setFormData({ ...formData, rm_ids: values });
                  }}
                  components={{ Option: RmCheckboxOption }}
                  menuPortalTarget={
                    typeof document !== "undefined" ? document.body : null
                  }
                  styles={{
                    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                    control: (base) => ({
                      ...base,
                      minHeight: 38,
                      borderColor: "#ced4da",
                    }),
                    option: (base) => ({
                      ...base,
                      paddingTop: 8,
                      paddingBottom: 8,
                    }),
                  }}
                />
                {errors.rm_ids && (
                  <div>
                    <Form.Text className="text-danger">{errors.rm_ids}</Form.Text>
                  </div>
                )}
              </Form.Group>
            </Col>
          </Row>

          {isReadOnly && (
            <div className="mt-4">
              <h6 className="fw-semibold mb-2">RM Details</h6>
              <div className="table-responsive border rounded">
                <table className="table align-middle mb-0">
                  <thead style={{ background: "#f5f7fb" }}>
                    <tr>
                      <th>User ID</th>
                      <th>Name</th>
                      <th>Zone</th>
                      <th>State</th>
                      <th>city</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewRmDetailsRows.length ? (
                      viewRmDetailsRows.map((rm, idx) => (
                        <tr key={rm.user_id || idx}>
                          <td>{rm.user_id}</td>
                          <td>{rm.name}</td>
                          <td>{rm.zone || "-"}</td>
                          <td>{rm.state || "-"}</td>
                          <td>{rm.city || "-"}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="text-center py-3">
                          No RM details found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
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

      <Modal
        show={rmDetailsShow}
        onHide={() => setRmDetailsShow(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>RM Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead style={{ background: "#f5f7fb" }}>
                <tr>
                  <th>User ID</th>
                  <th>Name</th>
                  <th>Zone</th>
                  <th>State</th>
                  <th>city</th>
                </tr>
              </thead>
              <tbody>
                {rmDetailsRows.length ? (
                  rmDetailsRows.map((rm, idx) => (
                    <tr key={rm.user_id || idx}>
                      <td>{rm.user_id}</td>
                      <td>{rm.name}</td>
                      <td>{rm.zone || "-"}</td>
                      <td>{rm.state || "-"}</td>
                      <td>{rm.city || "-"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-3">
                      No RM details found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Modal.Body>
      </Modal>

      <ConfirmBox
        showConfirm={deleteConfirm}
        setshowConfirm={setDeleteConfirm}
        actionType={handleDelete}
        title="Delete Project?"
      />
    </div>
  );
};

export default ProjectManagementScreen;
