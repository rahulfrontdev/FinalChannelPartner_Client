import React, { useEffect, useState } from 'react'
import BasicRangeShortcuts from '../../DateRangeCustom/Daterange'
import { getCookie, hasCookie } from 'cookies-next';
import DashboardAdmin from '../Admin/DashboardAdmin/DashboardAdmin';
import DashboardUser from '../User/DashboardUser/DashboardUser';
import { isRmRole } from '../../../Utils/Constants';
const DashBoardScreenCHANNEL = () => {

  const [roleId, setRoleId] = useState()

  useEffect(() => {
    if (hasCookie("userInfo")) {
      const userInfoData = JSON.parse(getCookie("userInfo"));
      setRoleId(userInfoData.role_id)
    }
  }, []);

  return (
    <>
      {(roleId === 1 || roleId === 2 || isRmRole(roleId) || roleId === 31) && <DashboardUser />}
      {(roleId === null || roleId === 3) && <DashboardAdmin />}
    </>

  )
}

export default DashBoardScreenCHANNEL