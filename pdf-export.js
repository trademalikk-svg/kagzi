(function () {
  'use strict';

  function safeFilename(value) {
    const leaf = String(value || 'document.pdf').replace(/\\/g, '/').split('/').pop();
    const cleaned = leaf.replace(/[\u0000-\u001f\u007f<>:"|?*]/g, '_').replace(/\s+/g, '_').replace(/^\.+/, '');
    const base = cleaned || 'document.pdf';
    return /\.pdf$/i.test(base) ? base : base + '.pdf';
  }

  function download(bytes, filename) {
    const validBytes = bytes instanceof ArrayBuffer || ArrayBuffer.isView(bytes);
    const size = bytes instanceof ArrayBuffer ? bytes.byteLength : (ArrayBuffer.isView(bytes) ? bytes.byteLength : 0);
    if (!validBytes || !size) throw new TypeError('Please provide valid PDF bytes before downloading.');

    const safeName = safeFilename(filename);
    const blob = new window.Blob([bytes], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const anchor = window.document.createElement('a');
    anchor.href = url;
    anchor.download = safeName;

    try {
      window.document.body.append(anchor);
      anchor.click();
    } catch (error) {
      window.URL.revokeObjectURL(url);
      throw error;
    } finally {
      if (typeof anchor.remove === 'function') anchor.remove();
    }

    window.setTimeout(() => window.URL.revokeObjectURL(url), 30000);
    return { filename: safeName, mimeType: blob.type, size: blob.size };
  }

  window.KAGZIPdfExport = Object.freeze({ download });
})();
