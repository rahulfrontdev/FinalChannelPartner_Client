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

const CampaignScreen = () => {
  const [showModal, setShowModal] = useState(false);
  const [imgFile, setImgFile] = useState("");
  const clientBtnColor = hasCookie("clientBtnColor")
    ? getCookie("clientBtnColor")
    : "#293790";
  const [projectData, setProjectData] = useState({
    project: "",
    project_id:null,
    location: "",
    property_size: "",
    unit_area: "",
    price: "",
    contact_no: "",
    rera_number: "",
    file: null,
    file_preview:"",
    logo:null,
    logo_preview:null,
    template:null,
    template_name:null
  });
  const[editMode,setEditMode]=useState(false)
  const[projects,setProjects]=useState([]);
  const [digitalKits, setDigitalKits] = useState([]);
  const [kitEditProjectId, setKitEditProjectId] = useState(null);
  const [contactDraft, setContactDraft] = useState("");
  const [reraDraft, setReraDraft] = useState("");
  const [pendingLogoFile, setPendingLogoFile] = useState(null);
  const [pendingLogoPreview, setPendingLogoPreview] = useState("");
  const kitLogoInputRef = useRef(null);
  const dispatch=useDispatch()
  const {isButtonLoading}=useSelector((state)=>state.buttonLoader)
  const [loader,setLoader]=useState();
  const userInfo=hasCookie("userInfo")?JSON.parse(getCookie("userInfo")):null;
  const canEditKit = hasCookie("channel") && userInfo?.role_id == 1;

  

  const getDataList = async () => {
    setLoader(true)
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
        if(response.status === 200 || response.status === 201){
          setLoader(false)
        setProjects(response?.data?.data)
        getDigitalKits()
        }
      } catch (error) {
        if (error?.response?.data?.message) {
          setLoader(false)
          toast.error(error?.response?.data?.message,{autoClose:2500});
        } else {
          setLoader(false)
          toast.error("Something went wrong!",{autoClose:2500});
        }
      }
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes && bytes !== 0) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
    try {
      if (typeof createImageBitmap !== "function") return file;
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
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) return file;
      const name = String(file.name || "logo").replace(/\.\w+$/, "") + ".png";
      return new File([blob], name, { type: "image/png" });
    } catch (_error) {
      return file;
    }
  };

  const clearKitEdit = () => {
    if (pendingLogoPreview?.startsWith("blob:")) URL.revokeObjectURL(pendingLogoPreview);
    setKitEditProjectId(null);
    setContactDraft("");
    setReraDraft("");
    setPendingLogoFile(null);
    setPendingLogoPreview("");
    if (kitLogoInputRef.current) kitLogoInputRef.current.value = "";
  };

  const pickKitLogo = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const name = (file.name || "").toLowerCase();
    if (!/\.(jpg|jpeg|png)$/.test(name)) {
      toast.error("Property logo must be a jpg or png image", { autoClose: 2500 });
      return;
    }
    const resized = await resizeLogoFile(file);
    if (pendingLogoPreview?.startsWith("blob:")) URL.revokeObjectURL(pendingLogoPreview);
    setPendingLogoFile(resized);
    setPendingLogoPreview(URL.createObjectURL(resized));
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

  const saveKitEdit = async (projectId) => {
    if (!projectId || !hasCookie("token")) return;
    const token = getCookie("token");
    const db_name = getCookie("db_name");
    const formData = new FormData();
    formData.append("project_id", projectId);
    formData.append("contact_detail", contactDraft.trim());
    formData.append("rera_number", reraDraft.trim());
    if (pendingLogoFile) formData.append("logo", pendingLogoFile);
    try {
      await axios.put(`${Baseurl}/db/channel/digital-kit/details`, formData, {
        headers: {
          Accept: "application/json",
          Authorization: "Bearer ".concat(token),
          db: db_name,
          m_id: 76,
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      });
      toast.success("Updated successfully", { autoClose: 2500 });
      clearKitEdit();
      await getDigitalKits();
    } catch (error) {
      const message = error?.response?.data?.message || "Could not update digital kit";
      toast.error(message, { autoClose: 2500 });
    }
  };

  const getDigitalKits = async () => {
    if (!hasCookie("token")) return;
    const token = getCookie("token");
    const db_name = getCookie("db_name");
    try {
      const response = await axios.get(`${Baseurl}/db/channel/digital-kit`, {
        headers: {
          Accept: "application/json",
          Authorization: "Bearer ".concat(token),
          db: db_name,
          m_id: 76,
        },
      });
      setDigitalKits(response?.data?.data || []);
    } catch (error) {
      if (error?.response?.data?.message) {
        toast.error(error.response.data.message, { autoClose: 2500 });
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
        const campaign=data?.data?.projectData;
        setProjectData({
            ...projectData,
            project: campaign?.project,
            project_id: campaign?.project_id,
            location: campaign?.location,
            property_size: campaign?.property_size,
            unit_area: campaign?.unit_area,
            price: campaign?.price,
            contact_no: campaign?.contact_no,
            rera_number: campaign?.rera_number || "",
            file:campaign?.cover_image,
            file_preview: `${filesUrl}/project/images${campaign?.cover_image}`,
            logo:campaign?.logo_image,
            logo_preview: `${filesUrl}/projectLogo/images${campaign?.logo_image}`,
            template:campaign?.html_file,
            template_name:campaign?.html_file,
        })
      } catch (error) {
        console.log(error)
        if (error?.response?.data?.message) {
          toast.error(error?.response?.data?.message,{autoClose:2500});
        } else {
          toast.error("Something went wrong!",{autoClose:2500});
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
      toast.warning(`Invalid file type. Please upload ${allowedExtensions}.`,{autoClose:2500});
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
  
  const validateProjectForm = () => {
    if (!projectData?.rera_number?.toString().trim()) {
      toast.warning("Please enter RERA Number", { autoClose: 2500 });
      return false;
    }
    const contactNo = projectData?.contact_no?.toString().trim();
    if (contactNo && contactNo.length !== 10) {
      toast.warning("contact no should be of 10 digit", { autoClose: 2500 });
      return false;
    }
    return true;
  };

  const createProject=  async() => {
    if (!validateProjectForm()) return;
  //   if(!projectData.project) return toast.warning("please enter project name")
  //  if(!projectData.file) return toast.warning("please upload cover image")
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

      const formData=new FormData();
    for (const [key, value] of Object.entries(projectData)) {
      // Only append non-null values
      if (value !== null && value !== undefined && value !== "") {
        formData.append(key, value);
      }
    }

      try {
        const response = await axios.post(`${Baseurl}/db/channel/project`,formData, {
          ...header,
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
          transformRequest: [(data) => data], // Don't transform FormData
          // Don't set Content-Type - let browser set it with boundary for FormData
        });
        if (response.status === 200 || response.status === 201) {
          toast.success(response?.data?.message,{autoClose:2500});
          setShowModal(false)
          getDataList();
        }
      } catch (error) {
        console.log("Upload error:", error)
        
        // Handle 413 Request Entity Too Large error
        if (error?.response?.status === 413) {
          toast.error("File size is too large. Maximum allowed size is 15MB. Please upload a smaller file.", { autoClose: 4000 });
          return;
        }
        
        if (error?.response?.data?.status === 422) {
          toast.error(error?.response?.data?.message,{autoClose:2500})
        } else if (error?.response?.data?.message) {
          toast.error(error?.response?.data?.message, {autoClose:2500});
        } else if (error?.message) {
          toast.error(error.message, {autoClose:2500});
        } else {
          toast.error("Something went wrong! Please check your connection and try again.",{autoClose:2500});
        }
      }
  };

  const updateProject=  async() => {
    if (!validateProjectForm()) return;
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

    const formData=new FormData();
  for (const [key, value] of Object.entries(projectData)) {
    // Only append non-null values
    if (value !== null && value !== undefined && value !== "") {
      formData.append(key, value);
    }
  }

    try {
      dispatch(startButtonLoading())
      const response = await axios.post(`${Baseurl}/db/channel/project/usertemplate`,formData, {
        ...header,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        transformRequest: [(data) => data], // Don't transform FormData
        // Don't set Content-Type - let browser set it with boundary for FormData
      });
      if (response.status === 200 || response.status === 201) {
        toast.success(response?.data?.message,{autoClose:2500});
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
        toast.error(error?.response?.data?.message,{autoClose:2500})
      } else if (error?.response?.data?.message) {
        toast.error(error?.response?.data?.message, {autoClose:2500});
      } else if (error?.message) {
        toast.error(error.message, {autoClose:2500});
      } else {
        toast.error("Something went wrong! Please check your connection and try again.",{autoClose:2500});
      }
    }
};

  

  return (
    <>
    {
      loader ? <div className="ps-4 pe-4 pb-4 w-100 mt-4 overflow-auto"><Loader/></div>
      :
      (
        <div className="ps-4 pe-4 pb-4 w-100 mt-4 overflow-auto">
        
        <section className="Channel-profile Booking-Detail Visit-Details Campaigns  pb-2 bg-white">
          <div className="container mt-3 mb-4" style={{ padding: "8px 12px 20px" }}>
            {false && (
            <div className="row gx-4 gy-4">
              <div className="profile-text">Campaigns</div>
            {
                projects?.map((project, i)=> (
                    <div key={i} className="col-12 col-md-6">
                <div
                  className="w-100 position-relative Campaign-img"
                  style={{
                    backgroundImage:
                      `url(${filesUrl}`+`/project/images${project?.cover_image})`,
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
                        <div className="d-flex gap-2">
                        {
                          hasCookie("channel") && userInfo?.role_id==1 && (
                            <img
                            src="/ChannelPartner/profile-edit-white.svg"
                            onClick={()=>{
                                setEditMode(true)
                                getDataListById(project?.project_id)
                                setShowModal(true)
                            }}
                            alt
                            
                            style={{ height: 17,cursor:"pointer" }}
                          />
                          )
                        }
                          
                          <Link
                            href={`/partner/CampaignDetails?id=${project?.project_id}`}
                          >
                          <img
                            src="/ChannelPartner/download-file-white.svg"
                            alt
                            className=" cursor-pointer"
                            style={{ height: 17 }}
                          />
                          </Link>
                          
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
                ))
            }
            </div>
            )}
            <div className="fw-semibold" style={{ margin: "4px 4px 16px", fontSize: 18 }}>Digital Kit</div>
            <input
              ref={kitLogoInputRef}
              type="file"
              accept=".jpg,.jpeg,.png"
              onChange={pickKitLogo}
              style={{ display: "none" }}
            />
            <div className="d-flex flex-column gap-3">
              {!digitalKits.length && (
                <small className="text-muted">No digital kits uploaded yet.</small>
              )}
              {projects
                .filter((project) => digitalKits.some((kit) => String(kit.project_id) === String(project.project_id)))
                .map((project) => (
                  <div key={project.project_id} className="bg-white border rounded-3 p-3" style={{ boxShadow: "0 1px 4px rgba(38, 32, 59, 0.06)" }}>
                    {(() => {
                      const details = kitDetailsForProject(project.project_id);
                      const isEditing = canEditKit && kitEditProjectId === project.project_id;
                      const logoSrc = isEditing && pendingLogoPreview ? pendingLogoPreview : details.logoUrl;
                      return (
                        <div className="d-flex align-items-center gap-3 mb-3">
                          {logoSrc ? (
                            <span style={{ width: 48, height: 48, overflow: "hidden", flexShrink: 0, borderRadius: 8, background: "#F7F7F7", border: "1px solid #eee", padding: 4 }}>
                              <img
                                src={logoSrc}
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
                            <div className="fw-semibold text-truncate" style={{ fontSize: 14 }}>{project.project}</div>
                            {isEditing ? (
                              <div className="d-flex align-items-end gap-2 mt-1 flex-wrap">
                                <div>
                                  <label className="d-block mb-1" style={{ fontSize: 11, color: "#9C9AA5" }}>Phone number</label>
                                  <input
                                    type="text"
                                    value={contactDraft}
                                    autoFocus
                                    placeholder="Phone number"
                                    onChange={(e) => setContactDraft(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") saveKitEdit(project.project_id);
                                    }}
                                    style={{ height: 28, fontSize: 12, width: 160, border: "1px solid #ddd", borderRadius: 4, padding: "2px 8px" }}
                                  />
                                </div>
                                <div>
                                  <label className="d-block mb-1" style={{ fontSize: 11, color: "#9C9AA5" }}>RERA number</label>
                                  <input
                                    type="text"
                                    value={reraDraft}
                                    placeholder="RERA number"
                                    onChange={(e) => setReraDraft(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") saveKitEdit(project.project_id);
                                    }}
                                    style={{ height: 28, fontSize: 12, width: 160, border: "1px solid #ddd", borderRadius: 4, padding: "2px 8px" }}
                                  />
                                </div>
                                <button
                                  type="button"
                                  className="kit-action-btn"
                                  style={{ color: clientBtnColor, border: `1px solid ${clientBtnColor}`, background: "#fff" }}
                                  onClick={() => kitLogoInputRef.current?.click()}
                                >
                                  Logo
                                </button>
                              </div>
                            ) : (
                              <>
                                <div className="text-muted text-truncate" style={{ fontSize: 12 }}>{details.contact ? `Phone number ${details.contact}` : "No phone number"}</div>
                                <div className="text-muted text-truncate" style={{ fontSize: 12 }}>{details.rera ? `RERA number ${details.rera}` : "No RERA number"}</div>
                              </>
                            )}
                          </div>
                          {canEditKit && (
                            isEditing ? (
                              <button
                                type="button"
                                className="kit-action-btn flex-shrink-0"
                                style={{ color: "#fff", border: "none", background: clientBtnColor }}
                                onClick={() => saveKitEdit(project.project_id)}
                              >
                                Save
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="kit-action-btn flex-shrink-0"
                                style={{
                                  color: clientBtnColor,
                                  border: `1px solid ${clientBtnColor}`,
                                  background: "#fff",
                                }}
                                onClick={() => {
                                  if (pendingLogoPreview?.startsWith("blob:")) URL.revokeObjectURL(pendingLogoPreview);
                                  setPendingLogoFile(null);
                                  setPendingLogoPreview("");
                                  setKitEditProjectId(project.project_id);
                                  setContactDraft(details.contact || "");
                                  setReraDraft(details.rera || "");
                                }}
                              >
                                Edit
                              </button>
                            )
                          )}
                        </div>
                      );
                    })()}
                    <div className="d-flex flex-column gap-2">
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
                                }}
                              >
                                {item.kind}
                              </span>
                              <div className="overflow-hidden">
                                <div className="text-truncate" title={item.file_name}>{item.file_name}</div>
                                <small className="text-muted">{formatFileSize(Number(item.file_size || 0))}</small>
                              </div>
                            </div>
                            <div className="d-flex align-items-center gap-2">
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
        </section>
      </div>
      )
    }
      

      <Modal
        show={showModal}
        onHide={() => {
          if(isButtonLoading==true)
            {
              setEditMode(false)
              setProjectData("")
              setShowModal(false);
            }
        }}
        size="lg"
        centered
      >
        <Modal.Body>
          <form className="  d-flex flex-column gap-4 p-4 " onSubmit={(e)=>{
            e.preventDefault()
            editMode ?  updateProject():createProject()
           
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
                    disabled={true}
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
                <div className="w-50 d-flex justify-content-lg-between align-items-center">
                  <label className="w-27" style={{ color: "#9C9AA5" }}>
                    RERA Number*
                  </label>
                  <input
                    type="text"
                    value={projectData?.rera_number}
                    onChange={(e) => {
                      setProjectData({
                        ...projectData,
                        rera_number: e.target.value,
                      });
                    }}
                    placeholder="Enter RERA Number"
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
                    disabled
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
                    disabled
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
                    disabled
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
                    Contact No
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
                <div className="w-50" />
              </div>


              <div className="d-flex justify-content-between gap-5 align-items-center">
                
                <div className="w-50 d-flex justify-content-lg-between align-items-center">
                  <label className="w-27" style={{ color: "#9C9AA5" }}>
                    Property Logo
                  </label>
                  <input
                    type="file"
                    accept=".jpeg, .jpg, .png"
                    onChange={(e)=>{
                      handleFileChange(e,"logo","logo_preview")
                    }}
                    id="logoInput"
                    style={{ display: "none" }}
                  />
                  {projectData?.logo_preview ? 
                    <div className="relative">
                        <img src={projectData?.logo_preview} />
                        <span className="absolute top-0 right-0" onClick={()=>{
                          setProjectData({
                            ...projectData,
                            logo: null,
                            logo_preview:null
                          })
                        }}>
                            <Delete  style={{color: 'red',cursor:"pointer"}}/>
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

             

            </div>

            <div className="d-flex justify-content-center align-items-center gap-3 ">
              <button
              type="button"
              disabled={isButtonLoading}
                className="btn btn-danger rounded-5"
                onClick={() => {setShowModal(false); setProjectData(""); setEditMode(false); } }
              >
                Cancel
              </button>
              {
                editMode ?
                (
                    <button
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
                className="btn text-white rounded-5"
                style={{ background: clientBtnColor }}
              >
                Create
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

export default CampaignScreen;
