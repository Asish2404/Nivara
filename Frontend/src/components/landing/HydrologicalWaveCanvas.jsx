import React, { useEffect, useRef } from "react";

/**
 * HydrologicalWaveCanvas
 * 
 * An interactive, high-performance HTML5 canvas simulation of bioluminescent 
 * water currents, tidal sinusoidal harmonics, and floating luminescent telemetry particles.
 * Tailored specifically for NIVARA's Deep Ocean Dark Mode palette.
 */
export default function HydrologicalWaveCanvas({
  speed = 1.0,
  interactive = true,
  className = "",
}) {
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const mouseRef = useRef({ x: -1000, y: -1000, targetX: -1000, targetY: -1000, active: false });
  const isVisibleRef = useRef(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;

    // Resize handler
    const handleResize = () => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.scale(dpr, dpr);
    };

    handleResize();
    const ro = new ResizeObserver(handleResize);
    ro.observe(canvas);

    // Visibility observer to pause when off-screen
    const io = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry.isIntersecting;
      },
      { threshold: 0.05 }
    );
    io.observe(canvas);

    // Mouse movement
    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.targetX = e.clientX - rect.left;
      mouseRef.current.targetY = e.clientY - rect.top;
      mouseRef.current.active = true;
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    if (interactive) {
      canvas.parentElement?.addEventListener("mousemove", handleMouseMove);
      canvas.parentElement?.addEventListener("mouseleave", handleMouseLeave);
    }

    // Bioluminescent water particles
    const particles = Array.from({ length: 42 }, () => ({
      x: Math.random() * (width || 800),
      y: (height || 300) * 0.4 + Math.random() * (height || 300) * 0.6,
      radius: Math.random() * 2.2 + 0.8,
      vx: (Math.random() - 0.5) * 0.4 + 0.3,
      vy: -(Math.random() * 0.5 + 0.2),
      alpha: Math.random() * 0.6 + 0.2,
      pulseSpeed: Math.random() * 0.03 + 0.01,
      phase: Math.random() * Math.PI * 2,
    }));

    let time = 0;

    // Render loop
    const render = () => {
      if (isVisibleRef.current && width > 0 && height > 0) {
        time += 0.012 * speed;

        // Smooth mouse lerp
        const m = mouseRef.current;
        m.x += (m.targetX - m.x) * 0.1;
        m.y += (m.targetY - m.y) * 0.1;

        ctx.clearRect(0, 0, width, height);

        // --- Wave 1: Deep slow tidal base (Cyan-Emerald Marine flow) ---
        ctx.beginPath();
        const baseLine1 = height * 0.68;
        ctx.moveTo(0, height);
        for (let x = 0; x <= width; x += 8) {
          const wave1 = Math.sin(x * 0.0035 + time * 0.8) * 18;
          const wave2 = Math.cos(x * 0.007 - time * 0.5) * 12;
          
          // Mouse repulsion/crest effect
          let mouseDist = 0;
          if (m.active) {
            const dx = x - m.x;
            const dist = Math.abs(dx);
            if (dist < 180) {
              mouseDist = Math.cos((dist / 180) * (Math.PI / 2)) * 26;
            }
          }

          const y = baseLine1 + wave1 + wave2 - mouseDist;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(width, height);
        ctx.closePath();

        const grad1 = ctx.createLinearGradient(0, height * 0.5, 0, height);
        grad1.addColorStop(0, "rgba(10, 51, 66, 0.35)");
        grad1.addColorStop(0.5, "rgba(6, 20, 27, 0.75)");
        grad1.addColorStop(1, "rgba(6, 20, 27, 0.95)");
        ctx.fillStyle = grad1;
        ctx.fill();

        // --- Wave 2: Middle Outfall Current (Luminescent Cyan & Sky Blue) ---
        ctx.beginPath();
        const baseLine2 = height * 0.76;
        ctx.moveTo(0, height);
        for (let x = 0; x <= width; x += 6) {
          const wave1 = Math.sin(x * 0.005 + time * 1.2) * 16;
          const wave2 = Math.sin(x * 0.012 - time * 0.9) * 8;
          
          let mouseDist = 0;
          if (m.active) {
            const dx = x - m.x;
            const dist = Math.abs(dx);
            if (dist < 140) {
              mouseDist = Math.sin((dist / 140) * Math.PI) * 18;
            }
          }

          const y = baseLine2 + wave1 + wave2 - mouseDist;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(width, height);
        ctx.closePath();

        const grad2 = ctx.createLinearGradient(0, height * 0.6, 0, height);
        grad2.addColorStop(0, "rgba(32, 197, 216, 0.22)");
        grad2.addColorStop(0.5, "rgba(14, 56, 68, 0.5)");
        grad2.addColorStop(1, "rgba(6, 20, 27, 0.9)");
        ctx.fillStyle = grad2;
        ctx.fill();

        // --- Wave 3: Telemetry Pulse Line (Neon Cyan Glowing River Crest) ---
        ctx.beginPath();
        const baseLine3 = height * 0.74;
        let startY = 0;
        for (let x = 0; x <= width; x += 5) {
          const wave1 = Math.sin(x * 0.006 + time * 1.35) * 14;
          const wave2 = Math.cos(x * 0.014 + time * 0.7) * 7;
          
          let mouseDist = 0;
          if (m.active) {
            const dx = x - m.x;
            const dist = Math.abs(dx);
            if (dist < 160) {
              mouseDist = Math.cos((dist / 160) * (Math.PI / 2)) * 22;
            }
          }

          const y = baseLine3 + wave1 + wave2 - mouseDist;
          if (x === 0) {
            ctx.moveTo(x, y);
            startY = y;
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.strokeStyle = "rgba(32, 197, 216, 0.65)";
        ctx.lineWidth = 1.8;
        ctx.shadowColor = "#20C5D8";
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.shadowBlur = 0; // reset shadow

        // Secondary Sky Blue Highlight Crest
        ctx.beginPath();
        for (let x = 0; x <= width; x += 8) {
          const wave = Math.cos(x * 0.008 - time * 1.1) * 12;
          const y = height * 0.82 + wave;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = "rgba(56, 189, 248, 0.35)";
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // --- 4. Bioluminescent Floating Particles ---
        particles.forEach((p) => {
          p.x += p.vx;
          p.y += p.vy;
          p.phase += p.pulseSpeed;

          // Wrap edges
          if (p.x > width) p.x = 0;
          if (p.x < 0) p.x = width;
          if (p.y < height * 0.35) {
            p.y = height * 0.95;
            p.x = Math.random() * width;
          }

          const currentAlpha = p.alpha * (0.6 + 0.4 * Math.sin(p.phase));

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(32, 197, 216, ${currentAlpha})`;
          ctx.shadowColor = "#20C5D8";
          ctx.shadowBlur = 8;
          ctx.fill();
          ctx.shadowBlur = 0;
        });

        // --- 5. Floating Municipal Outfall Telemetry Buoys ---
        const buoyStations = [
          { code: "KMC-PL01", name: "Palmer Bridge Outfall", xRatio: 0.18, phaseOffset: 0.4 },
          { code: "KMC-CH02", name: "Chetla Lock Station", xRatio: 0.52, phaseOffset: 2.3 },
          { code: "KMC-BG04", name: "Circular Siphon Gate", xRatio: 0.82, phaseOffset: 4.5 },
        ];

        buoyStations.forEach((buoy) => {
          const bx = width * buoy.xRatio;
          const waveVal = Math.sin(bx * 0.006 + time * 1.35) * 14 + Math.cos(bx * 0.014 + time * 0.7) * 7;
          const by = baseLine3 + waveVal;

          // Tether plumb line down to bottom
          ctx.beginPath();
          ctx.moveTo(bx, by);
          ctx.lineTo(bx, height);
          ctx.strokeStyle = "rgba(32, 197, 216, 0.12)";
          ctx.lineWidth = 1;
          ctx.setLineDash([3, 4]);
          ctx.stroke();
          ctx.setLineDash([]);

          // Outer pulsing signal ring
          const ringRadius = 5 + (Math.sin(time * 3 + buoy.phaseOffset) + 1) * 3;
          ctx.beginPath();
          ctx.arc(bx, by, ringRadius, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(32, 197, 216, 0.35)";
          ctx.lineWidth = 1;
          ctx.stroke();

          // Buoy core diamond
          ctx.save();
          ctx.translate(bx, by);
          ctx.rotate(Math.PI / 4);
          ctx.fillStyle = "#20C5D8";
          ctx.shadowColor = "#20C5D8";
          ctx.shadowBlur = 10;
          ctx.fillRect(-3, -3, 6, 6);
          ctx.restore();

          // Buoy text label
          ctx.font = "9px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
          ctx.fillStyle = "rgba(168, 197, 201, 0.65)";
          ctx.textAlign = "center";
          ctx.fillText(`▲ ${buoy.code}`, bx, by - 12);
        });

        // --- 6. Interactive Cursor Bioluminescent Aura ---
        if (m.active && m.x > 0 && m.x < width && m.y > 0 && m.y < height) {
          const cursorGrad = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, 140);
          cursorGrad.addColorStop(0, "rgba(32, 197, 216, 0.18)");
          cursorGrad.addColorStop(0.5, "rgba(56, 189, 248, 0.07)");
          cursorGrad.addColorStop(1, "rgba(32, 197, 216, 0)");

          ctx.beginPath();
          ctx.arc(m.x, m.y, 140, 0, Math.PI * 2);
          ctx.fillStyle = cursorGrad;
          ctx.fill();
        }
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      ro.disconnect();
      io.disconnect();
      if (interactive && canvas.parentElement) {
        canvas.parentElement.removeEventListener("mousemove", handleMouseMove);
        canvas.parentElement.removeEventListener("mouseleave", handleMouseLeave);
      }
    };
  }, [speed, interactive]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      style={{ display: "block" }}
    />
  );
}
