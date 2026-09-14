import React, { useEffect, useState } from 'react'
import ConfirmBox from './ConfirmBox';
import { useDispatch, useSelector } from "react-redux";
import { startLoading, stopLoading } from "../../../../store/loaderSlice";
import { clearMode } from "../../../../store/dbModeSlice";
import { hasCookie, getCookie, setCookie, deleteCookie, removeCookies } from "cookies-next";
import { useRouter } from 'next/router';
import { userLogOut } from "../../../../store/ClientLoginSlice";
import { toast } from "react-toastify";
import { Baseurl, filesUrl, isRmRole } from '../../../../Utils/Constants';
import axios from 'axios';
import Link from 'next/link';


const ChannelProfileScreen = () => {
    const router = useRouter();
    const dispatch = useDispatch();
    const [userInfo, setuserInfo] = useState({});
    const [showConfirm, setshowConfirm] = useState(false);
    const dbMode = useSelector((state) => state.dbMode.value);
    const clientBtnColor=hasCookie("clientBtnColor") ? getCookie("clientBtnColor") : "#293790"


    const logouthandler = () => {
        deleteCookie("clientBtnColor")
        setCookie("activeLink","/")
        dispatch(startLoading())
        const isAdminMode = dbMode === "admin";
        const isMasterOrUserMode = dbMode === "master" || dbMode === "user";
        setshowConfirm(!showConfirm);
        dispatch(clearMode());
        if (hasCookie("channel")) {
          router.push(isAdminMode ? "/admin" : "/partner")

        } else {
          router.push(isAdminMode ? "/admin" : "/")

        }
        dispatch(isAdminMode ? LoggedOut() : userLogOut());
        dispatch(stopLoading())
        toast.success("Logged Out Successfully",{autoClose:2500});
      };


    const getUserInfo = async (id) => {
        if (hasCookie("token")) {
          let token = getCookie("token");
          let db_name = getCookie("db_name");
    
          let header = {
            headers: {
              Accept: "application/json",
              Authorization: "Bearer ".concat(token),
              db: db_name,
              pass: "pass",
            },
          };
          try {
            const response = await axios.get(
              Baseurl + `/db/users?id=${id}`,
              header
            );
            setuserInfo(response?.data?.data);
          } catch (error) {
            console.log(error)
            if (
              error?.response?.data?.message === "please login again token expired"
            ) {
              toast.error(error?.response?.data?.message,{autoClose:2500});
              dispatch(userLogOut());
              router.push("/");
            } else {
              toast.error("Something went wrong!",{autoClose:2500});
            }
          }
        }
      };

    useEffect(() => {
        if (hasCookie("userInfo")) {

          const userInfo = JSON.parse(getCookie("userInfo"));
          console.log(userInfo.user_code)
          getUserInfo(userInfo.user_code);
        } 
      }, []);

 
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${date.getDate()}/${months[date.getMonth()]}/${date.getFullYear()}`;
    };

    return (
        <>
            <ConfirmBox
                showConfirm={showConfirm}
                setshowConfirm={setshowConfirm}
                actionType={logouthandler}
                title={"Are You Sure you want to Logout ?"}
            />
            <div className="w-100 ps-4 pe-4" style={{overflowY:"auto"}} >
                <div className="main_content">
                    <section className="Channel-profile pb-2">
                        <div className="container mb-4">
                            <div className="row gx-4 ">
                            <div className="profile-text mb-3">Profile</div>
                            
                                <div className="col-12 col-lg-4">
                                    <div className="position-relative profile-details image d-flex flex-column justify-content-center">
                                        <div className="text-center d-flex justify-content-center align-items-center"> 
                                        <Link href="/partner/UserEdit">
                                        <img style={{height:"120px", width:"120px"}}
                          src={
                            userInfo?.db_user_profile?.user_image_file
                              ? `${filesUrl}/lsUser/images${userInfo?.db_user_profile?.user_image_file}`
                              : `/images/profile_picture.png`
                          }
                          alt="normal"
                        />
                                        </Link>
                                        
                                        </div>
                                        <div className="profile-edit">
                                            {/* <img src="/ChannelPartner/profile-edit.svg" alt="normal" className="position-absolute" style={{ cursor: "pointer"  }}/> */}
                                        </div>
                                        <div className="d-flex flex-column gap-4">
                                            <div className="d-flex flex-column justify-content-center align-items-center gap-1">
                                                <span className="person-name mt-4">{userInfo.user}</span> <span className="idd">
                                                    {
                                                        userInfo?.role_id==null && "Admin"
                                                    }
                                                     {
                                                        userInfo?.role_id==1 && "Channel Partner"
                                                    }
                                                    {
                                                        userInfo?.role_id==2 && "BST"
                                                        }
                                                        {
                                                        userInfo?.role_id==3 && "Director"
                                                        }
                                                        {
                                                        isRmRole(userInfo?.role_id) && "RM"
                                                        }
                                                    </span>
                                            </div>
                                            <div className="d-flex flex-column gap-3 person-data">
                                                <div className="d-flex flex-column person-email">
                                                    <div className="d-flex justify-content-between align-items-center">
                                                        <span className="edit-email">
                                                            Email
                                                        </span>
                                                        
                                                        {/* <img src="/ChannelPartner/profile-edit.svg" alt="normal" style={{ height: "17px", cursor: "pointer"  }} /> */}
                                                       
                                                    </div>
                                                    <div>
                                                        <span className="edit-email text-black">{userInfo.email} </span>
                                                    </div>
                                                </div>
                                                <div className="d-flex flex-column person-no">
                                                    <div className="d-flex justify-content-between align-items-center">
                                                        <span className="edit-phone">
                                                            Phone
                                                        </span>
                                                        <Link href="/partner/UserEdit" >
                                                        <img src="/ChannelPartner/profile-edit.svg" alt="normal" style={{ height: "17px", cursor: "pointer" }} />
                                                        </Link>
                                                    </div>
                                                    <div>
                                                        <span className="edit-phone text-black">+91-{userInfo.contact_number}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="profile-logout d-flex justify-content-between align-items-center mt-4  d-none d-lg-flex" onClick={() => setshowConfirm(!showConfirm)}>
                                        <span>Logout</span>
                                        <img src="/ChannelPartner/profile-logout.svg" alt="normal" />
                                    </div>
                                </div>
                                <div className="col-12 col-lg-8">
                                    <ul className="list-group General-list channel-profile-logout" >
                                        <li href="#" className="list-group-item list-group-item-action  text-white"
                                            aria-current="true" 
                                                style={{background:clientBtnColor}}                                                
                                            >
                                            General Details
                                        </li>
                                        <li className="list-group-item list-group-item-action d-flex justify-content-between">
                                            <span className="list-left">Worker Type</span>
                                            <span className="list-right">{userInfo?.db_user_profile?.db_division
?.divison|| "-"}</span>
                                        </li>
                                        <li className="list-group-item list-group-item-action d-flex justify-content-between">
                                            <span className="list-left">Department</span>
                                            <span className="list-right">{userInfo?.db_user_profile?.db_department?.department|| "-"}</span>
                                        </li>
                                        <li className="list-group-item list-group-item-action d-flex justify-content-between">
                                            <span className="list-left">Job Title</span>
                                            <span className="list-right">{userInfo?.db_user_profile?.db_designation?.designation
|| "-"}</span>
                                        </li>
                                        <li className="list-group-item list-group-item-action d-flex justify-content-between">
                                            <span className="list-left">Joining Date</span>
                                            <span className="list-right">{formatDate(userInfo.createdAt)}</span>
                                        </li>
                                        <li className="list-group-item list-group-item-action d-flex justify-content-between">
                                            <span className="list-left">Reporting Manager</span>
                                            <span className="list-right">{userInfo?.reportToUser?.user|| "-"}</span>
                                        </li>
                                        <li className="list-group-item list-group-item-action d-flex justify-content-between">
                                            <span className="list-left">Location</span>
                                            <span className="list-right">{userInfo?.db_city?.city_name} </span>
                                        </li>
                                        <li className="list-group-item list-group-item-action d-flex justify-content-between">
                                            <span className="list-left">Username</span>
                                            <span className="list-right">{userInfo.email} </span>
                                        </li>
                                        <li className="list-group-item list-group-item-action d-flex justify-content-between align-items-baseline pt-1">
                                            <span className="list-left">Password</span>
                                            <span className="list-right" style={{ fontSize: "60px", lineHeight: "0" }}>......</span>
                                        </li>
                                    </ul>
                                    <div className="profile-logout d-flex justify-content-between align-items-center d-lg-none mt-lg-4  " onClick={() => setshowConfirm(!showConfirm)}>
                                        <span>Logout</span>
                                        <img src="/ChannelPartner/profile-logout.svg" alt="normal" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </>
    )

}

export default ChannelProfileScreen