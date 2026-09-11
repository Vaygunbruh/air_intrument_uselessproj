export type BurstParticle = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  radius: number;
  color: string;
};

export type FallingNoteParticle = {
  id: number;
  x: number;
  y: number;
  vy: number;
  vx: number;
  alpha: number;
  color: string;
  size: number;
  symbol: string;
};

export type TrailPoint = {
  id: number;
  x: number;
  y: number;
  life: number;
  color: string;
  handId?: string;
};

export const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],       // Thumb
  [0, 5], [5, 6], [6, 7], [7, 8],       // Index
  [5, 9], [9, 10], [10, 11], [11, 12],   // Middle
  [9, 13], [13, 14], [14, 15], [15, 16], // Ring
  [13, 17], [0, 17], [17, 18], [18, 19], [19, 20], // Pinky & Palm
] as const;

export const FINGER_TIPS = [4, 8, 12, 16, 20] as const;

export const PALM_INDICES = [0, 1, 5, 9, 13, 17];

class VisualEffectsEngine {
  private particles: BurstParticle[] = [];
  private fallingNotes: FallingNoteParticle[] = [];
  private trails: TrailPoint[] = [];

  public addBurst(x: number, y: number, color: string, count: number = 22) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 9;
      this.particles.push({
        id: Date.now() + Math.random(),
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        life: 1.0,
        maxLife: 1.0,
        radius: 2.5 + Math.random() * 4,
        color,
      });
    }

    // Add falling note sparks
    const symbols = ['♪', '♫', '♬', '✦', '•'];
    for (let i = 0; i < 4; i++) {
      this.fallingNotes.push({
        id: Date.now() + Math.random(),
        x: x + (Math.random() - 0.5) * 30,
        y: y + (Math.random() - 0.5) * 10,
        vy: 1.5 + Math.random() * 3,
        vx: (Math.random() - 0.5) * 1.5,
        alpha: 1.0,
        color,
        size: 14 + Math.random() * 12,
        symbol: symbols[Math.floor(Math.random() * symbols.length)],
      });
    }
  }

  public addTrailPoint(x: number, y: number, color: string, handId?: string) {
    this.trails.push({
      id: Date.now() + Math.random(),
      x,
      y,
      life: 1.0,
      color,
      handId,
    });

    if (this.trails.length > 180) {
      this.trails.shift();
    }
  }

  public clear() {
    this.particles = [];
    this.fallingNotes = [];
    this.trails = [];
  }

  public updateAndRender(ctx: CanvasRenderingContext2D, width: number, height: number) {
    // 1. Render & update fingertip trails
    this.trails = this.trails.filter((t) => t.life > 0.02);
    this.trails.forEach((t) => {
      t.life -= 0.04;
    });

    if (this.trails.length > 1) {
      ctx.save();
      for (let i = 1; i < this.trails.length; i++) {
        const p1 = this.trails[i - 1];
        const p2 = this.trails[i];

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = p2.color;
        ctx.lineWidth = Math.max(1, 4 * p2.life);
        ctx.globalAlpha = Math.max(0, p2.life * 0.7);
        ctx.shadowBlur = 8;
        ctx.shadowColor = p2.color;
        ctx.stroke();
      }
      ctx.restore();
    }

    // 2. Render & update particle bursts
    this.particles = this.particles.filter((p) => p.life > 0.02);
    ctx.save();
    this.particles.forEach((p) => {
      p.life -= 0.035;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15; // Gravity

      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0.5, p.radius * p.life), 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.shadowBlur = 10;
      ctx.shadowColor = p.color;
      ctx.fill();
    });
    ctx.restore();

    // 3. Render & update falling musical note sparks
    this.fallingNotes = this.fallingNotes.filter((n) => n.alpha > 0.02 && n.y < height);
    ctx.save();
    ctx.font = 'bold 16px Inter, sans-serif';
    this.fallingNotes.forEach((n) => {
      n.alpha -= 0.025;
      n.y += n.vy;
      n.x += n.vx;

      ctx.fillStyle = n.color;
      ctx.globalAlpha = Math.max(0, n.alpha);
      ctx.shadowBlur = 12;
      ctx.shadowColor = n.color;
      ctx.fillText(n.symbol, n.x, n.y);
    });
    ctx.restore();
  }

  public drawHandSkeleton(
    ctx: CanvasRenderingContext2D,
    landmarks: Array<{ x: number; y: number }>,
    handedness: 'Left' | 'Right',
    width: number,
    height: number,
    activeTips: Set<number>
  ) {
    ctx.save();

    const isLeft = handedness === 'Left';
    const primaryColor = isLeft ? '#00f3ff' : '#ff007f'; // Cyan vs Pink
    const secondaryColor = isLeft ? '#80f7ff' : '#ff80bf';
    const nodeColor = isLeft ? '#ffffff' : '#fff0f7';

    // 1. Calculate Palm Center and Draw Soft Reactive Palm Aura
    let palmX = 0;
    let palmY = 0;
    PALM_INDICES.forEach((idx) => {
      palmX += landmarks[idx].x * width;
      palmY += landmarks[idx].y * height;
    });
    palmX /= PALM_INDICES.length;
    palmY /= PALM_INDICES.length;

    const auraGradient = ctx.createRadialGradient(palmX, palmY, 10, palmX, palmY, 95);
    auraGradient.addColorStop(0, isLeft ? 'rgba(0, 243, 255, 0.25)' : 'rgba(255, 0, 127, 0.25)');
    auraGradient.addColorStop(0.6, isLeft ? 'rgba(0, 243, 255, 0.08)' : 'rgba(255, 0, 127, 0.08)');
    auraGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.beginPath();
    ctx.arc(palmX, palmY, 95, 0, Math.PI * 2);
    ctx.fillStyle = auraGradient;
    ctx.fill();

    // 2. Draw Skeleton Laser Connections
    HAND_CONNECTIONS.forEach(([start, end]) => {
      const p1 = landmarks[start];
      const p2 = landmarks[end];

      const x1 = p1.x * width;
      const y1 = p1.y * height;
      const x2 = p2.x * width;
      const y2 = p2.y * height;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);

      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 3.5;
      ctx.shadowBlur = 12;
      ctx.shadowColor = primaryColor;
      ctx.stroke();

      // Inner bright stroke
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.2;
      ctx.shadowBlur = 0;
      ctx.stroke();
    });

    // 3. Draw Joint Nodes & Fingertip Glows
    landmarks.forEach((pt, idx) => {
      const x = pt.x * width;
      const y = pt.y * height;
      const isTip = FINGER_TIPS.includes(idx as typeof FINGER_TIPS[number]);
      const isActiveTip = isTip && activeTips.has(idx);

      ctx.beginPath();
      if (isActiveTip) {
        // Active key hit tip flare
        const activeRadius = 13;
        ctx.arc(x, y, activeRadius, 0, Math.PI * 2);
        ctx.fillStyle = nodeColor;
        ctx.shadowBlur = 24;
        ctx.shadowColor = primaryColor;
        ctx.fill();

        // Pulsing ring
        ctx.beginPath();
        ctx.arc(x, y, activeRadius + 6, 0, Math.PI * 2);
        ctx.strokeStyle = primaryColor;
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (isTip) {
        // Fingertip glow
        ctx.arc(x, y, 7, 0, Math.PI * 2);
        ctx.fillStyle = secondaryColor;
        ctx.shadowBlur = 14;
        ctx.shadowColor = primaryColor;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      } else {
        // Regular joint node
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = primaryColor;
        ctx.shadowBlur = 8;
        ctx.shadowColor = primaryColor;
        ctx.fill();
      }
    });

    // 4. Draw Hand Label Badge near Wrist
    const wristX = landmarks[0].x * width;
    const wristY = landmarks[0].y * height + 28;

    ctx.font = '600 12px Inter, system-ui, sans-serif';
    ctx.fillStyle = primaryColor;
    ctx.shadowBlur = 8;
    ctx.shadowColor = primaryColor;
    ctx.textAlign = 'center';
    ctx.fillText(`${handedness.toUpperCase()} HAND`, wristX, wristY);

    ctx.restore();
  }
}

export const visualEffectsEngine = new VisualEffectsEngine();
