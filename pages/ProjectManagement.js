import { useDispatch } from 'react-redux'
import { useEffect } from 'react'
import { setCookie } from 'cookies-next'
import { setIsActive } from '../store/isActiveSidebarSlice'
import WithUserhoc_COMMON from "../HOC/WithUserhoc_COMMON"
import ProjectManagementScreen from '../Components/ProjectManagement/ProjectManagementScreen'

export default WithUserhoc_COMMON(function ProjectManagement() {
  const dispatch = useDispatch()
  useEffect(() => {
    setCookie('isActive', 'ProjectManagement')
    dispatch(setIsActive('ProjectManagement'))
  }, [dispatch]);
  return (
    <>
      <ProjectManagementScreen />
    </>
  )
})
