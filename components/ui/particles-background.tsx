'use client';

import React, { useEffect, useRef } from 'react';

export function ParticlesBackground() {
  const bgRef = useRef<HTMLDivElement>(null);
  const fgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const particleground = (container: HTMLElement, opts: {
      dotColor: string;
      lineColor: string;
      minSpeedX: number;
      maxSpeedX: number;
      minSpeedY: number;
      maxSpeedY: number;
      density: number;
      curvedLines: boolean;
      proximity: number;
      parallaxMultiplier: number;
      particleRadius: number;
      lineWidth?: number;
    }) => {
      const canvas = document.createElement('canvas');
      canvas.className = 'pg-canvas';
      canvas.style.display = 'block';
      canvas.style.position = 'absolute';
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      container.insertBefore(canvas, container.firstChild);
      const ctx = canvas.getContext('2d');
      if (!ctx) return { destroy: () => { } };
      const resize = () => {
        canvas.width = container.offsetWidth;
        canvas.height = container.offsetHeight;
        ctx.fillStyle = opts.dotColor;
        ctx.strokeStyle = opts.lineColor;
        ctx.lineWidth = opts.lineWidth ?? 1;
      };
      resize();
      let running = true;
      const particles: Array<{
        stackPos: number;
        active: boolean;
        layer: number;
        parallaxOffsetX: number;
        parallaxOffsetY: number;
        position: { x: number; y: number };
        speed: { x: number; y: number };
      }> = [];
      const count = Math.round(canvas.width * canvas.height / opts.density);
      for (let i = 0; i < count; i++) {
        const p = {
          stackPos: i,
          active: true,
          layer: Math.ceil(3 * Math.random()),
          parallaxOffsetX: 0,
          parallaxOffsetY: 0,
          position: { x: Math.ceil(Math.random() * canvas.width), y: Math.ceil(Math.random() * canvas.height) },
          speed: { x: 0, y: 0 },
        };
        p.speed.x = (Math.random() * (opts.maxSpeedX - opts.minSpeedX) + opts.minSpeedX) * (Math.random() < 0.5 ? -1 : 1);
        p.speed.y = (Math.random() * (opts.maxSpeedY - opts.minSpeedY) + opts.minSpeedY) * (Math.random() < 0.5 ? -1 : 1);
        particles.push(p);
      }
      let mouseX = 0, mouseY = 0;
      const onMouseMove = (e: MouseEvent) => {
        const rect = container.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
        const rx = mouseX / rect.width - 0.5;
        const ry = mouseY / rect.height - 0.5;
        for (const p of particles) {
          const mult = p.layer !== 1 ? 0.5 * opts.parallaxMultiplier : opts.parallaxMultiplier;
          p.parallaxOffsetX = rx * mult;
          p.parallaxOffsetY = ry * mult;
        }
      };
      const step = () => {
        if (!running || !ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = opts.lineColor;
        ctx.lineWidth = opts.lineWidth ?? 1;
        for (const p of particles) {
          p.position.x += p.speed.x;
          p.position.y += p.speed.y;
          if (p.position.x + p.parallaxOffsetX > canvas.width) p.position.x = 0;
          else if (p.position.x + p.parallaxOffsetX < 0) p.position.x = canvas.width;
          if (p.position.y + p.parallaxOffsetY > canvas.height) p.position.y = 0;
          else if (p.position.y + p.parallaxOffsetY < 0) p.position.y = canvas.height;
          ctx.beginPath();
          ctx.arc(p.position.x + p.parallaxOffsetX, p.position.y + p.parallaxOffsetY, opts.particleRadius, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.beginPath();
        for (let i = 0; i < particles.length; i++) {
          const a = particles[i];
          const ax = a.position.x + a.parallaxOffsetX;
          const ay = a.position.y + a.parallaxOffsetY;
          for (let j = i + 1; j < particles.length; j++) {
            const b = particles[j];
            const bx = b.position.x + b.parallaxOffsetX;
            const by = b.position.y + b.parallaxOffsetY;
            const dx = ax - bx;
            const dy = ay - by;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < opts.proximity) {
              ctx.moveTo(ax, ay);
              ctx.lineTo(bx, by);
            }
          }
        }
        ctx.stroke();
        requestAnimationFrame(step);
      };
      window.addEventListener('resize', resize);
      container.addEventListener('mousemove', onMouseMove);
      requestAnimationFrame(step);
      return {
        destroy: () => {
          running = false;
          window.removeEventListener('resize', resize);
          container.removeEventListener('mousemove', onMouseMove);
          canvas.remove();
        }
      };
    };

    if (!bgRef.current || !fgRef.current) return;

    const instFg = particleground(fgRef.current, {
      dotColor: 'rgba(255, 255, 255, 0.85)',
      lineColor: 'rgba(255, 255, 255, 0.22)',
      minSpeedX: 0.3,
      maxSpeedX: 0.6,
      minSpeedY: 0.3,
      maxSpeedY: 0.6,
      density: 50000,
      curvedLines: false,
      proximity: 160,
      parallaxMultiplier: 10,
      particleRadius: 3,
      lineWidth: 1.6,
    });
    const instBg = particleground(bgRef.current, {
      dotColor: 'rgba(255, 255, 255, 0.45)',
      lineColor: 'rgba(255, 255, 255, 0.12)',
      minSpeedX: 0.075,
      maxSpeedX: 0.15,
      minSpeedY: 0.075,
      maxSpeedY: 0.15,
      density: 30000,
      curvedLines: false,
      proximity: 90,
      parallaxMultiplier: 20,
      particleRadius: 2,
      lineWidth: 1.2,
    });

    return () => {
      instFg.destroy();
      instBg.destroy();
    };
  }, []);

  return (
    <>
      <div
        ref={bgRef}
        className="absolute"
        style={{ left: '-51%', top: '-51%', width: '202%', height: '202%', transform: 'scale3d(0.5, 0.5, 1)' }}
      />
      <div
        ref={fgRef}
        className="absolute"
        style={{ left: '-51%', top: '-51%', width: '202%', height: '202%', transform: 'scale3d(0.5, 0.5, 1)' }}
      />
    </>
  );
}
