import React from "react";
import Link from "next/link";
import moment from "moment";
import { setCookie } from "cookies-next";
import DashLeadsCard from "./DashLeadsCard";
import Diversity3Icon from "@mui/icons-material/Diversity3";
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import WhereToVoteIcon from "@mui/icons-material/WhereToVote";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import TodayIcon from "@mui/icons-material/Today";
import VideocamIcon from "@mui/icons-material/Videocam";
import PlaceIcon from "@mui/icons-material/Place";
import DirectionsWalkIcon from "@mui/icons-material/DirectionsWalk";
import AutoGraphIcon from "@mui/icons-material/AutoGraph";
import BookOnlineIcon from "@mui/icons-material/BookOnline";
import LeaderboardIcon from "@mui/icons-material/Leaderboard";

const VISIT_TYPES = ["Site Visit", "Video Visit", "Out Visit"];

const count = (value) => (value == null || value === "" ? 0 : value);

const formatSchedule = (value) => {
  if (!value) return "---------";
  const parsed = moment(value, ["YYYY-MM-DD HH:mm:ss", moment.ISO_8601], true);
  return parsed.isValid() ? parsed.format("DD-MM-YYYY hh:mm A") : String(value);
};

const saveRange = (cookieName, startDate, endDate) => {
  if (!startDate || !endDate) return;
  setCookie(cookieName, { f_date: startDate, t_date: endDate });
};

const SectionTitle = ({ children }) => (
  <label className="m-3 fw-bold d-block" style={{ fontSize: "24px", color: "#160354" }}>
    {children}
  </label>
);

const StatCard = ({ href, onClick, head, price, dateLabel, color, icon }) => {
  const card = (
    <DashLeadsCard
      head={head}
      price={count(price)}
      date={dateLabel}
      color={color}
      icon={icon}
    />
  );
  return (
    <div className="col-xl-3 col-md-4 col-sm-6 col-12">
      {href ? (
        <Link href={href} onClick={onClick}>
          {card}
        </Link>
      ) : (
        card
      )}
    </div>
  );
};

const VisitTable = ({ rows = [], emptyText }) => {
  if (!rows.length) {
    return <div className="text-muted px-3 pb-3">{emptyText}</div>;
  }
  const showRm = rows.some((row) => row.rm_name);
  return (
    <div className="table-responsive bg-white rounded border mx-3 mb-3">
      <table className="table align-middle mb-0">
        <thead style={{ background: "#f5f7fb" }}>
          <tr>
            <th>CP Name</th>
            <th>Project</th>
            <th>Visit Type</th>
            {showRm ? <th>RM</th> : null}
            <th>Schedule</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.cpl_id}-${row.cpl_d_id}-${row.schedule_visit_at}`}>
              <td className="fw-semibold">{row.cp_name || "---------"}</td>
              <td>{row.project_name || "---------"}</td>
              <td>{row.visit_type || "---------"}</td>
              {showRm ? <td>{row.rm_name || "---------"}</td> : null}
              <td>{formatSchedule(row.schedule_visit_at)}</td>
              <td className="text-end">
                {row.cpl_id ? (
                  <Link
                    href={`/partner/VisitDetails?id=${row.cpl_id}&type=cp`}
                    className="fw-semibold text-decoration-none"
                    style={{ color: "#293790" }}
                  >
                    View
                  </Link>
                ) : (
                  "---------"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const RmDashboard = ({ rm = {}, startDate, endDate }) => {
  const dateLabel =
    startDate && endDate
      ? `${moment(startDate).format("DD-MM-YYYY")} to ${moment(endDate).format("DD-MM-YYYY")}`
      : "";
  const cps = rm?.cps || {};
  const visits = rm?.visits || {};
  const byType = visits.by_type || {};
  const activity = rm?.activity || {};
  const stages = activity.by_stage && typeof activity.by_stage === "object" ? activity.by_stage : {};
  const leadStages = rm?.cp_lead_stages && typeof rm.cp_lead_stages === "object" ? rm.cp_lead_stages : {};
  const business = rm?.cp_business || {};
  const projects = Array.isArray(cps.by_project) ? cps.by_project : [];
  const upcoming = Array.isArray(rm?.upcoming_visits) ? rm.upcoming_visits : [];
  const completed = Array.isArray(rm?.recent_completed_visits) ? rm.recent_completed_visits : [];
  const byRm = Array.isArray(rm?.by_rm) ? rm.by_rm : [];
  const typeIcons = {
    "Site Visit": PlaceIcon,
    "Video Visit": VideocamIcon,
    "Out Visit": DirectionsWalkIcon,
  };
  const typeColors = {
    "Site Visit": "#05539c",
    "Video Visit": "#8a059c",
    "Out Visit": "#cc5f10",
  };
  const extraTypes = Object.keys(byType).filter((name) => !VISIT_TYPES.includes(name));

  return (
    <div className="rm_dashboard">
      <SectionTitle>Channel Partners</SectionTitle>
      <div className="row leads_row addgap">
        <StatCard
          href="/partner/ActivePartners"
          onClick={() => saveRange("cpleadsFilter", startDate, endDate)}
          head="Total CPs"
          price={cps.total}
          dateLabel={dateLabel}
          color="#05539c"
          icon={Diversity3Icon}
        />
        <StatCard
          href="/partner/ActivePartners"
          onClick={() => saveRange("cpleadsFilter", startDate, endDate)}
          head="Active CPs"
          price={cps.active}
          dateLabel={dateLabel}
          color="#03850d"
          icon={GroupAddIcon}
        />
        <StatCard
          href="/partner/ActivePartners"
          onClick={() => saveRange("cpleadsFilter", startDate, endDate)}
          head="New CPs"
          price={cps.new_in_range}
          dateLabel={dateLabel}
          color="#0000FF"
          icon={PersonAddAlt1Icon}
        />
      </div>

      <SectionTitle>Visits</SectionTitle>
      <div className="row leads_row addgap">
        <StatCard
          href="/partner/Visits"
          onClick={() => saveRange("VisitsFilter", startDate, endDate)}
          head="Total Visits"
          price={visits.total}
          dateLabel={dateLabel}
          color="#293790"
          icon={WhereToVoteIcon}
        />
        <StatCard
          href="/partner/Visits"
          onClick={() => saveRange("VisitsFilter", startDate, endDate)}
          head="Scheduled Visit"
          price={visits.scheduled}
          dateLabel={dateLabel}
          color="#17B4E7"
          icon={EventAvailableIcon}
        />
        <StatCard
          href="/partner/Visits"
          onClick={() => saveRange("VisitsFilter", startDate, endDate)}
          head="Completed"
          price={visits.completed}
          dateLabel={dateLabel}
          color="#198754"
          icon={TaskAltIcon}
        />
        <StatCard
          href="/partner/Visits"
          onClick={() => saveRange("VisitsFilter", startDate, endDate)}
          head="Not Completed"
          price={visits.not_completed}
          dateLabel={dateLabel}
          color="#fd7e14"
          icon={PendingActionsIcon}
        />
        <StatCard
          href="/partner/Visits"
          onClick={() => saveRange("VisitsFilter", startDate, endDate)}
          head="Due Today"
          price={visits.due_today}
          dateLabel={dateLabel}
          color="#9c0550"
          icon={TodayIcon}
        />
      </div>

      <SectionTitle>Visit Type</SectionTitle>
      <div className="row leads_row addgap">
        {[...VISIT_TYPES, ...extraTypes].map((name) => (
          <StatCard
            key={name}
            href="/partner/Visits"
            onClick={() => saveRange("VisitsFilter", startDate, endDate)}
            head={name}
            price={byType[name]}
            dateLabel={dateLabel}
            color={typeColors[name] || "#05539c"}
            icon={typeIcons[name] || WhereToVoteIcon}
          />
        ))}
      </div>

      <SectionTitle>Activity</SectionTitle>
      <div className="row leads_row addgap">
        <StatCard
          head="Total Activity"
          price={activity.total}
          dateLabel={dateLabel}
          color="#160354"
          icon={AutoGraphIcon}
        />
        {Object.entries(stages).map(([stage, stageCount]) => (
          <StatCard
            key={stage}
            head={stage}
            price={stageCount}
            dateLabel={dateLabel}
            color="#8a059c"
            icon={LeaderboardIcon}
          />
        ))}
      </div>

      <SectionTitle>CP Lead Stages</SectionTitle>
      <div className="row leads_row addgap">
        {Object.keys(leadStages).length ? (
          Object.entries(leadStages).map(([stage, stageCount]) => (
            <StatCard
              key={stage}
              head={stage}
              price={stageCount}
              dateLabel={dateLabel}
              color="#0000FF"
              icon={GroupAddIcon}
            />
          ))
        ) : (
          <div className="text-muted px-3">No lead stages in this range</div>
        )}
      </div>

      <SectionTitle>Business</SectionTitle>
      <div className="row leads_row addgap">
        <StatCard
          head="Leads"
          price={business.leads}
          dateLabel={dateLabel}
          color="#05539c"
          icon={Diversity3Icon}
        />
        <StatCard
          head="Bookings"
          price={business.bookings}
          dateLabel={dateLabel}
          color="#9c0550"
          icon={BookOnlineIcon}
        />
      </div>

      <SectionTitle>Project-wise CPs</SectionTitle>
      {projects.length ? (
        <div className="table-responsive bg-white rounded border mx-3 mb-3">
          <table className="table align-middle mb-0">
            <thead style={{ background: "#f5f7fb" }}>
              <tr>
                <th>Project</th>
                <th>CP Count</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((row) => (
                <tr key={row.project_id || row.project}>
                  <td className="fw-semibold">{row.project || "---------"}</td>
                  <td>{count(row.cp_count)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-muted px-3 pb-3">No projects in this range</div>
      )}

      <SectionTitle>Upcoming Visits</SectionTitle>
      <VisitTable rows={upcoming} emptyText="No upcoming visits" />

      <SectionTitle>Recent Completed Visits</SectionTitle>
      <VisitTable rows={completed} emptyText="No completed visits" />

      {byRm.length ? (
        <>
          <SectionTitle>By RM</SectionTitle>
          {byRm.map((rmUser) => {
            const rmProjects = Array.isArray(rmUser?.cps?.by_project) ? rmUser.cps.by_project : [];
            const rmVisits = rmUser?.visits || {};
            const rmTypes = rmVisits.by_type || {};
            return (
              <div key={rmUser.user_id || rmUser.user_code} className="border rounded bg-white mx-3 mb-4 p-3">
                <div className="d-flex flex-wrap justify-content-between gap-2 mb-2">
                  <div>
                    <div className="fw-bold" style={{ color: "#160354", fontSize: "18px" }}>{rmUser.name || "---------"}</div>
                    <div className="text-muted">{rmUser.email || "---------"}</div>
                  </div>
                  <span className="fw-semibold" style={{ color: "#03850d" }}>{rmUser.status || "---------"}</span>
                </div>
                <div className="row leads_row addgap">
                  <StatCard head="Total CPs" price={rmUser?.cps?.total} dateLabel={dateLabel} color="#05539c" icon={Diversity3Icon} />
                  <StatCard head="Active CPs" price={rmUser?.cps?.active} dateLabel={dateLabel} color="#03850d" icon={GroupAddIcon} />
                  <StatCard head="New CPs" price={rmUser?.cps?.new_in_range} dateLabel={dateLabel} color="#0000FF" icon={PersonAddAlt1Icon} />
                  <StatCard head="Total Visits" price={rmVisits.total} dateLabel={dateLabel} color="#293790" icon={WhereToVoteIcon} />
                  <StatCard head="Scheduled Visit" price={rmVisits.scheduled} dateLabel={dateLabel} color="#17B4E7" icon={EventAvailableIcon} />
                  <StatCard head="Completed" price={rmVisits.completed} dateLabel={dateLabel} color="#198754" icon={TaskAltIcon} />
                  <StatCard head="Not Completed" price={rmVisits.not_completed} dateLabel={dateLabel} color="#fd7e14" icon={PendingActionsIcon} />
                  <StatCard head="Due Today" price={rmVisits.due_today} dateLabel={dateLabel} color="#9c0550" icon={TodayIcon} />
                  <StatCard head="Site Visit" price={rmTypes["Site Visit"]} dateLabel={dateLabel} color="#05539c" icon={PlaceIcon} />
                  <StatCard head="Video Visit" price={rmTypes["Video Visit"]} dateLabel={dateLabel} color="#8a059c" icon={VideocamIcon} />
                  <StatCard head="Out Visit" price={rmTypes["Out Visit"]} dateLabel={dateLabel} color="#cc5f10" icon={DirectionsWalkIcon} />
                  <StatCard head="Total Activity" price={rmUser?.activity?.total} dateLabel={dateLabel} color="#160354" icon={AutoGraphIcon} />
                </div>
                {rmProjects.length ? (
                  <div className="table-responsive mt-3">
                    <table className="table align-middle mb-0">
                      <thead style={{ background: "#f5f7fb" }}>
                        <tr>
                          <th>Project</th>
                          <th>CP Count</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rmProjects.map((row) => (
                          <tr key={`${rmUser.user_id}-${row.project_id || row.project}`}>
                            <td className="fw-semibold">{row.project || "---------"}</td>
                            <td>{count(row.cp_count)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </div>
            );
          })}
        </>
      ) : null}
    </div>
  );
};

export default RmDashboard;
