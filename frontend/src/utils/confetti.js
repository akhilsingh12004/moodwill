/**
 * Lightweight Canvas Confetti Generator for Moodwill.
 * No external dependencies.
 */
export function triggerConfetti() {
  let canvas = document.getElementById("mw-confetti-canvas");
  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.id = "mw-confetti-canvas";
    canvas.style.position = "fixed";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.width = "100vw";
    canvas.style.height = "100vh";
    canvas.style.pointerEvents = "none";
    canvas.style.zIndex = "9999";
    document.body.appendChild(canvas);
  }

  const ctx = canvas.getContext("2d");
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  const colors = [
    "#2dd4bf", // Teal
    "#fbbf24", // Amber
    "#fb7185", // Coral
    "#a78bfa", // Purple
    "#38bdf8", // Blue
    "#10b981", // Emerald
  ];

  const particles = [];
  
  // Left side burst
  for (let i = 0; i < 60; i++) {
    particles.push({
      x: 0,
      y: height * 0.8,
      vx: Math.random() * 15 + 5,
      vy: -Math.random() * 15 - 10,
      r: Math.random() * 6 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      angle: Math.random() * 360,
      spin: (Math.random() - 0.5) * 10,
      gravity: 0.45,
      alpha: 1,
    });
  }

  // Right side burst
  for (let i = 0; i < 60; i++) {
    particles.push({
      x: width,
      y: height * 0.8,
      vx: -Math.random() * 15 - 5,
      vy: -Math.random() * 15 - 10,
      r: Math.random() * 6 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      angle: Math.random() * 360,
      spin: (Math.random() - 0.5) * 10,
      gravity: 0.45,
      alpha: 1,
    });
  }

  let animationId;
  function animate() {
    ctx.clearRect(0, 0, width, height);

    let active = false;
    for (let p of particles) {
      if (p.alpha <= 0) continue;
      active = true;

      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.vx *= 0.985;
      p.vy *= 0.985;
      p.angle += p.spin;
      p.alpha -= 0.012; // slowly fade out

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.angle * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.alpha);
      
      // Draw rectangular confetti flakes
      ctx.fillRect(-p.r, -p.r, p.r * 1.8, p.r * 1.2);
      ctx.restore();
    }

    if (active) {
      animationId = requestAnimationFrame(animate);
    } else {
      ctx.clearRect(0, 0, width, height);
      if (canvas && canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
    }
  }

  animate();
}
