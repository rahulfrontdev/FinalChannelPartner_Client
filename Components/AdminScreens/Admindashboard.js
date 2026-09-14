import React, { useEffect, useState } from 'react';
import DashAdminSetCard from './DashAdminSetCard';
import CubesIcon from '../Svg/CubesIcon';
import GroupIcon from '../Svg/GroupIcon';
import Hierarchy from '../Svg/Hierarchy';
import Link from 'next/link';
import { hasCookie, getCookie } from "cookies-next";
import { useSelector } from 'react-redux';
import { Baseurl } from '../../Utils/Constants';
import axios from 'axios';
import Loader from "../Loader/Loader"
import { useRouter } from "next/router";
import CloseIcon from "@mui/icons-material/Close";
import { IconButton, Switch, Modal, Box, Button } from "@mui/material";
import CityMasterModal from './CityMasterModal';

const Admindashboard = () => {
    const router = useRouter();
    const sideView = useSelector((state) => state.sideView.value);
    const [dynamicFields, setDynamicFields] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [loader, setLoader] = useState(false);
    const [open, setOpen] = useState(false);
    const [cityModalOpen, setCityModalOpen] = useState(false);
    const [stateList, setStateList] = useState([]);

    // Get all states
    useEffect(() => {
        getAllState();
    }, []);

    const getAllState = async () => {
        try {
            const token = getCookie('token');
            const db_name = getCookie('db_name');

            if (!token) {
                console.error("No token found");
                return;
            }

            const header = {
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`,
                    db: db_name,
                    pass: 'pass'
                }
            };

            const res = await axios.get(`${Baseurl}/db/admin/state/list?country_id=101`, header);

            // Debug: Check what the API returns
            console.log("API RESPONSE:", res.data);
            console.log("API DATA:", res.data?.data);

            // Check if data exists and is an array
            if (res.data?.data && Array.isArray(res.data.data)) {
                // Map is_enabled to is_available for consistency
                // Check multiple possible field names from API
                const statesWithAvailability = res.data.data.map(item => ({
                    ...item,
                    is_available: item.is_enabled === true || item.is_enabled === 1 || item.is_available === true || item.status === true || item.active === true
                }));

                console.log("MAPPED STATES:", statesWithAvailability);
                setStateList(statesWithAvailability);
            } else {
                console.error("Invalid API response structure:", res.data);
                setStateList([]);
            }
        } catch (error) {
            console.error("Error fetching states:", error);
            console.error("Error details:", error.response?.data || error.message);
            setStateList([]);
        }
    };

    useEffect(() => {
        getSidebarInfo('admin-nav');
    }, []);

    const getSidebarInfo = async (navLink) => {
        if (!hasCookie('token')) {
            return;
        }

        const token = getCookie('token');
        const db_name = getCookie('db_name');
        const header = {
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
                db: db_name,
                pass: 'pass'
            }
        };

        try {
            setLoader(true);
            const { data } = await axios.get(`${Baseurl}/db/permission/${navLink}`, header);
            console.log("Full API Response:", data.data);
            console.log("DashBoard Navigaton (index 0):", data.data[0]?.children);
            console.log("DashBoard Master Navigation (index 1):", data.data[1]?.children);
            if (data?.status == 200) {
                setLoader(false);
                // Merge both navigation groups to show all items including "User Master"
                // data[0] = "DashBoard Navigaton" (regular navigation)
                // data[1] = "DashBoard Master Navigation" (master settings including "User Master")
                const allChildren = [
                    ...(data?.data[0]?.children || []),
                    ...(data?.data[1]?.children || [])
                ];
                setDynamicFields(allChildren);
            }
        } catch (error) {
            setLoader(false);
            console.log(error);
        }
    };

    useEffect(() => {
        if (searchTerm) {
            const results = [];
            dynamicFields.forEach((item) => {
                if (item.allais_menu.toLowerCase().includes(searchTerm.toLowerCase())) {
                    item.children.forEach((i) => {
                        results.push({ ...i, parentMenu: item.allais_menu });
                    });
                } else {
                    item.children.forEach((i) => {
                        if (i.allais_menu.toLowerCase().includes(searchTerm.toLowerCase())) {
                            results.push({ ...i, parentMenu: item.allais_menu });
                        }
                    });
                }
            });
            setSuggestions(results);
        } else {
            setSuggestions([]);
        }
    }, [searchTerm, dynamicFields]);

    const handleOpen = () => {
        setOpen(true);
        // Refetch state list when modal opens to ensure fresh data
        getAllState();
    };
    const handleClose = () => setOpen(false);

    const handleCityOpen = () => {
        setCityModalOpen(true);
        getAllState();
    };
    const handleCityClose = () => setCityModalOpen(false);

    // Toggle state availability - sends individual state to API immediately
    // This ensures previous states are NOT removed
    const handleToggle = async (state_id) => {
        try {
            // Find the current state to get its new availability status
            const currentState = stateList.find(item => item.state_id === state_id);
            const newAvailability = !currentState.is_available;

            // Update local state immediately for UI feedback
            setStateList(prev =>
                prev.map(item =>
                    item.state_id === state_id
                        ? { ...item, is_available: newAvailability }
                        : item
                )
            );

            // Send ONLY this single state with its new status
            // Backend can accept: state_id: 3 OR state_id: [3] OR state_id: [{ state_id: 3 }]
            const payload = {
                state_id: state_id,  // Single ID format
                is_enabled: newAvailability
            };

            console.log("TOGGLE PAYLOAD SENT:", payload);

            const token = getCookie("token");
            const db_name = getCookie("db_name");

            const response = await axios.put(
                `${Baseurl}/db/admin/state/toggle-availability`,
                payload,
                {
                    headers: {
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`,
                        db: db_name,
                        pass: 'pass',
                        "Content-Type": "application/json",
                    },
                }
            );

            console.log("API Response:", response.data);
        } catch (error) {
            console.error("API Error:", error);
            // Revert local state on error
            setStateList(prev =>
                prev.map(item =>
                    item.state_id === state_id
                        ? { ...item, is_available: !item.is_available }
                        : item
                )
            );
            alert("Something went wrong while updating!");
        }
    };

    // Close modal and refresh data
    const handleUpdate = async () => {
        // Refresh the state list from API to get the latest data
        await getAllState();
        alert("State list refreshed!");
        handleClose();
    };

    return (
        <>
            {
                loader ? <div className={`main_Box ${sideView}`}><Loader /></div> : (
                    <div className={`main_Box ${sideView}`}>
                        <div className="bread_head">
                            <h3 className="content_head">ADMIN DASHBOARD</h3>
                        </div>
                        <div className="main_content admin_dashboard">
                            <div className="top_search_bar">
                                <div className="col-md-5 col-xl-5 col-sm-12 col-12 position-relative">
                                    <input
                                        type="text"
                                        name="search"
                                        id="search"
                                        placeholder='Search by Keywords'
                                        className='form-control'
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                    {searchTerm && suggestions.length > 0 && (
                                        <ul className="suggestions_list">
                                            {suggestions.map((s, index) => (
                                                <li key={index} className="suggestion_item">
                                                    <Link href={`/${s.link}`}>
                                                        <div className="suggestion_link">{s.parentMenu} - {s.allais_menu}</div>
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>

                            <div className="settings_super_admin">
                                <div className="settings_heads">
                                    Settings Admin
                                </div>
                                <div className="settings_cards">
                                    <div className="row">
                                        <div className="col-xl-3 col-md-3 col-sm-12 col-12">
                                            <Link href='/UserProfileManagement'>
                                                <DashAdminSetCard name='User Profiles Master' />
                                            </Link>
                                        </div>
                                        <div className="col-xl-3 col-md-3 col-sm-12 col-12">
                                            <Link href='/EmailConfiguration'>
                                                <DashAdminSetCard name='Email Configuration' />
                                            </Link>
                                        </div>
                                        <div className="col-xl-3 col-md-3 col-sm-12 col-12">
                                            <Link href='/LicenseDetails'>
                                                <DashAdminSetCard name='License Details' />
                                            </Link>
                                        </div>
                                        <div className="col-xl-3 col-md-3 col-sm-12 col-12">
                                            <Link href='/CommonSettings'>
                                                <DashAdminSetCard name='Settings' />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="admin_setings_lists">
                                <div className="row">
                                    <div className="col-xl-6 col-md-6 col-sm-12 col-12">
                                        {dynamicFields?.map((item, index) => (
                                            index % 2 === 0 ? (
                                                <div key={index} className="card_wrapper">
                                                    <div className="card_lists">
                                                        <div className="card_head">{item?.allais_menu}:</div>
                                                        <ul className="settings_list">
                                                            {item?.children?.map((i) => (
                                                                <Link href={`/${i.link}`} key={i?.menu_id}>
                                                                    <li className="list_item">{i?.allais_menu}</li>
                                                                </Link>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                    <div className="icons">
                                                        <Hierarchy />
                                                    </div>
                                                </div>
                                            ) : null
                                        ))}
                                        <div className="card_wrapper">
                                            <div className="card_lists">
                                                <div className="card_head">Project Management</div>
                                                <ul className="settings_list">
                                                    <Link href="/ProjectManagement">
                                                        <li className="list_item">Project Management</li>
                                                    </Link>
                                                </ul>
                                            </div>
                                            <div className="icons">
                                                <Hierarchy />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-xl-6 col-md-6 col-sm-12 col-12">
                                        {dynamicFields?.map((item, index) => (
                                            index % 2 !== 0 ? (
                                                <div key={index} className="card_wrapper">
                                                    <div className="card_lists">
                                                        <div className="card_head">{item?.allais_menu}:</div>
                                                        <ul className="settings_list">
                                                            {item?.children?.map((i) => (
                                                                <Link href={`/${i.link}`} key={i?.menu_id}>
                                                                    <li className="list_item">{i?.allais_menu}</li>
                                                                </Link>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                    <div className="icons">
                                                        <Hierarchy />
                                                    </div>
                                                </div>
                                            ) : null
                                        ))}
                                        <div className="card_wrapper">
                                            <div className="card_lists">
                                                <div className="card_head">State Management</div>
                                                <ul className="settings_list">
                                                    <li className="list_item" style={{ cursor: 'pointer' }} onClick={handleOpen}>
                                                        State Management
                                                    </li>
                                                </ul>
                                            </div>
                                            <div className="icons">
                                                <Hierarchy />
                                            </div>
                                        </div>
                                        <div className="card_wrapper">
                                            <div className="card_lists">
                                                <div className="card_head">City Master</div>
                                                <ul className="settings_list">
                                                    <li className="list_item" style={{ cursor: 'pointer' }} onClick={handleCityOpen}>
                                                        City Master
                                                    </li>
                                                </ul>
                                            </div>
                                            <div className="icons">
                                                <Hierarchy />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* State Modal */}
                                <Modal open={open} onClose={handleClose}>
                                    <Box
                                        sx={{
                                            width: 600,
                                            bgcolor: "white",
                                            borderRadius: 2,
                                            mx: "auto",
                                            mt: "1%",
                                            position: "relative",
                                            maxHeight: "80vh",
                                            display: "flex",
                                            flexDirection: "column",
                                        }}
                                    >
                                        {/* Close Button */}
                                        <IconButton
                                            onClick={handleClose}
                                            sx={{
                                                position: "absolute",
                                                top: 10,
                                                right: 10,
                                                color: "black",
                                            }}
                                        >
                                            <CloseIcon />
                                        </IconButton>

                                        {/* Header */}
                                        <h3
                                            style={{
                                                margin: 0,
                                                padding: "20px 0",
                                                textAlign: "center",
                                                fontWeight: "bold",
                                                borderBottom: "1px solid #eee",
                                            }}
                                        >
                                            State List (Enable or Disable)
                                        </h3>

                                        {/* Scrollable List */}
                                        <Box
                                            sx={{
                                                flex: 1,
                                                overflowY: "auto",
                                                padding: "0 20px",
                                            }}
                                        >
                                            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                                                {stateList.map((item, i) => (
                                                    <li
                                                        key={item.state_id}
                                                        style={{
                                                            padding: "10px 0",
                                                            display: "flex",
                                                            justifyContent: "space-between",
                                                            alignItems: "center",
                                                            borderBottom: "1px solid #eee",
                                                        }}
                                                    >
                                                        <span>{item.state_name}</span>
                                                        <Switch
                                                            color="primary"
                                                            checked={item.is_available}
                                                            onChange={() => handleToggle(item.state_id)}
                                                        />
                                                    </li>
                                                ))}
                                            </ul>
                                        </Box>

                                        {/* Fixed Update Button */}
                                        <Box
                                            sx={{
                                                borderTop: "1px solid #eee",
                                                p: 2,
                                                display: "flex",
                                                justifyContent: "flex-end",
                                                bgcolor: "white",
                                                position: "sticky",
                                                bottom: 0,
                                            }}
                                        >
                                            <Button
                                                variant="contained"
                                                color="primary"
                                                onClick={handleClose}
                                            >
                                                Close
                                            </Button>
                                        </Box>
                                    </Box>
                                </Modal>

                                <CityMasterModal
                                    open={cityModalOpen}
                                    onClose={handleCityClose}
                                    stateList={stateList}
                                />
                            </div>
                        </div>

                        <style jsx>{`
                            .position-relative {
                                position: relative;
                            }
                            .suggestions_list {
                                position: absolute;
                                top: 100%;
                                left: 0;
                                width: 100%;
                                max-height: 200px;
                                overflow-y: auto;
                                background: #fff;
                                border: 1px solid #ccc;
                                border-top: none;
                                z-index: 1000;
                            }
                            .suggestion_item {
                                padding: 8px 16px;
                                cursor: pointer;
                                border-bottom: 1px solid #eee;
                            }
                            .suggestion_item:last-child {
                                border-bottom: none;
                            }
                            .suggestion_item:hover {
                                background: #f0f0f0;
                            }
                            .suggestion_link {
                                text-decoration: none;
                                color: #333;
                                display: block;
                            }
                            .suggestion_link:hover {
                                text-decoration: underline;
                            }
                        `}</style>
                    </div>
                )
            }
        </>
    );
};

export default Admindashboard;