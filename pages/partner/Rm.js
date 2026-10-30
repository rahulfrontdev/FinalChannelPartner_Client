import React from "react";
import WithUserhoc_CP from "../../HOC/WithUserhoc_CP";
import RmScreen from "../../Components/ChannelPartner/Admin/Rm/RmScreen";

const Rm = () => {
  return <RmScreen />;
};

export default WithUserhoc_CP(Rm);
