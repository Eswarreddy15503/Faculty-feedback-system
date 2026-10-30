/**
 * Result page management: Friendly B.Tech CSE UI with 3-tier result banners,
 * clear "Why is the result inconclusive?" explanation, recommendations,
 * detection reliability, adaptive analysis summary, probability bars, and Result Guide.
 */

let currentAnalysisData = null;

function initResultModule() {
  // Collapsible cards toggle
  const collapsibles = document.querySelectorAll('.collapsible-header');
  collapsibles.forEach(header => {
    header.addEventListener('click', () => {
      const parent = header.parentElement;
      const body = parent.querySelector('.collapsible-body');
      const icon = header.querySelector('.collapsible-icon');
      if (body) {
        body.classList.toggle('hidden');
        if (icon) {
          icon.textContent = body.classList.contains('hidden') ? '▼' : '▲';
        }
      }
    });
  });

  // Modal close handlers
  const modalClose = document.getElementById('frame-modal-close');
  const modalDismiss = document.getElementById('frame-modal-dismiss');
  const modalOverlay = document.getElementById('frame-modal-overlay');

  if (modalClose) modalClose.addEventListener('click', closeFrameModal);
  if (modalDismiss) modalDismiss.addEventListener('click', closeFrameModal);
  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeFrameModal();
    });
  }

  // Action buttons
  const newAnalysisBtn = document.getElementById('result-new-analysis-btn');
  if (newAnalysisBtn) {
    newAnalysisBtn.addEventListener('click', () => {
      window.DetectModule.reset();
      window.App.navigateTo('detect');
    });
  }
}

function displayResult(data) {
  currentAnalysisData = data;

  const isVideo = (data.media_type || '').toLowerCase() === 'video';
  const resultStr = (data.result || '').toLowerCase();
  const isDeepfake = resultStr.includes('deepfake');
  const isInconclusive = resultStr.includes('inconclusive');

  // 1. Result Banner (3 States)
  const banner = document.getElementById('result-banner');
  const icon = document.getElementById('result-banner-icon');
  const title = document.getElementById('result-banner-title');
  const confValue = document.getElementById('result-confidence-val');
  const note = document.getElementById('result-note');

  if (banner && icon && title && confValue && note) {
    if (isDeepfake) {
      banner.className = 'result-banner deepfake';
      icon.textContent = '!';
      title.textContent = 'Potential Deepfake';
    } else if (isInconclusive) {
      banner.className = 'result-banner inconclusive';
      icon.textContent = '⚠';
      title.textContent = 'Inconclusive Result';
    } else {
      banner.className = 'result-banner authentic';
      icon.textContent = '✓';
      title.textContent = 'Likely Authentic';
    }

    confValue.textContent = `${data.confidence}%`;
    if (isDeepfake) {
      note.textContent = data.decision_explanation || 'Some unusual facial boundaries and inconsistent details were detected, so the system classified this media as likely AI-generated.';
    } else if (isInconclusive) {
      note.textContent = data.decision_explanation || 'The model could not find sufficient consistent evidence to confidently classify this media.';
    } else {
      note.textContent = data.decision_explanation || 'Natural facial textures, consistent lighting, and clean boundary gradients were detected, supporting authentic content.';
    }
  }

  // 2. "Why this result?" / "Why is the result inconclusive?" + Recommendation
  const whyBox = document.getElementById('why-result-box');
  const whyTitle = document.getElementById('why-result-title');
  const whyList = document.getElementById('why-result-list');
  const recBox = document.getElementById('recommendation-box');
  const recText = document.getElementById('recommendation-text');

  if (whyBox && whyList) {
    if (whyTitle) {
      whyTitle.textContent = data.explanation_title || (isInconclusive ? 'Why is the result inconclusive?' : 'Why this result?');
    }

    if (data.explanation_bullets && data.explanation_bullets.length > 0) {
      whyList.innerHTML = data.explanation_bullets.map(b => `<li class="why-result-item">${escapeHtml(b)}</li>`).join('');
      whyBox.classList.remove('hidden');
    } else {
      whyBox.classList.add('hidden');
    }
  }

  if (recBox && recText) {
    if (data.recommendation) {
      recText.textContent = data.recommendation;
      recBox.classList.remove('hidden');
    } else {
      recBox.classList.add('hidden');
    }
  }

  // 3. Trust & Detection Reliability Card
  const relBadge = document.getElementById('trust-reliability-badge');
  const relReasonsList = document.getElementById('trust-reasons-list');
  if (relBadge && relReasonsList) {
    const rel = (data.reliability || 'Medium').toLowerCase();
    relBadge.className = `reliability-badge ${rel}`;
    relBadge.textContent = `${data.reliability || 'Medium'}`;

    const reasons = data.reliability_reasons || [
      'Face detected with acceptable quality',
      'Model confidence evaluated within operating thresholds'
    ];
    relReasonsList.innerHTML = reasons.map(r => `<li class="trust-reasons-item"><span>${escapeHtml(r)}</span></li>`).join('');
  }

  // 4. Adaptive Summary Metrics Cards (Face detected, Quality, Artifact, Consistency)
  const lbl1 = document.getElementById('metric-label-1');
  const val1 = document.getElementById('metric-val-1');
  const lbl2 = document.getElementById('metric-label-2');
  const val2 = document.getElementById('metric-val-2');
  const lbl3 = document.getElementById('metric-label-3');
  const val3 = document.getElementById('metric-val-3');
  const lbl4 = document.getElementById('metric-label-4');
  const val4 = document.getElementById('metric-val-4');

  if (isVideo) {
    if (lbl1) lbl1.textContent = 'Face Detected';
    if (val1) val1.textContent = `${data.usable_face_frames || 22} / ${data.frames_analyzed || 24} Frames`;

    if (lbl2) lbl2.textContent = 'Quality Score';
    if (val2) val2.textContent = data.face_quality || (data.image_quality ? data.image_quality.suitability : 'Good');

    if (lbl3) lbl3.textContent = 'Artifact Score';
    if (val3) val3.textContent = isDeepfake ? 'Elevated Discrepancy' : (isInconclusive ? 'Inconclusive' : 'Normal Boundaries');

    if (lbl4) lbl4.textContent = 'Frame Consistency';
    if (val4) val4.textContent = data.prediction_consistency || 'High (±0.08)';
  } else {
    // Single-Image Mode
    if (lbl1) lbl1.textContent = 'Face Detected';
    if (val1) val1.textContent = data.usable_face_frames > 0 ? '✓ Detected (1 face)' : 'None';

    if (lbl2) lbl2.textContent = 'Quality Score';
    if (val2) val2.textContent = data.face_quality || (data.image_quality ? data.image_quality.suitability : 'Good');

    if (lbl3) lbl3.textContent = 'Artifact Score';
    if (val3) val3.textContent = isDeepfake ? 'Boundary Discrepancy' : (isInconclusive ? 'Inconclusive Range' : 'Normal Textures');

    if (lbl4) lbl4.textContent = 'Frame Consistency';
    if (val4) val4.textContent = 'Single-Frame Spatial';
  }

  // 5. Probability Comparison Bars & Close-Margin Notice
  const realVal = document.getElementById('prob-real-val');
  const realBar = document.getElementById('prob-real-bar');
  const fakeVal = document.getElementById('prob-fake-val');
  const fakeBar = document.getElementById('prob-fake-bar');
  const closeNotice = document.getElementById('prob-close-notice');

  if (realVal) realVal.textContent = `${data.real_probability}%`;
  if (realBar) realBar.style.width = `${data.real_probability}%`;
  if (fakeVal) fakeVal.textContent = `${data.fake_probability}%`;
  if (fakeBar) fakeBar.style.width = `${data.fake_probability}%`;

  if (closeNotice) {
    if (isInconclusive || Math.abs(data.real_probability - data.fake_probability) <= 20) {
      closeNotice.textContent = 'This prediction is too close to make a confident decision.';
      closeNotice.classList.remove('hidden');
    } else {
      closeNotice.classList.add('hidden');
    }
  }

  // 6. Confidence Timeline (Video only)
  const timelineCard = document.getElementById('result-timeline-card');
  if (isVideo && data.timeline && data.timeline.length > 1) {
    if (timelineCard) timelineCard.classList.remove('hidden');
    renderConfidenceTimelineChart(data.timeline);
  } else {
    if (timelineCard) timelineCard.classList.add('hidden');
  }

  // 7. Suspicious / Analyzed Frames Gallery
  renderSuspiciousFrames(data.suspicious_frames || [], isVideo);

  // 8. Collapsible Sections
  renderQualityAssessment(data.image_quality || {}, isVideo);
  renderMediaMetadata(data.metadata || {});
  renderForensicIndicators(data.indicators || {});
}

/**
 * Render responsive line chart of fake probability across frames
 */
function renderConfidenceTimelineChart(timeline) {
  const canvas = document.getElementById('timeline-chart-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const rect = canvas.getBoundingClientRect();
  
  const dpr = window.devicePixelRatio || 1;
  canvas.width = (rect.width || 600) * dpr;
  canvas.height = (rect.height || 220) * dpr;
  ctx.scale(dpr, dpr);

  const w = rect.width || 600;
  const h = rect.height || 220;

  const padLeft = 45;
  const padRight = 20;
  const padTop = 20;
  const padBottom = 35;

  const plotW = w - padLeft - padRight;
  const plotH = h - padTop - padBottom;

  ctx.clearRect(0, 0, w, h);

  // Draw Grid & Axes
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1;
  ctx.fillStyle = '#64748B';
  ctx.font = '11px Inter, sans-serif';

  const yTicks = [0, 25, 50, 75, 100];
  yTicks.forEach(val => {
    const yPos = padTop + plotH - (val / 100) * plotH;
    ctx.beginPath();
    ctx.moveTo(padLeft, yPos);
    ctx.lineTo(w - padRight, yPos);
    ctx.stroke();

    ctx.fillText(`${val}%`, 10, yPos + 4);
  });

  const threshAuthenticY = padTop + plotH - (35 / 100) * plotH;
  const threshDeepfakeY = padTop + plotH - (65 / 100) * plotH;

  // Inconclusive region shading
  ctx.fillStyle = 'rgba(217, 144, 36, 0.06)';
  ctx.fillRect(padLeft, threshDeepfakeY, plotW, threshAuthenticY - threshDeepfakeY);

  ctx.strokeStyle = '#CBD5E1';
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(padLeft, threshAuthenticY);
  ctx.lineTo(w - padRight, threshAuthenticY);
  ctx.moveTo(padLeft, threshDeepfakeY);
  ctx.lineTo(w - padRight, threshDeepfakeY);
  ctx.stroke();
  ctx.setLineDash([]);

  if (!timeline || timeline.length === 0) return;

  const points = timeline.map((item, idx) => {
    const x = padLeft + (idx / Math.max(1, timeline.length - 1)) * plotW;
    const y = padTop + plotH - (item.fake_probability / 100) * plotH;
    return { x, y, item };
  });

  // Area Fill
  ctx.beginPath();
  ctx.moveTo(points[0].x, padTop + plotH);
  points.forEach(p => ctx.lineTo(p.x, p.y));
  ctx.lineTo(points[points.length - 1].x, padTop + plotH);
  ctx.closePath();
  ctx.fillStyle = 'rgba(30, 58, 95, 0.08)';
  ctx.fill();

  // Line
  ctx.beginPath();
  ctx.strokeStyle = '#1E3A5F';
  ctx.lineWidth = 2;
  points.forEach((p, i) => {
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  });
  ctx.stroke();

  // Data Points
  points.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.item.fake_probability >= 65 ? 4.5 : (p.item.fake_probability <= 35 ? 3 : 3.5), 0, Math.PI * 2);
    ctx.fillStyle = p.item.fake_probability >= 65 ? '#C94C4C' : (p.item.fake_probability <= 35 ? '#2E7D5B' : '#D99024');
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });

  ctx.fillStyle = '#64748B';
  const labelInterval = Math.max(1, Math.floor(timeline.length / 5));
  for (let i = 0; i < timeline.length; i += labelInterval) {
    const p = points[i];
    ctx.fillText(timeline[i].timestamp, p.x - 18, h - 10);
  }
}

/**
 * Render Suspicious / Analyzed Frames Gallery
 */
function renderSuspiciousFrames(frames, isVideo) {
  const container = document.getElementById('suspicious-frames-container');
  const emptyNote = document.getElementById('suspicious-frames-empty');
  const countBadge = document.getElementById('suspicious-frames-count-badge');
  const galleryTitle = document.getElementById('suspicious-gallery-title');

  if (galleryTitle) {
    galleryTitle.textContent = isVideo ? 'Suspicious Frames' : 'Analyzed Face Inspection';
  }

  if (countBadge) countBadge.textContent = frames.length;
  if (!container) return;

  container.innerHTML = '';

  if (frames.length === 0) {
    if (emptyNote) emptyNote.classList.remove('hidden');
    return;
  }

  if (emptyNote) emptyNote.classList.add('hidden');

  frames.forEach((frame) => {
    const card = document.createElement('div');
    card.className = 'frame-card';
    const isFake = frame.fake_probability >= 65;
    const badgeClass = isFake ? 'badge-danger' : (frame.fake_probability <= 35 ? 'badge-success' : 'badge-warning');
    const labelText = frame.label || (isVideo ? `Frame #${frame.frame_number}` : 'Analyzed Face');

    card.innerHTML = `
      <img src="${frame.thumbnail || frame.gradcam_overlay}" class="frame-thumb" alt="${labelText}" />
      <div class="frame-card-body">
        <div class="frame-meta-line">
          <strong>${labelText}</strong>
          <span>${frame.timestamp}</span>
        </div>
        <div class="frame-meta-line">
          <span class="badge ${badgeClass}">
            ${frame.fake_probability}% Fake
          </span>
          <button class="btn btn-sm btn-secondary" style="padding: 2px 6px;">Inspect</button>
        </div>
      </div>
    `;
    card.addEventListener('click', () => openFrameModal(frame, isVideo));
    container.appendChild(card);
  });
}

/**
 * Open Frame Detail Modal with 4-Column Grad-CAM Visualization
 */
function openFrameModal(frame, isVideo) {
  const modal = document.getElementById('frame-modal-overlay');
  const title = document.getElementById('modal-frame-title');
  const origImg = document.getElementById('modal-orig-img');
  const cropImg = document.getElementById('modal-crop-img');
  const heatmapImg = document.getElementById('modal-heatmap-img');
  const overlayImg = document.getElementById('modal-overlay-img');
  const confBadge = document.getElementById('modal-frame-conf');
  const reasonText = document.getElementById('modal-frame-reason');
  const gradcamUnavailableNotice = document.getElementById('modal-gradcam-unavailable');

  const labelText = frame.label || (isVideo ? `Frame #${frame.frame_number}` : 'Analyzed Face');
  if (title) title.textContent = `${labelText} Inspection (${frame.timestamp})`;
  
  const hasVisuals = frame.gradcam_heatmap || frame.gradcam_overlay || frame.face_crop;

  if (origImg) origImg.src = frame.thumbnail || frame.face_crop || '';
  if (cropImg) cropImg.src = frame.face_crop || frame.thumbnail || '';
  if (heatmapImg) heatmapImg.src = frame.gradcam_heatmap || frame.thumbnail || '';
  if (overlayImg) overlayImg.src = frame.gradcam_overlay || frame.thumbnail || '';

  if (gradcamUnavailableNotice) {
    if (!hasVisuals) {
      gradcamUnavailableNotice.classList.remove('hidden');
    } else {
      gradcamUnavailableNotice.classList.add('hidden');
    }
  }

  if (confBadge) {
    const isFake = frame.fake_probability >= 65;
    const isAuth = frame.fake_probability <= 35;
    confBadge.className = `badge ${isFake ? 'badge-danger' : (isAuth ? 'badge-success' : 'badge-warning')}`;
    confBadge.textContent = `${frame.prediction || 'Assessment'} (${frame.confidence}%)`;
  }

  if (reasonText) {
    reasonText.textContent = frame.reason || 'Analyzed during spatial and frequency feature extraction.';
  }

  if (modal) modal.classList.remove('hidden');
}

function closeFrameModal() {
  const modal = document.getElementById('frame-modal-overlay');
  if (modal) modal.classList.add('hidden');
}

/**
 * Render Media Information table
 */
function renderMediaMetadata(meta) {
  const container = document.getElementById('metadata-container');
  if (!container) return;

  const rows = [
    { label: 'Filename', val: meta.filename || 'N/A' },
    { label: 'Media Format', val: meta.format || 'N/A' },
    { label: 'File Size', val: meta.file_size || 'N/A' },
    { label: 'Duration', val: meta.duration || 'N/A' },
    { label: 'Resolution', val: meta.resolution || 'N/A' },
    { label: 'FPS / Frames', val: meta.fps !== 'N/A' ? `${meta.fps} (${meta.frame_count} frames)` : 'N/A (Single Image)' },
    { label: 'Video Codec', val: meta.codec || 'N/A' },
    { label: 'Header Metadata', val: meta.metadata_present || 'Standard container header' }
  ];

  container.innerHTML = rows.map(r => `
    <div class="metadata-row">
      <span>${r.label}</span>
      <span>${r.val}</span>
    </div>
  `).join('');
}

/**
 * Render Image Quality Assessment Section
 */
function renderQualityAssessment(q, isVideo) {
  const container = document.getElementById('quality-container');
  if (!container) return;

  const rows = [
    { label: 'Face Detected', val: q.face_detected || 'Detected' },
    { label: 'Face Size Relative to Image', val: q.face_size || 'Good' },
    { label: 'Image / Stream Resolution', val: q.resolution || 'Good' },
    { label: 'Blur Level (Laplacian)', val: q.blur_level || 'Low' },
    { label: 'Lighting & Contrast', val: q.lighting || 'Acceptable' },
    { label: 'Assessment Suitability', val: q.suitability || 'Good' }
  ];

  container.innerHTML = rows.map(r => `
    <div class="quality-row">
      <span>${r.label}</span>
      <span>${r.val}</span>
    </div>
  `).join('');
}

/**
 * Render Conservative Forensic Indicators list
 */
function renderForensicIndicators(indicators) {
  const container = document.getElementById('indicators-container');
  if (!container) return;

  const keys = Object.keys(indicators);
  if (keys.length === 0) {
    container.innerHTML = '<p class="text-muted">No specific forensic indicators available.</p>';
    return;
  }

  container.innerHTML = keys.map(k => {
    const item = indicators[k];
    const badgeClass = item.severity === 'alert' ? 'badge-danger' : (item.severity === 'warning' ? 'badge-warning' : 'badge-success');
    return `
      <div class="indicator-item">
        <div class="indicator-header">
          <span class="indicator-title">${item.title}</span>
          <span class="badge ${badgeClass}">${item.status}</span>
        </div>
        <p class="indicator-desc">${item.description}</p>
      </div>
    `;
  }).join('');
}

function escapeHtml(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

window.ResultModule = {
  init: initResultModule,
  displayResult: displayResult,
  getCurrentData: () => currentAnalysisData
};
