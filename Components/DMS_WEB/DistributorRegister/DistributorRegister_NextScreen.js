import { useRouter } from "next/router";
import React from "react";

const DistributorRegister_NextScreen = () => {
  const router = useRouter();

  return (
    <div className="cp-next">
      <div className="cp-next__card">
        <div className="cp-next__header">
          <h5 className="cp-next__title">
            Your document verification is currently under process
          </h5>
        </div>

        <div className="cp-next__body">
          <p className="cp-next__text">
            We will notify you as soon as your documents have been reviewed and
            approved by our team
          </p>

          <img
            src="/ChannelPartner/cpregister_nextscreen.jpg"
            className="cp-next__image"
            alt="Document review"
          />

          <button
            type="button"
            className="btn btn-outline-success cp-next__button"
            onClick={() => router.push("/")}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

export default DistributorRegister_NextScreen;
