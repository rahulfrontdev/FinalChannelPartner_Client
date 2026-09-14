import React, { useEffect, useState } from "react";
import Select from "react-select";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import axios from "axios";
import { Baseurl, filesUrl } from "../../../Utils/Constants";
import { getCookie, hasCookie, setCookie } from "cookies-next";
import { useDispatch, useSelector } from "react-redux";
import { startButtonLoading, stopButtonLoading } from "../../../store/buttonLoaderSlice";
import Loader from "../../Loader/Loader";


const ChannelSignUpScreen = () => {
  // const CP_LEAD_STATUS_URL = "https://admin.theprosperity.in/api/v1/db/channelPartnerLeads/";
  const CP_LEAD_STATUS_URL = `${Baseurl}/db/channelPartnerLeads/`;
  const [formFields, setFormFields] = useState({
    id: "",
    cpl_id: "",
    db_name: "",
    token: "",
    aadhar: "",
    pan: "",
    rera: "",
    cheque: "",
    name: "",
    user_l_name: "",
    email: "",
    mobile: "",
    isTokenVerified: false,
    isUploadVerified: false,
    organisation: "",
    country_id: 101,
    state_id: "",
    city_id: "",
    address: "",
    gst: "",
  });
  const [statelist, setStatelist] = useState([]);
  const [citylist, setCitylist] = useState([]);
  const [clientData, setClientData] = useState();
  const { isButtonLoading } = useSelector((state) => state.buttonLoader)
  const dispatch = useDispatch()
  const [tokenLoading, setTokenLoading] = useState(false)
  const [agreementAccepted, setAgreementAccepted] = useState(false);

  const router = useRouter();

  useEffect(() => {
    // Keep acceptance state even if user opens agreement in another page
    // and comes back.
    try {
      if (typeof window !== "undefined") {
        const stored = window.localStorage.getItem("cpAgreementAccepted");
        if (stored === "true") setAgreementAccepted(true);
      }
    } catch (e) {
      // Ignore localStorage issues
    }
  }, []);

  useEffect(() => {
    const { token } = router.query;
    if (token) {
      verifyToken(token);
    }
  }, [router.query.token]);

  const decodeJwtPayload = (token) => {
    try {
      const parts = String(token || "").split(".");
      if (parts.length < 2) return null;
      const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
      const decoded = JSON.parse(atob(padded));
      return decoded;
    } catch (e) {
      return null;
    }
  };

  const verifyToken = async (token) => {
    try {
      setTokenLoading(true)
      const tokenPayload = decodeJwtPayload(token) || {};
      const tokenCplId =
        tokenPayload?.cpl_id || tokenPayload?.cplId || tokenPayload?.lead_id || tokenPayload?.id || "";
      const tokenDbName =
        tokenPayload?.db_name || tokenPayload?.dbName || "";

      const { data } = await axios.post(
        Baseurl + `/db/users/cp/registrationToken/verification`,
        { token }
      );
      if (data.status === 200) {
        const preFill = data?.data?.preFillData || {};
        if (data?.data?.doc_verification === 0) {
          setTokenLoading(false)
          toast.success(data?.message, { autoClose: 2500 });
          setFormFields((prev) => ({
            ...prev,
            // basic details – prefer preFillData if present
            name: preFill.first_name || data?.data?.user || "",
            user_l_name: preFill.last_name || data?.data?.user_l_name || "",
            mobile: preFill.contact || data?.data?.contact_number || "",
            email: preFill.email || data?.data?.email || "",
            id: data?.data?.user_id,
            cpl_id:
              tokenCplId || preFill?.cpl_id || preFill?.cplId || data?.data?.cpl_id || data?.data?.cplId || "",
            db_name: tokenDbName || preFill?.db_name || data?.data?.db_name || "",
            token: token,
            isTokenVerified: true,
            // prefill location/details coming from lead registration
            organisation: data?.data?.organisation || "",
            state_id: preFill.state_id || data?.data?.state_id || "",
            city_id: preFill.city_id || data?.data?.city_id || "",
            address: data?.data?.address || "",
            gst: data?.data?.gst || "",
          }));
        } else if (data?.data?.doc_verification === 1) {
          setTokenLoading(false)
          toast.success("Pending for verification", { autoClose: 2500 });
          setFormFields((prev) => ({
            ...prev,
            name: data?.data?.user || "",
            user_l_name: data?.data?.user_l_name || "",
            mobile: data?.data?.contact_number || "",
            email: data?.data?.email || "",
            cpl_id:
              tokenCplId || data?.data?.cpl_id || data?.data?.cplId || "",
            db_name: tokenDbName || data?.data?.db_name || "",
            pan: data?.data?.db_user_profile?.pan_file || null,
            aadhar: data?.data?.db_user_profile?.aadhar_file || null,
            rera: data?.data?.db_user_profile?.rera_file || null,
            cheque: data?.data?.db_user_profile?.c_cheque_file || null,
            isTokenVerified: true,
            isUploadVerified: true,
            organisation: data?.data?.organisation || "",
            state_id: data?.data?.state_id || "",
            city_id: data?.data?.city_id || "",
            address: data?.data?.address || "",
            gst: data?.data?.gst || "",
          }));
          setInterval(() => {
            router.push("/partner")
          }, [1500])
        } else if (data?.data?.doc_verification === 2) {
          setTokenLoading(false)
          toast.success("Documents Verified", { autoClose: 2500 });
          setFormFields((prev) => ({
            ...prev,
            name: data?.data?.user || "",
            user_l_name: data?.data?.user_l_name || "",
            mobile: data?.data?.contact_number || "",
            email: data?.data?.email || "",
            cpl_id:
              tokenCplId || data?.data?.cpl_id || data?.data?.cplId || "",
            db_name: tokenDbName || data?.data?.db_name || "",
            pan: data?.data?.db_user_profile?.pan_file || null,
            aadhar: data?.data?.db_user_profile?.aadhar_file || null,
            rera: data?.data?.db_user_profile?.rera_file || null,
            cheque: data?.data?.db_user_profile?.c_cheque_file || null,
            isTokenVerified: true,
            isUploadVerified: true,
            organisation: data?.data?.organisation || "",
            state_id: data?.data?.state_id || "",
            city_id: data?.data?.city_id || "",
            address: data?.data?.address || "",
            gst: data?.data?.gst || "",
          }));
          setInterval(() => {
            router.push("/partner")
          }, [1500])
        } else {
          setTokenLoading(false)
          toast.success("Documents Rejected", { autoClose: 2500 });
          setFormFields((prev) => ({
            ...prev,
            name: data?.data?.user || "",
            user_l_name: data?.data?.user_l_name || "",
            mobile: data?.data?.contact_number || "",
            email: data?.data?.email || "",
            cpl_id:
              tokenCplId || data?.data?.cpl_id || data?.data?.cplId || "",
            db_name: tokenDbName || data?.data?.db_name || "",
            pan: data?.data?.db_user_profile?.pan_file || null,
            aadhar: data?.data?.db_user_profile?.aadhar_file || null,
            rera: data?.data?.db_user_profile?.rera_file || null,
            cheque: data?.data?.db_user_profile?.c_cheque_file || null,
            isTokenVerified: true,
            isUploadVerified: true,
            organisation: data?.data?.organisation || "",
            state_id: data?.data?.state_id || "",
            city_id: data?.data?.city_id || "",
            address: data?.data?.address || "",
            gst: data?.data?.gst || "",
          }));
          setInterval(() => {
            router.push("/partner")
          }, [1500])
        }

      }
    } catch (error) {
      setTokenLoading(false)
      console.log(error)
      const errorMessage =
        error?.response?.data?.message || "Something went wrong!";
      toast.error(errorMessage, { autoClose: 2500 });
    }
  };

  const updateCpLeadAgreementStatus = async (isAccepted) => {
    try {
      const userInfo = hasCookie("userInfo") ? getCookie("userInfo") : null;
      const tokenPayload = decodeJwtPayload(formFields?.token) || {};
      const tokenCplId =
        tokenPayload?.cpl_id || tokenPayload?.cplId || tokenPayload?.lead_id || tokenPayload?.id || "";
      const tokenDbName =
        tokenPayload?.db_name || tokenPayload?.dbName || "";
      const dbName =
        tokenDbName ||
        formFields?.db_name ||
        clientData?.db_name ||
        getCookie("db_name") ||
        userInfo?.db_name ||
        "";
      const tokenToSend = getCookie("token") || formFields?.token;
      if (!tokenToSend) {
        toast.error("No token found. Please reopen the signup link.", { autoClose: 2000 });
        return;
      }
      if (!dbName) {
        toast.error("db_name not found. Please reopen the signup link.", { autoClose: 2000 });
        return;
      }

      let leadId = tokenCplId || formFields?.cpl_id || router?.query?.cpl_id || "";

      // If token verification doesn't return cpl_id, fetch it using user_id/email/mobile.
      if (!leadId) {
        // const localBase = "https://admin.theprosperity.in/api/v1";
        const localBase = Baseurl;
        const listUrl = `${localBase}/db/channelPartnerLeads?db_name=${encodeURIComponent(dbName)}`;

        const headersForList = {
          Accept: "application/json",
          Authorization: `Bearer ${tokenToSend}`,
          db: dbName,
          pass: "pass",
        };

        const listRes = await axios.get(listUrl, { headers: headersForList });
        const leads = listRes?.data?.data || listRes?.data || [];

        const userId = formFields?.id ? Number(formFields.id) : null;
        const email = formFields?.email;
        const mobile = formFields?.mobile;

        const matchedLead =
          leads?.find((l) => userId && Number(l?.user_id) === userId) ||
          leads?.find((l) => email && String(l?.email || "").toLowerCase() === String(email).toLowerCase()) ||
          leads?.find((l) => mobile && String(l?.contact || l?.contact_number || "").toString() === String(mobile).toString());

        leadId = matchedLead?.cpl_id || matchedLead?.cplId || "";
      }

      if (!leadId) {
        toast.error("cpl_id not found for this user. Please check the token/link payload.", { autoClose: 2500 });
        return;
      }

      const cplIdToSend = parseInt(String(leadId), 10);
      if (!cplIdToSend) {
        toast.error("Invalid cpl_id found for status update.", { autoClose: 2500 });
        return;
      }

      const stageToSend = isAccepted ? "Accept" : "Reject";

      const headers = {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenToSend}`,
        db: dbName,
        pass: "pass",
      };

      const payload = {
        db_name: String(dbName || ""),
        cpl_id: cplIdToSend,
        stage: stageToSend,
      };

      // Explicit endpoint requested for CP lead status update.
      console.log("CP lead status payload:", payload);
      await axios.put(CP_LEAD_STATUS_URL, payload, { headers });
      toast.success(
        isAccepted ? "Accepted successfully" : "Not accepted successfully",
        { autoClose: 1500 }
      );
    } catch (error) {
      console.log("Agreement status sync failed", error?.response?.data || error?.message);
      toast.error(
        error?.response?.data?.message || "Agreement status API failed",
        { autoClose: 2000 }
      );
    }
  };

  const isValidFileType = (file) => {
    const validTypes = ['image/png', 'image/jpeg'];
    return file && validTypes.includes(file.type);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!agreementAccepted) {
      dispatch(stopButtonLoading())
      return toast.warning("Please accept the agreement before submitting.", { autoClose: 2500 });
    }
    if (formFields?.name == "" || formFields.user_l_name == "" || formFields.organisation == "" || formFields.mobile == "" || formFields.email == "" || formFields.state_id == "" || formFields.city_id == "" || formFields.address == "" || formFields.aadhar == "" || formFields.pan == "" || formFields.rera == "" || formFields.cheque == "") {
      dispatch(stopButtonLoading())
      return toast.warning("Pls Fill All Mandatory Fields", { autoClose: 2500 });
    }
    if (
      !isValidFileType(formFields.aadhar) ||
      !isValidFileType(formFields.pan) ||
      !isValidFileType(formFields.rera) ||
      (formFields.cheque && !isValidFileType(formFields.cheque))
    ) {
      dispatch(stopButtonLoading());
      return toast.warning("Please upload files in PNG or JPEG format.", { autoClose: 2500 });
    }

    try {
      dispatch(startButtonLoading())
      if (!formFields.aadhar || !formFields.pan || !formFields.rera) {
        toast.error("Aadhar, PAN, and RERA are required.", { autoClose: 2500 });
        dispatch(stopButtonLoading())
        return;
      }
      const formData = new FormData();
      formData.append("id", formFields.id);
      formData.append("token", formFields.token);
      // Send agreement acceptance status to the server
      formData.append("agreementAccepted", agreementAccepted ? "true" : "false");
      formData.append("termsAccepted", agreementAccepted ? "true" : "false");
      formData.append("aadhar", formFields.aadhar);
      formData.append("pan", formFields.pan);
      formData.append("rera", formFields.rera);

      if (formFields.cheque) {
        formData.append("cheque", formFields.cheque);
      }

      formData.append("name", formFields.name);
      formData.append("user_l_name", formFields.user_l_name);
      formData.append("email", formFields.email);
      formData.append("mobile", formFields.mobile);
      formData.append("address", formFields.address);
      formData.append("city_id", formFields.city_id);
      formData.append("state_id", formFields.state_id);
      formData.append("organisation", formFields.organisation);
      formData.append("gst", formFields.gst);


      const { data } = await axios.put(
        Baseurl + `/db/users/cp/completeRegistration`,
        formData
      );
      if (data.status === 200) {
        dispatch(stopButtonLoading())
        toast.success(data?.message, { autoClose: 2500 });
        setFormFields({ ...formFields, isSubmitted: true });
        router.push("/ChannelPartnerRegister_Next");
      }
    } catch (error) {
      dispatch(stopButtonLoading())
      console.log(error?.response?.data);
      const errorMessage =
        error?.response?.data?.message || "Something went wrong!";
      toast.error(errorMessage, { autoClose: 2500 });
    }
  };

  // Only states enabled in Settings → State master
  const getState = async () => {
    try {
      const token = getCookie("token");
      const db_name = getCookie("db_name");
      const header = token
        ? {
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
              db: db_name,
              pass: "pass",
            },
          }
        : { headers: { Accept: "application/json" } };

      const response = await axios.get(
        `${Baseurl}/db/admin/state/available?country_id=101`,
        header
      );

      let states = [];
      if (Array.isArray(response.data?.data)) {
        states = response.data.data;
      } else if (Array.isArray(response.data)) {
        states = response.data;
      }

      const enabledStates = states.filter(
        (state) =>
          state.is_available === true ||
          state.is_available === 1 ||
          state.is_active === true ||
          state.is_active === 1 ||
          state.is_enabled === true ||
          state.is_enabled === 1
      );

      setStatelist(enabledStates);
    } catch (error) {
      console.error("Error fetching states:", error);
      setStatelist([]);
      toast.error("Failed to load states. Please refresh the page.", { autoClose: 2500 });
    }
  };

  // Only cities enabled in Settings → City master for selected state
  const getcity = async (id) => {
    if (!id) {
      setCitylist([]);
      return;
    }

    try {
      const token = getCookie("token");
      const db_name = getCookie("db_name");
      const header = token
        ? {
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
              db: db_name,
              pass: "pass",
            },
          }
        : { headers: { Accept: "application/json" } };

      const response = await axios.get(
        `${Baseurl}/db/area/city/active?state_id=${id}`,
        header
      );

      const responseData = response.data?.data;
      let cities = [];
      if (Array.isArray(responseData)) {
        cities = responseData;
      } else if (Array.isArray(responseData?.cityData)) {
        cities = responseData.cityData;
      } else if (Array.isArray(response.data)) {
        cities = response.data;
      }

      const enabledCities = cities.filter(
        (city) =>
          city.is_available === true ||
          city.is_available === 1 ||
          city.is_active === true ||
          city.is_active === 1 ||
          city.is_enabled === true ||
          city.is_enabled === 1 ||
          // active endpoint may already return only enabled cities
          (city.is_available === undefined &&
            city.is_active === undefined &&
            city.is_enabled === undefined)
      );

      setCitylist(enabledCities);
    } catch (error) {
      console.error("Error fetching cities:", error);
      setCitylist([]);
      toast.error("Failed to load cities for selected state.", { autoClose: 2500 });
    }
  };

  const handleFileChange = (event, field) => {
    const file = event.target.files[0];
    console.log("Selected file:", file); // Check the selected file in the console
    if (file) {
      setFormFields({ ...formFields, [field]: file });
    }
  };

  const inputFields = [
    { label: "Aadhar Card*", field: "aadhar" },
    { label: "PAN Card*", field: "pan" },
    { label: "RERA License*", field: "rera" },
    { label: "Cancelled Cheque*", field: "cheque" },
  ];

  useEffect(() => {
    getState();
  }, []);

  useEffect(() => {
    if (formFields.state_id) {
      getcity(formFields.state_id);
    } else {
      setCitylist([]);
    }
  }, [formFields.state_id]);

  useEffect(() => {
    const getSignInData = async () => {
      try {
        const baseUrl = "http://18.61.246.105";
        const { data } = await axios.post(Baseurl + "/db/admin/url", {
          client_url: `${baseUrl}`,
        })
        setClientData(data?.data)
      } catch (error) {
        console.log(error)
      }
    }
    getSignInData()
  }, [])

  return (
    <>
      {
        tokenLoading ? <Loader /> :
          (
            <section className="Sign-Up pt-4" style={{ padding: '0 16px' }}>
              <div className="container">
                <div className="row">
                  <div className="col-12 col-md-7">
                    <div className="row gx-3">
                      <div className="Sign-In-logo pb-4">
                        <img src={
                          clientData?.logo
                            ? `${filesUrl}` +
                            `/logo/images${clientData?.logo}`
                            : "/ChannelPartner/logo.png"
                        } alt="normal" />
                      </div>
                      <div className="col-6">
                        <div
                          style={{
                            height: 320,
                            width: "100%",
                            // backgroundImage: "url(/ChannelPartner/signup-img1.png)",
                            backgroundImage: clientData?.client_image_1 ? `url(${filesUrl}/clientdoc/images${clientData?.client_image_1}` : `url(/ChannelPartner/signup-img1.png)`,
                            backgroundRepeat: "no-repeat",
                            backgroundSize: "cover",
                            marginBottom: 15,
                            borderTopLeftRadius: 10,
                          }}
                        ></div>
                        <div
                          style={{
                            height: 336,
                            width: "100%",
                            // backgroundImage: "url(/ChannelPartner/signup-img3.png)",
                            backgroundImage: clientData?.client_image_2 ? `url(${filesUrl}/clientdoc/images${clientData?.client_image_2}` : `url(/ChannelPartner/signup-img3.png)`,
                            backgroundRepeat: "no-repeat",
                            backgroundSize: "cover",
                            marginBottom: 15,
                            borderBottomLeftRadius: 10,
                          }}
                        ></div>
                        <div></div>
                      </div>
                      <div className="col-6">
                        <div
                          style={{
                            height: 176,
                            width: "100%",
                            // backgroundImage: "url(/ChannelPartner/signup-img2.png)",
                            backgroundImage: clientData?.client_image_3 ? `url(${filesUrl}/clientdoc/images${clientData?.client_image_3}` : `url(/ChannelPartner/signup-img2.png)`,
                            backgroundRepeat: "no-repeat",
                            backgroundSize: "cover",
                            marginBottom: 15,
                            borderTopRightRadius: 10,
                          }}
                        ></div>
                        <div
                          style={{
                            height: 368,
                            width: "100%",
                            // backgroundImage: "url(/ChannelPartner/signup-img4.png)",
                            backgroundImage: clientData?.client_image_4 ? `url(${filesUrl}/clientdoc/images${clientData?.client_image_4}` : `url(/ChannelPartner/signup-img4.png)`,
                            backgroundRepeat: "no-repeat",
                            backgroundSize: "cover",
                            marginBottom: 15,
                            borderBottomRightRadius: 10,
                          }}
                        ></div>
                      </div>
                      <div className="col-12 d-flex gap-3">
                        <div
                          style={{
                            height: 192,
                            width: "100%",
                            // backgroundImage: "url(/ChannelPartner/signup-img2.png)",
                            backgroundImage: clientData?.client_image_1 ? `url(${filesUrl}/clientdoc/images${clientData?.client_image_1}` : `url(/ChannelPartner/signup-img2.png)`,
                            backgroundRepeat: "no-repeat",
                            backgroundSize: "cover",
                            marginBottom: 15,
                            borderBottomLeftRadius: 10,
                          }}
                        ></div>
                        <div
                          style={{
                            height: 304,
                            width: "100%",
                            // backgroundImage: "url(/ChannelPartner/signup-img5.png)",
                            backgroundImage: clientData?.client_image_2 ? `url(${filesUrl}/clientdoc/images${clientData?.client_image_2}` : `url(/ChannelPartner/signup-img5.png)`,
                            backgroundRepeat: "no-repeat",
                            backgroundSize: "cover",
                            marginBottom: 15,
                            borderBottomRightRadius: 10,
                            marginTop: "-110px",
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div className="col-12 col-md-5 d-flex justify-content-center">
                    <div className="Sign-Up_Sign-In">
                      <h3 className="Perfect-Home ps-2">Find Your Perfect Home. </h3>
                      <div className="underline" />
                      <div className="d-flex pt-5 ps-2">
                        <div
                          className="nav-link d-flex flex-column gap-2 align-items-center pb-3 Sign-Up-btn text-white"
                          id="Sign-Up"
                          data-bs-toggle="tab"
                          data-bs-target="#Sign-Up-tab"
                          style={{ backgroundColor: `${clientData?.button_color || '#293790'}` }}
                        >
                          Sign Up
                        </div>
                      </div>
                      <div className="perfect-home-form pt-1">
                        <section className="Details_Form">
                          <div className="container pt-3">
                            <form
                              id="survey-form"
                              method="GET"
                              action
                              className="d-flex flex-column gap-3"
                              onSubmit={handleSubmit}
                            >
                              <div className="d-flex gap-2">
                                <div className="rowTab">
                                  <div className="labels">
                                    <label id="name-label" htmlFor="name">
                                      Name
                                    </label>
                                    <span>*</span>
                                  </div>
                                  <div className="rightTab">
                                    <input
                                      autofocus
                                      type="text"
                                      name="name"
                                      id="name"
                                      className="input-field"
                                      placeholder="Enter First Name"
                                      value={formFields.name}

                                      disabled={formFields.isTokenVerified}
                                    />
                                  </div>
                                </div>
                                <div className="rowTab">
                                  <div className="labels">
                                    <label id="name-label" htmlFor="name">Last Name</label>
                                    <span />
                                  </div>
                                  <div className="rightTab">
                                    <input
                                      autofocus
                                      type="text"
                                      name="name"
                                      id="last"
                                      className="input-field"
                                      placeholder="Enter Last Name"
                                      value={formFields.user_l_name}
                                      disabled={formFields.isTokenVerified}

                                    />
                                  </div>
                                </div>
                              </div>
                              <div className="rowTab">
                                <div className="labels">
                                  <label id="Organization" htmlFor="name">
                                    Organization
                                  </label>
                                  <span>*</span>
                                </div>
                                <div className="rightTab">
                                  <input
                                    autofocus
                                    type="text"
                                    name="name"
                                    id="Organization"
                                    className="input-field"
                                    placeholder="Enter Organisation Name"
                                    value={formFields.organisation}

                                    disabled={formFields.isUploadVerified}
                                    onChange={(e) => {
                                      setFormFields({ ...formFields, organisation: e.target.value })
                                    }}
                                  />
                                </div>
                              </div>
                              <div className="rowTab">
                                <div className="labels">
                                  <label id="number" htmlFor="number">
                                    Mobile Number
                                  </label>
                                  <span>*</span>
                                </div>
                                <div className="rightTab">
                                  {/* <input
                              type="tel"
                              name="number"
                              id="num"
                              className="input-field"
                              
                              placeholder="Enter Mobile Number"
                              value={formFields.mobile}
                              onChange={(e)=>{
                                setFormFields({...formFields,mobile:e.target.value})
                              }} 
                            /> */}
                                  <input
                                    type="tel"
                                    name="number"
                                    id="num"
                                    className="input-field"
                                    placeholder="Enter Mobile Number"
                                    value={formFields.mobile}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      // Filter out non-digit characters and limit length to 10
                                      const formattedValue = value.replace(/\D/g, '').slice(0, 10);
                                      setFormFields({ ...formFields, mobile: formattedValue });
                                    }}
                                  />
                                </div>
                              </div>
                              <div className="rowTab">
                                <div className="labels">
                                  <label id="email-label" htmlFor="email">
                                    Email
                                  </label>
                                  <span>*</span>
                                </div>
                                <div className="rightTab">
                                  <input
                                    type="email"
                                    name="email"
                                    id="email"
                                    className="input-field"

                                    placeholder="Enter Email"
                                    value={formFields.email}
                                    disabled={formFields.isTokenVerified}
                                  />
                                </div>
                              </div>
                              <div className="rowTab">
                                <div className="rightTab d-flex gap-2 ">
                                  <div className="w-50" >
                                    <label id="email-label" htmlFor="email">
                                      State*
                                    </label>
                                    <Select
                                      id={formFields.state_id}
                                      defaultValue={"select state"}
                                      disabled={formFields.isUploadVerified}
                                      options={statelist?.map((data) => ({
                                        value: data?.state_id ?? data?.id,
                                        label: data?.state_name,
                                      }))}
                                      value={
                                        statelist
                                          ?.map((data) => ({
                                            value: data?.state_id ?? data?.id,
                                            label: data?.state_name,
                                          }))
                                          .find(
                                            (option) =>
                                              String(option.value) ===
                                              String(formFields.state_id)
                                          ) || null
                                      }
                                      onChange={(e) =>
                                        setFormFields((prev) => ({
                                          ...prev,
                                          state_id: e?.value || "",
                                          // reset city if state changes
                                          city_id: "",
                                        }))
                                      }
                                    />
                                  </div>
                                  <div className="w-50">
                                    <label id="email-label" htmlFor="email">
                                      City*
                                    </label>
                                    <Select
                                      id={formFields.city_id}
                                      defaultValue={"select city"}
                                      disabled={formFields.isUploadVerified}
                                      options={citylist?.map((data) => ({
                                        value: data?.city_id ?? data?.id,
                                        label: data?.city_name,
                                      }))}
                                      value={
                                        citylist
                                          ?.map((data) => ({
                                            value: data?.city_id ?? data?.id,
                                            label: data?.city_name,
                                          }))
                                          .find(
                                            (option) =>
                                              String(option.value) ===
                                              String(formFields.city_id)
                                          ) || null
                                      }
                                      onChange={(e) =>
                                        setFormFields((prev) => ({
                                          ...prev,
                                          city_id: e?.value || "",
                                        }))
                                      }
                                    />
                                  </div>
                                </div>
                              </div>
                              <div className="rowTab">
                                <div className="labels">
                                  <label id="address-label" htmlFor="address">
                                    Address
                                  </label>
                                  <span>*</span>
                                </div>
                                <div className="rightTab">
                                  <input
                                    type="text"
                                    name="address"
                                    id="address"
                                    className="input-field"
                                    placeholder="Enter your address"
                                    value={formFields.address}
                                    onChange={(e) => {
                                      setFormFields({ ...formFields, address: e.target.value })
                                    }}

                                    disabled={formFields.isUploadVerified}
                                  />
                                </div>
                              </div>
                              <div className="rowTab">
                                <div className="labels">
                                  <label id="GST" htmlFor="name">
                                    GST Number
                                  </label>
                                  <span />
                                </div>
                                <div className="rightTab">
                                  {/* <input
                              autofocus
                              type="text"
                              name="name"
                              id="GST"
                              className="input-field"
                              placeholder="Enter GST Number"
                              value={formFields.gst}
                              onChange={(e)=>{
                                setFormFields({...formFields,gst:e.target.value})
                              }}
                              
                              disabled={formFields.isUploadVerified}
                            /> */}
                                  <input
                                    autofocus
                                    type="text"
                                    name="name"
                                    id="GST"
                                    className="input-field"
                                    placeholder="Enter GST Number"
                                    value={formFields.gst}
                                    onChange={(e) => {
                                      // Get the new value from the input field
                                      const newValue = e.target.value;

                                      // Filter out non-alphanumeric characters
                                      const filteredValue = newValue.replace(/[^a-zA-Z0-9]/g, '');

                                      // Limit the length to 15 characters
                                      const limitedValue = filteredValue.slice(0, 15);

                                      // Update the form field state
                                      setFormFields({ ...formFields, gst: limitedValue });
                                    }}

                                    disabled={formFields.isUploadVerified}
                                  />


                                </div>
                              </div>
                              <div className="d-flex justify-content-between flex-wrap  upload-files">
                                {inputFields.map((input) => (
                                  <div className="rowTab" key={input.field}>
                                    <div className="labels">
                                      <label id="name-label" htmlFor={input.field}>
                                        {input.label}
                                      </label>
                                    </div>
                                    <div className="rightTab">
                                      <label
                                        htmlFor={input.field}
                                        className="form-control d-flex justify-content-between align-items-center"
                                        style={{ width: 160, height: 48 }}
                                      >
                                        Upload
                                        <img
                                          src="/ChannelPartner/upload-file.svg"
                                          alt="normal"
                                          style={{ height: 24 }}
                                        />
                                      </label>
                                      <input
                                        autofocus
                                        type="file"
                                        accept="image/png, image/jpeg"
                                        name={input.field}
                                        id={input.field}
                                        className="input-field"
                                        style={{ display: "none" }}
                                        onChange={(e) => handleFileChange(e, input.field)}
                                        disabled={formFields.isUploadVerified}
                                      />


                                      {formFields.isUploadVerified === false &&
                                        formFields[input.field] && (
                                          <img
                                            src={URL.createObjectURL(
                                              formFields[input.field]
                                            )}
                                            alt={`${input.label} Preview`}
                                            style={{
                                              maxWidth: "100px",
                                              maxHeight: "100px",
                                              marginTop: "5px",
                                            }}
                                          />
                                        )}

                                      {formFields.isUploadVerified &&
                                        input.field === "aadhar" &&
                                        formFields[input.field] ? (
                                        <img
                                          src={`${filesUrl}/adh/images${formFields[input.field]
                                            }`}
                                          alt={`${input.label} Preview`}
                                          style={{
                                            maxWidth: "100px",
                                            maxHeight: "100px",
                                          }}
                                        />
                                      ) : (
                                        formFields.isUploadVerified &&
                                        input.field !== "aadhar" &&
                                        formFields[input.field] && (
                                          <img
                                            src={
                                              `${filesUrl}` +
                                              `/${input.field}/images${formFields[input.field]
                                              }`
                                            }
                                            alt={`${input.label} Preview`}
                                            style={{
                                              maxWidth: "100px",
                                              maxHeight: "100px",
                                            }}
                                          />
                                        )
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <div className="agreement-card p-3 shadow-sm rounded bg-white">
                                {/* Heading */}
                                <div className="d-flex align-items-center gap-2 mb-1">
                                  <span style={{ fontSize: "18px" }}>📄</span>
                                  <h6 className="mb-0 fw-bold">Terms & Conditions</h6>
                                </div>

                                {/* Description */}
                                <p className="text-muted mb-1" style={{ fontSize: "14px" }}>
                                  Please read the agreement document carefully before proceeding.
                                </p>

                                {/* View PDF (navigate to a dedicated viewer page) */}
                                <button
                                  type="button"
                                  className="btn btn-link p-0 mb-1"
                                  style={{ cursor: "pointer" }}
                                  onClick={() => {
                                    const returnTo = router.asPath || "/partner/Signup";
                                    router.push(
                                      `/ChannelPartnerAgreementViewer?returnTo=${encodeURIComponent(returnTo)}`
                                    );
                                  }}
                                >
                                  🔗 View Terms & Conditions
                                </button>

                                {/* Checkbox */}
                                {/* <div className="form-check mb-4"> */}
                                {/* <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id="agreeCheck"
                                    onChange={(e) => setAgreementAccepted(e.target.checked)}
                                  /> */}
                                {/* <label className="form-check-label" htmlFor="agreeCheck">
                                    I agree and understand the terms & conditions
                                  </label> */}
                                {/* </div> */}
                                <p className="form-check-label mb-0">
                                  I agree and understand the terms & conditions
                                </p>

                                {/* Buttons */}
                                <div className="d-flex justify-content-end gap-2">
                                  <button
                                    type="button"
                                    className="btn btn-outline-secondary"
                                    onClick={async () => {
                                      setAgreementAccepted(false);
                                      try {
                                        window.localStorage.setItem("cpAgreementAccepted", "false");
                                      } catch (e) { }
                                      await updateCpLeadAgreementStatus(false);
                                    }}
                                  >
                                    Reject
                                  </button>

                                  <button
                                    type="button"
                                    className={agreementAccepted ? "btn btn-success" : "btn btn-outline-success"}
                                    onClick={async () => {
                                      setAgreementAccepted(true);
                                      try {
                                        window.localStorage.setItem("cpAgreementAccepted", "true");
                                      } catch (e) { }
                                      await updateCpLeadAgreementStatus(true);
                                    }}
                                  >
                                    {agreementAccepted ? "Accepted" : "Accept"}
                                  </button>
                                </div>
                              </div>
                              <button
                                id="craete-account"
                                type="submit"
                                className="border-0 mb-4"
                                disabled={formFields.isUploadVerified || !agreementAccepted}
                              >
                                {isButtonLoading ? (
                                  <>
                                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                    &nbsp;Create Account
                                  </>
                                ) : (
                                  'Create Account'
                                )}
                              </button>
                            </form>
                          </div>
                        </section>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )
      }

    </>
  );
};

export default ChannelSignUpScreen;
