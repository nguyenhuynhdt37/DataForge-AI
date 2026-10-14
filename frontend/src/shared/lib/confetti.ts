/**
 * Native Canvas Fireworks & Confetti Celebration Engine (Zero-Dependency)
 * Tái tạo chính xác thuật toán pháo hoa đa tầng của StudyNest:
 * 1. Bắn trung tâm (Center burst)
 * 2. Pháo hoa góc trái 60 độ
 * 3. Pháo hoa góc phải 120 độ
 * 4. Chùm nổ 360 độ cực đại hoàn tất
 *
 * Hoạt động 100% trên HTML5 Canvas thuần, không phụ thuộc thư viện ngoài,
 * an toàn tuyệt đối với SSR Next.js 15 và tự động dọn dẹp bộ nhớ (Zero Memory Leak).
 */

const BRAND_COLORS = [
  '#2D5A34', // VinFast Deep Forest Green
  '#7FA086', // Soft Sage Green
  '#B7CDBB', // Light Sage Accent
  '#10B981', // Emerald Success
  '#059669', // Medium Forest Emerald
  '#E8F0EA', // Mint Soft Cream
  '#F59E0B', // Amber Gold Accent
];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  rotation: number;
  rotationSpeed: number;
  shape: 'rect' | 'circle';
}

class CanvasConfettiEngine {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private particles: Particle[] = [];
  private animationFrameId: number | null = null;
  private isRunning = false;

  private initCanvas(): boolean {
    if (typeof window === 'undefined') return false;

    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      this.canvas.style.position = 'fixed';
      this.canvas.style.top = '0';
      this.canvas.style.left = '0';
      this.canvas.style.width = '100vw';
      this.canvas.style.height = '100vh';
      this.canvas.style.pointerEvents = 'none';
      this.canvas.style.zIndex = '999999';
      document.body.appendChild(this.canvas);
    }

    this.ctx = this.canvas.getContext('2d');
    if (!this.ctx) return false;

    this.resize();
    return true;
  }

  private resize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth * window.devicePixelRatio;
    this.canvas.height = window.innerHeight * window.devicePixelRatio;
    if (this.ctx) {
      this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }
  }

  public burst(options: {
    originX?: number;
    originY?: number;
    count?: number;
    angle?: number;
    spread?: number;
    velocity?: number;
  } = {}) {
    if (!this.initCanvas()) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    const originX = (options.originX ?? 0.5) * width;
    const originY = (options.originY ?? 0.6) * height;
    const count = options.count ?? 80;
    const baseAngle = options.angle !== undefined ? (options.angle * Math.PI) / 180 : -Math.PI / 2;
    const spreadRad = ((options.spread ?? 70) * Math.PI) / 180;
    const baseVelocity = options.velocity ?? 14;

    for (let i = 0; i < count; i++) {
      // Góc ngẫu nhiên phân bố trong dải spread
      const angle = baseAngle + (Math.random() - 0.5) * spreadRad;
      const speed = baseVelocity * (0.6 + Math.random() * 0.8);
      const color = BRAND_COLORS[Math.floor(Math.random() * BRAND_COLORS.length)];

      this.particles.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 5 + Math.random() * 6,
        color,
        alpha: 1,
        decay: 0.008 + Math.random() * 0.012,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2,
        shape: Math.random() > 0.4 ? 'rect' : 'circle',
      });
    }

    if (!this.isRunning) {
      this.isRunning = true;
      this.loop();
    }
  }

  private loop = () => {
    if (!this.ctx || !this.canvas) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    this.ctx.clearRect(0, 0, width, height);

    // Cập nhật và vẽ từng hạt pháo hoa
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.35; // Trọng lực (Gravity)
      p.vx *= 0.98; // Ma sát không khí (Air friction)
      p.rotation += p.rotationSpeed;
      p.alpha -= p.decay;

      if (p.alpha <= 0 || p.y > height + 20) {
        this.particles.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, p.alpha);
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate(p.rotation);
      this.ctx.fillStyle = p.color;

      if (p.shape === 'rect') {
        this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.4);
      } else {
        this.ctx.beginPath();
        this.ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        this.ctx.fill();
      }

      this.ctx.restore();
    }

    if (this.particles.length > 0) {
      this.animationFrameId = requestAnimationFrame(this.loop);
    } else {
      this.isRunning = false;
      this.destroyCanvas();
    }
  };

  private destroyCanvas() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
      this.canvas = null;
      this.ctx = null;
    }
  }
}

// Singleton Engine Instance
const engine = new CanvasConfettiEngine();

/**
 * Kích hoạt chùm pháo hoa chào mừng nhiều tầng (Multi-burst Fireworks)
 * Chuẩn hiệu ứng từ StudyNest:
 * - Đợt 1 (0ms): Bắn bung tỏa từ trung tâm
 * - Đợt 2 (250ms): Bắn từ cánh trái 60°
 * - Đợt 3 (500ms): Bắn từ cánh phải 120°
 * - Đợt 4 (900ms): Nổ 360° cực đại
 */
export const triggerConfettiFireworks = () => {
  if (typeof window === 'undefined') return;

  // Đợt 1: Bắn từ giữa màn hình hướng lên
  engine.burst({
    originX: 0.5,
    originY: 0.6,
    count: 80,
    angle: 270, // Hướng lên trên
    spread: 75,
    velocity: 15,
  });

  // Đợt 2: Cánh trái bắn lên chếch sang phải
  setTimeout(() => {
    engine.burst({
      originX: 0.15,
      originY: 0.65,
      count: 50,
      angle: 305, // 60 độ so với phương ngang
      spread: 55,
      velocity: 16,
    });
  }, 250);

  // Đợt 3: Cánh phải bắn lên chếch sang trái
  setTimeout(() => {
    engine.burst({
      originX: 0.85,
      originY: 0.65,
      count: 50,
      angle: 235, // 120 độ
      spread: 55,
      velocity: 16,
    });
  }, 500);

  // Đợt 4: Nổ tung 360 độ cực đại ăn mừng
  setTimeout(() => {
    engine.burst({
      originX: 0.5,
      originY: 0.55,
      count: 110,
      angle: 270,
      spread: 360,
      velocity: 13,
    });
  }, 900);
};
