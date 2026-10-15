import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import PlusIcon from "../../../Svg/PlusIcon";

import { Baseurl, filesUrl } from "../../../../Utils/Constants";
import { getCookie, hasCookie } from "cookies-next";
import { toast, useToast } from "react-toastify";
import { Modal } from "react-bootstrap";
import { Delete } from "@mui/icons-material";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { startButtonLoading, stopButtonLoading } from "../../../../store/buttonLoaderSlice";
import Loader from "../../../Loader/Loader";
import ConfirmBox from "../../../Basics/ConfirmBox";

const MAX_KIT_FILE_BYTES = 500 * 1024 * 1024;

const CampaignAdminScreen = () => {
  const [showModal, setShowModal] = useState(false);
  const clientBtnColor = hasCookie("clientBtnColor")
    ? getCookie("clientBtnColor")
    : "#293790";
  const [projectData, setProjectData] = useState({
    project: "",
    project_id: null,
    location: "",
    property_size: "",
    unit_area: "",
    price: "",
    contact_no: "",
    file: null,
    file_preview: "",
    logo: null,
    logo_preview: null,
    template: null,
    template_name: null
  });
  const [editMode, setEditMode] = useState(false)
  const [projects, setProjects] = useState([]);
  const userInfo = hasCookie("userInfo") ? JSON.parse(getCookie("userInfo")) : null;
  const dispatch = useDispatch()
  const { isButtonLoading } = useSelector((state) => state.buttonLoader)
  const [loader, setLoader] = useState(false)
  const [activeTab, setActiveTab] = useState("digitalKit");
  const [filesProjectId, setFilesProjectId] = useState("");
  const [selectedProjectFiles, setSelectedProjectFiles] = useState([]);
  const [digitalKits, setDigitalKits] = useState([]);
  const [kitContactDetail, setKitContactDetail] = useState("");
  const [kitReraNumber, setKitReraNumber] = useState("");
  const [kitLogoFile, setKitLogoFile] = useState(null);
  const [kitLogoPreview, setKitLogoPreview] = useState("");
  const [kitEditMode, setKitEditMode] = useState(false);
  const projectFilesInputRef = useRef(null);
  const kitLogoInputRef = useRef(null);
  const kitFormRef = useRef(null);

  const PROJECT_FILE_ACCEPT =
    ".mp4,.webm,.mov,.ppt,.pptx,.pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx";

  const getProjectFileKind = (file) => {
    const name = (file?.name || "").toLowerCase();
    const type = file?.type || "";
    if (type.startsWith("video/") || /\.(mp4|webm|mov)$/.test(name)) return "video";
    if (/\.(ppt|pptx)$/.test(name)) return "ppt";
    if (/\.pdf$/.test(name)) return "pdf";
    if (type.startsWith("image/") || /\.(jpg|jpeg|png|gif)$/.test(name)) return "image";
    return "file";
  };

  const formatFileSize = (bytes) => {
    if (!bytes && bytes !== 0) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isPdfKit = (item) =>
    item?.kind === "pdf" || String(item?.file_name || "").toLowerCase().endsWith(".pdf");

  const readBlobError = async (error, fallback) => {
    const data = error?.response?.data;
    if (data instanceof Blob) {
      try {
        const parsed = JSON.parse(await data.text());
        if (parsed?.message) return parsed.message;
      } catch (_parseError) {
        return fallback;
      }
    }
    return error?.response?.data?.message || fallback;
  };

  const fetchStampedPdf = async (item, forView) => {
    if (!hasCookie("token")) return null;
    const token = getCookie("token");
    const db_name = getCookie("db_name");
    const response = await axios.get(
      `${Baseurl}/db/channel/digital-kit/${item.kit_id}/download${forView ? "?view=1" : ""}`,
      {
        headers: {
          Authorization: "Bearer ".concat(token),
          db: db_name,
          m_id: 76,
        },
        responseType: "blob",
      }
    );
    return new Blob([response.data], { type: "application/pdf" });
  };

  const showPdfPreview = (preview, blob, fileName) => {
    const url = URL.createObjectURL(blob);
    const title = String(fileName || "PDF").replace(/[<>&"]/g, "");
    preview.document.open();
    preview.document.write(
      `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title><style>html,body{margin:0;height:100%;background:#525659}iframe{border:0;width:100%;height:100%}</style></head><body><iframe src="${url}" title="${title}"></iframe></body></html>`
    );
    preview.document.close();
  };

  const openKitFile = async (item) => {
    if (isPdfKit(item)) {
      const preview = window.open("", "_blank");
      if (!preview) {
        toast.error("Allow pop-ups to view the PDF", { autoClose: 2500 });
        return;
      }
      preview.document.write("<p style=\"font-family:sans-serif;padding:24px\">Opening PDF...</p>");
      try {
        const blob = await fetchStampedPdf(item, true);
        if (!blob) {
          preview.close();
          return;
        }
        showPdfPreview(preview, blob, item.file_name);
      } catch (error) {
        preview.close();
        toast.error(await readBlobError(error, "Could not open the file"), { autoClose: 2500 });
      }
      return;
    }
    if (!item.play_url) {
      toast.error("File link is not available", { autoClose: 2000 });
      return;
    }
    window.open(item.play_url, "_blank", "noopener,noreferrer");
  };

  const downloadKitFile = async (item) => {
    if (!isPdfKit(item)) {
      if (!item.download_url) {
        toast.error("Download link is not available", { autoClose: 2000 });
        return;
      }
      const link = document.createElement("a");
      link.href = item.download_url;
      link.download = item.file_name || "download";
      document.body.appendChild(link);
      link.click();
      link.remove();
      return;
    }
    try {
      const blob = await fetchStampedPdf(item);
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = item.file_name || "download.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      toast.error(await readBlobError(error, "Could not download the file"), { autoClose: 2500 });
    }
  };

  const resetProjectFilesModal = () => {
    selectedProjectFiles.forEach((item) => {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    });
    setSelectedProjectFiles([]);
    setFilesProjectId("");
    setKitContactDetail("");
    setKitReraNumber("");
    setKitLogoFile(null);
    setKitEditMode(false);
    if (kitLogoPreview?.startsWith("blob:")) URL.revokeObjectURL(kitLogoPreview);
    setKitLogoPreview("");
    if (projectFilesInputRef.current) projectFilesInputRef.current.value = "";
    if (kitLogoInputRef.current) kitLogoInputRef.current.value = "";
  };

  const startEditKit = (projectId) => {
    const details = kitDetailsForProject(projectId);
    setFilesProjectId(String(projectId));
    setKitContactDetail(details.contact || "");
    setKitReraNumber(details.rera || "");
    setKitLogoFile(null);
    if (kitLogoPreview?.startsWith("blob:")) URL.revokeObjectURL(kitLogoPreview);
    setKitLogoPreview(details.logoUrl || "");
    setKitEditMode(true);
    if (kitLogoInputRef.current) kitLogoInputRef.current.value = "";
    kitFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const kitDetailsForProject = (projectId) => {
    const kits = digitalKits
      .filter((kit) => String(kit.project_id) === String(projectId))
      .sort((a, b) => Number(b.kit_id) - Number(a.kit_id));
    return {
      contact: kits.find((kit) => kit.contact_detail)?.contact_detail || "",
      rera: kits.find((kit) => kit.rera_number)?.rera_number || "",
      logoUrl: kits.find((kit) => kit.logo_url)?.logo_url || "",
    };
  };

  const resizeLogoFile = async (file) => {
    const toPngFile = (canvas) => new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          resolve(file);
          return;
        }
        const name = String(file.name || "logo").replace(/\.\w+$/, "") + ".png";
        resolve(new File([blob], name, { type: "image/png" }));
      }, "image/png");
    });

    try {
      if (typeof createImageBitmap === "function") {
        const bitmap = await createImageBitmap(file);
        const max = 320;
        const scale = Math.min(1, max / Math.max(bitmap.width || 1, bitmap.height || 1));
        const width = Math.max(1, Math.round(bitmap.width * scale));
        const height = Math.max(1, Math.round(bitmap.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          bitmap.close();
          return file;
        }
        ctx.drawImage(bitmap, 0, 0, width, height);
        bitmap.close();
        return toPngFile(canvas);
      }
    } catch (_error) {
      return file;
    }
    return file;
  };

  const handleKitLogoPick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const name = (file.name || "").toLowerCase();
    if (!/\.(jpg|jpeg|png)$/.test(name)) {
      toast.error("Property logo must be a jpg or png image", { autoClose: 2500 });
      return;
    }
    const resized = await resizeLogoFile(file);
    if (kitLogoPreview?.startsWith("blob:")) URL.revokeObjectURL(kitLogoPreview);
    setKitLogoFile(resized);
    setKitLogoPreview(URL.createObjectURL(resized));
  };

  const openDigitalKitTab = () => {
    setActiveTab("digitalKit");
    if (!filesProjectId && projects?.[0]?.project_id) {
      setFilesProjectId(String(projects[0].project_id));
    }
    getDigitalKits();
  };

  const authHeader = () => {
    const token = getCookie("token");
    const db_name = getCookie("db_name");
    return {
      headers: {
        Accept: "application/json",
        Authorization: "Bearer ".concat(token),
        db: db_name,
        m_id: 76,
      },
    };
  };

  const getDigitalKits = async () => {
    if (!hasCookie("token")) return;
    try {
      const response = await axios.get(`${Baseurl}/db/channel/digital-kit`, authHeader());
      setDigitalKits(response?.data?.data || []);
    } catch (error) {
      if (error?.response?.data?.message) {
        toast.error(error.response.data.message, { autoClose: 2500 });
      }
    }
  };

  const handleProjectFilesPick = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const accepted = [];
    files.forEach((file) => {
      if (file.size > MAX_KIT_FILE_BYTES) {
        toast.error(`${file.name} is larger than 500MB`, { autoClose: 3000 });
        return;
      }
      accepted.push(file);
    });
    const next = accepted.map((file, index) => ({
      id: `${Date.now()}-${index}-${file.name}`,
      file,
      name: file.name,
      size: file.size,
      kind: getProjectFileKind(file),
      previewUrl: file.type.startsWith("video/") || file.type.startsWith("image/")
        ? URL.createObjectURL(file)
        : null,
    }));
    setSelectedProjectFiles((prev) => [...prev, ...next]);
    e.target.value = "";
  };

  const removeSelectedProjectFile = (id) => {
    setSelectedProjectFiles((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((item) => item.id !== id);
    });
  };

  const handleSaveProjectFiles = async () => {
    if (!filesProjectId) {
      return toast.warning("Please select a project", { autoClose: 2500 });
    }
    if (!selectedProjectFiles.length && !kitEditMode) {
      return toast.warning("Please select at least one file", { autoClose: 2500 });
    }
    if (!hasCookie("token")) return;

    dispatch(startButtonLoading());
    try {
      if (!selectedProjectFiles.length && kitEditMode) {
        const formData = new FormData();
        formData.append("project_id", filesProjectId);
        formData.append("contact_detail", kitContactDetail.trim());
        formData.append("rera_number", kitReraNumber.trim());
        if (kitLogoFile) formData.append("logo", kitLogoFile);
        await axios.put(`${Baseurl}/db/channel/digital-kit/details`, formData, {
          ...authHeader(),
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
        });
        toast.success("Contact and logo updated", { autoClose: 2500 });
        resetProjectFilesModal();
        await getDigitalKits();
        return;
      }
      for (let index = 0; index < selectedProjectFiles.length; index += 1) {
        const item = selectedProjectFiles[index];
        const formData = new FormData();
        formData.append("file", item.file);
        formData.append("project_id", filesProjectId);
        formData.append("kit_type", "repository");
        formData.append("contact_detail", kitContactDetail.trim());
        formData.append("rera_number", kitReraNumber.trim());
        if (index === 0 && kitLogoFile) formData.append("logo", kitLogoFile);
        await axios.post(`${Baseurl}/db/channel/digital-kit/file`, formData, {
          ...authHeader(),
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
        });
      }
      toast.success("Uploaded successfully", { autoClose: 2500 });
      selectedProjectFiles.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });
      setSelectedProjectFiles([]);
      setKitContactDetail("");
      setKitReraNumber("");
      setKitLogoFile(null);
      setKitEditMode(false);
      if (kitLogoPreview?.startsWith("blob:")) URL.revokeObjectURL(kitLogoPreview);
      setKitLogoPreview("");
      if (projectFilesInputRef.current) projectFilesInputRef.current.value = "";
      if (kitLogoInputRef.current) kitLogoInputRef.current.value = "";
      await getDigitalKits();
    } catch (error) {
      const message = error?.response?.data?.message || error?.message || "Upload failed";
      toast.error(message, { autoClose: 3500 });
    } finally {
      dispatch(stopButtonLoading());
    }
  };


  const getDataList = async () => {
    if (!projects.length) setLoader(true);
    if (hasCookie("token")) {
      let token = getCookie("token");
      let db_name = getCookie("db_name");

      let header = {
        headers: {
          Accept: "application/json",
          Authorization: "Bearer ".concat(token),
          db: db_name,
          m_id: 76,
        },
      };

      try {
        const response = await axios.get(
          Baseurl + `/db/channel/project`,
          header
        );
        if (response?.status === 200 || response?.status === 201) {
          setLoader(false)
          setProjects(response?.data?.data)
          getDigitalKits()
        }
      } catch (error) {
        if (error?.response?.data?.message) {
          setLoader(false)
          toast.error(error?.response?.data?.message, { autoClose: 2500 });
        } else {
          setLoader(false)
          toast.error("Something went wrong!", { autoClose: 2500 });
        }
      }
    }
  };

  const getDataListById = async (projectId) => {
    if (hasCookie("token")) {
      let token = getCookie("token");
      let db_name = getCookie("db_name");

      let header = {
        headers: {
          Accept: "application/json",
          Authorization: "Bearer ".concat(token),
          db: db_name,
          m_id: 76,
        },
      };

      try {
        const { data } = await axios.get(
          Baseurl + `/db/channel/project?project_id=${projectId}`,
          header
        );
        const campaign = data?.data?.projectData;
        setProjectData({
          ...projectData,
          project: campaign?.project,
          project_id: campaign?.project_id,
          location: campaign?.location,
          property_size: campaign?.property_size,
          unit_area: campaign?.unit_area,
          price: campaign?.price,
          contact_no: campaign?.contact_no,
          file: campaign?.cover_image,
          file_preview: `${filesUrl}/project/images${campaign?.cover_image}`,
          logo: campaign?.logo_image,
          logo_preview: `${filesUrl}/projectLogo/images${campaign?.logo_image}`,
          template: campaign?.html_file,
          template_name: campaign?.html_file,
        })
      } catch (error) {
        if (error?.response?.data?.message) {
          toast.error(error?.response?.data?.message, { autoClose: 2500 });
        } else {
          toast.error("Something went wrong!", { autoClose: 2500 });
        }
      }
    }
  };

  useEffect(() => {
    getDataList();
  }, []);

  const handleFileChange = (e, field, fieldPreview) => {
    const file = e.target.files[0];
    if (!file) {
      e.target.value = "";
      return;
    }

    const allowedTypes = field === "template" ? ['text/html', 'text/htm'] : ['image/jpg', 'image/jpeg', 'image/png'];

    if (!allowedTypes.includes(file.type)) {
      const allowedExtensions = field === "template" ? ".html, .htm" : ".jpg, .jpeg, .png";
      toast.warning(`Invalid file type. Please upload ${allowedExtensions}.`, { autoClose: 2500 });
      e.target.value = "";
      return;
    }

    // For HTML template files, skip FileReader to avoid memory issues with large files
    if (field === "template") {
      // Check file size and block if larger than 10MB (server limit is around 10MB based on 413 errors)
      const maxSize = 10 * 1024 * 1024; // 10MB in bytes
      if (file.size > maxSize) {
        toast.error(`File size is ${(file.size / (1024 * 1024)).toFixed(2)}MB. Maximum allowed size is 10MB. Please upload a smaller file.`, {autoClose: 4000});
        e.target.value = "";
        return;
      }
      
      // Store file directly without reading into memory
      setProjectData({
        ...projectData,
        [field]: file,
        [fieldPreview]: file.name,
      });
    } else {
      // For images, use FileReader for preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setProjectData({
          ...projectData,
          [field]: file,
          [fieldPreview]: URL.createObjectURL(file),
        });
      };
      reader.readAsDataURL(file);
    }

    // Reset the input value to ensure the change event is fired even if the same file is selected
    e.target.value = "";
  };


  // const handleFileChange = (e,field,fieldPreview) => {
  //   if (e.target.files[0]) {
  //     const reader = new FileReader();
  //     reader.onloadend = () => {
  //       if(fieldPreview==="template_name"){
  //         setProjectData({
  //           ...projectData,
  //           [field]: e.target.files[0],
  //           [fieldPreview]: e.target.files[0].name,
  //         });
  //       }
  //       else{
  //         setProjectData({
  //           ...projectData,
  //           [field]: e.target.files[0],
  //           [fieldPreview]: URL.createObjectURL(e.target.files[0]),
  //         });
  //       }

  //     };
  //     reader.readAsDataURL(e.target.files[0]);
  //   }
  // };

  const createProject = async () => {
    if (projectData?.contact_no?.toString().length !== 10) {
      return toast.warning("contact no should be of 10 digit", { autoClose: 2500 })
    }
    if (projectData?.project == "" || projectData?.contact_no == "") {
      return toast.warning("Pls Fill Mandatory Fields", { autoClose: 2500 })
    }

    if (!hasCookie("token")) return;
    const token = getCookie("token");
    const db_name = getCookie("db_name");
    const header = {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        db: db_name,
        m_id: 79,
      },
    };

    const formData = new FormData();
    for (const [key, value] of Object.entries(projectData)) {
      // Only append non-null values
      if (value !== null && value !== undefined && value !== "") {
        formData.append(key, value);
      }
    }

    try {
      dispatch(startButtonLoading())
      const response = await axios.post(`${Baseurl}/db/channel/project`, formData, {
        ...header,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        transformRequest: [(data) => data], // Don't transform FormData
        // Don't set Content-Type - let browser set it with boundary for FormData
      });
      if (response.status === 200 || response.status === 201) {
        toast.success(response?.data?.message, { autoClose: 2500 });
        dispatch(stopButtonLoading())
        setShowModal(false)
        getDataList();
      }
    } catch (error) {
      console.log("Upload error:", error)
      dispatch(stopButtonLoading())
      
      // Handle 413 Request Entity Too Large error
      if (error?.response?.status === 413) {
        toast.error("File size is too large. Maximum allowed size is 10MB. The server rejected this file. Please upload a smaller file or contact your administrator to increase the server upload limit.", { autoClose: 5000 });
        return;
      }
      
      if (error?.response?.data?.status === 422) {
        toast.error(error?.response?.data?.message, { autoClose: 2500 })
      } else if (error?.response?.data?.message) {
        toast.error(error?.response?.data?.message, { autoClose: 2500 });
      } else if (error?.message) {
        toast.error(error.message, { autoClose: 2500 });
      } else {
        toast.error("Something went wrong! Please check your connection and try again.", { autoClose: 2500 });
      }
    }
  };

  const updateProject = async () => {

    if (projectData?.contact_no?.toString().length !== 10) {
      return toast.warning("contact no should be of 10 digit", { autoClose: 2500 })
    }
    if (projectData?.project == "" || projectData?.contact_no == "") {
      return toast.warning("Pls Fill Mandatory Fields", { autoClose: 2500 })
    }
    if (!hasCookie("token")) return;
    const token = getCookie("token");
    const db_name = getCookie("db_name");
    const header = {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        db: db_name,
        m_id: 79,
      },
    };

    const formData = new FormData();
    for (const [key, value] of Object.entries(projectData)) {
      // Only append non-null values
      if (value !== null && value !== undefined && value !== "") {
        formData.append(key, value);
      }
    }

    try {
      dispatch(startButtonLoading())
      const response = await axios.put(`${Baseurl}/db/channel/project`, formData, {
        ...header,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        transformRequest: [(data) => data], // Don't transform FormData
        // Don't set Content-Type - let browser set it with boundary for FormData
      });
      if (response.status === 200 || response.status === 201) {
        toast.success(response?.data?.message, { autoClose: 2500 });
        dispatch(stopButtonLoading())
        setEditMode(false)
        setShowModal(false)
        setProjectData("")
        getDataList();
      }
    } catch (error) {
      console.log("Update error:", error)
      dispatch(stopButtonLoading())
      
      // Handle 413 Request Entity Too Large error
      if (error?.response?.status === 413) {
        toast.error("File size is too large. Maximum allowed size is 10MB. The server rejected this file. Please upload a smaller file or contact your administrator to increase the server upload limit.", { autoClose: 5000 });
        return;
      }
      
      if (error?.response?.data?.status === 422) {
        toast.error(error?.response?.data?.message, { autoClose: 2500 })
      } else if (error?.response?.data?.message) {
        toast.error(error?.response?.data?.message, { autoClose: 2500 });
      } else if (error?.message) {
        toast.error(error.message, { autoClose: 2500 });
      } else {
        toast.error("Something went wrong! Please check your connection and try again.", { autoClose: 2500 });
      }
    }
  };

  const [deleteshowConfirm, setdeleteshowConfirm] = useState(false);
  const [currObj, setcurrObj] = useState({ project_id: "", action: "" });

  function deleteConfirm(value) {
    setcurrObj({ project_id: value, action: "delete" });
    setdeleteshowConfirm(true);
  }
  async function deleteHandler() {
    if (hasCookie("token")) {
      let token = getCookie("token");
      let db_name = getCookie("db_name");

      let header = {
        headers: {
          Accept: "application/json",
          Authorization: "Bearer ".concat(token),
          db: db_name,
          m_id: "pass"
          // m_id: 149,
        },
      };

      try {
        const response = await axios.delete(
          Baseurl + `/db/channel/project?project_id=${currObj.project_id}`,
          header
        );
        if (response.status === 204 || response.status === 200) {
          toast.success(response.data.message);
          setdeleteshowConfirm(false);
          setcurrObj({ account_type_id: "", action: "" });
          getDataList();
        }
      } catch (error) {
        if (error?.response?.data?.message) {
          toast.error(error.response.data.message);
        } else {
          toast.error("Something went wrong!");
        }
      }
    }
  }
  return (
    <>
      {
        loader ? <div className="ps-4 pe-4 pb-4 w-100 mt-4 overflow-auto"><Loader /></div>
          :
          (
            <div className="ps-4 pe-4 pb-4 w-100 mt-4 overflow-auto">
              <div className="d-flex align-items-center justify-content-between mb-3" style={{ borderBottom: "1px solid #E6E6E6" }}>
                <div className="d-flex">
                  {false && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("campaign")}
                    style={{
                      background: "none",
                      border: "none",
                      borderBottom: activeTab === "campaign" ? `2px solid ${clientBtnColor}` : "2px solid transparent",
                      color: activeTab === "campaign" ? clientBtnColor : "#6B6B6B",
                      fontWeight: 600,
                      fontSize: 15,
                      padding: "10px 16px",
                      marginBottom: -1,
                    }}
                  >
                    Campaign
                  </button>
                  )}
                  <button
                    type="button"
                    onClick={openDigitalKitTab}
                    style={{
                      background: "none",
                      border: "none",
                      borderBottom: activeTab === "digitalKit" ? `2px solid ${clientBtnColor}` : "2px solid transparent",
                      color: activeTab === "digitalKit" ? clientBtnColor : "#6B6B6B",
                      fontWeight: 600,
                      fontSize: 15,
                      padding: "10px 16px",
                      marginBottom: -1,
                    }}
                  >
                    Digital Kit
                  </button>
                </div>
                {activeTab === "campaign" && hasCookie("channel") && userInfo?.role_id == null && (
                  <button
                    className="btn Add_btn mb-2"
                    style={{ background: `${clientBtnColor}` }}
                    onClick={() => {
                      setShowModal(true);
                    }}
                  >
                    <PlusIcon />
                    Create Campaign
                  </button>
                )}
              </div>
              <ConfirmBox
                showConfirm={deleteshowConfirm}
                setshowConfirm={setdeleteshowConfirm}
                actionType={deleteHandler}
                title={"Are You Sure you want to Delete ?"}
              />

              {activeTab === "campaign" && (
              <section className="Channel-profile Booking-Detail Visit-Details Campaigns pt-4 pb-2 bg-white">
                <div className="container mb-4">
                  <div className="row gx-4 gy-4">
                    <div className="profile-text">Campaigns</div>
                    {
                      projects?.map((project, i) => (
                        <div key={i} className="col-12 col-md-6">
                          <div
                            className="w-100 position-relative Campaign-img"
                            style={{
                              backgroundImage:
                                `url(${filesUrl}` + `/project/images${project?.cover_image})`,
                            }}
                          >
                            <div className="overlay" />
                            <div className="cart-overlay-items">
                              <div className="row">
                                <div className="col-8">
                                  <div className="Campaign-name">
                                    <h3 className="text-white">{project?.project}</h3>
                                  </div>
                                </div>
                                <div className="col-4 d-flex justify-content-end">
                                  <div className="d-flex gap-3">
                                    {
                                      hasCookie("channel") && userInfo?.role_id == null && (
                                        <img
                                          src="/ChannelPartner/profile-edit-white.svg"
                                          onClick={() => {
                                            setEditMode(true)
                                            getDataListById(project?.project_id)
                                            setShowModal(true)
                                          }}
                                          alt
                                          style={{ height: 17, cursor: "pointer" }}
                                        />
                                      )
                                    }

                                    <Link
                                      href={`/partner/CampaignDetailsAdmin?id=${project?.project_id}`}
                                    >
                                      <img
                                        src="/ChannelPartner/download-file-white.svg"
                                        alt
                                        style={{ height: 17 }}
                                      />
                                    </Link>
                                    {
                                      hasCookie("channel") && userInfo?.role_id == null && (
                                        <Delete style={{ color: '#eb5244', cursor: 'pointer', height: "20px" }} onClick={() => deleteConfirm(project?.project_id)} />
                                      )
                                    }
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </div>
              </section>
              )}

              {activeTab === "digitalKit" && (
                <section className="pt-3 pb-4 bg-white">
                  <div className="px-3" style={{ paddingTop: 8, paddingBottom: 12 }}>
                    <div className="row g-3 align-items-start">
                      <div className="col-12">
                        <div ref={kitFormRef} className="w-100 d-flex flex-column border rounded-3 p-3" style={{ boxShadow: "0 1px 4px rgba(38, 32, 59, 0.06)" }}>
                          <div className="fw-semibold mb-2" style={{ fontSize: 16 }}>
                            {kitEditMode ? "Edit Digital Kit" : "Digital Kit"}
                          </div>
                          <div className="d-flex align-items-end flex-nowrap gap-2">
                            <div style={{ flex: "1 1 0", minWidth: 0 }}>
                              <label className="mb-1 d-block" style={{ color: "#9C9AA5", fontSize: 12 }}>
                                Select Project*
                              </label>
                              <select
                                className="form-select"
                                style={{ outline: "none", height: 36, fontSize: 13 }}
                                value={filesProjectId}
                                onChange={(e) => setFilesProjectId(e.target.value)}
                              >
                                <option value="">Choose project</option>
                                {projects?.map((project) => (
                                  <option key={project?.project_id} value={project?.project_id}>
                                    {project?.project}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div style={{ flex: "1 1 0", minWidth: 0 }}>
                              <label className="mb-1 d-block" style={{ color: "#9C9AA5", fontSize: 12 }}>
                                Phone number
                              </label>
                              <input
                                type="text"
                                className="form-control"
                                placeholder="Phone number"
                                value={kitContactDetail}
                                onChange={(e) => setKitContactDetail(e.target.value)}
                                style={{ height: 36, fontSize: 13 }}
                              />
                            </div>
                            <div style={{ flex: "1 1 0", minWidth: 0 }}>
                              <label className="mb-1 d-block" style={{ color: "#9C9AA5", fontSize: 12 }}>
                                RERA number
                              </label>
                              <input
                                type="text"
                                className="form-control"
                                placeholder="RERA number"
                                value={kitReraNumber}
                                onChange={(e) => setKitReraNumber(e.target.value)}
                                style={{ height: 36, fontSize: 13 }}
                              />
                            </div>
                            <div style={{ flex: "1 1 0", minWidth: 0 }}>
                              <label className="mb-1 d-block" style={{ color: "#9C9AA5", fontSize: 12 }}>
                                Property logo
                              </label>
                              <input
                                ref={kitLogoInputRef}
                                type="file"
                                accept=".jpg,.jpeg,.png"
                                onChange={handleKitLogoPick}
                                id="kitLogoInput"
                                style={{ display: "none" }}
                              />
                              <label
                                htmlFor="kitLogoInput"
                                className="border rounded d-flex align-items-center gap-2 mb-0 px-2"
                                style={{
                                  cursor: "pointer",
                                  color: clientBtnColor,
                                  height: 36,
                                  background: "#FAFAFA",
                                  fontSize: 13,
                                }}
                              >
                                {kitLogoPreview ? (
                                  <span style={{ width: 22, height: 22, overflow: "hidden", flexShrink: 0, display: "inline-flex" }}>
                                    <img
                                      src={kitLogoPreview}
                                      alt="Property logo"
                                      style={{ width: 22, height: 22, objectFit: "contain", display: "block" }}
                                    />
                                  </span>
                                ) : null}
                                <span className="text-truncate">{kitLogoFile ? kitLogoFile.name : "jpg or png logo"}</span>
                              </label>
                            </div>
                            <div style={{ flex: "1 1 0", minWidth: 0 }}>
                              <label className="mb-1 d-block" style={{ color: "#9C9AA5", fontSize: 12 }}>
                                Files
                              </label>
                              <input
                                ref={projectFilesInputRef}
                                type="file"
                                multiple
                                accept={PROJECT_FILE_ACCEPT}
                                onChange={handleProjectFilesPick}
                                id="projectFilesInput"
                                style={{ display: "none" }}
                              />
                              <label
                                htmlFor="projectFilesInput"
                                className="border rounded d-flex align-items-center mb-0 px-2"
                                title="mp4, webm, mov, ppt, pdf, jpg, png, doc, xlsx"
                                style={{
                                  cursor: "pointer",
                                  color: clientBtnColor,
                                  height: 36,
                                  background: "#FAFAFA",
                                  fontSize: 13,
                                }}
                              >
                                <span className="text-truncate">Video, PPT, PDF or image</span>
                              </label>
                            </div>
                            <button
                              type="button"
                              className="btn flex-shrink-0"
                              style={{ color: "#9C9AA5", border: "1px solid #D9D9D9", background: "#fff", height: 36, fontSize: 12, padding: "4px 12px", borderRadius: 6 }}
                              onClick={resetProjectFilesModal}
                            >
                              Clear
                            </button>
                            <button
                              type="button"
                              className="btn text-white flex-shrink-0"
                              style={{ background: clientBtnColor, height: 36, fontSize: 12, padding: "4px 12px", borderRadius: 6 }}
                              onClick={handleSaveProjectFiles}
                            >
                              {kitEditMode ? "Update" : "Save"}
                            </button>
                          </div>

                            {selectedProjectFiles.length > 0 && (
                              <div className="d-flex flex-column gap-2" style={{ maxHeight: 180, overflowY: "auto" }}>
                                {selectedProjectFiles.map((item) => (
                                  <div
                                    key={item.id}
                                    className="d-flex align-items-center justify-content-between border rounded px-2 py-2 gap-2"
                                  >
                                    <div className="d-flex align-items-center gap-2 overflow-hidden">
                                      {item.kind === "image" && item.previewUrl ? (
                                        <img
                                          src={item.previewUrl}
                                          alt={item.name}
                                          style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 4, flexShrink: 0 }}
                                        />
                                      ) : (
                                        <span
                                          className="text-uppercase small fw-semibold px-2 py-1 rounded"
                                          style={{
                                            background: "#F1F2F6",
                                            color: clientBtnColor,
                                            minWidth: 48,
                                            textAlign: "center",
                                            flexShrink: 0,
                                          }}
                                        >
                                          {item.kind}
                                        </span>
                                      )}
                                      <div className="overflow-hidden">
                                        <div className="text-truncate" title={item.name}>{item.name}</div>
                                        <small className="text-muted">{formatFileSize(item.size)}</small>
                                      </div>
                                    </div>
                                    <Delete
                                      style={{ color: "#eb5244", cursor: "pointer", flexShrink: 0 }}
                                      onClick={() => removeSelectedProjectFile(item.id)}
                                    />
                                  </div>
                                ))}
                              </div>
                            )}
                        </div>
                      </div>

                      <div className="col-12">
                        <div className="w-100 d-flex flex-column border rounded-3 p-3" style={{ boxShadow: "0 1px 4px rgba(38, 32, 59, 0.06)" }}>
                          <div className="fw-semibold mb-3" style={{ fontSize: 16 }}>Uploaded kits</div>
                          <div className="d-flex flex-column gap-3">
                            {!digitalKits.length && (
                              <small className="text-muted">No digital kits uploaded yet.</small>
                            )}
                            {projects
                              .filter((project) => digitalKits.some((kit) => String(kit.project_id) === String(project.project_id)))
                              .map((project) => (
                              <div key={project?.project_id} className="border rounded-3 p-3">
                                {(() => {
                                  const details = kitDetailsForProject(project?.project_id);
                                  return (
                                    <div className="d-flex align-items-center gap-3 mb-3">
                                      {details.logoUrl ? (
                                        <span style={{ width: 48, height: 48, overflow: "hidden", flexShrink: 0, borderRadius: 8, background: "#F7F7F7", border: "1px solid #eee", padding: 4 }}>
                                          <img
                                            src={details.logoUrl}
                                            alt="Property logo"
                                            style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
                                          />
                                        </span>
                                      ) : (
                                        <div
                                          className="d-flex align-items-center justify-content-center text-muted"
                                          style={{ width: 48, height: 48, borderRadius: 8, background: "#F7F7F7", border: "1px solid #eee", fontSize: 10, textAlign: "center", flexShrink: 0, lineHeight: 1.1 }}
                                        >
                                          No logo
                                        </div>
                                      )}
                                      <div className="overflow-hidden flex-grow-1">
                                        <div className="fw-semibold text-truncate" style={{ fontSize: 14 }}>{project?.project}</div>
                                        <div className="text-muted text-truncate" style={{ fontSize: 12 }}>{details.contact ? `Phone number ${details.contact}` : "No phone number"}</div>
                                        <div className="text-muted text-truncate" style={{ fontSize: 12 }}>{details.rera ? `RERA number ${details.rera}` : "No RERA number"}</div>
                                      </div>
                                      <button
                                        type="button"
                                        className="btn flex-shrink-0"
                                        style={{
                                          color: clientBtnColor,
                                          border: `1px solid ${clientBtnColor}`,
                                          background: "transparent",
                                          height: 28,
                                          fontSize: 12,
                                          padding: "2px 10px",
                                          borderRadius: 6,
                                        }}
                                        onClick={() => startEditKit(project?.project_id)}
                                      >
                                        Edit
                                      </button>
                                    </div>
                                  );
                                })()}
                                <div className="d-flex flex-column gap-1">
                                  {digitalKits
                                    .filter((kit) => String(kit.project_id) === String(project.project_id))
                                    .sort((a, b) => Number(b.kit_id) - Number(a.kit_id))
                                    .slice(0, 2)
                                    .map((item) => (
                                          <div
                                            key={item.kit_id}
                                            className="d-flex align-items-center justify-content-between rounded px-3 py-2 gap-2"
                                            style={{ background: "#F7F8FA" }}
                                          >
                                            <div className="d-flex align-items-center gap-2 overflow-hidden">
                                              <span
                                                className="text-uppercase small fw-semibold px-2 py-1 rounded"
                                                style={{
                                                  background: "#F1F2F6",
                                                  color: clientBtnColor,
                                                  minWidth: 48,
                                                  textAlign: "center",
                                                  flexShrink: 0,
                                                }}
                                              >
                                                {item.kind}
                                              </span>
                                              <div className="overflow-hidden">
                                                <div className="text-truncate" title={item.file_name}>{item.file_name}</div>
                                                <small className="text-muted">{formatFileSize(Number(item.file_size || 0))}</small>
                                              </div>
                                            </div>
                                            <div className="d-flex align-items-center gap-2 flex-shrink-0">
                                              <button
                                                type="button"
                                                className="btn kit-action-btn"
                                                style={{
                                                  color: clientBtnColor,
                                                  border: `1px solid ${clientBtnColor}`,
                                                  background: "transparent",
                                                }}
                                                onClick={() => openKitFile(item)}
                                              >
                                                {item.kind === "video" ? "Play" : "View"}
                                              </button>
                                              <button
                                                type="button"
                                                className="btn kit-action-btn text-white"
                                                style={{ background: clientBtnColor }}
                                                onClick={() => downloadKitFile(item)}
                                              >
                                                Download
                                              </button>
                                            </div>
                                          </div>
                                        ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              )}
            </div>
          )
      }


      <Modal
        show={showModal}
        onHide={() => {
          if (isButtonLoading == false) {
            setEditMode(false)
            setProjectData("")
            setShowModal(false);
          }

        }}
        size="lg"
        centered
      >
        <Modal.Body>
          <form className="  d-flex flex-column gap-4 p-4 " onSubmit={(e) => {
            e.preventDefault()
            editMode ? updateProject() : createProject()

          }}>
            <div
              className=" text-center fs-4 "
              style={{ color: clientBtnColor }}
            >
              Project Details
            </div>

            <div className="d-flex flex-column gap-3">
              <div className="d-flex justify-content-between gap-5 align-items-center">
                <div className="w-50 d-flex justify-content-lg-between align-items-center">
                  <label className="w-27" style={{ color: "#9C9AA5" }}>
                    Property Name*
                  </label>
                  <input
                    type="text"
                    value={projectData?.project}
                    onChange={(e) => {
                      setProjectData({
                        ...projectData,
                        project: e.target.value,
                      });
                    }}
                    placeholder="Burrow Real Estate"
                    style={{ outline: "none" }}
                    className="w-73 border p-2 rounded-md text-black"
                  />
                </div>
                {/* <div className="w-50 d-flex justify-content-lg-between align-items-center">
                  <label className="w-27" style={{ color: "#9C9AA5" }}>
                    Property Size*
                  </label>
                  <input
                    type="text"
                    value={projectData?.property_size}
                    onChange={(e) => {
                      setProjectData({
                        ...projectData,
                        property_size: e.target.value,
                      });
                    }}
                    placeholder="3,4,5 BHK"
                    style={{ outline: "none" }}
                    className="w-73 border p-2 rounded-md text-black"
                  />
                </div> */}
              </div>

              {/* <div className="d-flex justify-content-between gap-5 align-items-center">
                <div className="w-50 d-flex justify-content-lg-between align-items-center">
                  <label className="w-27" style={{ color: "#9C9AA5" }}>
                    Location*
                  </label>
                  <input
                    type="text"
                    value={projectData?.location}
                    onChange={(e) => {
                      setProjectData({
                        ...projectData,
                        location: e.target.value,
                      });
                    }}
                    placeholder="Ex:- Vasant Kunj"
                    style={{ outline: "none" }}
                    className="w-73 border p-2 rounded-md text-black"
                  />
                </div>
                <div className="w-50 d-flex justify-content-lg-between align-items-center">
                  <label className="w-27" style={{ color: "#9C9AA5" }}>
                    Unit Area*
                  </label>
                  <input
                    type="text"
                    value={projectData?.unit_area}
                    onChange={(e) => {
                      setProjectData({
                        ...projectData,
                        unit_area: e.target.value,
                      });
                    }}
                    placeholder="4000 sq ft"
                    style={{ outline: "none" }}
                    className="w-73 border p-2 rounded-md text-black"
                  />
                </div>
              </div> */}

              <div className="d-flex justify-content-between gap-5 align-items-center">
                <div className="w-50 d-flex justify-content-lg-between align-items-center">
                  <label className="w-27" style={{ color: "#9C9AA5" }}>
                    Contact No.*
                  </label>
                  <input
                    type="number"
                    value={projectData?.contact_no}
                    onChange={(e) => {
                      setProjectData({
                        ...projectData,
                        contact_no: e.target.value,
                      });
                    }}
                    placeholder="+91-8787675466"
                    style={{ outline: "none" }}
                    className="w-73 border p-2 rounded-md text-black"
                  />
                </div>
                {/* <div className="w-50 d-flex justify-content-between align-items-center">
                  <label className="w-27" style={{ color: "#9C9AA5" }}>
                    Price*
                  </label>
                  <input
                    type="text"
                    value={projectData?.price}
                    onChange={(e) => {
                      setProjectData({
                        ...projectData,
                        price: e.target.value,
                      });
                    }}
                    placeholder="₹ 3.57 Cr onwards"
                    style={{ outline: "none" }}
                    className="w-73 border p-2 rounded-md text-black"
                  />
                </div> */}
              </div>


              <div className="d-flex justify-content-between gap-5 align-items-center">
                <div className="w-50  d-flex justify-content-lg-between align-items-center">
                  <label className="w-27" style={{ color: "#9C9AA5" }}>
                    Property Cover
                  </label>
                  <input
                    type="file"
                    accept=".jpeg, .jpg, .png"
                    onChange={(e) => handleFileChange(e, "file", "file_preview")}
                    id="fileInput"
                    style={{ display: "none" }}
                  />
                  {projectData?.file_preview ?
                    <div className="relative">
                      <img src={projectData?.file_preview} />
                      <span className="absolute top-0 right-0" onClick={() => {
                        setProjectData({ ...projectData, file: null, file_preview: null })
                      }}>
                        <Delete style={{ color: 'red', cursor: "pointer" }} />
                      </span>
                    </div>
                    :
                    <label
                      htmlFor="fileInput"
                      className="w-73 border p-2 ps-1 rounded-md text-black"
                      style={{ outline: "none", cursor: "pointer" }}
                    >
                      Click here to choose file
                    </label>
                  }
                </div>
                <div className="w-50 d-flex justify-content-lg-between align-items-center">
                  <label className="w-27" style={{ color: "#9C9AA5" }}>
                    Property Logo
                  </label>
                  <input
                    type="file"
                    accept=".jpeg, .jpg, .png"
                    onChange={(e) => handleFileChange(e, "logo", "logo_preview")}
                    id="logoInput"
                    style={{ display: "none" }}
                  />
                  {projectData?.logo_preview ?
                    <div className="relative">
                      <img src={projectData?.logo_preview} />
                      <span className="absolute top-0 right-0" onClick={() => {
                        setProjectData({
                          ...projectData,
                          logo: null,
                          logo_preview: null
                        })
                      }}>
                        <Delete style={{ color: 'red', cursor: "pointer" }} />
                      </span>

                    </div>
                    :
                    <label
                      htmlFor="logoInput"
                      className="w-73 border p-2 ps-1 rounded-md text-black"
                      style={{ outline: "none", cursor: "pointer" }}
                    >
                      Click here to choose file
                    </label>
                  }
                </div>
              </div>

              <div className="d-flex justify-content-between gap-5 align-items-center">
                <div className="w-50  d-flex justify-content-lg-between align-items-center">
                  <label className="w-27" style={{ color: "#9C9AA5" }}>
                    Template File(HTML)
                  </label>
                  <input
                    type="file"
                    accept=".html,.htm"
                    onChange={(e) => {
                      handleFileChange(e, "template", "template_name")
                    }}
                    id="templateInput"
                    style={{ display: "none" }}
                  />
                  {projectData?.template_name ?
                    <div className="relative w-73">
                      <div  >{projectData?.template_name}</div>
                      <span className="absolute top-0 right-0" onClick={() => {
                        setProjectData({ ...projectData, template_name: null, template_file: null })
                      }}>
                        <Delete style={{ color: 'red', cursor: "pointer" }} />
                      </span>
                    </div>
                    :
                    <label
                      htmlFor="templateInput"
                      className="w-73 border p-2 ps-1 rounded-md text-black"
                      style={{ outline: "none", cursor: "pointer" }}
                    >
                      Click here to choose file
                    </label>
                  }
                </div>
                <div className="w-50 d-flex justify-content-lg-between align-items-center">

                </div>
              </div>

            </div>

            <div className="d-flex justify-content-center align-items-center gap-3 ">
              <button
                type="button"
                disabled={isButtonLoading}
                className="btn btn-danger rounded-5"
                onClick={() => { setShowModal(false); setProjectData(""); setEditMode(false); }}
              >
                Cancel
              </button>
              {
                editMode ?
                  (
                    <button
                      type="submit"
                      disabled={isButtonLoading}
                      className="btn text-white rounded-5"
                      style={{ background: clientBtnColor }}
                    >
                      {isButtonLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                          &nbsp;Update
                        </>
                      ) : (
                        'Update'
                      )}
                    </button>
                  )
                  :
                  (
                    <button
                      type="submit"
                      disabled={isButtonLoading}
                      className="btn text-white rounded-5"
                      style={{ background: clientBtnColor }}
                    >
                      {isButtonLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                          &nbsp;Create
                        </>
                      ) : (
                        'Create'
                      )}
                    </button>
                  )
              }

            </div>
          </form>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default CampaignAdminScreen;
