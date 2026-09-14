import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import axios from "axios";
import { Baseurl, filesUrl } from "../../Utils/Constants";
import { getCookie, setCookie } from "cookies-next";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { startButtonLoading, stopButtonLoading } from "../../store/buttonLoaderSlice";
import ChannelPartnerHOC from "../../HOC/ChannelPartnerHOC";


const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");

  const [isShowVerification, setIsShowVerification] = useState(false);
  const [showResetBtn, setShowResetBtn] = useState(false);
  const [timer, setTimer] = useState(30);
  const[clientData,setClientData]=useState()
  const router = useRouter();
  const {isButtonLoading}=useSelector((state)=>state.buttonLoader)
  const dispatch=useDispatch();

  const resendCode = async () => {
    setCode("");
    setIsShowVerification(false);
    handleSendVerificationCode();
  };

  const handleVerify = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      toast.error("Please enter email.");
      return;
    }

  if (!emailRegex.test(email.trim())) {
    toast.error("Please enter a valid email address.");
    return;
  }

    if (!code.trim()) {
      toast.error("Please enter code.");
      return;
    }
    try {
      dispatch(startButtonLoading())
      // Make the API request using Axios
      const response = await axios.post(`${Baseurl}/db/users/cp/verify`, {
        email: email.trim(),
        otp: parseInt(code.trim()),
      });
      if (response.data.status == 200) {
        toast.success(response.data.message);
        dispatch(stopButtonLoading())
        setCookie('resetPasswordEmail',email);
        router.push("/partner/ResetPassword/");
      } else {
        toast.error(response.data.message);
        dispatch(stopButtonLoading())
      }
    } catch (error) {
      console.log("error", error);
      if (error?.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Something went wrong!");
      }
      dispatch(stopButtonLoading())
    }
  };

  const handleSendVerificationCode = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      toast.error("Please enter email.");
      return;
    }

  if (!emailRegex.test(email.trim())) {
    toast.error("Please enter a valid email address.");
    return;
  }
    try {
      let db_name = getCookie("db_name")
      dispatch(startButtonLoading())
      // Make the API request using Axios
      const response = await axios.post(`${Baseurl}/db/users/cp/send`, {
        email: email.trim(),
        db_name: db_name
      });
      if (response.data.status == 200) {
        toast.success(response.data.message);
        dispatch(stopButtonLoading())
        setIsShowVerification(true);
        startTimer();
      } else {
        toast.error(response.data.message);
        dispatch(stopButtonLoading())
      }
    } catch (error) {
      console.log("error", error);
      if (error?.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Something went wrong!");
      }
      dispatch(stopButtonLoading())
    }
  };

  const startTimer = () => {
    setTimer(30);
    setShowResetBtn(false);
    const interval = setInterval(() => {
      setTimer((prevTimer) => prevTimer - 1);
    }, 1000);

    setTimeout(() => {
      clearInterval(interval);
      setShowResetBtn(true);
    }, 30000);
  };

  useEffect(()=>{
    const getSignInData=async()=>{
      try {
        let baseUrl = "http://18.61.246.105";
        const {data}=await axios.post(Baseurl+"/db/admin/url",{
          client_url:`${baseUrl}`,
        })
        setClientData(data?.data)
      } catch (error) {
        console.log(error)
      }
    }
    getSignInData()
  },[])

  return (
    <>
      <section className="Sign-In pt-4" style={{ padding: "0 16px" }}>
        <div className="container-fluid">
          <div className="row">
            <div className="col-12">
              <div className="row">
                <div className="col-7 Sign-In-logo">
                  {/* <img src="/ChannelPartner/logo.png" alt="login" /> */}
                  <img
                      src={
                        clientData?.logo
                          &&( `${filesUrl}` +
                            `/logo/images${clientData?.logo}`)
                      }
                      alt="normal"
                    />
                </div>
                <div className="col-5 d-flex justify-content-md-end">
                  <div className="Sign-In_Sign-Up Register">
                    <h3 className="Perfect-Home" >Find Your Perfect Home. </h3>
                    <div className="underline" />
                  </div>
                </div>
              </div>
            </div>

            <div className="col-12 d-flex justify-content-center">
              <div className="Sign-In_Sign-Up Register">
                <div className="d-flex">
                  <div className="w-100 new-password p-2">
                    <button
                      type="submit"
                      className="set-password text-white w-100 border-0"
                    >
                      Set New Password
                    </button>
                  </div>
                </div>
                <div className="tab-content pt-4" id="Sign-In-tabContent">
                  <div className="" id="Sign-In-tab">
                    {/* signin-signup-page */}

                    <div className="perfect-home-form pt-1">
                      {/* FORMULAIRE */}
                      <form className="form">
                        <div className="d-flex flex-column gap-1">
                          <label id="user-email" htmlFor="name">
                            Email
                          </label>
                          <input
                            type="email"
                            disabled={isShowVerification}
                            placeholder="Enter email"
                            className="email mb-0"
                            id="email"
                            onChange={(e) => {
                              setEmail(e.target.value);
                            }}
                          />
                          {isShowVerification && (
                            <span className="text-muted resend-label">
                              Didn’t Receive Code?{" "}
                              {timer > 0 && !showResetBtn && (
                                <span className="resend-text fw-bold">
                                  {timer}
                                </span>
                              )}
                              {showResetBtn && (
                                <span
                                  className="resend-text"
                                  role="button"
                                  onClick={resendCode}
                                >
                                  Resend
                                </span>
                              )}
                            </span>
                          )}
                        </div>
                        {isShowVerification && (
                          <div className="d-flex flex-column gap-1">
                            <label htmlFor="code">Verification Code</label>
                            <input
                              type="text"
                              placeholder="Enter Verification Code"
                              className="code mb-0"
                              id="code"
                              onChange={(e) => {
                                setCode(e.target.value);
                              }}
                            />
                          </div>
                        )}
                      </form>
                      <div className="d-block gap-1">
                      <button
                        type="button"
                        className="login_btn btn mt-5"
                        disabled={isButtonLoading}
                        style={{background:clientData?.button_color}}
                        onClick={() =>
                          isShowVerification
                            ? handleVerify()
                            : handleSendVerificationCode()
                        }
                      >
                        {isShowVerification
                          ? isButtonLoading ?(<><span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Verify</>) :"Verify"
                          : isButtonLoading ?(<><span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Send Verification Code</>) :"Send Verification Code"}
                      </button>

                      <button disabled={isButtonLoading} onClick={()=>{
                        router.push("/partner")
                      }} className="login_btn btn  mt-2">
                          Login
                      </button>
                      </div>
                      
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default ChannelPartnerHOC(ForgotPassword);
