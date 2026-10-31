
import React, { useEffect, useState } from "react";
import LeadShyneIcon from '../Components/Svg/LeadShyneIcon'
import Link from 'next/link'
import axios from "axios";
import { Baseurl, filesUrl } from "../Utils/Constants";
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import ChannelPartnerHOC from "../HOC/ChannelPartnerHOC";

const ResetPassword = () => {

    const router = useRouter();
    const [userInfo, setUserInfo] = useState({ email: "" });
    const[clientData,setClientData]=useState();

    const submitHandler = async () => {

        if (userInfo.email == '') {
            toast.error('Please enter the Email')
        } else {

            let header = {
                headers: {
                    Accept: "application/json",

                }
            }
            try {
                const response = await axios.post(Baseurl + `/db/users/forget`, userInfo, header);
                if (response.status === 204 || response.status === 200) {
                    toast.success(response.data.message)
                    router.push('/Signin')

                }
            } catch (error) {
                if (error?.response?.data?.message) {
                    toast.error(error.response.data.message);
                }
                else {
                    console.log(error);
                    toast.error('Something went wrong!')
                }
            }
        }

    }

    useEffect(()=>{
        const getSignInData=async()=>{
          try {
            let baseUrl = window.location.origin;
            if(baseUrl==="http://localhost:3000"){
              baseUrl="https://connect.theprosperity.in"
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
                    <b className="fs-3 mb-2 text-center text-md-start">Please Enter Your Mail</b>
                    
                  </div>
                </div>
                <div className="col-12">
                  <label className="fs-5 pb-2" style={{ fontWeight: 600 }}>
                    Email
                  </label>
                  <div className="input-group">
                    <input
                      type="text"
                      required
                      className="form-control position-relative"
                      placeholder="Please Enter Your E-mail"
                      onChange={(e) => {
                        setUserInfo({
                          ...userInfo,
                          email: e.target.value,
                        });
                      }}
                      value={
                        userInfo.email ? userInfo.email : ""
                    }
                    />
                    
                  </div>
                </div>
                
                <div className="col-12 d-flex gap-4">
                  <button
                    type="submit"
                    style={{background: "#405189"}}
                    className="btn text-white fs-4 fw-semibold px-4 float-end w-100 rounded-4"
                  >
                    Submit
                  </button> 
                  <Link
                    type="submit"
                    href={"/"}
                    className="btn btn-danger text-white fs-4 fw-semibold px-4 float-end w-100 rounded-4"
                  >
                    Cancel
                  </Link> 
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    )
}

export default ChannelPartnerHOC (ResetPassword)