import axios from 'axios';
import { getCookie, hasCookie } from 'cookies-next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { Baseurl, filesUrl } from '../../../../Utils/Constants';
import { Modal } from 'react-bootstrap';
import { Delete, Download } from '@mui/icons-material';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useDispatch, useSelector } from 'react-redux';
import { startButtonLoading, stopButtonLoading } from '../../../../store/buttonLoaderSlice';
import Loader from '../../../Loader/Loader';

const CampaignDetailsScreen = () => {
  const router = useRouter();
  const { id } = router.query;
  const [showModal, setShowModal] = useState(false);
  const [loader, setLoader] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const contentRef = useRef(null);

  const clientBtnColor = hasCookie("clientBtnColor") ? getCookie("clientBtnColor") : "#293790";
  const clientLogo = getCookie('clientLogo') ? JSON.parse(getCookie('clientLogo')) : null;
  const userInfo = hasCookie("userInfo") ? JSON.parse(getCookie("userInfo")) : null;
  // RERA Number is only for Channel Partner profile (role_id 1), not BST
  const isCpProfile = Number(userInfo?.role_id) === 1;
  
  const dispatch = useDispatch();
  const { isButtonLoading } = useSelector((state) => state.buttonLoader);

  const [projectData, setProjectData] = useState({
    project: "",
    project_id: null,
    location: "",
    property_size: "",
    unit_area: "",
    price: "",
    contact_no: "",
    rera_number: "",
    file: null,
    file_preview: "",
    logo: null,
    logo_preview: null,
    template: null,
    template_name: null,
    htmlString: ""
  });

  useEffect(() => {
    if (id) {
      getCampaignById();
    }
  }, [id]);

  const getCampaignById = async () => {
    setLoader(true);
    if (hasCookie("token")) {
      const token = getCookie("token");
      const db_name = getCookie("db_name");

      const header = {
        headers: {
          Accept: "application/json",
          Authorization: "Bearer ".concat(token),
          db: db_name,
          m_id: 76,
        },
      };

      try {
        const response = await axios.get(
          Baseurl + `/db/channel/project?project_id=${id}`,
          header
        );
        const campaign = response?.data?.data?.projectData;
        if (response?.status === 200 || response?.status === 201) {
          let htmlContent = response?.data?.data?.htmlTemplate || "";
          
          // If htmlTemplate is empty but html_file exists, fetch the HTML file directly
          if (!htmlContent && campaign?.html_file) {
            try {
              const htmlFileUrl = `${filesUrl}/projectHtml/html/${campaign.html_file}`;
              const htmlResponse = await fetch(htmlFileUrl);
              if (htmlResponse.ok) {
                htmlContent = await htmlResponse.text();
              }
            } catch (htmlError) {
              console.log("Could not fetch HTML file:", htmlError);
            }
          }

          setProjectData({
            project: campaign?.project,
            project_id: campaign?.project_id,
            location: campaign?.location,
            property_size: campaign?.property_size,
            unit_area: campaign?.unit_area,
            price: campaign?.price,
            contact_no: campaign?.contact_no,
            rera_number: campaign?.rera_number || "",
            file: campaign?.cover_image,
            file_preview: campaign?.cover_image ? `${filesUrl}/project/images${campaign?.cover_image}` : null,
            logo: campaign?.logo_image,
            logo_preview: campaign?.logo_image ? `${filesUrl}/projectLogo/images${campaign?.logo_image}` : null,
            template: campaign?.html_file,
            template_name: campaign?.html_file,
            htmlString: htmlContent
          });
        }
      } catch (error) {
        console.log(error);
        toast.error(error?.response?.data?.message || "Something went wrong!", { autoClose: 2500 });
      } finally {
        setLoader(false);
      }
    }
  };

  // Download PDF function
  const downloadPdf = async () => {
    const reraNumber = projectData?.rera_number?.toString().trim();
    if (isCpProfile && !reraNumber) {
      toast.warning("Please enter and save RERA Number before downloading PDF", { autoClose: 3000 });
      return;
    }

    setPdfLoading(true);
    toast.info('Generating PDF...', { autoClose: 2000 });

    try {
      // Create a temporary container with all content for PDF capture
      const tempContainer = document.createElement('div');
      tempContainer.style.cssText = 'position: fixed; left: 0; top: 0; width: 900px; background: #fff; padding: 30px; z-index: -9999;';
      
      // Build the PDF content HTML - footer added separately via jsPDF for reliability
      tempContainer.innerHTML = `
        ${projectData?.logo_preview ? `
          <div style="display: flex; justify-content: center; align-items: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #eee;">
            <img src="${projectData?.logo_preview}" style="max-height: 60px;" />
          </div>
        ` : ''}
        
        ${projectData?.file_preview ? `
          <div style="margin-bottom: 25px; text-align: center;">
            <img src="${projectData?.file_preview}" style="max-width: 100%; max-height: 400px; border-radius: 8px; object-fit: cover;" />
          </div>
        ` : ''}
        
        <div style="text-align: center; margin-bottom: 25px;">
          <h1 style="color: ${clientBtnColor}; font-size: 32px; font-weight: bold; margin: 0;">${projectData?.project || 'Campaign'}</h1>
        </div>
        
        ${projectData?.htmlString ? `
          <div style="padding: 20px; background: #fafafa; border-radius: 8px; margin-bottom: 25px; border: 1px solid #eee;">
            ${projectData?.htmlString}
          </div>
        ` : ''}
      `;

      document.body.appendChild(tempContainer);

      // Wait for images to load
      const images = tempContainer.querySelectorAll('img');
      await Promise.all([...images].map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      }));

      // Small delay to ensure rendering
      await new Promise(resolve => setTimeout(resolve, 300));

      // Capture with html2canvas
      const canvas = await html2canvas(tempContainer, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowHeight: tempContainer.scrollHeight
      });

      // Remove temp container
      document.body.removeChild(tempContainer);

      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const footerHeight = 15;
      const contentHeight = pageHeight - 20 - footerHeight;
      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 10;

      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= contentHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= contentHeight;
      }

      // Add RERA footer on the last page (CP profile only)
      if (isCpProfile && reraNumber) {
        const totalPages = pdf.internal.getNumberOfPages();
        pdf.setPage(totalPages);
        pdf.setDrawColor(224, 224, 224);
        pdf.line(10, pageHeight - footerHeight, pageWidth - 10, pageHeight - footerHeight);
        pdf.setFontSize(11);
        pdf.setTextColor(51, 51, 51);
        const footerText = `RERA Number: ${reraNumber}`;
        const textWidth = pdf.getTextWidth(footerText);
        pdf.text(footerText, (pageWidth - textWidth) / 2, pageHeight - 6);
      }

      pdf.save(`${projectData?.project || 'Campaign'}-Template.pdf`);
      toast.success('PDF downloaded successfully!', { autoClose: 2500 });
    } catch (error) {
      console.error('PDF Error:', error);
      toast.error('Error generating PDF');
    } finally {
      setPdfLoading(false);
    }
  };

  const updateProject = async () => {
    if (isCpProfile && !projectData?.rera_number?.toString().trim()) {
      return toast.warning("Please enter RERA Number", { autoClose: 2500 });
    }
    const contactNo = projectData?.contact_no?.toString().trim();
    if (contactNo && contactNo.length !== 10) {
      return toast.warning("Contact no should be of 10 digits", { autoClose: 2500 });
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
      dispatch(startButtonLoading());
      const response = await axios.post(`${Baseurl}/db/channel/project/usertemplate`, formData, {
        ...header,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        transformRequest: [(data) => data], // Don't transform FormData
        // Don't set Content-Type - let browser set it with boundary for FormData
      });
      if (response.status === 200 || response.status === 201) {
        toast.success(response?.data?.message, { autoClose: 2500 });
        dispatch(stopButtonLoading());
        setShowModal(false);
        getCampaignById();
      }
    } catch (error) {
      dispatch(stopButtonLoading());
      toast.error(error?.response?.data?.message || "Something went wrong!", { autoClose: 2500 });
    }
  };

  const handleFileChange = (e, field, fieldPreview) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/jpg', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      toast.warning('Please upload .jpg, .jpeg, or .png files', { autoClose: 2500 });
      e.target.value = "";
      return;
    }
    setProjectData({ ...projectData, [field]: file, [fieldPreview]: URL.createObjectURL(file) });
    e.target.value = "";
  };

  return (
    <>
      {loader ? (
        <div style={{ padding: "2rem", width: "100%" }}><Loader /></div>
      ) : (
        <div style={{ 
          padding: "1rem", 
          width: "100%", 
          background: "#f5f5f5", 
          height: "100vh", 
          overflow: "auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center"
        }}>
          {/* Centered Container */}
          <div style={{ width: "100%", maxWidth: "1000px", padding: "0 15px" }}>
            
            {/* Action Buttons */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginBottom: "15px" }}>
              {hasCookie("channel") && userInfo?.role_id == 1 && (
                <button
                  onClick={() => { setShowModal(true); getCampaignById(id); }}
                  style={{
                    background: clientBtnColor,
                    color: "white",
                    border: "none",
                    padding: "8px 16px",
                    borderRadius: "5px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px"
                  }}
                >
                  Edit
                </button>
              )}
              <button
                onClick={downloadPdf}
                disabled={pdfLoading}
                style={{
                  background: pdfLoading ? "#ccc" : "#28a745",
                  color: "white",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: "5px",
                  cursor: pdfLoading ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px"
                }}
              >
                {pdfLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download style={{ fontSize: "18px" }} />
                    Download PDF
                  </>
                )}
              </button>
            </div>

            {/* Campaign Preview Content */}
            <div
              ref={contentRef}
              style={{
                background: "#ffffff",
                padding: "25px",
                borderRadius: "10px",
                boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                width: "100%"
              }}
            >
            {/* Header with Logo */}
            {projectData?.logo_preview && (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", marginBottom: "20px", paddingBottom: "15px", borderBottom: "2px solid #eee" }}>
                <img src={projectData?.logo_preview} alt="Project Logo" style={{ maxHeight: "60px" }} />
              </div>
            )}

            {/* Cover Image */}
            {projectData?.file_preview && (
              <div style={{ marginBottom: "25px", textAlign: "center" }}>
                <img 
                  src={projectData?.file_preview} 
                  alt="Cover Image" 
                  style={{ 
                    maxWidth: "100%", 
                    maxHeight: "400px", 
                    borderRadius: "8px",
                    objectFit: "cover"
                  }} 
                />
              </div>
            )}

            {/* Project Title */}
            <div style={{ textAlign: "center", marginBottom: "25px" }}>
              <h1 style={{ color: clientBtnColor, fontSize: "32px", fontWeight: "bold", margin: "0" }}>
                {projectData?.project || "Campaign"}
              </h1>
            </div>

            {/* HTML Template Content */}
            {projectData?.htmlString ? (
              <iframe
                srcDoc={projectData?.htmlString}
                style={{
                  width: "100%",
                  minHeight: "500px",
                  height: "auto",
                  border: "1px solid #eee",
                  borderRadius: "8px",
                  marginBottom: "25px",
                  background: "#fff",
                  overflow: "auto"
                }}
                title="Campaign Template"
                scrolling="yes"
              />
            ) : (
              <div style={{
                padding: "40px 20px",
                background: "#f8f9fa",
                borderRadius: "8px",
                marginBottom: "25px",
                border: "1px dashed #dee2e6",
                textAlign: "center"
              }}>
                <p style={{ color: "#6c757d", margin: 0, fontSize: "16px" }}>
                  {projectData?.template_name ? "HTML template uploaded but content not available" : "No HTML template uploaded"}
                </p>
              </div>
            )}

            {/* Project Details */}
            <div style={{ marginBottom: "25px" }}>
              <h3 style={{ color: clientBtnColor, marginBottom: "15px", fontSize: "20px" }}>Project Details</h3>
              <div style={{ background: "#f8f9fa", padding: "20px", borderRadius: "8px", border: "1px solid #dee2e6" }}>
                <div style={{ display: "flex", marginBottom: "15px" }}>
                  <span style={{ color: "#6c757d", fontWeight: "600", width: "150px" }}>Property Name:</span>
                  <span style={{ color: clientBtnColor, fontWeight: "600" }}>{projectData?.project || "N/A"}</span>
                </div>
                {isCpProfile && (
                  <div style={{ display: "flex", marginBottom: "15px" }}>
                    <span style={{ color: "#6c757d", fontWeight: "600", width: "150px" }}>RERA Number:</span>
                    <span style={{ color: "#333", fontWeight: "600" }}>{projectData?.rera_number || "N/A"}</span>
                  </div>
                )}
                {projectData?.location && (
                  <div style={{ display: "flex", marginBottom: "15px" }}>
                    <span style={{ color: "#6c757d", fontWeight: "600", width: "150px" }}>Location:</span>
                    <span style={{ color: "#333", fontWeight: "600" }}>{projectData?.location}</span>
                  </div>
                )}
                {projectData?.property_size && (
                  <div style={{ display: "flex", marginBottom: "15px" }}>
                    <span style={{ color: "#6c757d", fontWeight: "600", width: "150px" }}>Property Size:</span>
                    <span style={{ color: "#333", fontWeight: "600" }}>{projectData?.property_size}</span>
                  </div>
                )}
                {projectData?.unit_area && (
                  <div style={{ display: "flex", marginBottom: "15px" }}>
                    <span style={{ color: "#6c757d", fontWeight: "600", width: "150px" }}>Unit Area:</span>
                    <span style={{ color: "#333", fontWeight: "600" }}>{projectData?.unit_area}</span>
                  </div>
                )}
                {projectData?.price && (
                  <div style={{ display: "flex", marginBottom: "15px" }}>
                    <span style={{ color: "#6c757d", fontWeight: "600", width: "150px" }}>Price:</span>
                    <span style={{ color: "#333", fontWeight: "600" }}>{projectData?.price}</span>
                  </div>
                )}
                <div style={{ display: "flex", marginBottom: "15px" }}>
                  <span style={{ color: "#6c757d", fontWeight: "600", width: "150px" }}>Contact No:</span>
                  <span style={{ color: "#28a745", fontWeight: "600" }}>+91-{projectData?.contact_no || "N/A"}</span>
                </div>
              </div>
            </div>

            {/* Contact Footer */}
            <div style={{
              background: clientBtnColor,
              color: "white",
              padding: "25px",
              borderRadius: "8px"
            }}>
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                {isCpProfile && projectData?.rera_number && (
                  <p style={{ margin: 0, fontSize: "14px" }}><strong>RERA Number:</strong> {projectData.rera_number}</p>
                )}
              </div>
            </div>
            </div>

            {/* Back Button */}
            <div style={{ display: "flex", justifyContent: "center", marginTop: "20px", marginBottom: "20px" }}>
              <Link
                href="/partner/Campaign"
                style={{
                  background: clientBtnColor,
                  color: "white",
                  padding: "10px 25px",
                  borderRadius: "25px",
                  textDecoration: "none",
                  fontWeight: "500"
                }}
              >
                Back to Campaigns
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <Modal show={showModal} onHide={() => !isButtonLoading && setShowModal(false)} size="lg" centered>
        <Modal.Body>
          <form className="d-flex flex-column gap-4 p-4" onSubmit={(e) => { e.preventDefault(); updateProject(); }}>
            <div className="text-center fs-4" style={{ color: clientBtnColor }}>Edit Details</div>

            <div className="d-flex flex-column gap-3">
              <div className="d-flex justify-content-between gap-5 align-items-center">
                <div className="w-50 d-flex justify-content-lg-between align-items-center">
                  <label className="w-27" style={{ color: "#9C9AA5" }}>Property Name</label>
                  <input
                    type="text"
                    disabled
                    value={projectData?.project}
                    style={{ outline: "none" }}
                    className="w-73 border p-2 rounded-md text-black"
                  />
                </div>
                {isCpProfile && (
                  <div className="w-50 d-flex justify-content-lg-between align-items-center">
                    <label className="w-27" style={{ color: "#9C9AA5" }}>RERA Number*</label>
                    <input
                      type="text"
                      value={projectData?.rera_number}
                      onChange={(e) => setProjectData({ ...projectData, rera_number: e.target.value })}
                      placeholder="Enter RERA Number"
                      style={{ outline: "none" }}
                      className="w-73 border p-2 rounded-md text-black"
                    />
                  </div>
                )}
              </div>

              <div className="d-flex justify-content-between gap-5 align-items-center">
                <div className="w-50 d-flex justify-content-lg-between align-items-center">
                  <label className="w-27" style={{ color: "#9C9AA5" }}>Contact No</label>
                  <input
                    type="text"
                    value={projectData?.contact_no}
                    onChange={(e) => setProjectData({ ...projectData, contact_no: e.target.value })}
                    placeholder="+91-8787675466"
                    style={{ outline: "none" }}
                    className="w-73 border p-2 rounded-md text-black"
                  />
                </div>
                {/* <div className="w-50" /> */}
              </div>

              <div className="d-flex justify-content-between gap-5 align-items-center">
                <div className="w-50 d-flex justify-content-lg-between align-items-center">
                  <label className="w-27" style={{ color: "#9C9AA5" }}>Property Logo</label>
                  <input type="file" accept=".jpeg, .jpg, .png" onChange={(e) => handleFileChange(e, "logo", "logo_preview")} id="logoInput" style={{ display: "none" }} />
                  {projectData?.logo_preview ? (
                    <div className="relative">
                      <img src={projectData?.logo_preview} style={{ maxHeight: "60px" }} />
                      <span className="absolute top-0 right-0" onClick={() => setProjectData({ ...projectData, logo: null, logo_preview: null })}>
                        <Delete style={{ color: 'red', cursor: 'pointer' }} />
                      </span>
                    </div>
                  ) : (
                    <label htmlFor="logoInput" className="w-73 border p-2 ps-1 rounded-md text-black" style={{ cursor: "pointer" }}>
                      Click to choose file
                    </label>
                  )}
                </div>
              </div>
            </div>

            <div className="d-flex justify-content-center align-items-center gap-3">
              <button type="button" disabled={isButtonLoading} className="btn btn-danger rounded-5" onClick={() => { setShowModal(false); getCampaignById(); }}>
                Cancel
              </button>
              <button type="submit" disabled={isButtonLoading} className="btn text-white rounded-5" style={{ background: clientBtnColor }}>
                {isButtonLoading ? (<><span className="spinner-border spinner-border-sm" />&nbsp;Updating...</>) : 'Update'}
              </button>
            </div>
          </form>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default CampaignDetailsScreen;
