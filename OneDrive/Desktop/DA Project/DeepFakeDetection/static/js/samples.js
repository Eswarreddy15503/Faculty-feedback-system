/**
 * VIVA DEMO SAMPLE media fixtures for instant testing during project demonstrations.
 * When loaded, these samples are analyzed live by the backend detection pipeline.
 */

function createSampleImageBlob(type = 'authentic') {
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 320;
  const ctx = canvas.getContext('2d');

  if (type === 'authentic') {
    // Clean realistic portrait with natural lighting gradient and consistent skin texture
    const grad = ctx.createLinearGradient(0, 0, 320, 320);
    grad.addColorStop(0, '#f8fafc');
    grad.addColorStop(1, '#e2e8f0');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 320, 320);

    // Natural skin face oval
    ctx.fillStyle = '#fbd0b4';
    ctx.beginPath();
    ctx.ellipse(160, 150, 75, 105, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.arc(130, 130, 7, 0, Math.PI * 2);
    ctx.arc(190, 130, 7, 0, Math.PI * 2);
    ctx.fill();

    // Natural mouth
    ctx.strokeStyle = '#b91c1c';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(160, 185, 22, 0.2 * Math.PI, 0.8 * Math.PI, false);
    ctx.stroke();

    // Label watermark
    ctx.fillStyle = '#64748b';
    ctx.font = '10px Inter, sans-serif';
    ctx.fillText('VIVA DEMO SAMPLE — Authentic Phone Portrait', 12, 305);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(new File([blob], 'viva_demo_authentic_portrait.jpg', { type: 'image/jpeg' }));
      }, 'image/jpeg', 0.92);
    });

  } else if (type === 'deepfake') {
    // Synthetic sample with boundary blend discrepancies
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 320, 320);

    // Synthetic face oval with high contrast edge
    ctx.fillStyle = '#e2b397';
    ctx.beginPath();
    ctx.ellipse(160, 150, 78, 108, 0, 0, Math.PI * 2);
    ctx.fill();

    // Sharp outer boundary seam
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Eyes
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(130, 130, 8, 0, Math.PI * 2);
    ctx.arc(190, 130, 8, 0, Math.PI * 2);
    ctx.fill();

    // Distorted synthetic artifact mouth
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(135, 190);
    ctx.bezierCurveTo(145, 205, 175, 175, 185, 190);
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px Inter, sans-serif';
    ctx.fillText('VIVA DEMO SAMPLE — Synthetic Facial Artifacts', 12, 305);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(new File([blob], 'viva_demo_manipulated_face.jpg', { type: 'image/jpeg' }));
      }, 'image/jpeg', 0.88);
    });

  } else {
    // Low quality / ambiguous capture (Inconclusive)
    ctx.fillStyle = '#475569';
    ctx.fillRect(0, 0, 320, 320);

    // Dim face
    ctx.fillStyle = '#8c786c';
    ctx.beginPath();
    ctx.ellipse(160, 150, 60, 80, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '10px Inter, sans-serif';
    ctx.fillText('VIVA DEMO SAMPLE — Low-Resolution / Uncertain Capture', 12, 305);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(new File([blob], 'viva_demo_uncertain_capture.jpg', { type: 'image/jpeg' }));
      }, 'image/jpeg', 0.50);
    });
  }
}

window.SampleMedia = {
  createSampleImageBlob
};
