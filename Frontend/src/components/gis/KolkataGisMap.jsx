import { useRef, useEffect, useCallback } from "react";
import {
  HOOGHLY_RIVER,
  GREEN_RESERVES,
  WATER_BODIES,
  DRAINAGE_CANALS,
  DRAINAGE_TRUNK_CONDUITS,
  ROAD_NETWORK,
  NEIGHBORHOOD_BLOCKS,
  FLOOD_DEPTH_ZONES,
  RISK_ZONES,
  ACTIVE_INCIDENTS,
  PUMPING_STATIONS,
  SPATIAL_RAIN_CELLS,
  FORECAST_ISOBARS,
  GEOGRAPHIC_DISTRICTS,
} from "./kolkataCartographicData";
import { useKWIStore } from "../../store/useKWIStore";

export function KolkataGisMap({
  selectedDistrict,
  onSelectDistrict,
  overrideLayers,
  traceWaterFlow = false,
}) {
  const canvasRef = useRef(null);
  const store = useKWIStore();
  const activeLayers = overrideLayers || store.activeLayers;

  const selectedIncident = store.selectedIncident;
  const selectedRiskZone = store.selectedRiskZone;
  const selectedPumpStation = store.selectedPumpStation;

  // Camera & Viewport Transform State
  const viewState = useRef({
    x: 0,
    y: 0,
    zoom: 1.0,
    targetX: 0,
    targetY: 0,
    targetZoom: 1.0,
    isDragging: false,
    dragStart: { x: 0, y: 0 },
    flowDashOffset: 0,
  });

  // Watch selected items and smoothly focus map
  useEffect(() => {
    if (selectedIncident) {
      viewState.current.targetX = selectedIncident.x;
      viewState.current.targetY = selectedIncident.y;
      viewState.current.targetZoom = 1.6;
      return;
    }
    if (selectedPumpStation) {
      viewState.current.targetX = selectedPumpStation.x;
      viewState.current.targetY = selectedPumpStation.y;
      viewState.current.targetZoom = 1.5;
      return;
    }
    if (selectedRiskZone) {
      viewState.current.targetX = selectedRiskZone.center[0];
      viewState.current.targetY = selectedRiskZone.center[1];
      viewState.current.targetZoom = 1.4;
      return;
    }
    if (selectedDistrict) {
      const d = GEOGRAPHIC_DISTRICTS.find(
        (item) => item.id === selectedDistrict,
      );
      if (d) {
        viewState.current.targetX = d.center[0];
        viewState.current.targetY = d.center[1];
        viewState.current.targetZoom = d.zoom;
        return;
      }
    }
  }, [
    selectedIncident,
    selectedPumpStation,
    selectedRiskZone,
    selectedDistrict,
  ]);

  // Watch Zoom In / Out / Reset from Store
  const lastZoomTrigger = useRef(store.zoomTrigger);
  useEffect(() => {
    if (store.zoomTrigger !== lastZoomTrigger.current) {
      const dir = store.zoomTrigger > lastZoomTrigger.current ? 1.25 : 0.8;
      lastZoomTrigger.current = store.zoomTrigger;
      viewState.current.targetZoom = Math.min(
        Math.max(viewState.current.targetZoom * dir, 0.6),
        3.5,
      );
    }
  }, [store.zoomTrigger]);

  const lastResetTrigger = useRef(store.resetCameraTrigger);
  useEffect(() => {
    if (store.resetCameraTrigger !== lastResetTrigger.current) {
      lastResetTrigger.current = store.resetCameraTrigger;
      viewState.current.targetX = 0.5;
      viewState.current.targetY = 0;
      viewState.current.targetZoom = 1.0;
    }
  }, [store.resetCameraTrigger]);

  // Coordinate Mapping Helper
  const getScreenCoords = useCallback((kmX, kmY, width, height) => {
    const v = viewState.current;
    const pixelsPerKm = (Math.min(width, height) / 24) * v.zoom;
    const screenX = width / 2 + (kmX - v.x) * pixelsPerKm;
    const screenY = height / 2 + (kmY - v.y) * pixelsPerKm;
    return [screenX, screenY, pixelsPerKm];
  }, []);

  const getKmCoords = useCallback((screenX, screenY, width, height) => {
    const v = viewState.current;
    const pixelsPerKm = (Math.min(width, height) / 24) * v.zoom;
    const kmX = (screenX - width / 2) / pixelsPerKm + v.x;
    const kmY = (screenY - height / 2) / pixelsPerKm + v.y;
    return [kmX, kmY];
  }, []);

  // Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationFrameId;

    const render = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // Smooth Camera Lerp (No bouncing, natural deceleration)
      const v = viewState.current;
      v.x += (v.targetX - v.x) * 0.08;
      v.y += (v.targetY - v.y) * 0.08;
      v.zoom += (v.targetZoom - v.zoom) * 0.08;

      // Water Flow Animation Offset
      if (traceWaterFlow) {
        v.flowDashOffset = (v.flowDashOffset - 0.4) % 16;
      }

      const toScreen = (kmX, kmY) => getScreenCoords(kmX, kmY, width, height);

      // ========================================================
      // 1. BASE TERRAIN (Warm Cartographic Off-White)
      // ========================================================
      ctx.fillStyle = "#f5f5f1";
      ctx.fillRect(0, 0, width, height);

      // ========================================================
      // 2. RESTRAINED GEODETIC GRID
      // ========================================================
      ctx.strokeStyle = "rgba(120, 130, 140, 0.06)";
      ctx.lineWidth = 1;
      const [gridStartKmX, gridStartKmY] = getKmCoords(0, 0, width, height);
      const [gridEndKmX, gridEndKmY] = getKmCoords(
        width,
        height,
        width,
        height,
      );

      const gridSpacingKm = v.zoom > 1.8 ? 1.0 : 2.5;
      const minX = Math.floor(gridStartKmX / gridSpacingKm) * gridSpacingKm;
      const maxX = Math.ceil(gridEndKmX / gridSpacingKm) * gridSpacingKm;
      const minY = Math.floor(gridStartKmY / gridSpacingKm) * gridSpacingKm;
      const maxY = Math.ceil(gridEndKmY / gridSpacingKm) * gridSpacingKm;

      for (let gx = minX; gx <= maxX; gx += gridSpacingKm) {
        const [sx] = toScreen(gx, 0);
        ctx.beginPath();
        ctx.moveTo(sx, 0);
        ctx.lineTo(sx, height);
        ctx.stroke();
      }
      for (let gy = minY; gy <= maxY; gy += gridSpacingKm) {
        const [, sy] = toScreen(0, gy);
        ctx.beginPath();
        ctx.moveTo(0, sy);
        ctx.lineTo(width, sy);
        ctx.stroke();
      }

      // ========================================================
      // 3. URBAN NEIGHBORHOOD BLOCKS & VARIED PARCELS
      // ========================================================
      NEIGHBORHOOD_BLOCKS.forEach((block) => {
        // District Boundary Fill
        ctx.beginPath();
        block.polygon.forEach(([bx, by], i) => {
          const [sx, sy] = toScreen(bx, by);
          if (i === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        });
        ctx.closePath();
        ctx.fillStyle = "#ebebe5";
        ctx.fill();
        ctx.strokeStyle = "#deded6";
        ctx.lineWidth = 1;
        ctx.stroke();

        // Architectural Sub-Parcels (Communicating density & realistic footprint variety)
        if (block.subParcels) {
          block.subParcels.forEach((p) => {
            const [px, py, pKmVal] = toScreen(p.x, p.y);
            const pw = p.w * pKmVal;
            const ph = p.h * pKmVal;

            ctx.fillStyle = "#f1f1eb";
            ctx.fillRect(px, py, pw, ph);
            ctx.strokeStyle = "#e2e2dc";
            ctx.lineWidth = 0.75;
            ctx.strokeRect(px, py, pw, ph);
          });
        }
      });

      // ========================================================
      // 4. GREEN RESERVES & VEGETATION (Natural Muted Greens)
      // ========================================================
      GREEN_RESERVES.forEach((res) => {
        ctx.beginPath();
        res.polygon.forEach(([gx, gy], i) => {
          const [sx, sy] = toScreen(gx, gy);
          if (i === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        });
        ctx.closePath();
        ctx.fillStyle =
          res.id === "wetlands" ? "rgba(215, 235, 222, 0.75)" : "#dbe7d8";
        ctx.fill();
        ctx.strokeStyle = res.id === "wetlands" ? "#c2dbcb" : "#c9d8c5";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });

      // The Maidan Racecourse Oval
      const [rcX, rcY, pKm] = toScreen(-1.5, 0.8);
      ctx.beginPath();
      ctx.ellipse(rcX, rcY, 0.7 * pKm, 0.45 * pKm, 0.2, 0, Math.PI * 2);
      ctx.fillStyle = "#cde0ca";
      ctx.fill();
      ctx.strokeStyle = "#b9cfb5";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Victoria Memorial Footprint in The Maidan
      const [vmX, vmY] = toScreen(-1.0, 1.2);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(vmX - 6, vmY - 6, 12, 12);
      ctx.strokeStyle = "#94a3b8";
      ctx.lineWidth = 1;
      ctx.strokeRect(vmX - 6, vmY - 6, 12, 12);

      // ========================================================
      // 5. NATURAL WATER BODIES (Lakes & Retention Basins)
      // ========================================================
      WATER_BODIES.forEach((lake) => {
        const [cx, cy, pKmVal] = toScreen(lake.center[0], lake.center[1]);
        ctx.beginPath();
        ctx.ellipse(
          cx,
          cy,
          lake.radiusX * pKmVal,
          lake.radiusY * pKmVal,
          lake.rotation,
          0,
          Math.PI * 2,
        );
        ctx.fillStyle = "#8eaec2";
        ctx.fill();
        ctx.strokeStyle = "#7497ad";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });

      // ========================================================
      // 6. HOOGHLY RIVER (Western Waterway with natural shoreline)
      // ========================================================
      const leftBank = [];
      const rightBank = [];
      const riverPts = HOOGHLY_RIVER.centerline;

      for (let i = 0; i < riverPts.length; i++) {
        const pt = riverPts[i];
        const halfW = pt.width / 2;

        let dx = 0;
        let dy = 1;
        if (i < riverPts.length - 1) {
          dx = riverPts[i + 1].x - pt.x;
          dy = riverPts[i + 1].y - pt.y;
        } else {
          dx = pt.x - riverPts[i - 1].x;
          dy = pt.y - riverPts[i - 1].y;
        }
        const len = Math.hypot(dx, dy) || 1;
        const nx = -dy / len;
        const ny = dx / len;

        leftBank.push([pt.x - nx * halfW, pt.y - ny * halfW]);
        rightBank.push([pt.x + nx * halfW, pt.y + ny * halfW]);
      }

      ctx.beginPath();
      leftBank.forEach(([lx, ly], i) => {
        const [sx, sy] = toScreen(lx, ly);
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      });
      for (let i = rightBank.length - 1; i >= 0; i--) {
        const [rx, ry] = rightBank[i];
        const [sx, sy] = toScreen(rx, ry);
        ctx.lineTo(sx, sy);
      }
      ctx.closePath();
      ctx.fillStyle = "#80a3b9";
      ctx.fill();
      ctx.strokeStyle = "#688fa7";
      ctx.lineWidth = 2;
      ctx.stroke();

      // River Bridges
      HOOGHLY_RIVER.bridges.forEach((bridge) => {
        const [sx1, sy1] = toScreen(bridge.start[0], bridge.start[1]);
        const [sx2, sy2] = toScreen(bridge.end[0], bridge.end[1]);

        ctx.beginPath();
        ctx.moveTo(sx1, sy1);
        ctx.lineTo(sx2, sy2);
        ctx.strokeStyle = "#334155";
        ctx.lineWidth = 3.5;
        ctx.stroke();

        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Pylon markers
        if (bridge.pylons) {
          bridge.pylons.forEach(([px, py]) => {
            const [spx, spy] = toScreen(px, py);
            ctx.fillStyle = "#0f172a";
            ctx.fillRect(spx - 2, spy - 2, 4, 4);
          });
        }
      });

      // Historic Ghat Labels
      HOOGHLY_RIVER.ghats.forEach((g) => {
        const [gx, gy] = toScreen(g.x, g.y);
        ctx.beginPath();
        ctx.arc(gx, gy, 2, 0, Math.PI * 2);
        ctx.fillStyle = "#64748b";
        ctx.fill();

        if (v.zoom > 1.2) {
          ctx.font = "9px sans-serif";
          ctx.fillStyle = "#475569";
          ctx.fillText(g.name, gx + 4, gy + 3);
        }
      });

      // ========================================================
      // 7. ROAD NETWORK (Hierarchical Casing + Core)
      // ========================================================
      // Secondary Roads
      ROAD_NETWORK.secondary.forEach((road) => {
        ctx.beginPath();
        road.points.forEach(([rx, ry], i) => {
          const [sx, sy] = toScreen(rx, ry);
          if (i === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        });
        ctx.strokeStyle = "#e2e2dc";
        ctx.lineWidth = 3.0;
        ctx.stroke();

        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.8;
        ctx.stroke();
      });

      // Primary Arterials / Expressways (EM Bypass, Central Ave, Maa Flyover, VIP Rd, DH Rd)
      ROAD_NETWORK.primary.forEach((road) => {
        ctx.beginPath();
        road.points.forEach(([rx, ry], i) => {
          const [sx, sy] = toScreen(rx, ry);
          if (i === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        });
        ctx.strokeStyle = "#cbcbc5";
        ctx.lineWidth = 5.0;
        ctx.stroke();

        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 3.2;
        ctx.stroke();
      });

      // ========================================================
      // 8. DRAINAGE LAYER (Canals, Trunks, Flow Animation)
      // ========================================================
      if (activeLayers.drainage) {
        // Municipal Canals (Khals)
        DRAINAGE_CANALS.forEach((canal) => {
          ctx.beginPath();
          canal.points.forEach(([cx, cy], i) => {
            const [sx, sy] = toScreen(cx, cy);
            if (i === 0) ctx.moveTo(sx, sy);
            else ctx.lineTo(sx, sy);
          });
          ctx.strokeStyle = "#2e8b8f";
          ctx.lineWidth = 3.2;
          ctx.stroke();

          // If Trace Water Flow is active, show directional moving flow dashes
          if (traceWaterFlow) {
            ctx.save();
            ctx.setLineDash([6, 6]);
            ctx.lineDashOffset = v.flowDashOffset;
            ctx.strokeStyle = "#ecfeff";
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.restore();
          }
        });

        // Underground Stormwater Trunk Conduits
        DRAINAGE_TRUNK_CONDUITS.forEach((trunk) => {
          ctx.save();
          ctx.setLineDash(traceWaterFlow ? [4, 4] : [3, 3]);
          if (traceWaterFlow) ctx.lineDashOffset = v.flowDashOffset;

          ctx.beginPath();
          trunk.points.forEach(([tx, ty], i) => {
            const [sx, sy] = toScreen(tx, ty);
            if (i === 0) ctx.moveTo(sx, sy);
            else ctx.lineTo(sx, sy);
          });
          ctx.strokeStyle = "#439d9a";
          ctx.lineWidth = 2.0;
          ctx.stroke();
          ctx.restore();
        });
      }

      // ========================================================
      // 9. REALISTIC FLOOD DEPTH ZONES (Depths Following Corridors)
      // ========================================================
      if (activeLayers.risk) {
        FLOOD_DEPTH_ZONES.forEach((fz) => {
          ctx.beginPath();
          fz.polygon.forEach(([zx, zy], i) => {
            const [sx, sy] = toScreen(zx, zy);
            if (i === 0) ctx.moveTo(sx, sy);
            else ctx.lineTo(sx, sy);
          });
          ctx.closePath();
          ctx.fillStyle = fz.fillColor;
          ctx.fill();
          ctx.strokeStyle = fz.borderColor;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        });

        // Catchment Risk Boundary Discs
        RISK_ZONES.forEach((zone) => {
          const isSelected = selectedRiskZone?.id === zone.id;
          ctx.beginPath();
          zone.polygon.forEach(([zx, zy], i) => {
            const [sx, sy] = toScreen(zx, zy);
            if (i === 0) ctx.moveTo(sx, sy);
            else ctx.lineTo(sx, sy);
          });
          ctx.closePath();
          ctx.strokeStyle = zone.severityColor;
          ctx.lineWidth = isSelected ? 2.5 : 1.2;
          ctx.stroke();
        });
      }

      // ========================================================
      // 10. SPATIAL RAINFALL PRECIPITATION LAYER
      // ========================================================
      if (activeLayers.rain) {
        SPATIAL_RAIN_CELLS.forEach((cell) => {
          const [cx, cy, pKmVal] = toScreen(cell.center[0], cell.center[1]);
          ctx.beginPath();
          ctx.ellipse(
            cx,
            cy,
            cell.radiusX * pKmVal,
            cell.radiusY * pKmVal,
            0.15,
            0,
            Math.PI * 2,
          );
          ctx.fillStyle = cell.color;
          ctx.fill();
          ctx.strokeStyle = "rgba(74, 133, 171, 0.35)";
          ctx.lineWidth = 1;
          ctx.stroke();
        });
      }

      // ========================================================
      // 11. FORECAST RADAR ISOBARS
      // ========================================================
      if (activeLayers.forecast) {
        FORECAST_ISOBARS.forEach((isobar) => {
          const [cx, cy, pKmVal] = toScreen(isobar.center[0], isobar.center[1]);
          ctx.save();
          ctx.setLineDash([6, 6]);
          ctx.beginPath();
          ctx.arc(cx, cy, isobar.radius * pKmVal, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(56, 120, 160, 0.4)";
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.restore();
        });
      }

      // ========================================================
      // 12. PUMPING STATIONS (Engineering Nodes)
      // ========================================================
      if (activeLayers.pumps) {
        PUMPING_STATIONS.forEach((ps) => {
          const isSelected = selectedPumpStation?.id === ps.id;
          const [sx, sy] = toScreen(ps.x, ps.y);

          ctx.fillStyle = ps.isAtCapacity ? "#dc2626" : "#2e8b8f";
          ctx.fillRect(sx - 4.5, sy - 4.5, 9, 9);
          ctx.strokeStyle = isSelected ? "#0f172a" : "#ffffff";
          ctx.lineWidth = isSelected ? 2 : 1;
          ctx.strokeRect(sx - 4.5, sy - 4.5, 9, 9);

          ctx.font = "bold 9px monospace";
          ctx.fillStyle = "#334155";
          ctx.fillText(ps.id, sx + 7, sy + 3);
        });
      }

      // ========================================================
      // 13. ACTIVE INCIDENTS (Connected Municipal Signals)
      // ========================================================
      if (activeLayers.incidents) {
        ACTIVE_INCIDENTS.forEach((inc) => {
          const isSelected = selectedIncident?.id === inc.id;
          const [sx, sy] = toScreen(inc.x, inc.y);

          if (isSelected || inc.isPrimary) {
            ctx.beginPath();
            ctx.arc(sx, sy, isSelected ? 12 : 8, 0, Math.PI * 2);
            ctx.fillStyle = `${inc.severityColor}28`;
            ctx.fill();
          }

          ctx.beginPath();
          ctx.arc(sx, sy, 4.5, 0, Math.PI * 2);
          ctx.fillStyle = inc.severityColor;
          ctx.fill();
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.font = isSelected ? "bold 10px monospace" : "600 9px monospace";
          ctx.fillStyle = isSelected ? "#0f172a" : "#475569";
          ctx.fillText(inc.id, sx + 7, sy - 2);
        });
      }

      // ========================================================
      // 14. CARTOGRAPHIC DISTRICT LABELS
      // ========================================================
      const labels = [
        {
          text: "HOOGHLY RIVER",
          x: -4.4,
          y: -4.0,
          font: "italic 11px sans-serif",
          color: "#688fa7",
        },
        {
          text: "HOWRAH",
          x: -4.5,
          y: -2.0,
          font: "bold 10px monospace",
          color: "#64748b",
        },
        {
          text: "B.B.D. BAGH",
          x: -0.6,
          y: -2.0,
          font: "bold 10px monospace",
          color: "#334155",
        },
        {
          text: "THE MAIDAN",
          x: -1.4,
          y: 0.2,
          font: "bold 10px monospace",
          color: "#4f7d4e",
        },
        {
          text: "PARK STREET",
          x: 0.2,
          y: 0.8,
          font: "bold 10px monospace",
          color: "#334155",
        },
        {
          text: "SALT LAKE",
          x: 5.0,
          y: -3.8,
          font: "bold 10px monospace",
          color: "#475569",
        },
        {
          text: "SECTOR V",
          x: 6.6,
          y: -1.2,
          font: "bold 10px monospace",
          color: "#334155",
        },
        {
          text: "NEW TOWN",
          x: 8.8,
          y: -4.5,
          font: "bold 10px monospace",
          color: "#475569",
        },
        {
          text: "E.M. BYPASS",
          x: 3.8,
          y: 2.5,
          font: "bold 9px monospace",
          color: "#64748b",
        },
        {
          text: "BEHALA",
          x: -2.4,
          y: 6.0,
          font: "bold 10px monospace",
          color: "#334155",
        },
        {
          text: "BALLYGUNGE",
          x: 1.8,
          y: 3.2,
          font: "bold 10px monospace",
          color: "#334155",
        },
        {
          text: "EAST KOLKATA WETLANDS",
          x: 6.8,
          y: 3.5,
          font: "italic 10px sans-serif",
          color: "#4a856a",
        },
      ];

      labels.forEach((lbl) => {
        const [sx, sy] = toScreen(lbl.x, lbl.y);
        ctx.font = lbl.font;
        ctx.fillStyle = lbl.color;
        ctx.fillText(lbl.text, sx, sy);
      });

      // North Arrow Indicator
      ctx.save();
      const naX = width - 40;
      const naY = 120;
      ctx.beginPath();
      ctx.moveTo(naX, naY - 14);
      ctx.lineTo(naX - 5, naY + 4);
      ctx.lineTo(naX, naY);
      ctx.lineTo(naX + 5, naY + 4);
      ctx.closePath();
      ctx.fillStyle = "#334155";
      ctx.fill();
      ctx.font = "bold 8px monospace";
      ctx.fillStyle = "#64748b";
      ctx.fillText("N", naX - 2.5, naY - 18);
      ctx.restore();

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [
    activeLayers,
    getKmCoords,
    getScreenCoords,
    selectedIncident,
    selectedPumpStation,
    selectedRiskZone,
    traceWaterFlow,
  ]);

  // Mouse & Touch Interactions
  const handleMouseDown = (e) => {
    viewState.current.isDragging = true;
    viewState.current.dragStart = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e) => {
    if (!viewState.current.isDragging) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const pixelsPerKm = (Math.min(width, height) / 24) * viewState.current.zoom;

    const dx = (e.clientX - viewState.current.dragStart.x) / pixelsPerKm;
    const dy = (e.clientY - viewState.current.dragStart.y) / pixelsPerKm;

    viewState.current.targetX -= dx;
    viewState.current.targetY -= dy;
    viewState.current.x -= dx;
    viewState.current.y -= dy;
    viewState.current.dragStart = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    viewState.current.isDragging = false;
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.88;
    viewState.current.targetZoom = Math.min(
      Math.max(viewState.current.targetZoom * zoomFactor, 0.6),
      3.5,
    );
  };

  const handleClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const [clickKmX, clickKmY] = getKmCoords(
      clickX,
      clickY,
      canvas.clientWidth,
      canvas.clientHeight,
    );

    // Check Incident Click
    if (activeLayers.incidents) {
      const hitIncident = ACTIVE_INCIDENTS.find((inc) => {
        const dist = Math.hypot(inc.x - clickKmX, inc.y - clickKmY);
        return dist < 0.6 / viewState.current.zoom;
      });
      if (hitIncident) {
        store.setSelectedIncident(hitIncident);
        return;
      }
    }

    // Check Pump Station Click
    if (activeLayers.pumps) {
      const hitPump = PUMPING_STATIONS.find((ps) => {
        const dist = Math.hypot(ps.x - clickKmX, ps.y - clickKmY);
        return dist < 0.6 / viewState.current.zoom;
      });
      if (hitPump) {
        store.setSelectedPumpStation(hitPump);
        return;
      }
    }

    // Check Risk Zone Click
    if (activeLayers.risk) {
      const hitZone = RISK_ZONES.find((zone) => {
        const dist = Math.hypot(
          zone.center[0] - clickKmX,
          zone.center[1] - clickKmY,
        );
        return dist < 1.4 / viewState.current.zoom;
      });
      if (hitZone) {
        store.setSelectedRiskZone(hitZone);
        return;
      }
    }

    store.clearSelections();
  };

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-[#f5f5f1] select-none cursor-grab active:cursor-grabbing">
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onClick={handleClick}
        aria-label="Interactive Cartographic Map of Kolkata"
      />
    </div>
  );
}

export default KolkataGisMap;
