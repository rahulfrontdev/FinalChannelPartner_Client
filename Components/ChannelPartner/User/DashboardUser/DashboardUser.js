import React, { useState, useEffect } from 'react'
import { hasCookie, getCookie, setCookie } from "cookies-next";
import { toast } from "react-toastify";
import axios from "axios";
import { useRouter } from "next/router";
import DashLeadsCard from './DashLeadsCard'
import { Baseurl, filesUrl, isRmRole } from '../../../../Utils/Constants';
import moment from 'moment';
import { useSelector } from 'react-redux';
import ReChart from './ReChart';
import Datepicker from 'react-tailwindcss-datepicker';
import generatePDF from 'react-to-pdf';
import Loader from '../../../Loader/Loader';
import Link from 'next/link';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import ContactsIcon from '@mui/icons-material/Contacts';
import CallIcon from '@mui/icons-material/Call';
import NotInterestedIcon from '@mui/icons-material/NotInterested';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import WhereToVoteIcon from '@mui/icons-material/WhereToVote';
import BookOnlineIcon from '@mui/icons-material/BookOnline';
import TimelapseIcon from '@mui/icons-material/Timelapse';
import Diversity3Icon from '@mui/icons-material/Diversity3';
import PersonPinCircleIcon from '@mui/icons-material/PersonPinCircle';
import PermPhoneMsgIcon from '@mui/icons-material/PermPhoneMsg';


const DashboardUser = () => {
    const sideView = useSelector((state) => state.sideView.value);
    const clientLogo = getCookie('clientLogo') ? JSON.parse(getCookie('clientLogo')) : null;
    const [showLogo, setShowLogo] = useState(false)
    const router = useRouter();
    const { id } = router.query;

    const [timeFilter, settimeFilter] = useState('weekly');
    const [dataList, setDataList] = useState({})
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isLoading, setisLoading] = useState(true)
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [checkInInfo, setCheckInInfo] = useState({})
    const [checkInState, setCheckInState] = useState('')
    const [userDetails, setUserDetails] = useState({})
    const [value, setValue] = useState()
    const [loader, setLoader] = useState(false)
    const userInfoCheck = hasCookie("userInfo") ? JSON.parse(getCookie("userInfo")) : null



    const getTargetElement = () => document.getElementById("to-be-printed");
    const options = {
        filename: `ChannelPartner-${new Date().getDate()}.pdf`,
        page: {
            margin: 10
        }
    };
    const downloadPdf = () => {
        setTimeout(() => {
            generatePDF(getTargetElement, options);
        }, 0)

        setTimeout(() => {
            setShowLogo(false)
        }, 1)
    }



    const handleValueChange = (newValue) => {
        setValue(newValue);
        setStartDate(startDate)
        setEndDate(endDate)
        const queryObjLeads = {
            f_date: newValue.startDate,
            t_date: newValue.endDate,
        }

        getDataList(newValue.startDate, newValue.endDate);

    }




    // Get the start of the week
    function currentWeak() {
        let today = new Date();
        let startOfWeek = new Date(today);
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + 1); // Monday

        // Get the end of the week
        let endOfWeek = new Date(currentDate);
        endOfWeek.setDate(currentDate.getDate() + (7 - currentDate.getDay())); // Sunday


        // Format the dates
        let formattedStartOfWeek = startOfWeek.toISOString().substr(0, 10);
        let formattedEndOfWeek = endOfWeek.toISOString().substr(0, 10);
        settimeFilter('weekly')
        setValue({
            ...value,
            startDate: formattedStartOfWeek,
            endDate: formattedEndOfWeek,
        })
        setEndDate(formattedEndOfWeek)
        setStartDate(formattedStartOfWeek)

    }

    const currDate = moment().format('YYYY-MM-DD LTS');
    const startDay = moment().format('YYYY-MM-DD 00:00:00');
    const nextDay = moment().add(1, 'day').format('YYYY-MM-DD 00:00:00');

    async function getAttndncData() {
        if (hasCookie("token")) {
            let token = getCookie("token");
            let db_name = getCookie("db_name");

            let header = {
                headers: {
                    Accept: "application/json",
                    Authorization: "Bearer ".concat(token),
                    db: db_name,
                    pass: 'pass'
                },
            };

            try {
                const response = await axios.get(Baseurl + `/db/checkin?start_date=${startDay}&end_date=${nextDay}`, header);
                setCheckInInfo(response.data.data)
                if (response.status === 204 || response.status === 200) {
                    setCheckInState('2');
                    setisLoading(false);
                }
            } catch (error) {
                if (error?.response?.data?.message) {
                    if (error.response.data.message == "not logged In") {
                        setCheckInState('1');
                        setisLoading(false);
                    }
                } else {
                    toast.error("Something went wrong!", { autoClose: 2500 });
                }
            }
        }

    }

    async function checkInFunc() {
        const reqInfo = {
            ...userDetails,
            "check_in": currDate,
            "start_date": startDay,
            "end_date": nextDay,
        }
        if (!userDetails.lat) {
            toast.error('Please Allow Location Permissions', { autoClose: 2500 })
        } else {
            if (hasCookie("token")) {
                let token = getCookie("token");
                let db_name = getCookie("db_name");

                let header = {
                    headers: {
                        Accept: "application/json",
                        Authorization: "Bearer ".concat(token),
                        db: db_name,
                        m_id: 194
                    },
                };

                try {
                    const response = await axios.post(Baseurl + `/db/checkin`, reqInfo, header);
                    if (response.status === 204 || response.status === 200) {
                        toast.success(response?.data?.message, { autoClose: 2500 });
                        getAttndncData();
                    }
                } catch (error) {
                    if (error?.response?.data?.message) {
                        toast.error(error?.response?.data?.message, { autoClose: 2500 });
                    } else {
                        toast.error("Something went wrong!", { autoClose: 2500 });
                    }
                }
            }
        }

    }

    async function checkoutFunc() {
        const reqInfo = {
            "check_out": currDate,
            "start_date": startDay,
            "end_date": nextDay,
        }
        if (!userDetails.lat) {
            toast.error('Please Allow Location Permissions', { autoClose: 2500 })
        } else {
            if (hasCookie("token")) {
                let token = getCookie("token");
                let db_name = getCookie("db_name");

                let header = {
                    headers: {
                        Accept: "application/json",
                        Authorization: "Bearer ".concat(token),
                        db: db_name,
                        m_id: 194
                    },
                };

                try {
                    const response = await axios.put(Baseurl + `/db/checkin`, reqInfo, header);
                    if (response.status === 204 || response.status === 200) {
                        toast.success(response?.data?.message, { autoClose: 2500 });
                        getAttndncData();
                    }
                } catch (error) {
                    if (error?.response?.data?.message) {
                        toast.error(error?.response?.data?.message, { autoClose: 2500 });
                    } else {
                        toast.error("Something went wrong!", { autoClose: 2500 });
                    }
                }
            }
        }
    }


    function currentMonth() {
        let today = new Date();
        let year = today.getFullYear();
        let month = today.getMonth() + 1; // Month starts from 0
        let daysInMonth = new Date(year, month, 0).getDate(); // Get total number of days in current month
        let startDate = new Date(year, month - 1, 1); // First day of current month
        let endDate = new Date(year, month - 1, daysInMonth); // Last day of current month
        // Format the dates as strings in "yyyy-mm-dd" format
        let startDateString = moment(startDate).format("YYYY-MM-DD");
        let endDateString = moment(endDate).format("YYYY-MM-DD")
        settimeFilter('monthly')
        setEndDate(endDateString)
        setStartDate(startDateString)

    }
    function AllData() {
        let today = new Date()
        let currentDate = today.toISOString().slice(0, 10);
        settimeFilter('all')
        setEndDate(currentDate)
        setStartDate('2023-02-01')

    }

    const getDataList = async (start, end, type) => {
        setLoader(true)
        if (hasCookie("token")) {
            let token = getCookie("token");
            let db_name = getCookie("db_name");

            let header = {
                headers: {
                    Accept: "application/json",
                    Authorization: "Bearer ".concat(token),
                    db: db_name,
                },
            };
            try {
                const response = await axios.get(Baseurl + `/db/channel/dashboard?endDate=${end}&&startDate=${start}`, header);
                if (response?.status === 200 || response?.status === 201) {
                    setLoader(false)
                    setDataList(response?.data?.data);
                }
            } catch (error) {
                setLoader(false)
                console.log(error);
                toast.error("Something went wrong!", { autoClose: 2500 });
            }
        }
    };
    useEffect(() => {
        currentWeak();
    }, []);


    useEffect(() => {
        if (startDate !== null && endDate !== null) {
            getDataList(startDate, endDate);
        }
    }, [router.isReady, id, startDate]);

    useEffect(() => {
        const location = window.navigator && window.navigator.geolocation
        if (location) {
            location.getCurrentPosition((position) => {
                setUserDetails({
                    ...userDetails,
                    lat: position.coords.latitude,
                    lon: position.coords.longitude,
                })
            }, (error) => {
                setUserDetails({ ...userDetails, lat: null, lon: null })
            })
        }
        getAttndncData();
    }, [])

    return (
        <>
            {
                loader ? <div className='d-block w-100'><Loader /></div> :
                    (
                        <div className='d-block w-100'>
                            <div>
                                <div className=' d-flex justify-content-end pe-4  pt-3'>
                                    <img src="/ChannelPartner/download-file-blue.svg" alt="normal" style={{ height: 17, cursor: "pointer" }} onClick={() => {
                                        setShowLogo(true)
                                        downloadPdf()
                                    }} />
                                </div>
                            </div>
                            <div className={`main_Box w-100 `} >
                                <div className="main_content dashboard indxx" id='to-be-printed' >
                                    <div className="Cards_side w-100">
                                        <div className="dashboard_head">
                                            <div className="time_filter" style={{ marginTop: "-40px", marginBottom: "-10px" }}>
                                                {
                                                    showLogo ?
                                                        (
                                                            <img src={`${filesUrl}/logo/images${clientLogo?.logo}`} alt="normal" className='pt-3 pb-3' />

                                                        )
                                                        :
                                                        (
                                                            <div className='mt-5 mt-md-4'>
                                                                <Datepicker
                                                                    value={value}
                                                                    showFooter={true}
                                                                    displayFormat={"DD-MM-YYYY"}
                                                                    onChange={handleValueChange}
                                                                    showShortcuts={true}
                                                                    popoverDirection="down"
                                                                    primaryColor={"blue"}
                                                                    containerClassName="relative w-64 mt-8  border rounded-md mb-4 border-black  text-black inline-block"
                                                                />
                                                            </div>

                                                        )
                                                }
                                            </div>
                                        </div>
                                        <div className="cards_Box">
                                            {
                                                userInfoCheck?.role_id !== 2 && (
                                                <div className="row leads_row addgap">
                                                    {!isRmRole(userInfoCheck?.role_id) && (
                                                    <div className="col-xl-3 col-md-3 col-12 col-sm-12">
                                                        <Link href={`/partner/Leads`} onClick={() => {
                                                            const queryObjLeads = {
                                                                f_date: value.startDate,
                                                                t_date: value.endDate,
                                                            }
                                                            setCookie(`LeadsFilter`, queryObjLeads)
                                                        }}>
                                                            <DashLeadsCard
                                                                head='Total Leads'
                                                                price={dataList.leads}
                                                                date={`${moment(value?.startDate).format("DD-MM-YYYY")} to ${moment(value?.endDate).format("DD-MM-YYYY")}`}
                                                                img='/images/groupicon.png'
                                                                color="#05539c"
                                                                icon={Diversity3Icon} />
                                                        </Link>

                                                    </div>
                                                    )}
                                                    <div className="col-xl-3 col-md-3 col-12 col-sm-12">
                                                        <Link href={"/partner/Visits"} onClick={() => {
                                                            const queryObjLeads = {
                                                                f_date: value.startDate,
                                                                t_date: value.endDate,
                                                            }
                                                            setCookie(`VisitsFilter`, queryObjLeads)
                                                        }}>
                                                            <DashLeadsCard
                                                                head='Visits Completed'
                                                                price={dataList.visits}
                                                                date={`${moment(value?.startDate).format("DD-MM-YYYY")} to ${moment(value?.endDate).format("DD-MM-YYYY")}`}
                                                                img='/images/groupicon.png'
                                                                color='#9c8f05'
                                                                icon={WhereToVoteIcon} />

                                                        </Link>

                                                    </div>
                                                    {!isRmRole(userInfoCheck?.role_id) && (
                                                    <>
                                                    <div className="col-xl-3 col-md-3 col-12 col-sm-12">
                                                        <Link href={"/partner/Bookings"} onClick={() => {
                                                            const queryObjLeads = {
                                                                f_date: value.startDate,
                                                                t_date: value.endDate,
                                                            }
                                                            setCookie(`BookingsFilter`, queryObjLeads)
                                                        }}>

                                                            <DashLeadsCard
                                                                head='Bookings Completed'
                                                                price={dataList.booking}
                                                                date={`${moment(value?.startDate).format("DD-MM-YYYY")} to ${moment(value?.endDate).format("DD-MM-YYYY")}`}
                                                                img='/images/usericon.png'
                                                                color='#9c0550'
                                                                icon={BookOnlineIcon} />
                                                        </Link>

                                                    </div>
                                                    <div className="col-xl-3 col-md-3 col-12 col-sm-12">

                                                        <DashLeadsCard
                                                            head='Tat For Leads'
                                                            //  price={`${dataList?.averageHours || '0'} ʰʳˢ `} 
                                                            price={dataList?.averageHours != "NaN" ? `${dataList?.averageHours || '0'} ʰʳˢ ` : `${'0'} ʰʳˢ `}
                                                            date={`${moment(value?.startDate).format("DD-MM-YYYY")} to ${moment(value?.endDate).format("DD-MM-YYYY")}`}
                                                            img='/images/usericon.png'
                                                            color='#03850d'
                                                            icon={TimelapseIcon} />
                                                    </div>
                                                    </>
                                                    )}
                                                </div>
                                                )
                                            }

                                            {
                                                <>
                                                    <label className='m-3 fw-bold' style={{ fontSize: "24px", color: "#160354" }}>CP LEADS</label>
                                                    <div className="row leads_row addgap">
                                                        {!isRmRole(userInfoCheck?.role_id) && (
                                                        <>
                                                        <div className="col-xl-3 col-md-3 col-12 col-sm-12">
                                                            <Link href={"/partner/CPRegisterLeads?status_id=OPEN"} onClick={() => {
                                                                const queryObjLeads = {
                                                                    f_date: value.startDate,
                                                                    t_date: value.endDate,
                                                                }
                                                                setCookie(`cpleadsFilter`, queryObjLeads)
                                                            }}>
                                                                <DashLeadsCard
                                                                    head='OPEN'
                                                                    price={dataList.OPENCPs}
                                                                    date={`${moment(value?.startDate).format("DD-MM-YYYY")} to ${moment(value?.endDate).format("DD-MM-YYYY")}`}
                                                                    img='/images/usericon.png'
                                                                    color='#ff0000'
                                                                    icon={AutoGraphIcon}
                                                                />
                                                            </Link>
                                                        </div>

                                                        <div className="col-xl-3 col-md-3 col-12 col-sm-12">
                                                            <Link href={"/partner/CPRegisterLeads?status_id=CALL"} onClick={() => {
                                                                const queryObjLeads = {
                                                                    f_date: value.startDate,
                                                                    t_date: value.endDate,
                                                                }
                                                                setCookie(`cpleadsFilter`, queryObjLeads)
                                                            }}>
                                                                <DashLeadsCard
                                                                    head='CALL'
                                                                    price={dataList.CALLCPs}
                                                                    date={`${moment(value?.startDate).format("DD-MM-YYYY")} to ${moment(value?.endDate).format("DD-MM-YYYY")}`}
                                                                    img='/images/usericon.png'
                                                                    color='#008000'
                                                                    icon={CallIcon}
                                                                />
                                                            </Link>
                                                        </div>

                                                        <div className="col-xl-3 col-md-3 col-12 col-sm-12">
                                                            <Link href={"/partner/CPRegisterLeads?status_id=CONTACTED"} onClick={() => {
                                                                const queryObjLeads = {
                                                                    f_date: value.startDate,
                                                                    t_date: value.endDate,
                                                                }
                                                                setCookie(`cpleadsFilter`, queryObjLeads)
                                                            }}>
                                                                <DashLeadsCard
                                                                    head='CONTACTED'
                                                                    price={dataList.CONTACTEDCPs}
                                                                    date={`${moment(value?.startDate).format("DD-MM-YYYY")} to ${moment(value?.endDate).format("DD-MM-YYYY")}`}
                                                                    img='/images/usericon.png'
                                                                    color='#cc5f10'
                                                                    icon={ContactsIcon}
                                                                />
                                                            </Link>
                                                        </div>

                                                        <div className="col-xl-3 col-md-3 col-12 col-sm-12">
                                                            <Link href={"/partner/CPRegisterLeads?status_id=NOT INTERESTED"} onClick={() => {
                                                                const queryObjLeads = {
                                                                    f_date: value.startDate,
                                                                    t_date: value.endDate,
                                                                }
                                                                setCookie(`cpleadsFilter`, queryObjLeads)
                                                            }}>
                                                                <DashLeadsCard
                                                                    head='NOT INTERESTED'
                                                                    price={dataList.NOTINTERESTEDCPs}
                                                                    date={`${moment(value?.startDate).format("DD-MM-YYYY")} to ${moment(value?.endDate).format("DD-MM-YYYY")}`}
                                                                    img='/images/usericon.png'
                                                                    color='#ad027a'
                                                                    icon={NotInterestedIcon}
                                                                />
                                                            </Link>
                                                        </div>
                                                        </>
                                                        )}

                                                        <div className="col-xl-3 col-md-3 col-12 col-sm-12">
                                                            <Link href={"/partner/CPRegisterLeads?status_id=ONBOARDED"} onClick={() => {
                                                                const queryObjLeads = {
                                                                    f_date: value.startDate,
                                                                    t_date: value.endDate,
                                                                }
                                                                setCookie(`cpleadsFilter`, queryObjLeads)
                                                            }}>
                                                                <DashLeadsCard
                                                                    head='ONBOARDED'
                                                                    price={dataList.ONBOARDEDCPs}
                                                                    date={`${moment(value?.startDate).format("DD-MM-YYYY")} to ${moment(value?.endDate).format("DD-MM-YYYY")}`}
                                                                    img='/images/usericon.png'
                                                                    color='#0000FF'
                                                                    icon={GroupAddIcon}
                                                                />
                                                            </Link>
                                                        </div>

                                                        <div className="col-xl-3 col-md-3 col-12 col-sm-12">
                                                            <Link href={"/partner/CPRegisterLeads?status_id=VISIT"} onClick={() => {
                                                                const queryObjLeads = {
                                                                    f_date: value.startDate,
                                                                    t_date: value.endDate,
                                                                }
                                                                setCookie(`cpleadsFilter`, queryObjLeads)
                                                            }}>
                                                                <DashLeadsCard
                                                                    head='VISIT'
                                                                    price={dataList.VISITCPs}
                                                                    date={`${moment(value?.startDate).format("DD-MM-YYYY")} to ${moment(value?.endDate).format("DD-MM-YYYY")}`}
                                                                    img='/images/usericon.png'
                                                                    color="#8a059c"
                                                                    icon={PersonPinCircleIcon}
                                                                />
                                                            </Link>
                                                        </div>
                                                        {!isRmRole(userInfoCheck?.role_id) && (
                                                        <div className="col-xl-3 col-md-3 col-12 col-sm-12">
                                                            <Link href={"/partner/CPRegisterLeads?status_id=FOLLOW UP"} onClick={() => {
                                                                const queryObjLeads = {
                                                                    f_date: value.startDate,
                                                                    t_date: value.endDate,
                                                                }
                                                                setCookie(`cpleadsFilter`, queryObjLeads)
                                                            }}>
                                                                <DashLeadsCard
                                                                    head='FOLLOW UP'
                                                                    price={dataList.FOLLOWUPCPs}
                                                                    date={`${moment(value?.startDate).format("DD-MM-YYYY")} to ${moment(value?.endDate).format("DD-MM-YYYY")}`}
                                                                    img='/images/usericon.png'
                                                                    color="#018c7e"
                                                                    icon={PermPhoneMsgIcon}
                                                                />
                                                            </Link>
                                                        </div>
                                                        )}
                                                    </div>
                                                </>
                                                // )
                                            }


                                            {
                                                userInfoCheck?.role_id == 1 && (
                                                    <div className="row ">

                                                        {dataList?.barchart?.length ?
                                                            <div className="col-xl-10 col-md-6 col-12 col-sm-12 mt-2">
                                                                <div className="dash_card chartSec">
                                                                    <ReChart
                                                                        head='Leads Generated V/s Leads Booked'
                                                                        dataList={dataList?.barchart}
                                                                    />
                                                                </div>
                                                            </div> : null}
                                                    </div>
                                                )
                                            }



                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>
                    )
            }
            <style>
                {
                    `
                .addgap{
                --bs-gutter-y: 1.5rem;
                }
                `
                }
            </style>
        </>


    )
}

export default DashboardUser