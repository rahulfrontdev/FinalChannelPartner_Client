// /*  -----------------uat links------------- */

// export const Baseurl = 'https://crm.saleofast.com/support/api/v1';
// export const filesUrl = 'https://crm.saleofast.com/support/images';

// /*  -----------------iis links------------- */

// export const Baseurl = 'http://crm.cybermatrixsolutions.com/support/api/v1';
// export const filesUrl = 'http://crm.cybermatrixsolutions.com/support/images';

// export const Baseurl = 'http://catalogue.cybermatrixsolutions.com/support/api/v1';
// export const filesUrl = 'http://catalogue.cybermatrixsolutions.com/support/images';


/* -----------------main links------------- */

// export const Baseurl = 'http://localhost:8050/api/v1';
// export const filesUrl = 'http://localhost:8050/images';


// export const Baseurl = 'http://192.168.1.20:8050/api/v1';
// export const filesUrl = 'http://192.168.1.20:8050/images';

/* -----------------NK Realtors links------------- */
// Production
// export const Baseurl = 'https://admin.theprosperity.in/api/v1';
// export const filesUrl = 'https://admin.theprosperity.in/images';

export const Baseurl = 'http://18.61.246.105/api/v1';
export const filesUrl = 'http://18.61.246.105/images';

// Local
// export const Baseurl = 'http://localhost:8050/api/v1';
// export const filesUrl = 'http://localhost:8050/images';

/* RM role id — set per environment in .env (NEXT_PUBLIC_RM_ROLE_ID) */
export const RM_ROLE_ID = Number(process.env.NEXT_PUBLIC_RM_ROLE_ID || 9);

export const isRmRole = (roleId) =>
  roleId !== null &&
  roleId !== undefined &&
  roleId !== "" &&
  Number(roleId) === RM_ROLE_ID;

export const BST_ROLE_ID = 2;

export const isBstRole = (roleId) =>
  roleId !== null &&
  roleId !== undefined &&
  roleId !== "" &&
  Number(roleId) === BST_ROLE_ID;

/** Admin / DB owner (same checks used on VisitsScreen) */
export const isAdminUser = (userInfo) =>
  userInfo?.role_id == null ||
  !!userInfo?.isDB ||
  Number(userInfo?.role_id) === 3;

/**
 * CP Visits UI: Scheduled Date/Time + Activation Date/Time
 * shown for Admin, RM, and BST (same columns as BST profile).
 */
export const showCpVisitScheduleColumns = (userInfo) =>
  isAdminUser(userInfo) ||
  isRmRole(userInfo?.role_id) ||
  isBstRole(userInfo?.role_id);

/** BST profile shows "Activation Date" instead of "Visit Date" */
export const getVisitDateLabel = (roleId, { required = false, possible = false } = {}) => {
  if (isBstRole(roleId)) {
    if (possible) return "Possible Activation Date";
    return required ? "Activation Date*" : "Activation Date";
  }
  if (possible) return "Possible Visit Date";
  return required ? "Visit Date*" : "Visit Date";
};

export const getCpVisitScheduledDate = (item) =>
  item?.schedule_visit_date ||
  item?.follow_up_date ||
  item?.visit_date ||
  item?.createdAt ||
  "";

export const getCpVisitScheduledTime = (item) =>
  item?.schedule_visit_time ||
  item?.follow_up_time ||
  item?.visit_time ||
  "";

export const getCpVisitActivationDate = (item) => {
  if (item?.activation_date) return item.activation_date;
  const verifiedAt =
    item?.visit_verified_at ||
    item?.code_verified_at ||
    item?.visit_code_verified_at ||
    item?.activation_at;
  if (verifiedAt) return String(verifiedAt).split("T")[0];
  // Do not fall back to updatedAt — that marks rescheduled VISIT rows as completed.
  return "";
};

export const getCpVisitActivationTime = (item) => {
  if (item?.activation_time) return item.activation_time;
  const verifiedAt =
    item?.visit_verified_at ||
    item?.code_verified_at ||
    item?.visit_code_verified_at ||
    item?.activation_at;
  if (verifiedAt && String(verifiedAt).includes("T")) {
    return String(verifiedAt).split("T")[1]?.slice(0, 8) || "";
  }
  return "";
};

const normalizeCpDateValue = (value = "") => {
  if (!value) return "";
  const str = String(value);
  if (str.includes("T")) return str.split("T")[0];
  return str.slice(0, 10);
};

const normalizeCpTimeValue = (value = "") => {
  if (!value) return "";
  const str = String(value).trim();
  if (str.includes("T")) return str.split("T")[1]?.slice(0, 8) || "";
  if (str.length === 5) return `${str}:00`;
  return str.slice(0, 8);
};

/**
 * Per-history-row activation for display.
 * Hides activation when it clearly belongs to an older finish
 * (activation date before this row's scheduled date).
 */
export const getCpVisitDisplayActivation = (item = {}) => {
  const scheduledDate = normalizeCpDateValue(getCpVisitScheduledDate(item));
  const activationDateRaw = getCpVisitActivationDate(item);
  const activationTimeRaw = getCpVisitActivationTime(item);
  const activationDate = normalizeCpDateValue(activationDateRaw);
  const activationTime = normalizeCpTimeValue(activationTimeRaw);

  if (!activationDate && !activationTime) {
    return { activation_date: "", activation_time: "" };
  }

  // Stale shared activation from another finish / previous visit
  if (scheduledDate && activationDate && activationDate < scheduledDate) {
    return { activation_date: "", activation_time: "" };
  }

  return {
    activation_date: activationDateRaw || activationDate,
    activation_time: activationTimeRaw || activationTime,
  };
};

export const getCpVisitProjectName = (item, fallback = "") =>
  item?.project_name || item?.sales_project_name || fallback || "";

export const mapCpVisitHistoryItem = (item, fallbackProjectName = "") => {
  const displayActivation = getCpVisitDisplayActivation(item);
  return {
    scheduled_date: getCpVisitScheduledDate(item),
    scheduled_time: getCpVisitScheduledTime(item),
    activation_date: displayActivation.activation_date,
    activation_time: displayActivation.activation_time,
    project_name: getCpVisitProjectName(item, fallbackProjectName),
    revisit_date: getCpVisitScheduledDate(item),
    revisit_time: getCpVisitScheduledTime(item),
    remark: [item?.stage || item?.current_stage, item?.remarks || item?.remark]
      .filter(Boolean)
      .join(" - "),
  };
};
