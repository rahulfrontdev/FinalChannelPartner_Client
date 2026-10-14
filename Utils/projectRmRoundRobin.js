import { components } from "react-select";

const CURSOR_KEY = "cpProjectRmCursor";
const ASSIGN_KEY = "cpPartnerProjectRmMap";

const readStore = (key) => {
    if (typeof window === "undefined") return {};
    try {
        return JSON.parse(window.localStorage.getItem(key) || "{}") || {};
    } catch (error) {
        return {};
    }
};

const writeStore = (key, value) => {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        // ignore storage errors
    }
};

export const extractProjectRows = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.records)) return payload.records;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.projects)) return payload.projects;
    return [];
};

export const normalizeProjectForRm = (item = {}) => {
    const rmUsers = Array.isArray(item?.rm_users)
        ? item.rm_users
        : Array.isArray(item?.bst_users)
            ? item.bst_users
            : [];
    const rmIds = Array.isArray(item?.rm_ids)
        ? item.rm_ids.map(String)
        : Array.isArray(item?.bst_ids)
            ? item.bst_ids.map(String)
            : rmUsers.map((u) => u?.user_id || u?.id).filter(Boolean).map(String);
    const rmNames = Array.isArray(item?.rm_names)
        ? item.rm_names
        : item?.rm_name
            ? String(item.rm_name).split(",").map((n) => n.trim()).filter(Boolean)
            : rmUsers.map((u) => u?.user || u?.name || u?.email).filter(Boolean);

    const stateObj = item?.projectState || (item?.state && typeof item.state === "object" ? item.state : null);
    const cityObj = item?.projectCity || (item?.city && typeof item.city === "object" ? item.city : null);

    return {
        project_id: item?.project_id || item?.id || "",
        project_name: item?.project_name || item?.project || item?.name || "",
        state_id: item?.state_id || stateObj?.state_id || "",
        state_name: item?.state_name || stateObj?.state_name || (typeof item?.state === "string" ? item.state : ""),
        city_id: item?.city_id || cityObj?.city_id || "",
        city_name: item?.city_name || cityObj?.city_name || (typeof item?.city === "string" ? item.city : ""),
        rm_ids: rmIds,
        rm_names: rmNames,
        rm_users: rmUsers,
    };
};

const normText = (value) => String(value || "").trim().toLowerCase();

const partnerCityId = (cp) =>
    cp?.city_id || cp?.db_city?.city_id || (cp?.city && typeof cp.city === "object" ? cp.city.city_id : "") || "";
const partnerCityName = (cp) =>
    cp?.db_city?.city_name ||
    cp?.city_name ||
    (cp?.city && typeof cp.city === "object" ? cp.city.city_name : "") ||
    (typeof cp?.city === "string" ? cp.city : "");
const partnerStateId = (cp) =>
    cp?.state_id || cp?.db_state?.state_id || (cp?.state && typeof cp.state === "object" ? cp.state.state_id : "") || "";
const partnerStateName = (cp) =>
    cp?.db_state?.state_name ||
    cp?.state_name ||
    (cp?.state && typeof cp.state === "object" ? cp.state.state_name : "") ||
    (typeof cp?.state === "string" ? cp.state : "");

export const matchProjectByCity = (cp, projects = []) => {
    const withRms = projects.filter((project) => project?.rm_ids?.length);
    const cityId = String(partnerCityId(cp) || "");
    const cityName = normText(partnerCityName(cp));
    const stateId = String(partnerStateId(cp) || "");
    const stateName = normText(partnerStateName(cp));

    let matches = cityId ? withRms.filter((project) => String(project.city_id) === cityId) : [];
    if (!matches.length && cityName) {
        matches = withRms.filter((project) => normText(project.city_name) === cityName);
    }
    if (matches.length > 1 && (stateId || stateName)) {
        const narrowed = matches.filter(
            (project) =>
                (stateId && String(project.state_id) === stateId) ||
                (stateName && normText(project.state_name) === stateName)
        );
        if (narrowed.length) matches = narrowed;
    }
    matches.sort((a, b) => Number(a.project_id) - Number(b.project_id));
    return matches[0] || null;
};

export const buildCityRoundRobin = (partners = [], projects = [], usersList = []) => {
    const groups = new Map();
    partners.forEach((cp) => {
        const project = matchProjectByCity(cp, projects);
        if (!project) return;
        const key = String(project.project_id);
        if (!groups.has(key)) groups.set(key, { project, cps: [] });
        groups.get(key).cps.push(cp);
    });

    const assignment = new Map();
    groups.forEach(({ project, cps }) => {
        const ordered = [...cps].sort((a, b) => {
            const ta = new Date(a.createdAt || a.created_at || 0).getTime() || 0;
            const tb = new Date(b.createdAt || b.created_at || 0).getTime() || 0;
            if (ta !== tb) return ta - tb;
            return String(a.user_code || "").localeCompare(String(b.user_code || ""));
        });
        const rmOptions = projectRmOptions(project, usersList);
        ordered.forEach((cp, index) => {
            const rotated = rotateOptions(rmOptions, index);
            assignment.set(String(cp.user_code), {
                names: rotated.map((rm) => rm.label).filter(Boolean),
                rmIds: rotated.map((rm) => rm.value).filter((id) => id != null && id !== ""),
                projectName: project.project_name || "",
            });
        });
    });
    return assignment;
};

export const loadPartnerRmMap = () => readStore(ASSIGN_KEY);

export const savePartnerRmAssignment = (userCode, assignment) => {
    const all = readStore(ASSIGN_KEY);
    all[String(userCode)] = assignment;
    writeStore(ASSIGN_KEY, all);
};

export const getProjectCursor = (projectId) => {
    const all = readStore(CURSOR_KEY);
    const value = Number(all[String(projectId)] || 0);
    return Number.isFinite(value) ? value : 0;
};

export const setProjectCursor = (projectId, cursor) => {
    const all = readStore(CURSOR_KEY);
    all[String(projectId)] = cursor;
    writeStore(CURSOR_KEY, all);
};

export const projectRmOptions = (project, usersList = []) => {
    return (project?.rm_ids || []).map((id, index) => {
        const fromProject = (project.rm_users || []).find(
            (u) => String(u?.user_id || u?.id) === String(id)
        );
        const fromUsers = usersList.find((u) => String(u.user_id) === String(id));
        return {
            value: String(id),
            label:
                fromProject?.user ||
                fromProject?.name ||
                project.rm_names?.[index] ||
                fromUsers?.user ||
                fromUsers?.name ||
                `User ${id}`,
        };
    });
};

export const rotateOptions = (options = [], startIndex = 0) => {
    if (!options.length) return [];
    const size = options.length;
    const start = ((Number(startIndex) || 0) % size + size) % size;
    return [...options.slice(start), ...options.slice(0, start)];
};

/** All RMs of the project, rotated so the next round-robin RM is first. */
export const roundRobinProjectRms = (project, usersList = [], startIndex = 0) =>
    rotateOptions(projectRmOptions(project, usersList), startIndex);

export const ProjectRmCheckboxOption = (props) => {
    const { isFocused, isSelected, children, innerProps, getStyles, isDisabled, ...rest } = props;
    let bg = "transparent";
    if (isFocused) bg = "#eee";
    if (isSelected) bg = "#B2D4FF";

    return (
        <components.Option
            {...rest}
            isDisabled={isDisabled}
            isFocused={isFocused}
            isSelected={isSelected}
            getStyles={getStyles}
            innerProps={{
                ...innerProps,
                style: {
                    alignItems: "center",
                    backgroundColor: bg,
                    color: "inherit",
                    display: "flex",
                    gap: 8,
                },
            }}
        >
            <input type="checkbox" checked={!!isSelected} readOnly style={{ marginRight: 8 }} />
            {children}
        </components.Option>
    );
};
