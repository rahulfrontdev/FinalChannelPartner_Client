import axios from "axios";
import { getCookie, hasCookie, setCookie } from "cookies-next";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Baseurl, filesUrl } from "../../Utils/Constants";
import { useDispatch, useSelector } from "react-redux";
import { startButtonLoading, stopButtonLoading } from "../../store/buttonLoaderSlice";
import ChannelPartnerHOC from "../../HOC/ChannelPartnerHOC";


const ForgotPassword = () => {
  const router = useRouter();
  const {tkn } = router.query;
  const [email] = useState(getCookie("resetPasswordEmail"));
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [token, setToken] = useState('')
  const[clientData,setClientData]=useState()
  const {isButtonLoading}=useSelector((state)=>state.buttonLoader)
  const dispatch=useDispatch();

  const handleSubmit = async () => {

    if (newPassword.trim() === '') {
      toast.error("New Password is required.");
      return;
    }
    if (confirmPassword.trim() === '') {
      toast.error("Confirm Password is required.");
      return;
    }
    

    if (newPassword !== confirmPassword) {
      toast.error("Confirm password do not match.");
      return;
    }

    let header = {
      headers: {
          Accept: "application/json",
      }
    }

    try {
      dispatch(startButtonLoading())
      const response = await axios.put(Baseurl + `/db/users/forget`, {
          token,
          password: newPassword
      });
      if (response.status === 204 || response.status === 200) {
        dispatch(stopButtonLoading())
          toast.success(response.data.message)
          router.push('/partner')
      }
  } catch (error) {
      console.log(error);
      if (error?.response?.data?.message) {
          toast.error(error.response.data.message);
          dispatch(stopButtonLoading())
      }
      else {
          toast.error('Something went wrong!')
          dispatch(stopButtonLoading())
      }
  }
  };

  useEffect(() => {
    if (!router.isReady) return
    const myArray = tkn?.slice(4, tkn.length)
    setToken(myArray)
}, [router.isReady, tkn])

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
              <div className="row ">
                <div className="col-7 Sign-In-logo">
                  {/* <img src="/ChannelPartner/logo.png" alt="login" /> */}
                  <img
                      src={
                        clientData?.logo
                          &&( `${filesUrl}` +
                            `/logo/images${clientData?.logo}`)
                      }
                      alt
                    />
                </div>
                <div className="col-5 d-flex justify-content-md-end">
                  <div className="Sign-In_Sign-Up Register">
                    <h3 className="Perfect-Home">Find Your Perfect Home. </h3>
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
                          <label id="pass" htmlFor="password">
                            New Password
                          </label>
                          <input
                            type="password"
                            placeholder="Enter Password"
                            className="pass"
                            onChange={(e) => setNewPassword(e.target.value)}
                            id="password"
                          />
                        </div>
                        <div className="d-flex flex-column gap-1">
                          <label id="confirm" htmlFor="confirm">
                            Confirm Password
                          </label>
                          <input
                            type="password"
                            placeholder="Enter Password"
                            className="pass"
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            id="confirm"
                          />
                        </div>
                      </form>
                      <button
                        type="button"
                        disabled={isButtonLoading}
                        style={{background:clientData?.button_color}}
                        className="login_btn mt-3"
                        onClick={() => handleSubmit()}
                      >
                        {isButtonLoading ? (
                                  <>
                                     <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                    &nbsp; Update Password
                                  </>
                                ) : (
                                  'Update Password'
                                )} 
                        
                      </button>
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
