"use client";
// Full-viewport animated star background (decorative Canvas, aria-hidden).
import { useEffect, useRef } from "react";

export default function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const stars: { x: number; y: number; r: number; phase: number; speed: number }[] = [];

    const spawnStars = (w: number, h: number) => {
      stars.length = 0;
      for (let i = 0; i < 200; i++) {
        stars.push({
          x:     Math.random() * w,
          y:     Math.random() * h,
          r:     Math.random() * 1.5 + 0.3,
          phase: Math.random() * Math.PI * 2,
          speed: Math.random() * 0.02 + 0.005,
        });
      }
    };

    let dpr = 1;
    const resize = () => {
      // Render at devicePixelRatio so stars stay crisp on HiDPI screens
      dpr = window.devicePixelRatio || 1;
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width  = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width  = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      spawnStars(w, h); // reposition stars within new viewport bounds
    };
    resize();
    window.addEventListener("resize", resize);

    let animId: number;
    let t = 0;
    const draw = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      t += 0.016;
      stars.forEach((s) => {
        const alpha = 0.3 + 0.7 * ((Math.sin(t * s.speed * 60 + s.phase) + 1) / 2);
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.fill();
      });
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      role="presentation"
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.6 }}
    />
  );
}
