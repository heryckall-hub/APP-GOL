import React, { useEffect, useRef } from 'react';

interface CyberMapCanvasProps {
  routeActive: boolean;
  speedKmh: number;
  gear: '1' | '2' | '3' | '4' | '5';
  destinationName: string;
}

interface BuildingBlock {
  x: number;
  y: number;
  w: number;
  h: number;
  highlight?: boolean;
}

const CITY_BLOCKS: BuildingBlock[] = [
  { x: -720, y: -520, w: 180, h: 130 },
  { x: -490, y: -520, w: 220, h: 130 },
  { x: -220, y: -520, w: 170, h: 130 },
  { x: 0, y: -520, w: 210, h: 130 },
  { x: 260, y: -520, w: 190, h: 130, highlight: true },
  { x: 500, y: -520, w: 230, h: 130 },

  { x: -720, y: -340, w: 180, h: 160 },
  { x: -490, y: -340, w: 110, h: 160 },
  { x: -340, y: -340, w: 170, h: 160 },
  { x: -120, y: -340, w: 160, h: 160, highlight: true },
  { x: 90, y: -340, w: 130, h: 160 },
  { x: 270, y: -340, w: 210, h: 160 },
  { x: 530, y: -340, w: 200, h: 160 },

  { x: -720, y: -130, w: 140, h: 140 },
  { x: -530, y: -130, w: 180, h: 140 },
  { x: -300, y: -130, w: 160, h: 140 },
  { x: -90, y: -130, w: 180, h: 140 },
  { x: 140, y: -130, w: 160, h: 140 },
  { x: 350, y: -130, w: 170, h: 140, highlight: true },
  { x: 570, y: -130, w: 160, h: 140 },

  { x: -720, y: 60, w: 190, h: 150 },
  { x: -480, y: 60, w: 150, h: 150, highlight: true },
  { x: -280, y: 60, w: 190, h: 150 },
  { x: -40, y: 60, w: 140, h: 150 },
  { x: 150, y: 60, w: 200, h: 150 },
  { x: 400, y: 60, w: 160, h: 150 },
  { x: 610, y: 60, w: 140, h: 150 },

  { x: -720, y: 260, w: 160, h: 170 },
  { x: -510, y: 260, w: 210, h: 170 },
  { x: -250, y: 260, w: 160, h: 170 },
  { x: -40, y: 260, w: 190, h: 170 },
  { x: 200, y: 260, w: 170, h: 170 },
  { x: 420, y: 260, w: 220, h: 170 },
];

export const CyberMapCanvas: React.FC<CyberMapCanvasProps> = ({
  routeActive,
  speedKmh,
  gear,
  destinationName,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef({
    offset: 0,
    routeActive,
    speedKmh,
    gear,
    destinationName,
  });

  useEffect(() => {
    stateRef.current.routeActive = routeActive;
    stateRef.current.speedKmh = speedKmh;
    stateRef.current.gear = gear;
    stateRef.current.destinationName = destinationName;
  }, [routeActive, speedKmh, gear, destinationName]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    let lastTime = performance.now();

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = parent.clientWidth;
      const height = parent.clientHeight;
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize);

    const draw = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const { offset, routeActive: isRoute, speedKmh: spd, destinationName: dest } =
        stateRef.current;

      // Scroll map smoothly when speed > 0
      const direction = 1;
      const effectiveSpeed = spd;
      stateRef.current.offset = (offset + dt * effectiveSpeed * 0.55 * direction) % 240;

      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const cx = width * 0.54;
      const cy = height * 0.48;

      // 1. Absolute black obsidian background
      ctx.fillStyle = '#09090B';
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      ctx.translate(cx, cy);

      // Slight cyber tactical map tilt / perspective grid feel
      const tileShiftY = stateRef.current.offset;

      // 2. Street grid network (#1C1C21)
      ctx.strokeStyle = '#1C1C21';
      ctx.lineWidth = 10;
      const gridStepX = 180;
      const gridStepY = 240;

      for (let gx = -900; gx <= 900; gx += gridStepX) {
        ctx.beginPath();
        ctx.moveTo(gx, -800);
        ctx.lineTo(gx, 800);
        ctx.stroke();
      }

      for (let gy = -960; gy <= 960; gy += gridStepY) {
        const yPos = gy + tileShiftY;
        ctx.beginPath();
        ctx.moveTo(-1000, yPos);
        ctx.lineTo(1000, yPos);
        ctx.stroke();
      }

      // Diagonal arterial highway
      ctx.strokeStyle = '#1C1C21';
      ctx.lineWidth = 16;
      ctx.beginPath();
      ctx.moveTo(-950, 520 + tileShiftY * 0.5);
      ctx.lineTo(950, -480 + tileShiftY * 0.5);
      ctx.stroke();

      // Secondary technical hairlines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      for (let gx = -900; gx <= 900; gx += 60) {
        ctx.beginPath();
        ctx.moveTo(gx, -800);
        ctx.lineTo(gx, 800);
        ctx.stroke();
      }

      // 3. Urban blocks (#0D0D10) with crisp thin outlines
      for (const b of CITY_BLOCKS) {
        const by = b.y + tileShiftY;
        ctx.fillStyle = '#0D0D10';
        ctx.fillRect(b.x, by, b.w, b.h);
        ctx.strokeStyle = b.highlight ? 'rgba(0, 180, 216, 0.28)' : '#19191F';
        ctx.lineWidth = 1;
        ctx.strokeRect(b.x, by, b.w, b.h);
      }

      // 4. Radar range rings centered on vehicle
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.045)';
      ctx.lineWidth = 1;
      [130, 260, 410].forEach((r) => {
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();
      });

      // 5. Active Glowing Route Line (#FFFFFF + Degradê Azul Havaí)
      if (isRoute) {
        const routePts: [number, number][] = [
          [0, 260],
          [0, 0],
          [0, -140],
          [180, -140],
          [180, -320],
          [410, -420],
        ];

        const routeGrad = ctx.createLinearGradient(0, 260, 410, -420);
        routeGrad.addColorStop(0, '#0077B6');
        routeGrad.addColorStop(0.5, '#00B4D8');
        routeGrad.addColorStop(1, '#00E5FF');

        // Outer Hawaiian Blue neon glow
        ctx.save();
        ctx.lineCap = 'square';
        ctx.lineJoin = 'miter';
        ctx.shadowColor = '#00D4FF';
        ctx.shadowBlur = 18;
        ctx.strokeStyle = routeGrad;
        ctx.lineWidth = 7;
        ctx.beginPath();
        routePts.forEach(([px, py], i) => {
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.stroke();

        // Crisp pure white core line
        ctx.shadowBlur = 6;
        ctx.shadowColor = '#FFFFFF';
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        routePts.forEach(([px, py], i) => {
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.stroke();
        ctx.restore();

        // Next turn node marker
        ctx.fillStyle = '#00B4D8';
        ctx.fillRect(-5, -145, 10, 10);
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-5, -145, 10, 10);

        // Destination diamond marker
        const [dx, dy] = routePts[routePts.length - 1];
        ctx.save();
        ctx.translate(dx, dy);
        ctx.rotate(Math.PI / 4);
        ctx.fillStyle = '#00E5FF';
        ctx.fillRect(-8, -8, 16, 16);
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.strokeRect(-8, -8, 16, 16);
        ctx.restore();

        // Destination tactical tag
        ctx.font = '600 11px "JetBrains Mono", monospace';
        const label = dest.toUpperCase();
        const textW = ctx.measureText(label).width;
        ctx.fillStyle = 'rgba(20, 20, 23, 0.92)';
        ctx.fillRect(dx - textW - 26, dy - 32, textW + 16, 22);
        ctx.strokeStyle = '#00B4D8';
        ctx.lineWidth = 1;
        ctx.strokeRect(dx - textW - 26, dy - 32, textW + 16, 22);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(label, dx - textW - 18, dy - 17);
      }

      // 6. Central Triangular Cursor
      ctx.save();

      // Forward sensor cone
      const coneGrad = ctx.createLinearGradient(0, -14, 0, -120);
      coneGrad.addColorStop(0, 'rgba(0, 212, 255, 0.25)');
      coneGrad.addColorStop(1, 'rgba(0, 119, 182, 0)');
      ctx.fillStyle = coneGrad;
      ctx.beginPath();
      ctx.moveTo(0, -16);
      ctx.lineTo(-42, -120);
      ctx.lineTo(42, -120);
      ctx.closePath();
      ctx.fill();

      // Triangular Cyber cursor outer glow
      ctx.shadowColor = '#00D4FF';
      ctx.shadowBlur = 14;
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.moveTo(0, -20);
      ctx.lineTo(14, 14);
      ctx.lineTo(0, 7);
      ctx.lineTo(-14, 14);
      ctx.closePath();
      ctx.fill();

      // Crisp inner Hawaiian Blue spine
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#00B4D8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -15);
      ctx.lineTo(0, 7);
      ctx.stroke();

      ctx.restore();
      ctx.restore();

      // 7. Street & Sector HUD Labels on the Map
      ctx.font = '500 10px "JetBrains Mono", monospace';
      ctx.fillStyle = '#8E8E93';
      ctx.fillText('AV. FARIA LIMA // SETOR 04', width * 0.56 + 18, height * 0.31);
      ctx.fillText('MARGINAL SUL // EIXO 12', width * 0.24, height * 0.62);

      // Vignette gradient at edges so HUD stays ultra-legible
      const edgeGrad = ctx.createRadialGradient(cx, cy, Math.min(width, height) * 0.22, cx, cy, Math.max(width, height) * 0.72);
      edgeGrad.addColorStop(0, 'rgba(9, 9, 11, 0)');
      edgeGrad.addColorStop(1, 'rgba(9, 9, 11, 0.85)');
      ctx.fillStyle = edgeGrad;
      ctx.fillRect(0, 0, width, height);

      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="relative w-full h-full bg-[#09090B]">
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
};
