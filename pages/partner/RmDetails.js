import React from "react";
import WithUserhoc_CP from "../../HOC/WithUserhoc_CP";
import RmDetailsScreen from "../../Components/ChannelPartner/Admin/Rm/RmDetailsScreen";

const RmDetails = () => {
  return <RmDetailsScreen />;
};

export default WithUserhoc_CP(RmDetails);
