/**
 * Kolkata Water Intelligence (KWI)
 * Hydraulic Intervention & Scenario Simulation Engine
 *
 * Implements hydrodynamic transient mass-balance estimation for stormwater
 * drainage networks, station booster capacity, inlet desilting efficiency,
 * mobile submersible pumping units, and Hooghly tidal outfall backpressure.
 */

/**
 * Calculates simulated hydraulic outcomes based on baseline state and intervention controls.
 *
 * @param {Object} params
 * @param {number} params.baselineDepthCm - Initial water depth at hotspot in cm (e.g., 28.0)
 * @param {number} params.baselineAreaM2 - Initial inundated area in m² (e.g., 12400)
 * @param {number} params.baselineRiskScore - Current incident risk score (0 - 100)
 * @param {number} params.baselineDrainageLoad - Current drainage conduit load percentage (0 - 100)
 * @param {number} params.stationMaxDischargeCusecs - Rated station capacity in cusecs (e.g., 85, 140)
 * @param {number} params.pumpCapacity - Turbine throttle percentage (50% - 100%)
 * @param {boolean} params.crewDispatched - Inlet Desilting Mobile Unit deployed
 * @param {boolean} params.extraPumpUnit - 20 HP Mobile Submersible Pump deployed
 * @param {number} params.hooghlyTideLevel - River tide level in meters (e.g., 3.42m)
 * @returns {Object} Simulated metrics, relief percentages, and clearance status
 */
export function calculateHydraulicSimulation({
  baselineDepthCm = 28.0,
  baselineAreaM2 = 12400,
  baselineRiskScore = 82,
  baselineDrainageLoad = 75,
  stationMaxDischargeCusecs = 85,
  pumpCapacity = 100,
  crewDispatched = true,
  extraPumpUnit = true,
  hooghlyTideLevel = 3.42,
}) {
  // 1. Pumping Station Boost Factor (50% -> 0 boost, 100% -> up to 34% relief)
  const pumpThrottleFraction = Math.max(0, (pumpCapacity - 50) / 50);
  const pumpDischargeCusecs = Math.round(
    stationMaxDischargeCusecs * (0.5 + 0.5 * pumpThrottleFraction)
  );
  const pumpBoostRatio = pumpThrottleFraction * 0.34;

  // 2. Inlet Desilting Factor (restores culvert draw by removing sediment choke)
  const desiltRatio = crewDispatched ? 0.22 : 0.0;

  // 3. Mobile Submersible High-Head Unit (independent point dewatering)
  const mobilePumpRatio = extraPumpUnit ? 0.19 : 0.0;

  // 4. Hooghly River Tidal Backpressure Modulation
  // At > 3.20m tide, river head throttles gravity outfalls and lock gates
  const highTideThreshold = 3.2;
  const tidePenalty =
    hooghlyTideLevel > highTideThreshold
      ? Math.min(0.18, (hooghlyTideLevel - highTideThreshold) * 0.14)
      : 0.0;

  // 5. Net Hydrodynamic Relief Factor (clamped between 8% and 82%)
  const rawReliefFactor =
    pumpBoostRatio + desiltRatio + mobilePumpRatio - tidePenalty;
  const netReliefRatio = Math.max(0.08, Math.min(0.82, rawReliefFactor));

  // 6. Post-Intervention Simulated Water Depth (cm)
  const simulatedDepthCm = Math.max(
    2.0,
    parseFloat((baselineDepthCm * (1 - netReliefRatio)).toFixed(1))
  );
  const depthReductionCm = parseFloat(
    Math.max(0, baselineDepthCm - simulatedDepthCm).toFixed(1)
  );
  const depthReductionPct = Math.round(
    (depthReductionCm / Math.max(1, baselineDepthCm)) * 100
  );

  // 7. Post-Intervention Inundated Area (m²)
  // Area scales non-linearly with basin depth (Hager-Wiggert shallow basin geometry)
  const areaScalePower = 1.25;
  const areaRatio = Math.pow(simulatedDepthCm / Math.max(1, baselineDepthCm), areaScalePower);
  const simulatedAreaM2 = Math.max(
    800,
    Math.round(baselineAreaM2 * Math.min(1.0, areaRatio))
  );

  // 8. Projected Drainage Station Conduit Load (%)
  // Pumping load increases while conduits actively evacuate stored surface water
  const conduitLoadAdjustment =
    (pumpCapacity / 100) * (crewDispatched ? 1.12 : 0.95);
  const simulatedDrainageLoad = Math.min(
    100,
    Math.max(
      35,
      Math.round(baselineDrainageLoad * conduitLoadAdjustment)
    )
  );

  // 9. Projected Risk Score (0 - 100)
  const riskReductionFactor = netReliefRatio * 0.72;
  const simulatedRiskScore = Math.max(
    12,
    Math.round(baselineRiskScore * (1 - riskReductionFactor))
  );

  // 10. Estimated Time to Clear Water (Hours)
  // Inverse relationship with active discharge and reduction ratio
  const evacuationSpeedFactor = netReliefRatio * (pumpDischargeCusecs / 60);
  const clearanceHours = Math.max(
    0.8,
    parseFloat(
      (simulatedDepthCm / Math.max(0.2, evacuationSpeedFactor * 12) + 0.9).toFixed(1)
    )
  );

  // 11. Vehicular & Traffic Clearance Categorization
  let clearanceStatus = "Safe Vehicular Clearance";
  let clearanceColor = "text-emerald-700";
  let clearanceBadgeBg = "bg-emerald-50 border-emerald-200 text-emerald-700";

  if (simulatedDepthCm <= 8.0) {
    clearanceStatus = "Safe Vehicular Clearance";
    clearanceColor = "text-emerald-700";
    clearanceBadgeBg = "bg-emerald-50 border-emerald-200 text-emerald-700";
  } else if (simulatedDepthCm <= 14.0) {
    clearanceStatus = "Controlled Single-Lane Flow";
    clearanceColor = "text-amber-700";
    clearanceBadgeBg = "bg-amber-50 border-amber-200 text-amber-700";
  } else {
    clearanceStatus = "Restricted Heavy-Vehicle Only";
    clearanceColor = "text-rose-700";
    clearanceBadgeBg = "bg-rose-50 border-rose-200 text-rose-700";
  }

  // 12. Tactical Municipal Dispatch Summary
  const equipmentUsed = [];
  if (pumpCapacity >= 90) equipmentUsed.push(`Turbine boosted to ${pumpCapacity}%`);
  if (crewDispatched) equipmentUsed.push("Unit 04 Inlet Desilting");
  if (extraPumpUnit) equipmentUsed.push("20 HP Godwin High-Head Unit");

  const equipmentSummary =
    equipmentUsed.length > 0 ? equipmentUsed.join(" + ") : "Station Standard Flow";

  const dispatchSummary = `${equipmentSummary} projected to reduce water depth by ${depthReductionCm} cm (${depthReductionPct}%), clearing arterial transit ${clearanceHours} hrs ahead of flood crest.`;

  return {
    netReliefRatio,
    simulatedDepthCm,
    depthReductionCm,
    depthReductionPct,
    simulatedAreaM2,
    simulatedDrainageLoad,
    simulatedRiskScore,
    clearanceHours,
    clearanceStatus,
    clearanceColor,
    clearanceBadgeBg,
    pumpDischargeCusecs,
    dispatchSummary,
    equipmentUsed,
  };
}
