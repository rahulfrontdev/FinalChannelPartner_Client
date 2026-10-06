import { useDispatch } from 'react-redux'
import { useEffect } from 'react'
import { setCookie } from 'cookies-next'
import { setIsActive } from '../store/isActiveSidebarSlice'
import WithUserhoc_COMMON from "../HOC/WithUserhoc_COMMON"
import ZoneManagementScreen from '../Components/ZoneManagement/ZoneManagementScreen'

export default WithUserhoc_COMMON(function ZoneManagement() {
  const dispatch = useDispatch()
  useEffect(() => {
    setCookie('isActive', 'ZoneManagement')
    dispatch(setIsActive('ZoneManagement'))
  }, [dispatch]);
  return (
    <>
      <ZoneManagementScreen />
    </>
  )
})
