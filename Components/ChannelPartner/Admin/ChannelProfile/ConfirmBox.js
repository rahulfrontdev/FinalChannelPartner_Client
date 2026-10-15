import { getCookie, hasCookie } from 'cookies-next'
import React from 'react'

const ConfirmBox = ({
  title,
  body,
  setshowConfirm,
  showConfirm,
  actionType,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  loading = false,
}) => {
  const clientBtnColor = hasCookie("clientBtnColor") ? getCookie("clientBtnColor") : "#293790"

  return (
    <>
      {showConfirm ? (
        <div className="confirmBox">
          <div className="main-box-inside">
            <div className="text-head">{title}</div>
            {body ? (
              <div className="text-muted mb-3" style={{ fontSize: "14px", lineHeight: 1.4 }}>
                {body}
              </div>
            ) : null}
            <div className="btn-row">
              <button
                type="button"
                className="btn btn-secondary rounded-3 me-3"
                disabled={loading}
                onClick={() => setshowConfirm(false)}
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                className={`btn text-white rounded-3 ${destructive ? "btn-danger" : ""}`}
                style={destructive ? undefined : { background: clientBtnColor }}
                disabled={loading}
                onClick={actionType}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                    &nbsp;{confirmLabel}
                  </>
                ) : (
                  confirmLabel
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

export default ConfirmBox
