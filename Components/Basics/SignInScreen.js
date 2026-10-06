import React, { useEffect, useState } from "react";
import LeadShyneIcon from "../Svg/LeadShyneIcon";
import { useRouter } from "next/router";
import Link from "next/link";
import { toast } from "react-toastify";
import { setCookie } from "cookies-next";
import { useSelector, useDispatch } from "react-redux";
import { userMode } from "../../store/dbModeSlice";
import { UserLogIN } from "../../store/ClientLoginSlice";
import { Baseurl, filesUrl } from "../../Utils/Constants";
import axios from "axios";
import { validEmail } from "../../Utils/regex";
import {
  assignPermissions,
  crm,
  dms,
  sales,
  channel,
  media
} from "../../store/permissionSlice";
import { startLoading, stopLoading } from "../../store/loaderSlice";
import {
  clearTheme,
  setSidebarColor,
  setTopNavColor,
  setbuttonColor,
} from "../../store/themeSlice";
import PersonIcon from "@mui/icons-material/Person";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import VisibilityIcon from "@mui/icons-material/Visibility";

export default function SignInScreen({ setLoggedIn }) {
  const router = useRouter();
  const dispatch = useDispatch();
  const [clientData, setClientData] = useState();
  const [userForm, setUserForm] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);

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
    dispatch(startLoading());
    const type = router.pathname === "/crm" ? "crm" : router.pathname === "/dms" ? "dms" : router.pathname === "/sales" ? "sales" : router.pathname === "/partner" ? "partner" : router.pathname === "/media" ? "media" : "common"
    if (userForm.email === "" || userForm.email.length < 1) {
      toast.error("Email is Empty");
      dispatch(stopLoading())
    } else if (!validEmail.test(userForm.email.toLowerCase().trim())) {
      toast.error("Email is not Valid");
      dispatch(stopLoading())
    } else if (userForm.password === "" || userForm.password.length < 1) {
      toast.error("password is Empty");
      dispatch(stopLoading())
    } else {
      try {
        let baseUrl = window.location.origin;
        const isLocalDev =
          /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(baseUrl) ||
          baseUrl.startsWith("http://10.") ||
          baseUrl.startsWith("http://192.168.") ||
          baseUrl.startsWith("http://172.");
        const clientUrl = isLocalDev
          ? Baseurl.replace(/\/api\/v1\/?$/, "")
          : baseUrl;
        const payload = {
          email: userForm.email.toLowerCase(),
          password: userForm.password,
          type: type,
          client_url: clientUrl,
        };
        const res = await axios.post(Baseurl + "/db/login", payload);

        if (res.status === 200) {
          dispatch(stopLoading());
          dispatch(userMode());
          dispatch(UserLogIN());
          dispatch(clearTheme());
          setCookie("user", "true");
          setCookie("sideUser", "true");
          setCookie("token", res.data.token);
          setCookie("userInfo", res.data.userData);
          setCookie("subscriptionInfo", res.data.userAdminSubscriptionData);
          setCookie("clientLogo", res.data.Logo[0]);
          setCookie("db_name", res.data.userData.db_name);

          dispatch(
            setSidebarColor(res.data.Logo[0].sidebar_color || "#405189")
          );
          dispatch(setbuttonColor(res.data.Logo[0].button_color || "#405189"));
          dispatch(setTopNavColor(res.data.Logo[0].top_nav_color || "#405189"));
          assignPermission(res?.data?.platformData);

          if (router.pathname === "/crm") {
            dispatch(crm())
            router.push("/crm")
          }
          else if (router.pathname === "/partner") {
            dispatch(channel())
            if (res?.data?.userData?.role_id === 2) {
              setCookie("activeLink", "/partner")
              router.push("/partner");
            }
            else {
              setCookie("activeLink", "/partner")
              router.push("/partner");
            }
          }
          else if (router.pathname === "/dms") {
            dispatch(dms())
            router.push("/dms")
          }
          else if (router.pathname === "/sales") {
            dispatch(sales())
            router.push("/sales")
          }
          else if (router.pathname === "/media") {
            dispatch(media())
            router.push("/media")
          }
          else {
            router.push("/")
          }

          // make this comment below code and we will choose this on platform select page
          // initialPermission(res.data.platformData[0].platform_name)
          // assignPermission(res.data.platformData);
          // router.push("/");
          toast.success("Logged in SuccessFully");
        }
      } catch (error) {
        dispatch(stopLoading());
        if (error?.response?.data?.message) {
          toast.error(error.response.data.message);
        } else if (error?.code === "ERR_NETWORK" || !error?.response) {
          toast.error("Cannot connect to server. Check if the backend is running (e.g. localhost:8050).");
        } else {
          toast.error("Something went wrong!");
        }
      }
    }
  };

  useEffect(() => {
    const getSignInData = async () => {
      try {
        let baseUrl = window.location.origin;
        // Handle local development URLs (localhost and local IP addresses)
        if (baseUrl === "http://localhost:3000" || baseUrl.startsWith("http://10.") || baseUrl.startsWith("http://192.168.") || baseUrl.startsWith("http://172.")) {
          baseUrl = "https://srijanbandhan.com";
        }
        const { data } = await axios.post(Baseurl + "/db/admin/url", {
          client_url: `${baseUrl}`,
        });
        setCookie("clientBtnColor", data?.data?.button_color)
        setClientData(data?.data);
      } catch (error) {
        console.log(error);
      }
    };
    getSignInData();
  }, []);

  return (
    <>
      <div className="NewLoginScreen bg-white">
        <div className="row m-0  login">

          <div style={{ background: "#111B34" }} className="col-12 col-lg-6 m-0 p-0  w-half lg:w-1/2 m-0 p-0">
            <div className="form-left d-flex flex-column justify-content-center">
              {/* <img src="/images/Ellipse26.png" alt="normal"className="image-one" /> */}
              <img
                src={clientData?.logo
                  && (`${filesUrl}` +
                    `/logo/images${clientData?.logo}`)}
                alt=""
                className=" mx-auto w-auto"
              />
              {/* <img
                src="/images/Ellipse27.png"
                alt
                className="image-two d-none d-lg-block"
              /> */}
            </div>
          </div>

          <div style={{ background: "#F28A21" }} className="col-12 col-lg-6 d-flex align-items-center  justify-content-center pt-5 w-half lg:w-1/2 m-0 p-0  text-black-500">
            <div className="form-right  d-flex justify-content-center align-items-center text-black-100">
              <form action className="row g-4 text-black-100" onSubmit={submitHandler}>
                <div className="col-12">
                  <div className="d-flex flex-column">
                    <b className="fs-3 mb-2 text-center text-md-start">Login</b>
                    <span
                      className="font-black fs-6 d-none d-md-block"
                      style={{ fontWeight: 600 }}
                    >
                      Welcome Back! Please login to your account
                    </span>
                  </div>
                </div>
                <div className="col-12">
                  <label className="fs-5 pb-2 "
                    style={{ fontWeight: 600 }}
                  >
                    Username
                  </label>
                  <div className="input-group">
                    <input
                      type="text"
                      required
                      className="form-control position-relative"
                      placeholder="Enter Username"
                      onChange={(e) => {
                        setUserForm({
                          ...userForm,
                          email: e.target.value.trim(),
                        });
                      }}
                    />
                    <div
                      className
                      style={{ position: "absolute", right: 10, top: 5 }}
                    >
                      <PersonIcon />
                    </div>
                  </div>
                </div>
                <div className="col-12">
                  <label className="fs-5 pb-2"
                    style={{ fontWeight: 600 }}
                  >
                    Password
                  </label>
                  <div className="input-group">
                    <input
                      required
                      type={showPassword ? "text" : "password"}
                      className="form-control position-relative"
                      placeholder="Enter Password"
                      onChange={(e) => {
                        setUserForm({ ...userForm, password: e.target.value });
                      }}
                    />
                    <div
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: "absolute",
                        right: 10,
                        top: 6,
                        cursor: "pointer",
                      }}
                    >
                      {showPassword ? (
                        <VisibilityIcon />
                      ) : (
                        <VisibilityOffIcon />
                      )}
                    </div>
                  </div>
                </div>
                <div className>
                  <Link
                    href="/ResetPassword"
                    className="float-end fw-semibold text-decoration-none"
                    style={{ fontWeight: 600, textDecoration: 'none!important' }}
                  >
                    Forgot Password?
                  </Link>
                </div>
                <div className="col-12 text-black-100">
                  <button
                    type="submit"
                    style={{ background: "#405189" }}
                    className="btn text-white fs-4 fw-semibold px-4 float-end w-100 rounded-4 text-black-100"
                  >
                    Login
                  </button>
                </div>
              </form>
            </div>
          </div>

        </div>
        <style>
          {`
         a:hover {
           color: inherit;
           }
          `}
        </style>
      </div>
    </>
  );
}
