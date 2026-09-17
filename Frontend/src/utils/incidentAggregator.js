/**
 * Incident Aggregator & Dynamic Hotspot Synthesis Engine
 *
 * Exclusively derives active municipal incident boxes from the database "reports" table:
 * 1. Fetches unique locations strictly from the reports table "location" column.
 * 2. Removes all hardcoded/dummy locations (e.g. Hastings, Kalighat, or fictitious base entries).
 * 3. Assigns connectedIncidentId strictly formatted as:
 *    "First 2 letter of location in capital format-random 3 numbers" (e.g., SA-288, TE-891, MA-979).
 * 4. Auto-increments verified report count according to the actual reports in the reports table.
 * 5. Dynamically classifies state into CRITICAL, HIGH, MODERATE, LOW, MONITORING based
 *    on report volume and physical water depth.
 * 6. Sorts boxes strictly in decreasing order (Critical -> High -> Moderate -> Low -> Monitoring).
 */

/**
 * Generates an incident ID in the format:
 * "First 2 letter of location in capital format-random 3 numbers"
 * e.g. "Salt Lake, Sector V" -> "SA-288"
 *
 * Uses a deterministic hash of location string so the ID remains stable across re-renders.
 */
export function generateConnectedIncidentId(location) {
  if (!location || typeof location !== "string") {
    return "IN-101";
  }

  // Extract first 2 alphabetical letters
  const lettersOnly = location.trim().replace(/[^a-zA-Z]/g, "");
  const prefix = (
    lettersOnly.length >= 2 ? lettersOnly.slice(0, 2) : (lettersOnly + "XX").slice(0, 2)
  ).toUpperCase();

  // Deterministic 3-digit number from location string hash
  let hash = 0;
  for (let i = 0; i < location.length; i++) {
    hash = (hash << 5) - hash + location.charCodeAt(i);
    hash |= 0;
  }
  const randomNum = Math.abs(hash % 900) + 100; // 100 to 999

  return `${prefix}-${randomNum}`;
}

/**
 * Assigns severity category based on report count & physical water depth:
 * - CRITICAL: >= 5 reports (or >= 3 reports with >= 25 cm depth)
 * - HIGH: 3 to 4 reports (or >= 2 reports with >= 20 cm depth)
 * - MODERATE: 2 reports (or >= 15 cm depth)
 * - LOW: 1 report
 * - MONITORING: 0 reports / pending telemetry
 */
export function getSeverityFromReportCount(reportCount = 0, waterDepthNum = 0) {
  if (reportCount >= 5 || (reportCount >= 3 && waterDepthNum >= 25)) {
    return "CRITICAL";
  }
  if (reportCount >= 3 || (reportCount >= 2 && waterDepthNum >= 20)) {
    return "HIGH";
  }
  if (reportCount >= 2 || waterDepthNum >= 15) {
    return "MODERATE";
  }
  if (reportCount >= 1) {
    return "LOW";
  }
  return "MONITORING";
}

/**
 * Severity ranking for sorting: CRITICAL > HIGH > MODERATE > LOW > MONITORING
 */
export function getSeverityRank(severity) {
  const sev = String(severity || "").toUpperCase();
  switch (sev) {
    case "CRITICAL":
      return 5;
    case "HIGH":
      return 4;
    case "MODERATE":
    case "MEDIUM":
      return 3;
    case "LOW":
      return 2;
    case "MONITORING":
      return 1;
    default:
      return 0;
  }
}

/**
 * Parses numeric water depth in cm from string or number
 */
export function parseWaterDepthCm(depthVal) {
  if (typeof depthVal === "number" && !isNaN(depthVal)) return depthVal;
  if (!depthVal) return 0;
  const match = String(depthVal).match(/(\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : 0;
}

/**
 * Normalizes location key for grouping reports submitted for the same location
 */
function getNormalizedLocationKey(location) {
  if (!location) return "";
  return location.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Aggregates incidents EXCLUSIVELY from the database reports table.
 * No dummy or hardcoded locations are added.
 *
 * @param {Array} reports - Array of report records from reports table
 * @returns {Array} Real, auto-counted, severity-ranked, sorted incidents
 */
export function aggregateIncidentsFromReports(reports = []) {
  const safeReports = Array.isArray(reports) ? reports : [];
  if (safeReports.length === 0) return [];

  // Group reports by location column from reports table
  const locationGroups = new Map(); // normalizedKey -> { rawLocation, reports: [] }

  safeReports.forEach((rep) => {
    const rawLoc = rep.location || rep.locality || "";
    if (!rawLoc || typeof rawLoc !== "string" || !rawLoc.trim()) return;

    const trimmedLoc = rawLoc.trim();
    const normKey = getNormalizedLocationKey(trimmedLoc);

    // Check if an existing group matches this location
    let matchedKey = null;
    if (locationGroups.has(normKey)) {
      matchedKey = normKey;
    } else {
      // Check for exact or high-confidence substring match
      for (const [key, group] of locationGroups.entries()) {
        const existingRaw = group.rawLocation.toLowerCase();
        const currentRaw = trimmedLoc.toLowerCase();
        if (existingRaw === currentRaw) {
          matchedKey = key;
          break;
        }
      }
    }

    if (matchedKey) {
      locationGroups.get(matchedKey).reports.push(rep);
    } else {
      locationGroups.set(normKey, {
        rawLocation: trimmedLoc,
        reports: [rep],
      });
    }
  });

  const finalIncidents = [];

  // Build an incident box for each real reported location
  locationGroups.forEach((group) => {
    const loc = group.rawLocation;
    const count = group.reports.length;

    // Collect depths from reports for this location
    const depths = group.reports
      .map((r) => parseWaterDepthCm(r.water_depth ?? r.waterDepth))
      .filter((d) => d > 0);

    const maxDepth = depths.length > 0 ? Math.max(...depths) : 0;
    const avgDepth = depths.length > 0 ? Math.round(depths.reduce((a, b) => a + b, 0) / depths.length) : 0;
    const effectiveDepth = maxDepth > 0 ? maxDepth : avgDepth;

    // connectedIncidentId strictly formatted as:
    // "First 2 letter of location in capital format-random 3 numbers" (e.g. SA-288, TE-891)
    const rawConnectedId = generateConnectedIncidentId(loc);
    const cardId = `#${rawConnectedId}`;
    const dynamicSeverity = getSeverityFromReportCount(count, effectiveDepth);

    const firstReport = group.reports[0] || {};
    const lat = firstReport.latitude || 22.5726;
    const lon = firstReport.longitude || 88.3639;
    const kmX = Number(((lon - 88.3639) * 102.6).toFixed(2));
    const kmY = Number(((22.5726 - lat) * 111.13).toFixed(2));
    const ward = firstReport.ward || "";
    const ulb = firstReport.assigned_ulb_name || "";

    const primaryName = loc.split(",")[0].trim().toUpperCase();
    const subdivision = ward
      ? `${primaryName} // ${ward.toUpperCase()}`
      : ulb
        ? `${primaryName} // ${ulb.toUpperCase()}`
        : `${primaryName} // LOCAL DRAINAGE`;

    const waterDepthDisplay =
      effectiveDepth > 0
        ? `${effectiveDepth} cm water depth`
        : "Telemetry Pending";

    finalIncidents.push({
      id: cardId,
      connectedIncidentId: rawConnectedId,
      name: `${loc} Incident ${cardId}`,
      subdivision,
      location: loc,
      latitude: lat,
      longitude: lon,
      x: kmX,
      y: kmY,
      timestamp: firstReport.submitted_at ? "Logged via Citizen Mobile" : "Just now",
      waterDepth: waterDepthDisplay,
      waterLevel: `${effectiveDepth > 0 ? effectiveDepth : 15} cm`,
      waterLevelCm: effectiveDepth > 0 ? effectiveDepth : 15.0,
      rainfall: `${Math.min(95, 45 + count * 6)} mm / 3 hr`,
      verifiedReports: count,
      affectedArea: `${Math.round(4200 + count * 1100).toLocaleString()} m²`,
      riskScore: `${Math.min(96, 45 + count * 8)} / 100`,
      connectedDrainage: "Local Municipal Stormwater Network",
      nearestPump: "PS-07",
      probableCause: "Verified citizen ground reports indicating active surface inundation.",
      severity: dynamicSeverity,
      status: "Needs Intervention",
      isPrimary: false,
    });
  });

  // Sort boxes strictly in decreasing order:
  // Priority 1: Severity Rank (CRITICAL > HIGH > MODERATE > LOW > MONITORING)
  // Priority 2: Verified Reports Count (descending)
  // Priority 3: Water Depth (descending)
  return finalIncidents.sort((a, b) => {
    const rankDiff = getSeverityRank(b.severity) - getSeverityRank(a.severity);
    if (rankDiff !== 0) return rankDiff;

    const reportDiff = (b.verifiedReports ?? 0) - (a.verifiedReports ?? 0);
    if (reportDiff !== 0) return reportDiff;

    return parseWaterDepthCm(b.waterDepth) - parseWaterDepthCm(a.waterDepth);
  });
}

/**
 * Maps raw IncidentQueue records from backend incident_queue table directly to UI incident cards.
 */
export function mapIncidentQueueToCards(incidentQueue = []) {
  if (!Array.isArray(incidentQueue) || incidentQueue.length === 0) return [];

  const mapped = incidentQueue.map((inc) => {
    const rawConnectedId = (inc.incident_id || "").replace(/^#/, "") || generateConnectedIncidentId(inc.location);
    const cardId = `#${rawConnectedId}`;
    const count = inc.report_count || 1;
    const depth = parseWaterDepthCm(inc.water_depth);
    const lat = inc.latitude || 22.5726;
    const lon = inc.longitude || 88.3639;
    const kmX = Number(((lon - 88.3639) * 102.6).toFixed(2));
    const kmY = Number(((22.5726 - lat) * 111.13).toFixed(2));

    const primaryName = (inc.location || "LOCALITY").split(",")[0].trim().toUpperCase();
    const subdivision = inc.subdivision || (
      inc.ward
        ? `${primaryName} // ${inc.ward.toUpperCase()}`
        : inc.assigned_ulb_name
          ? `${primaryName} // ${inc.assigned_ulb_name.toUpperCase()}`
          : `${primaryName} // LOCAL DRAINAGE`
    );

    const waterDepthDisplay =
      depth > 0 ? `${depth} cm water depth` : (inc.water_depth_display || "Telemetry Pending");

    return {
      id: cardId,
      connectedIncidentId: rawConnectedId,
      name: `${inc.location} Incident ${cardId}`,
      subdivision,
      location: inc.location,
      latitude: lat,
      longitude: lon,
      x: kmX,
      y: kmY,
      timestamp: inc.updated_at_formatted || "Active",
      waterDepth: waterDepthDisplay,
      waterLevel: `${depth > 0 ? depth : 15} cm`,
      waterLevelCm: depth > 0 ? depth : 15.0,
      rainfall: `${Math.min(95, 45 + count * 6)} mm / 3 hr`,
      verifiedReports: count,
      affectedArea: `${Math.round(4200 + count * 1100).toLocaleString()} m²`,
      riskScore: `${Math.min(96, 45 + count * 8)} / 100`,
      connectedDrainage: "Local Municipal Stormwater Network",
      nearestPump: "PS-07",
      probableCause: "Verified citizen ground reports indicating active surface inundation.",
      severity: inc.severity || getSeverityFromReportCount(count, depth),
      status: "Needs Intervention",
      isPrimary: false,
    };
  });

  return mapped.sort((a, b) => {
    const rankDiff = getSeverityRank(b.severity) - getSeverityRank(a.severity);
    if (rankDiff !== 0) return rankDiff;
    const reportDiff = (b.verifiedReports ?? 0) - (a.verifiedReports ?? 0);
    if (reportDiff !== 0) return reportDiff;
    return parseWaterDepthCm(b.waterDepth) - parseWaterDepthCm(a.waterDepth);
  });
}

/**
 * Backward-compatible wrapper for aggregateIncidentsFromReports.
 * Exclusively derives incidents from the reports table.
 */
export function aggregateIncidentsWithReports(arg1 = [], arg2 = null) {
  const reports = Array.isArray(arg2) ? arg2 : (Array.isArray(arg1) ? arg1 : []);
  return aggregateIncidentsFromReports(reports);
}

