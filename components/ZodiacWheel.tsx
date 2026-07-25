"use client";
// Canvas zodiac wheel: 12 sign sectors, planet dots, and highlighted rings
// for Sun / Moon / Ascendant. Rendered at devicePixelRatio for HiDPI.
import { useEffect, useRef } from "react";
import type { AstroData } from "@/lib/astrology";
import { ZODIAC_SIGNS } from "@/lib/astrology";
import { useApp } from "@/contexts/app";

interface Props {
  astroData: AstroData;
}

export default function ZodiacWheel({ astroData }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { t } = useApp();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = 300;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + "px";
    canvas.style.height = size + "px";
    ctx.scale(dpr, dpr);
    const cx = size / 2;
    const cy = size / 2;
    const outerR = 130;
    const innerR = 90;
    const signR = 110;

    ctx.clearRect(0, 0, size, size);

    // Outer glow
    const gradient = ctx.createRadialGradient(cx, cy, innerR, cx, cy, outerR + 10);
    gradient.addColorStop(0, "rgba(168, 85, 247, 0.0)");
    gradient.addColorStop(0.7, "rgba(168, 85, 247, 0.05)");
    gradient.addColorStop(1, "rgba(168, 85, 247, 0.2)");
    ctx.beginPath();
    ctx.arc(cx, cy, outerR + 10, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    // Outer ring
    ctx.beginPath();
    ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(168, 85, 247, 0.5)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Inner ring
    ctx.beginPath();
    ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(168, 85, 247, 0.3)";
    ctx.lineWidth = 1;
    ctx.stroke();

    const signs = ZODIAC_SIGNS.map(z => z.symbol);
    const signColors = [
      "#ef4444", "#22c55e", "#eab308", "#3b82f6",
      "#f97316", "#84cc16", "#06b6d4", "#8b5cf6",
      "#ec4899", "#64748b", "#38bdf8", "#6366f1",
    ];

    // -90° offset throughout: canvas angle 0 points at 3 o'clock,
    // but 0° Bélier must sit at the top of the wheel
    signs.forEach((sign, i) => {
      const startAngle = (i * 30 - 90) * (Math.PI / 180);
      const endAngle = ((i + 1) * 30 - 90) * (Math.PI / 180);
      const midAngle = ((i * 30 + 15 - 90) * Math.PI) / 180;

      // Sector background
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, outerR, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = `${signColors[i]}08`;
      ctx.fill();

      // Sector border
      ctx.beginPath();
      ctx.moveTo(cx + innerR * Math.cos(startAngle), cy + innerR * Math.sin(startAngle));
      ctx.lineTo(cx + outerR * Math.cos(startAngle), cy + outerR * Math.sin(startAngle));
      ctx.strokeStyle = "rgba(168, 85, 247, 0.2)";
      ctx.lineWidth = 0.5;
      ctx.stroke();

      // Sign symbol
      const sx = cx + signR * Math.cos(midAngle);
      const sy = cy + signR * Math.sin(midAngle);
      ctx.font = "14px Arial";
      ctx.fillStyle = signColors[i];
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(sign, sx, sy);
    });

    // Plot planet positions
    astroData.planetPositions.forEach((pp) => {
      const angle = (pp.sign.start + pp.degree - 90) * (Math.PI / 180);
      const r = innerR - 15;
      const px = cx + r * Math.cos(angle);
      const py = cy + r * Math.sin(angle);

      ctx.beginPath();
      ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.fillStyle = pp.planet.color;
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.5)";
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Center decoration
    ctx.beginPath();
    ctx.arc(cx, cy, 20, 0, Math.PI * 2);
    const centerGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 20);
    centerGrad.addColorStop(0, "rgba(168, 85, 247, 0.8)");
    centerGrad.addColorStop(1, "rgba(168, 85, 247, 0.1)");
    ctx.fillStyle = centerGrad;
    ctx.fill();

    ctx.font = "16px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("✦", cx, cy);

    // Highlight Sun, Moon, Ascendant
    const highlights = [
      { name: "☀", sign: astroData.sunSign, degree: astroData.planetPositions[0]?.degree || 15, color: "#FFD700" },
      { name: "☽", sign: astroData.moonSign, degree: astroData.planetPositions[1]?.degree || 15, color: "#C0C0C0" },
      { name: "Asc", sign: astroData.ascendant, degree: 0, color: "#a855f7" },
    ];

    highlights.forEach((h) => {
      const angle = (h.sign.start + h.degree - 90) * (Math.PI / 180);
      const r = innerR + 5;
      const px = cx + r * Math.cos(angle);
      const py = cy + r * Math.sin(angle);

      ctx.beginPath();
      ctx.arc(px, py, 8, 0, Math.PI * 2);
      ctx.strokeStyle = h.color;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.font = "10px Arial";
      ctx.fillStyle = h.color;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(h.name === "Asc" ? "↑" : h.name, px, py);
    });
  }, [astroData]);

  return (
    <div className="flex flex-col items-center gap-3">
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={`Roue zodiacale — Soleil en ${astroData.sunSign.name}, Lune en ${astroData.moonSign.name}, Ascendant ${astroData.ascendant.name}`}
        className="animate-rotate-slow"
        style={{ maxWidth: "100%", borderRadius: "50%", boxShadow: "0 0 30px rgba(168, 85, 247, 0.3)" }}
      />
      <div className="flex gap-4 text-xs text-purple-300">
        <span>{t.wheel.sun}</span>
        <span>{t.wheel.moon}</span>
        <span>{t.wheel.ascendant}</span>
      </div>
    </div>
  );
}
