/**
 * Model Performance page management: Supports Dataset Benchmark Evaluation and
 * Real-World Generalization Evaluation with real empirical metrics, confusion matrix,
 * and training/validation loss & accuracy canvas curves.
 */

let currentPerfTab = 'dataset';

function initPerformanceModule() {
  const datasetTabBtn = document.getElementById('perf-tab-dataset');
  const realWorldTabBtn = document.getElementById('perf-tab-realworld');

  if (datasetTabBtn && realWorldTabBtn) {
    datasetTabBtn.addEventListener('click', () => {
      datasetTabBtn.classList.add('active');
      realWorldTabBtn.classList.remove('active');
      currentPerfTab = 'dataset';
      loadPerformanceData('dataset');
    });

    realWorldTabBtn.addEventListener('click', () => {
      realWorldTabBtn.classList.add('active');
      datasetTabBtn.classList.remove('active');
      currentPerfTab = 'real_world';
      loadPerformanceData('real_world');
    });
  }
}

async function loadPerformanceData(evalType = 'dataset') {
  const contentWrapper = document.getElementById('perf-content-wrapper');
  const emptyState = document.getElementById('perf-empty-state');
  const emptyTitle = document.getElementById('perf-empty-title');
  const emptyText = document.getElementById('perf-empty-text');
  const badgeEl = document.getElementById('perf-eval-type-badge');
  const curvesRow = document.getElementById('perf-curves-row');

  if (badgeEl) {
    badgeEl.textContent = evalType === 'dataset' ? 'Dataset Benchmark Evaluation' : 'Real-World Test Evaluation';
  }

  try {
    const response = await fetch(`/api/performance?type=${evalType}`);
    if (!response.ok) throw new Error('Could not fetch performance data');

    const data = await response.json();
    if (!data || data.status === 'unavailable' || data.accuracy === null) {
      if (contentWrapper) contentWrapper.classList.add('hidden');
      if (emptyState) {
        emptyState.classList.remove('hidden');
        if (emptyTitle) {
          emptyTitle.textContent = evalType === 'real_world' 
            ? 'Real-world evaluation has not been completed.' 
            : 'Model evaluation has not been completed.';
        }
        if (emptyText) {
          emptyText.textContent = evalType === 'real_world'
            ? 'Place test media inside real_world_test/ folders and execute python evaluate_real_world.py to generate metrics.'
            : 'Evaluation metrics will appear dynamically once the validation pipeline completes.';
        }
      }
      return;
    }

    if (contentWrapper) contentWrapper.classList.remove('hidden');
    if (emptyState) emptyState.classList.add('hidden');

    // Populate Metric Cards
    const accEl = document.getElementById('perf-acc-val');
    const precEl = document.getElementById('perf-prec-val');
    const recEl = document.getElementById('perf-rec-val');
    const f1El = document.getElementById('perf-f1-val');

    if (accEl) accEl.textContent = data.accuracy !== null && data.accuracy !== undefined ? `${data.accuracy}%` : 'N/A';
    if (precEl) precEl.textContent = data.precision !== null && data.precision !== undefined ? `${data.precision}%` : 'N/A';
    if (recEl) recEl.textContent = data.recall !== null && data.recall !== undefined ? `${data.recall}%` : 'N/A';
    if (f1El) f1El.textContent = data.f1_score !== null && data.f1_score !== undefined ? `${data.f1_score}%` : 'N/A';

    // Populate Confusion Matrix
    const trEl = document.getElementById('cm-true-real');
    const ffEl = document.getElementById('cm-false-fake');
    const frEl = document.getElementById('cm-false-real');
    const tfEl = document.getElementById('cm-true-fake');

    if (data.confusion_matrix) {
      const cm = data.confusion_matrix;
      if (trEl) trEl.textContent = cm.true_real !== undefined ? cm.true_real : '—';
      if (ffEl) ffEl.textContent = cm.false_fake !== undefined ? cm.false_fake : '—';
      if (frEl) frEl.textContent = cm.false_real !== undefined ? cm.false_real : '—';
      if (tfEl) tfEl.textContent = cm.true_fake !== undefined ? cm.true_fake : '—';
    } else {
      if (trEl) trEl.textContent = 'N/A';
      if (ffEl) ffEl.textContent = 'N/A';
      if (frEl) frEl.textContent = 'N/A';
      if (tfEl) tfEl.textContent = 'N/A';
    }

    // Populate Model Info
    const modelNameEl = document.getElementById('perf-model-name');
    const datasetEl = document.getElementById('perf-dataset-name');
    const inputSizeEl = document.getElementById('perf-input-size');
    const classesEl = document.getElementById('perf-classes-count');
    const dateEl = document.getElementById('perf-train-date');
    const epochsEl = document.getElementById('perf-epochs');

    if (modelNameEl) modelNameEl.textContent = data.model_name || 'N/A';
    if (datasetEl) datasetEl.textContent = data.dataset_name || 'N/A';
    if (inputSizeEl) inputSizeEl.textContent = data.input_size || 'N/A';
    if (classesEl) classesEl.textContent = data.number_of_classes ? `${data.number_of_classes} (Binary Classification)` : 'N/A';
    if (dateEl) dateEl.textContent = data.evaluation_date || data.training_date || 'N/A';
    if (epochsEl) epochsEl.textContent = data.epochs ? `${data.epochs} Epochs` : 'N/A';

    // Curves row
    if (curvesRow) {
      if (data.training_curves) {
        curvesRow.classList.remove('hidden');
        renderTrainingCurves(data.training_curves);
      } else {
        curvesRow.classList.add('hidden');
      }
    }

  } catch (err) {
    console.error('Error loading performance:', err);
    if (contentWrapper) contentWrapper.classList.add('hidden');
    if (emptyState) emptyState.classList.remove('hidden');
  }
}

function renderTrainingCurves(curves) {
  const accCanvas = document.getElementById('acc-curve-canvas');
  const lossCanvas = document.getElementById('loss-curve-canvas');

  if (accCanvas && curves.train_acc && curves.val_acc) {
    drawCurvePlot(accCanvas, curves.epochs, [
      { label: 'Train Acc', data: curves.train_acc, color: '#1e3a8a' },
      { label: 'Val Acc', data: curves.val_acc, color: '#16a34a' }
    ], '%', 60, 100);
  }

  if (lossCanvas && curves.train_loss && curves.val_loss) {
    drawCurvePlot(lossCanvas, curves.epochs, [
      { label: 'Train Loss', data: curves.train_loss, color: '#1e3a8a' },
      { label: 'Val Loss', data: curves.val_loss, color: '#dc2626' }
    ], '', 0, 0.8);
  }
}

function drawCurvePlot(canvas, xValues, seriesList, unit, minVal, maxVal) {
  const ctx = canvas.getContext('2d');
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;

  canvas.width = (rect.width || 360) * dpr;
  canvas.height = (rect.height || 180) * dpr;
  ctx.scale(dpr, dpr);

  const w = rect.width || 360;
  const h = rect.height || 180;

  const padLeft = 40;
  const padRight = 15;
  const padTop = 15;
  const padBottom = 25;

  const plotW = w - padLeft - padRight;
  const plotH = h - padTop - padBottom;

  ctx.clearRect(0, 0, w, h);

  // Grid
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.fillStyle = '#64748b';
  ctx.font = '10px Inter, sans-serif';

  const steps = 4;
  for (let i = 0; i <= steps; i++) {
    const yVal = minVal + (i / steps) * (maxVal - minVal);
    const yPos = padTop + plotH - (i / steps) * plotH;
    ctx.beginPath();
    ctx.moveTo(padLeft, yPos);
    ctx.lineTo(w - padRight, yPos);
    ctx.stroke();

    ctx.fillText(`${yVal.toFixed(unit ? 0 : 2)}${unit}`, 5, yPos + 3);
  }

  // Draw each series
  seriesList.forEach(series => {
    const points = series.data.map((v, idx) => {
      const x = padLeft + (idx / Math.max(1, xValues.length - 1)) * plotW;
      const yNorm = (v - minVal) / Math.max(1e-5, maxVal - minVal);
      const y = padTop + plotH - yNorm * plotH;
      return { x, y };
    });

    ctx.beginPath();
    ctx.strokeStyle = series.color;
    ctx.lineWidth = 2;
    points.forEach((p, idx) => {
      if (idx === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();

    // Data points
    points.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = series.color;
      ctx.fill();
    });
  });

  // Epoch markers
  ctx.fillStyle = '#64748b';
  xValues.forEach((ep, idx) => {
    if (idx % 2 === 0 || idx === xValues.length - 1) {
      const x = padLeft + (idx / Math.max(1, xValues.length - 1)) * plotW;
      ctx.fillText(`E${ep}`, x - 7, h - 8);
    }
  });
}

window.PerformanceModule = {
  init: initPerformanceModule,
  load: loadPerformanceData
};
