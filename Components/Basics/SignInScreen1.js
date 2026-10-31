import React, { useEffect, useState } from 'react';
import LeadShyneIcon from '../Svg/LeadShyneIcon';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { setCookie } from 'cookies-next';
import { useSelector, useDispatch } from 'react-redux';
import { userMode } from '../../store/dbModeSlice';
import { UserLogIN } from '../../store/ClientLoginSlice';
import { Baseurl, filesUrl } from '../../Utils/Constants';
import axios from 'axios';
import { validEmail } from '../../Utils/regex';
import { assignPermissions, crm, dms, sales, channel } from '../../store/permissionSlice';
import { startLoading, stopLoading } from '../../store/loaderSlice';
import { clearTheme, setSidebarColor, setTopNavColor, setbuttonColor } from '../../store/themeSlice';


export default function SignInScreen({ setLoggedIn }) {

    const router = useRouter()
    const dispatch = useDispatch()
    const [clientData, setClientData] = useState();
    const [userForm, setUserForm] = useState({
        email: "",
        password: ""
    })
    const initialPermission = (permission) => {
        switch (permission) {
            case "CRM":
                dispatch(crm())
                break;

            case "DMS":
                dispatch(dms())
                break;

            case "CHANNEL":
                dispatch(channel())
                break;

            case "SALES":
                dispatch(sales())

            default:
                break;
        }
    }


    const assignPermission = (permissionsArray) => {

        const arr = permissionsArray.reduce((ac, permission) => {
            const platformName = permission.platform_name.toLowerCase();
            return [...ac, platformName];
        }, []);
        dispatch(assignPermissions(arr));

    }



    const submitHandler = async (e) => {
        e.preventDefault();
        dispatch(startLoading())
        if (userForm.email === "" || userForm.email.length < 1) {
            toast.error('Email is Empty');
        }
        else if (!validEmail.test(userForm.email.toLowerCase().trim())) {
            toast.error('Email is not Valid');
        }
        else if (userForm.password === "" || userForm.password.length < 1) {
            toast.error('password is Empty');
        }
        else {
            try {

                const res = await axios.post(Baseurl + "/db/login", {
                    "email": userForm.email.toLowerCase(),
                    "password": userForm.password
                })

                if (res.status === 200) {
                    dispatch(stopLoading())
                    dispatch(userMode())
                    dispatch(UserLogIN())
                    dispatch(clearTheme())
                    setCookie('user', 'true');
                    setCookie('sideUser', 'true');
                    setCookie('token', res.data.token);
                    setCookie('userInfo', res.data.userData);
                    setCookie('clientLogo', res.data.Logo[0]);
                    setCookie('db_name', res.data.userData.db_name);

                    dispatch(setSidebarColor(res.data.Logo[0].sidebar_color || '#405189'))
                    dispatch(setbuttonColor(res.data.Logo[0].button_color || '#405189'))
                    dispatch(setTopNavColor(res.data.Logo[0].top_nav_color || '#405189'))
                    // make this comment below code and we will choose this on platform select page
                    // initialPermission(res.data.platformData[0].platform_name)
                    assignPermission(res.data.platformData)
                    // setCookie("allowedPermissions",res.data.platformData)
                    toast.success('Logged in SuccessFully')
                    router.push('/')
                }

            } catch (error) {
                dispatch(stopLoading())
                if (error?.response?.data?.message) {
                    toast.error(error.response.data.message);
                }
                else {
                    toast.error('Something went wrong!')
                }
            }
        }
    }

    useEffect(() => {
        const getSignInData = async () => {
            try {
                let baseUrl = window.location.origin;
                if (baseUrl === "http://localhost:3000") {
                    baseUrl = "https://connect.theprosperity.in"
                }
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
        <div className="login_wrapper">
            <div className="login_box">
                <div className="img_logo">
                    {/* <LeadShyneIcon />  */}
                    <img
                        src={
                            clientData?.logo
                            && (`${filesUrl}` +
                                `/logo/images${clientData?.logo}`)
                        }
                        alt
                    />
                </div>
                <div className="header"> Please Login to Continue </div>
                <div className="content_box">
                    <form className='login_form' onSubmit={submitHandler}>
                        <div className="field_box">
                            <label htmlFor="username">Email</label>
                            <input
                                type="text"
                                name="username"
                                id="username"
                                placeholder='Please enter your email'
                                className='form-control'
                                onChange={(e) => { setUserForm({ ...userForm, email: e.target.value.trim() }) }}
                            />

                        </div>
                        <div className="field_box">
                            <label htmlFor="password">Password</label>
                            <input
                                type="password"
                                name="password"
                                id="password"
                                placeholder='Please enter your password'
                                className='form-control'
                                onChange={(e) => { setUserForm({ ...userForm, password: e.target.value }) }}
                            />
                        </div>
                        <div className="btn_box">
                            <button className="btn btn-primary" style={{ background: clientData?.button_color }} type='submit'>Submit</button>
                        </div>
                        <div className="forget_links">
                            <Link href='/ResetPassword'> Forgot Password? </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
