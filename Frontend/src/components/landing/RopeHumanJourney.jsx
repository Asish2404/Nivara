import React, { useMemo } from "react";
import { motion } from "framer-motion";

/**
 * 3D AI Intelligence Bot Character Holding Rope and Pointing Out Steps
 * - One hand (raised arm) holding firmly onto the single real vertical rope.
 * - Other hand pointing directly to the right towards the active step cards.
 * - Suspended in mid-air in climbing posture with legs dangling.
 * - Rope remains perfectly vertical with zero rotation so the single rope never breaks.
 */
const AiBotCharacter = ({ isSliding, slideDirection = 1 }) => {
  return (
    <motion.div
      className="relative w-[68px] sm:w-[74px] md:w-[80px] flex flex-col items-center select-none pointer-events-none"
      animate={{
        // Zero rotation keeps the single real rope perfectly aligned and unbroken at all times
        y: isSliding ? 0 : [0, -2.5, 0],
      }}
      transition={{
        y: { repeat: Infinity, duration: 2.8, ease: "easeInOut" },
      }}
    >
      {/* Cyan energy halo matching the bot's glowing cyan eyes and chest core */}
      <div className="absolute inset-x-2 inset-y-3 rounded-full bg-cyan-400/20 blur-md -z-10 pointer-events-none" />

      {/* The 3D AI Bot Holding the Rope with One Hand and Pointing Out Steps */}
      <img
        src="/assets/ai-bot-hanging.png"
        alt="AI Bot Holding Rope and Pointing to Steps"
        className="w-full h-auto object-contain filter drop-shadow-[0_8px_18px_rgba(6,182,212,0.35)] drop-shadow-[0_14px_24px_rgba(15,23,42,0.22)] pointer-events-none"
        draggable="false"
      />
    </motion.div>
  );
};

/**
 * RopeHumanJourney Component
 * Dynamically extends the single real vertical rope as each step appears.
 * Features the 3D AI Bot gripping the single real rope by hand and sliding down to each step.
 */
export const RopeHumanJourney = ({
  steps = [],
  activeStep = 0,
  revealedCount = 1,
  stepPositions = [],
  isSliding = false,
  slideDirection = 1,
  isResetting = false,
  onStepSelect,
}) => {
  // Target Y coordinate of the active step
  const activeY = useMemo(() => {
    if (stepPositions && stepPositions[activeStep] !== undefined && stepPositions[activeStep] > 0) {
      return stepPositions[activeStep];
    }
    return 42 + activeStep * 82;
  }, [stepPositions, activeStep]);

  // Target Y coordinate of the furthest revealed step (where the rope extends to)
  const maxRevealedY = useMemo(() => {
    const lastIdx = Math.max(0, revealedCount - 1);
    if (stepPositions && stepPositions[lastIdx] !== undefined && stepPositions[lastIdx] > 0) {
      return stepPositions[lastIdx];
    }
    return 42 + lastIdx * 82;
  }, [stepPositions, revealedCount]);

  // The rope extends down past the bot's dangling boots and active step
  const ropeHeight = useMemo(() => {
    const targetBase = Math.max(activeY, maxRevealedY);
    return targetBase + 55;
  }, [activeY, maxRevealedY]);

  return (
    <div className="relative w-14 sm:w-16 md:w-18 self-stretch flex-shrink-0 select-none">
      {/* Top Rigging Pulley / Rope Suspension Mount */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-3 z-10 flex flex-col items-center pointer-events-none">
        <div className="w-5 h-2 rounded-t-sm bg-gradient-to-r from-slate-700 via-slate-600 to-slate-800 border border-slate-500 flex items-center justify-center shadow-xs">
          <div className="w-1.5 h-1 rounded-xs bg-cyan-400 animate-pulse" />
        </div>
        {/* Industrial brass pulley wheel supporting the rope */}
        <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-amber-600 via-amber-400 to-amber-700 border border-amber-800 flex items-center justify-center shadow-xs">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-900 border border-amber-300" />
        </div>
      </div>

      {/* 
        ============================================================
        THE EXTENDING REAL SINGLE CONTINUOUS ROPE
        Real braided hemp climbing rope texture running from the top
        pulley anchor down to the bottom tensioner, 100% seamless and single.
        ============================================================
      */}
      <motion.div
        className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none z-0"
        style={{
          width: "5px",
          backgroundImage: "url('/assets/rope-real-tile.png')",
          backgroundRepeat: "repeat-y",
          backgroundSize: "5px auto",
          backgroundPosition: "center top",
          filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.22))",
        }}
        animate={{
          height: ropeHeight,
        }}
        transition={{
          duration: isResetting ? 0.95 : 0.85,
          ease: [0.22, 1, 0.36, 1], // Exactly matching user's requested cubic-bezier
        }}
      >
        {/* Subtle cylindrical 3D depth highlight down the rope */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-transparent to-black/15 pointer-events-none" />

        {/* Bottom brass/steel weight tensioner travelling at the tip of the rope */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full flex flex-col items-center pointer-events-none">
          <div className="w-3.5 h-2 rounded-xs bg-gradient-to-r from-amber-700 via-amber-400 to-amber-800 border border-amber-900/60 shadow-xs flex items-center justify-center">
            <div className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse" />
          </div>
          <div className="w-3 h-3 rounded-full bg-gradient-to-b from-slate-700 to-slate-900 border border-slate-600 flex items-center justify-center shadow-md -mt-0.5">
            <div className="w-1 h-1 rounded-full bg-amber-400" />
          </div>
        </div>
      </motion.div>

      {/* SVG Canvas for Step Nodes & Horizontal Connectors */}
      <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none z-10">
        <defs>
          {/* Active connector beam gradient */}
          <linearGradient id="activeBeamGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>

        {/* Step Nodes & Connectors (Rendered for revealed steps as the rope reaches them) */}
        {steps.slice(0, revealedCount).map((step, idx) => {
          const isActive = idx === activeStep;
          const nodeY =
            stepPositions && stepPositions[idx] !== undefined && stepPositions[idx] > 0
              ? stepPositions[idx]
              : 42 + idx * 82;

          return (
            <g key={step.num}>
              {/* Horizontal Connector Line from Rope (50%) to Card (100%) */}
              {isActive ? (
                <motion.line
                  x1="50%"
                  y1={nodeY}
                  x2="100%"
                  y2={nodeY}
                  stroke="url(#activeBeamGrad)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                />
              ) : (
                <line
                  x1="50%"
                  y1={nodeY}
                  x2="100%"
                  y2={nodeY}
                  stroke="#cbd5e1"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
              )}

              {/* Active Step Node Pulsing Aura */}
              {isActive && (
                <motion.circle
                  cx="50%"
                  cy={nodeY}
                  r="10"
                  fill="rgba(6, 182, 212, 0.25)"
                  initial={{ scale: 0.6, opacity: 0.8 }}
                  animate={{ scale: [0.8, 1.45, 0.8], opacity: [0.8, 0.2, 0.8] }}
                  transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                />
              )}

              {/* Step Node Bead on the Rope */}
              {isActive ? (
                // Active Node: Solid luminous cyan
                <circle
                  cx="50%"
                  cy={nodeY}
                  r="5"
                  fill="#06b6d4"
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="filter drop-shadow-[0_0_6px_rgba(6,182,212,0.6)]"
                />
              ) : (
                // Completed Node: Crisp white ring with cyan outline
                <circle
                  cx="50%"
                  cy={nodeY}
                  r="3.5"
                  fill="#ffffff"
                  stroke="#0284c7"
                  strokeWidth="1.8"
                />
              )}
            </g>
          );
        })}
      </svg>

      {/* The AI Bot Holding the Rope with One Hand and Pointing Out the Steps */}
      <motion.div
        className="absolute left-1/2 -translate-x-1/2 pointer-events-none z-20 flex items-center justify-center"
        animate={{
          y: activeY - 50, // Centers the bot's extended pointing finger directly on the active step coordinate
        }}
        transition={{
          y: {
            duration: isResetting ? 0.95 : 0.85,
            ease: [0.22, 1, 0.36, 1], // Exactly matching user's requested cubic-bezier
          },
        }}
      >
        <AiBotCharacter isSliding={isSliding} slideDirection={slideDirection} />
      </motion.div>

      {/* Interactive Click Targets along the rope for revealed steps */}
      {steps.slice(0, revealedCount).map((step, idx) => {
        const nodeY =
          stepPositions && stepPositions[idx] !== undefined && stepPositions[idx] > 0
            ? stepPositions[idx]
            : 42 + idx * 82;

        return (
          <button
            key={`btn-${step.num}`}
            type="button"
            title={`Step ${step.num}: ${step.title}`}
            onClick={() => onStepSelect && onStepSelect(idx)}
            style={{ top: `${nodeY - 14}px` }}
            className="absolute left-1/2 -translate-x-1/2 w-8 h-7 z-30 cursor-pointer rounded-full hover:bg-cyan-500/15 transition-colors"
          />
        );
      })}
    </div>
  );
};

export default RopeHumanJourney;
