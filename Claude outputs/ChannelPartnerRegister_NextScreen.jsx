import { useRouter } from "next/router";
import React from "react";
import styles from "./ChannelPartnerRegister_NextScreen.module.css";

const ChannelPartnerRegister_NextScreen = () => {
  const router = useRouter();

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.header}>
          <p className={styles.eyebrow}>Thank You For Submitting The Documents</p>
          <h5 className={styles.title}>
            Your document verification is currently under process
          </h5>
        </div>

        <div className={styles.body}>
          <p className={styles.text}>
            We will notify you as soon as your documents have been reviewed and
            approved by our team
          </p>

          <img
            src="/ChannelPartner/cpregister_nextscreen.jpg"
            className={styles.image}
            alt="Document review"
          />

          <button
            type="button"
            className={`btn btn-outline-success ${styles.button}`}
            onClick={() => router.push("/partner")}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChannelPartnerRegister_NextScreen;
