import React from 'react'
import ChannelPartnerHOC from '../HOC/ChannelPartnerHOC'
import ChannelPartnerRegister_NextScreen from '../Claude outputs/ChannelPartnerRegister_NextScreen'

const ChannelPartnerRegister_Next = () => {
  return (
    <>
        <ChannelPartnerRegister_NextScreen/>
    </>
  )
}

export default ChannelPartnerHOC(ChannelPartnerRegister_Next)