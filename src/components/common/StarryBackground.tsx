import { useEffect, useRef } from 'react';

export function StarryBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const maxRadius = Math.max(canvas.width, canvas.height) * 0.82;
    const stars = Array.from({ length: 260 }, () => {
      const depth = Math.random();

      return {
        angle: Math.random() * Math.PI * 2,
        radius: Math.random() * maxRadius,
        size: 0.5 + depth * 1.8,
        opacity: 0.3 + Math.random() * 0.7,
        baseOpacity: 0.2 + depth * 0.6,
      };
    });

    let frame = 0;
    let animationId = 0;

    const draw = () => {
      frame += 1;
      context.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const rotation = frame * 0.00075;

      for (const star of stars) {
        const x = centerX + Math.cos(star.angle + rotation) * star.radius;
        const y = centerY + Math.sin(star.angle + rotation) * star.radius;
        const flicker = 0.75 + Math.sin(frame * 0.015 + star.angle * 3) * 0.25;

        context.beginPath();
        context.arc(x, y, star.size, 0, Math.PI * 2);
        context.fillStyle = `rgba(255, 255, 255, ${star.opacity * star.baseOpacity * flicker})`;
        context.fill();
      }

      animationId = window.requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.cancelAnimationFrame(animationId);
    };
  }, []);

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-0" />;
}
