import React, { useEffect } from 'react'
import { useRouter } from 'next/router'
import { getCookie, hasCookie } from 'cookies-next'
import WithUserhoc_CP from '../../HOC/WithUserhoc_CP'
import CPRegisterLeadsScreen from '../../Components/ChannelPartner/Admin/CPRegisterLeads/CPRegisterLeadsScreen'
import { isRmRole } from '../../Utils/Constants'

const CPRegisterLeads = () => {
  const router = useRouter()
  const userInfo = hasCookie("userInfo") ? JSON.parse(getCookie("userInfo")) : null
  const blocked = isRmRole(userInfo?.role_id)

  useEffect(() => {
    if (blocked) router.replace("/partner/ActivePartners")
  }, [blocked, router])

  if (blocked) return null

  return (
    <>
        <CPRegisterLeadsScreen/>
    </>
  )
}

export default WithUserhoc_CP(CPRegisterLeads)