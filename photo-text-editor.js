/* KAGZI Photo Text Editor — local browser-only overlays and area cover */
(() => {
  const $ = (id) => document.getElementById(id);
  const preview = $("photoTextPreview");
  const sourceImage = $("photoPreview");
  const addButton = $("photoOverlayAdd");
  const clearTextButton = $("photoOverlayClear");
  const coverButton = $("photoCoverApply");
  const clearCoverButton = $("photoCoverClear");
  if (!preview || !sourceImage || !addButton) return;

  const state = { text: null, cover: null, clone: { sample: null, strokes: [] }, pickingSample: false, activeStroke: null, rendering: false };
  const originalBuildPhotoBlob = window.buildPhotoBlob;
  const status = (message) => {
    const el = $("photoTextStatus");
    if (el) el.textContent = message;
  };
  const clampPercent = (value) => Math.max(0, Math.min(100, Number(value) || 0));

  function readText() {
    const value = $("photoOverlayText").value.trim();
    if (!value) throw new Error("पहले फोटो पर लगाने के लिए टेक्स्ट लिखें।");
    const size = Number($("photoOverlaySize").value);
    if (!Number.isFinite(size) || size < 8 || size > 300) throw new Error("Text size 8 से 300 px के बीच रखें।");
    return {
      value,
      color: $("photoOverlayColor").value,
      size,
      x: clampPercent($("photoOverlayX").value),
      y: clampPercent($("photoOverlayY").value)
    };
  }

  function readCover() {
    const x = clampPercent($("photoCoverX").value);
    const y = clampPercent($("photoCoverY").value);
    const w = Math.max(1, Math.min(100, Number($("photoCoverW").value) || 1));
    const h = Math.max(1, Math.min(100, Number($("photoCoverH").value) || 1));
    if (x + w > 100 || y + h > 100) throw new Error("Cover area को फोटो की सीमा के अंदर रखें।");
    return { x, y, w, h, color: $("photoCoverColor").value };
  }

  function paint(canvas, ctx, width, height) {
    if (state.cover) {
      const c = state.cover;
      ctx.fillStyle = c.color;
      ctx.fillRect(width * c.x / 100, height * c.y / 100, width * c.w / 100, height * c.h / 100);
    }
    if (state.text) {
      const t = state.text;
      ctx.save();
      ctx.font = `700 ${Math.max(8, t.size)}px Arial, sans-serif`;
      ctx.textBaseline = "top";
      ctx.fillStyle = t.color;
      ctx.shadowColor = "rgba(0,0,0,.45)";
      ctx.shadowBlur = Math.max(1, t.size * .08);
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      ctx.fillText(t.value, width * t.x / 100, height * t.y / 100, Math.max(20, width * (1 - t.x / 100)));
      ctx.restore();
    }
  }

  function paintClone(ctx, image, width, height) {
    for (const stroke of state.clone.strokes) {
      const radius = stroke.radius;
      for (const point of stroke.points) {
        const sx = point.x + stroke.offsetX - radius;
        const sy = point.y + stroke.offsetY - radius;
        if (sx < 0 || sy < 0 || sx + radius * 2 > width || sy + radius * 2 > height) continue;
        ctx.save();
        ctx.beginPath();
        ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(image, sx, sy, radius * 2, radius * 2, point.x - radius, point.y - radius, radius * 2, radius * 2);
        ctx.restore();
      }
    }
  }

  async function applyEdits(blob, mime, quality) {
    if (!state.text && !state.cover && !state.clone.strokes.length) return blob;
    const url = URL.createObjectURL(blob);
    try {
      const image = new Image();
      image.src = url;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Photo canvas is not available in this browser.");
      ctx.drawImage(image, 0, 0);
      paintClone(ctx, image, canvas.width, canvas.height);
      paint(canvas, ctx, canvas.width, canvas.height);
      const result = await new Promise(resolve => canvas.toBlob(resolve, mime || "image/png", quality));
      canvas.width = canvas.height = 1;
      if (!result) throw new Error("Could not export the edited photo.");
      return result;
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  if (typeof originalBuildPhotoBlob === "function") {
    window.buildPhotoBlob = async (mime, quality) => {
      const base = await originalBuildPhotoBlob(mime, quality);
      return applyEdits(base, mime, quality);
    };
  }

  async function renderPreview() {
    if (state.rendering || !sourceImage.naturalWidth) return;
    state.rendering = true;
    try {
      const builder = window.buildPhotoBlob;
      if (typeof builder !== "function") return;
      const blob = await builder("image/png", 1);
      const url = URL.createObjectURL(blob);
      try {
        const image = new Image();
        image.src = url;
        await image.decode();
        preview.width = image.naturalWidth;
        preview.height = image.naturalHeight;
        const ctx = preview.getContext("2d");
        ctx.clearRect(0, 0, preview.width, preview.height);
        ctx.drawImage(image, 0, 0);
        preview.hidden = false;
        preview.style.touchAction = "none";
        preview.style.cursor = state.pickingSample || state.clone.sample ? "crosshair" : "default";
        sourceImage.style.display = "none";
      } finally {
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      status(error.message || "Preview update could not complete.");
    } finally {
      state.rendering = false;
    }
  }

  const cloneSampleButton = $("photoCloneSample");
  const cloneClearButton = $("photoCloneClear");
  if (cloneSampleButton) cloneSampleButton.addEventListener("click", () => {
    if (!preview.width || preview.hidden) { status("Choose a photo first."); return; }
    state.pickingSample = true;
    status("Tap a clean area of the photo to sample, then drag over the unwanted text.");
  });
  if (cloneClearButton) cloneClearButton.addEventListener("click", async () => {
    state.clone.sample = null;
    state.clone.strokes = [];
    state.activeStroke = null;
    status("Manual retouch strokes cleared.");
    await renderPreview();
  });

  function pointerPosition(event) {
    const rect = preview.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(preview.width, (event.clientX - rect.left) * preview.width / rect.width)),
      y: Math.max(0, Math.min(preview.height, (event.clientY - rect.top) * preview.height / rect.height))
    };
  }
  preview.addEventListener("pointerdown", event => {
    if (preview.hidden || !preview.width) return;
    const point = pointerPosition(event);
    if (state.pickingSample) {
      state.clone.sample = point;
      state.pickingSample = false;
      if (cloneSampleButton) cloneSampleButton.textContent = "Sample selected · choose another";
      status("Sample selected. Now drag over the text you want to retouch.");
      preview.style.cursor = "crosshair";
      return;
    }
    if (!state.clone.sample) return;
    event.preventDefault();
    preview.setPointerCapture(event.pointerId);
    const radius = Math.max(2, Math.min(80, Number($("photoCloneSize").value) / 2 || 14));
    state.activeStroke = {
      radius,
      offsetX: state.clone.sample.x - point.x,
      offsetY: state.clone.sample.y - point.y,
      points: [point]
    };
    state.clone.strokes.push(state.activeStroke);
  });
  preview.addEventListener("pointermove", event => {
    if (!state.activeStroke) return;
    const point = pointerPosition(event);
    const last = state.activeStroke.points[state.activeStroke.points.length - 1];
    if (Math.hypot(point.x - last.x, point.y - last.y) >= Math.max(1, state.activeStroke.radius * 0.25)) {
      state.activeStroke.points.push(point);
      const ctx = preview.getContext("2d");
      const r = state.activeStroke.radius;
      const sx = point.x + state.activeStroke.offsetX - r;
      const sy = point.y + state.activeStroke.offsetY - r;
      if (sx >= 0 && sy >= 0 && sx + r * 2 <= preview.width && sy + r * 2 <= preview.height) {
        ctx.save(); ctx.beginPath(); ctx.arc(point.x, point.y, r, 0, Math.PI * 2); ctx.clip();
        ctx.drawImage(preview, sx, sy, r * 2, r * 2, point.x - r, point.y - r, r * 2, r * 2);
        ctx.restore();
      }
    }
  });
  async function finishCloneStroke() {
    if (!state.activeStroke) return;
    state.activeStroke = null;
    status("Clone brush applied to preview. Export the photo to save the retouch.");
    await renderPreview();
  }
  preview.addEventListener("pointerup", finishCloneStroke);
  preview.addEventListener("pointercancel", finishCloneStroke);

  sourceImage.addEventListener("load", () => {
    const hasImage = !!sourceImage.naturalWidth;
    addButton.disabled = !hasImage;
    clearTextButton.disabled = !hasImage;
    coverButton.disabled = !hasImage;
    clearCoverButton.disabled = !hasImage;
    preview.hidden = true;
    sourceImage.style.display = hasImage ? "none" : "block";
    if (hasImage) renderPreview();
  });

  addButton.addEventListener("click", async () => {
    try {
      if (!sourceImage.naturalWidth) throw new Error("पहले फोटो चुनें।");
      state.text = readText();
      status("Text preview updated. Download the edited photo to save it.");
      await renderPreview();
    } catch (error) { status(error.message); }
  });

  clearTextButton.addEventListener("click", async () => {
    state.text = null;
    status("Added text removed. Original photo text is not affected.");
    await renderPreview();
  });

  coverButton.addEventListener("click", async () => {
    try {
      if (!sourceImage.naturalWidth) throw new Error("पहले फोटो चुनें।");
      state.cover = readCover();
      status("Selected area covered with a solid colour. This is not AI background reconstruction.");
      await renderPreview();
    } catch (error) { status(error.message); }
  });

  clearCoverButton.addEventListener("click", async () => {
    state.cover = null;
    status("Cover removed.");
    await renderPreview();
  });

  ["photoCropX","photoCropY","photoCropW","photoCropH","photoRotate","photoWidth","photoHeight"].forEach(id => {
    const el = $(id);
    if (el) el.addEventListener("change", renderPreview);
  });
})();
