"use client";

import { useEffect, useRef } from "react";

type Particle = {
  text: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  size: number;
  opacity: number;
  color: string;
};

type QuietArea = { left: number; top: number; right: number; bottom: number };

const MAX_PARTICLES = 160;
const COLORS = ["#f5f7fa", "#e2e8f0", "#edf2f7", "#b7e5ec", "#a2d5c5"];

/** Decorative random numerals only. No market data, scores, or research inputs. */
export default function NumericHeroParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const surface = canvasRef.current;
    const drawingContext = surface?.getContext("2d");
    if (!surface || !drawingContext) return;

    const canvas = surface;
    const context = drawingContext;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mouse = window.matchMedia("(hover: hover) and (pointer: fine)");
    const desktop = window.matchMedia("(min-width: 768px)");
    const particles: Particle[] = [];
    let quietAreas: QuietArea[] = [];
    let enabled = false;
    let quietAreasDirty = true;
    let disposed = false;
    let frame = 0;
    let previousFrame = 0;
    let width = 0;
    let height = 0;
    let scale = 1;
    let credit = 0;
    let previousPointer: { x: number; y: number; at: number } | null = null;

    function stop() {
      if (frame) window.cancelAnimationFrame(frame);
      frame = 0;
      previousFrame = 0;
      previousPointer = null;
      credit = 0;
      particles.length = 0;
      context.clearRect(0, 0, width, height);
    }

    function resize() {
      if (disposed) return;
      stop();
      enabled = !motion.matches && mouse.matches && desktop.matches;
      if (!enabled) {
        canvas.width = 0;
        canvas.height = 0;
        return;
      }

      const bounds = canvas.getBoundingClientRect();
      width = bounds.width;
      height = bounds.height;
      if (!width || !height) return;
      // Bound the backing store even on high-DPI / very wide displays.
      scale = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(2_000_000 / (width * height)));
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      context.setTransform(scale, 0, 0, scale, 0, 0);
      context.textAlign = "center";
      context.textBaseline = "middle";
      quietAreasDirty = true;
    }

    function updateQuietAreas() {
      quietAreasDirty = false;
      quietAreas = [];
      // Measure visible text lines, rather than blank space inside whole cards.
      for (const element of document.querySelectorAll("h1, h2, h3, h4, p, a, button, input, textarea, select, nav")) {
        const bounds = element.getBoundingClientRect();
        if (bounds.bottom < 0 || bounds.top > height) continue;
        const range = document.createRange();
        range.selectNodeContents(element);
        const rects = element.matches("button, input, textarea, select, nav") ? element.getClientRects() : range.getClientRects();
        for (const rect of rects) {
          if (rect.bottom < 0 || rect.top > height) continue;
          quietAreas.push({ left: rect.left - 4, top: rect.top - 4, right: rect.right + 4, bottom: rect.bottom + 4 });
        }
      }
    }

    function draw(now: number) {
      frame = 0;
      if (!enabled || document.hidden) {
        stop();
        return;
      }
      const delta = previousFrame ? Math.min((now - previousFrame) / 1000, 0.05) : 0;
      previousFrame = now;
      if (quietAreasDirty) updateQuietAreas();
      context.clearRect(0, 0, width, height);
      let retained = 0;

      for (const particle of particles) {
        particle.age += delta;
        if (particle.age >= particle.life) continue;
        particle.vx *= Math.exp(-3.1 * delta);
        particle.vy *= Math.exp(-3.1 * delta);
        particle.x += particle.vx * delta;
        particle.y += (particle.vy - 7) * delta;
        particles[retained++] = particle;

        const progress = particle.age / particle.life;
        const size = Math.max(10, particle.size * (1 - progress * 0.15));
        const halfWidth = particle.text.length * size * 0.32;
        // Leave headings, copy, and controls clear, including during a burst.
        if (quietAreas.some(area =>
          particle.x + halfWidth > area.left && particle.x - halfWidth < area.right &&
          particle.y + size / 2 > area.top && particle.y - size / 2 < area.bottom,
        )) continue;

        context.globalAlpha = particle.opacity * Math.pow(1 - progress, 1.5);
        context.fillStyle = particle.color;
        context.font = `400 ${size.toFixed(2)}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
        context.fillText(particle.text, particle.x, particle.y);
      }
      particles.length = retained;
      context.globalAlpha = 1;
      if (particles.length) frame = window.requestAnimationFrame(draw);
      else previousFrame = 0;
    }

    function wake() {
      if (!frame && particles.length) frame = window.requestAnimationFrame(draw);
    }

    function add(x: number, y: number, vx: number, vy: number, burst: boolean) {
      const accent = Math.random();
      particles.push({
        text: Math.random() < 0.24 ? String(Math.floor(Math.random() * 10)) : (Math.random() * 9).toFixed(2),
        x,
        y,
        vx,
        vy,
        age: 0,
        life: burst ? 0.9 + Math.random() * 0.45 : 0.75 + Math.random() * 0.5,
        size: burst ? 12 + Math.random() * 2 : 11 + Math.random() * 2,
        opacity: burst ? 0.88 + Math.random() * 0.07 : 0.82 + Math.random() * 0.1,
        color: COLORS[accent > 0.985 ? 4 : accent > 0.88 ? 3 : Math.floor(accent * 3)],
      });
    }

    function constrainAndWake() {
      if (particles.length > MAX_PARTICLES) particles.splice(0, particles.length - MAX_PARTICLES);
      wake();
    }

    function point(event: PointerEvent) {
      if (!enabled || document.hidden || event.pointerType !== "mouse" || !event.isPrimary) return null;
      // The fixed overlay shares pointer-event viewport coordinates at every scroll position.
      const x = event.clientX;
      const y = event.clientY;
      return x >= 0 && x <= width && y >= 0 && y <= height ? { x, y } : null;
    }

    function move(event: PointerEvent) {
      const current = point(event);
      if (!current) return;
      const now = performance.now();
      const previous = previousPointer;
      previousPointer = { ...current, at: now };
      if (!previous) {
        add(current.x, current.y, (Math.random() - 0.5) * 20, -10, false);
        constrainAndWake();
        return;
      }

      const dx = current.x - previous.x;
      const dy = current.y - previous.y;
      const distance = Math.hypot(dx, dy);
      if (distance < 0.5) return; // Stationary pointer events never emit.
      const seconds = Math.max((now - previous.at) / 1000, 0.008);
      const speed = Math.min(distance / seconds, 1400);
      credit += Math.min(seconds, 0.05) * (22 + Math.min(speed / 900, 1) * 58);
      const count = Math.min(4, Math.floor(credit));
      credit -= count;
      for (let i = 0; i < count; i++) {
        const along = (i + 1) / (count + 1);
        add(
          previous.x + dx * along + (Math.random() - 0.5) * 8,
          previous.y + dy * along + (Math.random() - 0.5) * 8,
          (Math.random() - 0.5) * (18 + speed * 0.025),
          -10 + (Math.random() - 0.5) * (18 + speed * 0.025),
          false,
        );
      }
      constrainAndWake();
    }

    function burst(event: PointerEvent) {
      const current = point(event);
      if (!current || event.button !== 0) return;
      if (event.target instanceof Element && event.target.closest("a, button, input, textarea, select, [contenteditable]")) return;
      for (let i = 0; i < 20; i++) {
        const angle = i * Math.PI * 2 / 20 + (Math.random() - 0.5) * 0.08;
        const velocity = 140 + Math.random() * 100;
        const offset = 3 + Math.random() * 5;
        add(current.x + Math.cos(angle) * offset, current.y + Math.sin(angle) * offset, Math.cos(angle) * velocity, Math.sin(angle) * velocity, true);
      }
      constrainAndWake();
    }

    function leave() {
      previousPointer = null;
      credit = 0;
    }

    function visibility() {
      if (document.hidden) stop();
    }

    function scroll() {
      quietAreasDirty = true;
    }

    const sizing = new ResizeObserver(resize);
    sizing.observe(document.body);
    resize();
    document.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerdown", burst, { passive: true });
    document.addEventListener("pointerleave", leave, { passive: true });
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("scroll", scroll, { passive: true });
    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("blur", stop);
    for (const query of [motion, mouse, desktop]) query.addEventListener("change", resize);

    return () => {
      disposed = true;
      stop();
      sizing.disconnect();
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerdown", burst);
      document.removeEventListener("pointerleave", leave);
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("scroll", scroll);
      window.removeEventListener("resize", resize);
      window.removeEventListener("blur", stop);
      for (const query of [motion, mouse, desktop]) query.removeEventListener("change", resize);
      canvas.width = 0;
      canvas.height = 0;
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      data-home-numeric-particles
      aria-hidden="true"
      width={0}
      height={0}
      className="pointer-events-none fixed inset-0 z-40 h-full w-full"
    />
  );
}
