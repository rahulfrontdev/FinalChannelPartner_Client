import React from 'react'
import MUIDataTable from "mui-datatables";
import ViewIcon from '../Svg/ViewIcon';
import DisableIcon from '../Svg/DisableIcon';
import EditIcon from '../Svg/EditIcon';
import DeleteIcon from '../Svg/DeleteIcon';
import CheckIcon from '../Svg/CheckIcon';
import Link from 'next/link';
import Loader from "../Loader/Loader"

const ManageUsersTable = ({ deleteConfirm, disableConfirm, dataList, openEdtMdl, title, loader }) => {

    const columns = [
        {
            name: 'user',
            label: "Name",
            options: {
                filter: true,
            }
        },
        {
            name: 'user_l_name',
            label: "Last Name",
            options: {
                filter: true,
            }
        },
        {
            name: 'email',
            label: "E-mail",
            options: {
                filter: true,
            }
        },
        {
            name: 'contact_number',
            label: "Mobile No",
            options: {
                filter: true,
            }
        },
        {
            name: 'user_code',
            label: "User Code",
            options: {
                filter: true,
            }
        },
        {
            // name: 'db_role',
            name: 'db_role.role_name',
            label: "Role",
            options: {
                filter: true,
                customBodyRender: (value, tableMeta, updateValue) => {
                    return (
                        <div className='status_box'>
                            {/* {value && <span >{value.role_name}</span>} */}
                            {value && <span >{value}</span>}
                        </div>
                    )
                }
            }
        },
        {
            // name: 'reportToUser',
            name: 'reportToUser.user',
            label: "Report/Assign To",
            options: {
                filter: true,
                customBodyRender: (value, tableMeta, updateValue) => {
                    return (
                        <div className='status_box'>
                            {/* {value && <span  >{value.user}</span>} */}
                            {value && <span  >{value}</span>}
                        </div>
                    )
                }
            }
        },
        {
            name: 'user_status',
            label: "Status",
            options: {
                filter: false,
                download: false,
                customBodyRender: (value, tableMeta, updateValue) => {
                    return (
                        <div className='status_box'>
                            {value ? <span className='active status_btn'>active</span> :
                                <span className='inactive status_btn'>inactive</span>}
                        </div>
                    )
                }
            }
        },
        {
            name: 'user_code',
            label: "Action",
            options: {
                filter: false,
                download: false,

                customBodyRender: (value, tableMeta, updateValue) => {
                    console.log(tableMeta)
                    return (
                        <div className="table_btns">
                            <Link href={`/AddUsers?id=${value}&mode=view`}>
                                <button
                                    className="action_btn"
                                    title='View'>
                                    <ViewIcon />
                                </button>
                            </Link>

                            <Link href={`/AddUsers?id=${value}&mode=edit`}>
                                <button
                                    className="action_btn"
                                    title='Edit'>
                                    <EditIcon />
                                </button>
                            </Link>
                            {tableMeta.rowData[7] ?
                                <button
                                    onClick={() => disableConfirm(value, 0)}
                                    className="action_btn"
                                    title='Disable'>
                                    <DisableIcon />
                                </button>
                                : <button
                                    onClick={() => disableConfirm(value, 1)}
                                    className="action_btn x2"
                                    title='Enable'>
                                    <CheckIcon />
                                </button>}

                            {/* <button
                                onClick={() => deleteConfirm(value, 0)}
                                className="action_btn"
                                title='Delete'>
                                <DeleteIcon />
                            </button> */}
                        </div>
                    )
                }
            }
        },
    ];

    const options = {
        selectableRows: 'none',
        responsive: "standard",
        downloadOptions: { filename: "UsersList.csv" },
        enableNestedDataAccess: "."
    };

    const mappedDataList = dataList?.map(list => ({
        user: list?.user,
        email: list?.email,
        contact_number: list?.contact_number,
        user_code: list?.user_code,
        db_role: list?.db_role?.role_name,
        reportToUser: list?.reportToUser?.user,
        user_status: list?.user_status,

    }))

    return (
        <>
            {loader ? <><Loader /> </> : (
                <div className="miuiTable">
                    <MUIDataTable
                        title={title}
                        // data={mappedDataList}
                        data={dataList}
                        columns={columns}
                        options={options}
                    />
                </div>)}


        </>

    )
}

export default ManageUsersTable 