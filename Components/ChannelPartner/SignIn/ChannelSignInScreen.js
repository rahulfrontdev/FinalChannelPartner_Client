import React, { useEffect, useState } from "react";
import LeadShyneIcon from "../../Svg/LeadShyneIcon";
import { useRouter } from "next/router";
import Link from "next/link";
import { toast } from "react-toastify";
import { setCookie } from "cookies-next";
import { useSelector, useDispatch } from "react-redux";
import { userMode } from "../../../store/dbModeSlice";
import { UserLogIN } from "../../../store/ClientLoginSlice";
import { Baseurl, filesUrl } from "../../../Utils/Constants";
import axios from "axios";
import { validEmail } from "../../../Utils/regex";
import { clearTheme, setSidebarColor, setTopNavColor, setbuttonColor } from '../../../store/themeSlice';

import {
  assignPermissions,
  crm,
  dms,
  sales,
  channel,
} from "../../../store/permissionSlice";
import { startLoading, stopLoading } from "../../../store/loaderSlice";

export default function ChannelSignInScreen({ setLoggedIn }) {
  const router = useRouter();
  const dispatch = useDispatch();
  const userLogin = useSelector((state) => state.userLogin.value);
  const [userForm, setUserForm] = useState({
    email: "",
    password: "",
  });

  const [clientData, setClientData] = useState();


  const initialPermission = (permission) => {
    switch (permission) {
      case "CRM":
        dispatch(crm());
        break;

      case "DMS":
        dispatch(dms());
        break;

      case "CHANNEL":
        dispatch(channel());
        break;

      case "SALES":
        dispatch(sales());

      default:
        break;
    }
  };

  const assignPermission = (permissionsArray) => {
    const arr = permissionsArray.reduce((ac, permission) => {
      const platformName = permission.platform_name.toLowerCase();
      return [...ac, platformName];
    }, []);
    dispatch(assignPermissions(arr));
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    dispatch(startLoading())
    if (userForm.email === "" || userForm.email.length < 1) {
      toast.error("Email is Empty", { autoClose: 2500 });
      dispatch(stopLoading())
    } else if (!validEmail.test(userForm.email.toLowerCase().trim())) {
      toast.error("Email is not Valid", { autoClose: 2500 });
      dispatch(stopLoading())
    } else if (userForm.password === "" || userForm.password.length < 1) {
      toast.error("password is Empty", { autoClose: 2500 });
      dispatch(stopLoading())
    } else {
      try {
        const clientUrl = "http://18.61.246.105";
        let baseUrl = window.location.origin;

        // Treat localhost / LAN URLs as development, don't send client_url there
        const isLocalDev =
          baseUrl === "http://localhost:3000" ||
          baseUrl.startsWith("http://10.") ||
          baseUrl.startsWith("http://192.168.") ||
          baseUrl.startsWith("http://172.");

        const payload = isLocalDev
          ? {
              email: userForm.email.toLowerCase(),
              password: userForm.password,
              type: "partner",
            }
          : {
              email: userForm.email.toLowerCase(),
              password: userForm.password,
              type: "partner",
              client_url: clientUrl,
            };

        const res = await axios.post(Baseurl + "/db/login", payload);

        if (res.status === 200) {
          dispatch(userMode());
          dispatch(UserLogIN());
          setCookie("user", "true");
          setCookie("sideUser", "true");
          setCookie("token", res.data.token);
          setCookie("userInfo", res.data.userData);
          setCookie("subscriptionInfo", res.data.userAdminSubscriptionData);
          setCookie('clientLogo', res.data.Logo[0]);
          setCookie("db_name", res.data.userData.db_name);
          setCookie('sidecolor', res.data.userData.sidebar_color || '#405189');
          setCookie('btncolor', res.data.userData.button_color || '#405189');
          setCookie('topnavcolor', res.data.userData.top_nav_color || '#405189');
          dispatch(setSidebarColor(res.data.userData.sidebar_color || '#405189'))
          dispatch(setbuttonColor(res.data.userData.button_color || '#405189'))
          dispatch(setTopNavColor(res.data.userData.top_nav_color || '#405189'))
          initialPermission("CHANNEL")
          assignPermission(res.data.platformData);
          toast.success("Logged in SuccessFully", { autoClose: 2500 });
          dispatch(stopLoading())
          // router.push("/");
          if (res?.data?.userData?.role_id === 2) {
            setCookie("activeLink", "/partner")
            router.push("/partner");
          }
          else {
            setCookie("activeLink", "/partner")
            router.push("/partner");
          }
        }
      } catch (error) {
        dispatch(stopLoading())
        if (error?.response?.data?.message) {
          toast.error(error?.response?.data?.message, { autoClose: 2500 });
        } else if (error?.code === "ERR_NETWORK" || !error?.response) {
          toast.error("Cannot connect to server. Check if the backend is running (e.g. localhost:8050).", { autoClose: 4000 });
        } else {
          toast.error("Something went wrong!", { autoClose: 2500 });
        }
      }
    }
  };

  useEffect(() => {
    const getSignInData = async () => {
      try {
        const baseUrl = "http://18.61.246.105";
        const { data } = await axios.post(Baseurl + "/db/admin/url", {
          client_url: `${baseUrl}`,
        })
        setClientData(data?.data)
        setCookie("clientBtnColor", data?.data?.button_color)
      } catch (error) {
        console.log(error)
      }
    }
    getSignInData()
  }, [])

  return (
    <>
      {!userLogin && (
        <section className="Sign-In pt-4" style={{ padding: "0 16px" }}>
          <div className="container">
            <div className="row">
              <div className="col-12 col-md-7">
                <div className="row gx-3">
                  <div className="Sign-In-logo pb-4">
                    {/* <img src="/ChannelPartner/logo.png" alt="normal"/> */}
                    <img
                      src={
                        clientData?.logo
                        && (`${filesUrl}` +
                          `/logo/images${clientData?.logo}`)
                      }
                      alt
                    />
                  </div>
                  <div className="col-6">
                    <div
                      style={{
                        height: 290,
                        width: "100%",
                        backgroundImage: clientData?.client_image_1 ? `url(${filesUrl}/clientdoc/images${clientData?.client_image_1}` : `url(/ChannelPartner/signup-img1.png)`,
                        backgroundRepeat: "no-repeat",
                        backgroundSize: "cover",
                        marginBottom: 15,
                        borderTopLeftRadius: 10,
                      }}
                    ></div>
                    <div
                      style={{
                        height: 200,
                        width: "100%",
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
                        height: 200,
                        width: "100%",
                        backgroundImage: clientData?.client_image_3 ? `url(${filesUrl}/clientdoc/images${clientData?.client_image_3}` : `url(/ChannelPartner/signup-img2.png)`,
                        backgroundRepeat: "no-repeat",
                        backgroundSize: "cover",
                        marginBottom: 15,
                        borderTopRightRadius: 10,
                      }}
                    ></div>
                    <div
                      style={{
                        height: 290,
                        width: "100%",
                        backgroundImage: clientData?.client_image_4 ? `url(${filesUrl}/clientdoc/images${clientData?.client_image_4}` : `url(/ChannelPartner/signup-img4.png)`,
                        backgroundRepeat: "no-repeat",
                        backgroundSize: "cover",
                        marginBottom: 15,
                        borderBottomRightRadius: 10,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
              <div className="col-12 col-md-5 d-flex justify-content-center pt-5">
                <div className="Sign-In_Sign-Up">
                  <h3 className="Perfect-Home">Find Your Perfect Home. </h3>
                  <div className="underline" />
                  <div className="d-flex justify-content-between pt-5">
                    {" "}
                    <div
                      className="nav-link d-flex flex-column gap-2 align-items-center pb-3 Sign-In-btn"
                      id="Sign-In"
                      style={{ background: clientData?.button_color }}
                    >
                      Sign In
                    </div>
                  </div>
                  <div className="tab-content pt-4" id="Sign-In-tabContent">
                    <div
                      className="tab-pane fade active show"
                      id="Sign-In-tab"
                      role="tabpanel"
                      aria-labelledby="Sign-In"
                    >
                      {/* signin-signup-page */}
                      <div className="perfect-home-form pt-1">
                        {/* FORMULAIRE */}
                        <form className="form" onSubmit={submitHandler}>
                          <div className="d-flex flex-column gap-1">
                            <label id="user" htmlFor="username">
                              Username
                            </label>
                            <input
                              type="text"
                              name="username"
                              id="username"
                              placeholder="Please enter your email"
                              className="form-control"
                              onChange={(e) => {
                                setUserForm({
                                  ...userForm,
                                  email: e.target.value.trim(),
                                });
                              }}
                            />
                          </div>
                          <div className="d-flex flex-column gap-1">
                            <label id="pass" htmlFor="password">
                              Password
                            </label>
                            <input
                              type="password"
                              name="password"
                              id="password"
                              placeholder="Please enter your password"
                              className="form-control"
                              onChange={(e) => {
                                setUserForm({
                                  ...userForm,
                                  password: e.target.value,
                                });
                              }}
                            />
                          </div>
                          <button type="submit" style={{ background: clientData?.button_color }} className="login_btn">
                            Login
                          </button>
                        </form>
                        {/* MOT DE PASSE OUBLIE ? */}
                        <div className=" d-flex justify-content-between">
                          <Link
                            href="/partner/ForgotPassword"
                            className="fp text-decoration-none"
                          >
                            Forgot password?
                          </Link>
                          <Link
                            href="/partner/NewRegistration"
                            className="fp text-decoration-none"
                          >
                            New Registration
                          </Link>
                        </div>
                        {/* <Link
                          href="/partner/ForgotPassword"
                          className="fp text-decoration-none"
                        >
                          Forgot password?
                        </Link> */}

                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
