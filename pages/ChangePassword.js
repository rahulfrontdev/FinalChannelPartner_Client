import React, { useState, useEffect } from 'react'
import LeadShyneIcon from '../Components/Svg/LeadShyneIcon'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { hasCookie, getCookie } from 'cookies-next';
import { toast } from 'react-toastify';
import { Baseurl, ClientUrl, filesUrl } from "../Utils/Constants";
import axios from 'axios'
import { useDispatch, useSelector } from 'react-redux';
import { startButtonLoading, stopButtonLoading } from '../store/buttonLoaderSlice';
import ChannelPartnerHOC from '../HOC/ChannelPartnerHOC';

export default ChannelPartnerHOC(
  function  ChangePassword() {
    const router = useRouter()
    const { tkn } = router.query
    const [token, setToken] = useState('')
    const[clientData,setClientData]=useState();
    const {isButtonLoading}=useSelector((state)=>state.buttonLoader)
    const dispatch=useDispatch();


    const [userInfo, setUserInfo] = useState({ password: "", conf_pass: "" });
    

    const submitHandler = async () => {

        if (userInfo.password == '') {
            toast.error('Please enter the Password')
        } else if (userInfo.conf_pass !== userInfo.password) {
            toast.error('Password does not match with Confirm Password')
        } else {
            dispatch(startButtonLoading())
            let header = {
                headers: {
                    Accept: "application/json",
                }
            }
            try {
                const response = await axios.put(Baseurl + `/db/users/forget`, {
                    token,
                    password: userInfo.password
                }, header);
                if (response.status === 204 || response.status === 200) {
                    toast.success(response.data.message)
                    dispatch(stopButtonLoading())
                    router.push('/')
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

        }

    }


    useEffect(() => {
        if (!router.isReady) return
        const myArray = tkn?.slice(4, tkn.length)
        console.log(typeof (myArray))
        setToken(myArray)
    }, [router.isReady, tkn])

    useEffect(()=>{
        const getSignInData=async()=>{
          try {
            let baseUrl = window.location.origin;
            if(
              baseUrl==="http://localhost:3000" ||
              baseUrl.startsWith("http://10.") ||
              baseUrl.startsWith("http://192.168.") ||
              baseUrl.startsWith("http://172.")
            ){
              baseUrl = ClientUrl;
            }
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
        <div className="NewLoginScreen bg-white">
        <div className="row m-0  login">
          <div style={{background:"#111B34"}} className="col-12 col-lg-6 m-0 p-0">
            <div className="form-left d-flex flex-column justify-content-center">
              {/* <img src="/images/Ellipse26.png" alt="normal"className="image-one" /> */}
              <img
                src={
                  clientData?.logo
                    &&( `${filesUrl}` +
                      `/logo/images${clientData?.logo}`)
                }
                alt
                className=" mx-auto"
              />
              {/* <img
                src="/images/Ellipse27.png"
                alt
                className="image-two d-none d-lg-block"
              /> */}
            </div>
            
          </div>
          <div style={{background:"#F28A21"}} className=" col-12 col-lg-6 d-flex align-items-center justify-content-center pt-5">
            <div className="form-right  d-flex justify-content-center align-items-center ">
              <form action className="row g-4" onSubmit={(e)=>{
                e.preventDefault()
                 submitHandler()}}>
                <div className="col-12">
                  <div className="d-flex flex-column">
                    <b className="fs-3 mb-2 text-center text-md-start">Choose a new Password </b>
                    
                  </div>
                </div>
                <div className="col-12">
                  <label className="fs-5 pb-2" style={{ fontWeight: 600 }}>
                    Password
                  </label>
                  <div className="input-group">
                    <input
                      type="password"
                      required
                      className="form-control position-relative"
                      placeholder="Enter Your Password"
                      onChange={(e) =>
                        setUserInfo({
                            ...userInfo,
                            password: e.target.value,
                        })
                    }
                    value={
                        userInfo.password ? userInfo.password : ""
                    }
                    />
                    
                  </div>
                </div>

                <div className="col-12">
                  <label className="fs-5 pb-2" style={{ fontWeight: 600 }}>
                    Confirm Password
                  </label>
                  <div className="input-group">
                    <input
                      type="password"
                      required
                      className="form-control position-relative"
                      placeholder="Confirm Your Password"
                      onChange={(e) =>
                        setUserInfo({
                            ...userInfo,
                            conf_pass: e.target.value,
                        })
                    }
                    value={
                        userInfo.conf_pass ? userInfo.conf_pass : ""
                    }
                    />
                    
                  </div>
                </div>
                
                <div className="col-12 d-flex gap-4">
                  <button
                    type="submit"
                    disabled={isButtonLoading}
                    style={{background: "#405189"}}
                    className="btn text-white fs-4 fw-semibold px-4 float-end w-100 rounded-4"
                  >
                    {isButtonLoading ? (
                                  <>
                                    &nbsp;Submit <span className="spinner-border spinner-border-sm mb-1" role="status" aria-hidden="true"></span>
                                    
                                  </>
                                ) : (
                                  'Submit'
                                )}
                  </button> 
                  <Link 
                  href={"/"}
                  className="btn btn-danger text-white fs-4 fw-semibold px-4 float-end w-100 rounded-4"              
                  >
                  <button
                    disabled={isButtonLoading}
                    type="button"
                    
                  >
                    Cancel
                  </button> 
                    </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    )
}


)