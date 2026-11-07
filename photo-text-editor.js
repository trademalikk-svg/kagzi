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

  const state = { text: null, cover: null, rendering: false };
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

  async function applyEdits(blob, mime, quality) {
    if (!state.text && !state.cover) return blob;
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
