(() => {
  const canvases = Array.from(document.querySelectorAll(".auth-wave-canvas"));
  if (!canvases.length) return;

  canvases.forEach((canvas) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let imageData;
    let data;
    const buffer = document.createElement("canvas");
    const bufferCtx = buffer.getContext("2d");
    if (!bufferCtx) return;
    let rafId = 0;
    let scale = 2;
    let isRunning = true;

    const resizeCanvas = () => {
      const viewportWidth = Math.max(window.innerWidth || 0, 1);
      const viewportHeight = Math.max(window.innerHeight || 0, 1);
      const pixelCount = viewportWidth * viewportHeight;

      // Keep compute load bounded across devices for smoother frame pacing.
      if (pixelCount > 2000000) {
        scale = 3;
      } else if (pixelCount > 1100000) {
        scale = 2.5;
      } else {
        scale = 2;
      }

      // Render in CSS pixels intentionally to avoid high-DPR overdraw.
      canvas.width = viewportWidth;
      canvas.height = viewportHeight;
      canvas.style.width = `${viewportWidth}px`;
      canvas.style.height = `${viewportHeight}px`;

      width = Math.floor(canvas.width / scale);
      height = Math.floor(canvas.height / scale);
      buffer.width = width;
      buffer.height = height;
      imageData = bufferCtx.createImageData(width, height);
      data = imageData.data;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("orientationchange", resizeCanvas);

    const startTime = Date.now();

    const SIN_TABLE = new Float32Array(1024);
    const COS_TABLE = new Float32Array(1024);
    for (let i = 0; i < 1024; i += 1) {
      const angle = (i / 1024) * Math.PI * 2;
      SIN_TABLE[i] = Math.sin(angle);
      COS_TABLE[i] = Math.cos(angle);
    }

    const fastSin = (x) => {
      const index = Math.floor(((x % (Math.PI * 2)) / (Math.PI * 2)) * 1024) & 1023;
      return SIN_TABLE[index];
    };

    const fastCos = (x) => {
      const index = Math.floor(((x % (Math.PI * 2)) / (Math.PI * 2)) * 1024) & 1023;
      return COS_TABLE[index];
    };

    const render = () => {
      if (!isRunning) return;
      const time = (Date.now() - startTime) * 0.001;

      for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
          const u_x = (2 * x - width) / height;
          const u_y = (2 * y - height) / height;

          let a = 0;
          let d = 0;

          for (let i = 0; i < 4; i += 1) {
            a += fastCos(i - d + time * 0.5 - a * u_x);
            d += fastSin(i * u_y + a);
          }

          const wave = (fastSin(a) + fastCos(d)) * 0.5;
          // Keep the wave visible while avoiding over-saturation.
          const intensity = 0.48 + 0.44 * wave;
          const baseVal = 0.19 + 0.22 * fastCos(u_x + u_y + time * 0.3);
          const blueAccent = 0.24 * fastSin(a * 1.5 + time * 0.2);
          const purpleAccent = 0.2 * fastCos(d * 2 + time * 0.1);

          const r = Math.max(0, Math.min(1, baseVal + purpleAccent * 0.8)) * intensity;
          const g = Math.max(0, Math.min(1, baseVal + blueAccent * 0.6)) * intensity;
          const b = Math.max(0, Math.min(1, baseVal + blueAccent * 1.2 + purpleAccent * 0.4)) * intensity;

          const index = (y * width + x) * 4;
          data[index] = r * 255;
          data[index + 1] = g * 255;
          data[index + 2] = b * 255;
          data[index + 3] = 255;
        }
      }

      bufferCtx.putImageData(imageData, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(buffer, 0, 0, width, height, 0, 0, canvas.width, canvas.height);

      rafId = window.requestAnimationFrame(render);
    };

    render();

    const onVisibilityChange = () => {
      if (document.hidden) {
        isRunning = false;
        window.cancelAnimationFrame(rafId);
      } else if (!isRunning) {
        isRunning = true;
        render();
      }
    };

    const cleanup = () => {
      isRunning = false;
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("orientationchange", resizeCanvas);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("beforeunload", cleanup);
    window.addEventListener("pagehide", cleanup);
    canvas.addEventListener("DOMNodeRemoved", cleanup, { once: true });
  });
})();
