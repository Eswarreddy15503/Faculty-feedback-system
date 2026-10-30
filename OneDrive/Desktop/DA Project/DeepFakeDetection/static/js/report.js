/**
 * PDF Report Generator for AI-Based Deepfake Detection System.
 * Creates a clean, printable digital forensics analysis report
 * supporting 3-tier results (Likely Authentic, Potential Deepfake, Inconclusive),
 * Image Quality Assessment table, dynamic explanations, and recommendations.
 */

function initReportModule() {
  const downloadPdfBtn = document.getElementById('download-report-btn');
  if (downloadPdfBtn) {
    downloadPdfBtn.addEventListener('click', generatePdfReport);
  }
}

function generatePdfReport() {
  const data = window.ResultModule.getCurrentData();
  if (!data) {
    window.App.showToast('No active analysis to export.', 'error');
    return;
  }

  const isVideo = (data.media_type || '').toLowerCase() === 'video';
  const resStr = (data.result || '').toLowerCase();
  const isDeepfake = resStr.includes('deepfake');
  const isInconclusive = resStr.includes('inconclusive');

  let resultColor = '#2E7D5B';
  let resultBg = '#EAF5EF';
  let resultBorder = '#B6DFC9';
  let resultTitle = '✓ Likely Authentic';

  if (isDeepfake) {
    resultColor = '#C94C4C';
    resultBg = '#FDF2F2';
    resultBorder = '#F5C2C2';
    resultTitle = '! Potential Deepfake';
  } else if (isInconclusive) {
    resultColor = '#D99024';
    resultBg = '#FEF8EC';
    resultBorder = '#F7D9A0';
    resultTitle = '⚠ Inconclusive Result';
  }

  const printWindow = window.open('', '_blank', 'width=850,height=950');
  if (!printWindow) {
    window.App.showToast('Please allow popups to download or print the PDF report.', 'warning');
    return;
  }

  const qualityRows = data.image_quality ? `
    <div class="section-title">Image Quality Assessment</div>
    <table>
      <tr>
        <th>Face Detected</th><td>${data.image_quality.face_detected || 'Detected'}</td>
        <th>Face Size Relative to Image</th><td>${data.image_quality.face_size || 'Good'}</td>
      </tr>
      <tr>
        <th>Resolution</th><td>${data.image_quality.resolution || data.metadata?.resolution || 'Good'}</td>
        <th>Blur Level (Laplacian)</th><td>${data.image_quality.blur_level || 'Low'}</td>
      </tr>
      <tr>
        <th>Lighting & Contrast</th><td>${data.image_quality.lighting || 'Acceptable'}</td>
        <th>Assessment Suitability</th><td><strong>${data.image_quality.suitability || 'Good'}</strong></td>
      </tr>
    </table>
  ` : '';

  const reasonsList = (data.reliability_reasons || []).map(r => `<li>${escapeHtml(r)}</li>`).join('');
  const explanationBullets = (data.explanation_bullets || []).map(b => `<li>${escapeHtml(b)}</li>`).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Forensic Analysis Report - ${data.id}</title>
      <style>
        body {
          font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          color: #1F2937;
          line-height: 1.45;
          padding: 36px;
          max-width: 800px;
          margin: 0 auto;
          background: #fff;
        }
        .header {
          border-bottom: 2px solid #1E3A5F;
          padding-bottom: 12px;
          margin-bottom: 18px;
        }
        .title {
          font-size: 19px;
          font-weight: 700;
          color: #1E3A5F;
          margin: 0 0 3px 0;
        }
        .subtitle {
          font-size: 12px;
          color: #4B5563;
          margin: 0 0 8px 0;
        }
        .report-meta {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: #64748B;
        }
        .result-box {
          border: 1px solid ${resultBorder};
          background-color: ${resultBg};
          padding: 16px;
          border-radius: 8px;
          text-align: center;
          margin-bottom: 16px;
        }
        .result-title {
          font-size: 20px;
          font-weight: 700;
          color: ${resultColor};
          margin-bottom: 3px;
        }
        .result-conf {
          font-size: 22px;
          font-weight: 700;
          color: #1F2937;
        }
        .section-title {
          font-size: 13px;
          font-weight: 700;
          color: #1E3A5F;
          border-bottom: 1px solid #E2E8F0;
          padding-bottom: 3px;
          margin: 16px 0 8px 0;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
          margin-bottom: 12px;
        }
        th, td {
          border: 1px solid #E2E8F0;
          padding: 6px 8px;
          text-align: left;
        }
        th {
          background-color: #F8FAFC;
          color: #4B5563;
          width: 28%;
        }
        .why-box {
          background-color: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 6px;
          padding: 12px;
          font-size: 11px;
          margin-bottom: 12px;
        }
        .why-box ul {
          margin: 4px 0 0 16px;
          padding: 0;
        }
        .rec-box {
          background-color: #EBF3FA;
          border: 1px solid #C5DCF0;
          border-radius: 6px;
          padding: 10px 12px;
          font-size: 11px;
          color: #1E3A5F;
          margin-top: 8px;
        }
        .trust-box {
          background-color: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 6px;
          padding: 10px 12px;
          font-size: 11px;
          margin-bottom: 12px;
        }
        .trust-box ul {
          margin: 4px 0 0 16px;
          padding: 0;
        }
        .indicators-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px;
          font-size: 10px;
        }
        .indicator-card {
          border: 1px solid #E2E8F0;
          padding: 6px 8px;
          border-radius: 4px;
          background: #F8FAFC;
        }
        .disclaimer {
          margin-top: 20px;
          padding: 8px 10px;
          background: #F8FAFC;
          border-left: 3px solid #CBD5E1;
          font-size: 10px;
          color: #64748B;
        }
        @media print {
          body { padding: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="margin-bottom: 15px; text-align: right;">
        <button onclick="window.print()" style="padding: 7px 14px; background: #1E3A5F; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
          Print / Save as PDF
        </button>
      </div>

      <div class="header">
        <h1 class="title">Deepfake Detection</h1>
        <p class="subtitle">Digital Forensics & Media Authenticity Report • Final Year B.Tech CSE Project</p>
        <div class="report-meta">
          <span><strong>Analysis ID:</strong> ${data.id}</span>
          <span><strong>Timestamp:</strong> ${data.created_at || new Date().toLocaleString()}</span>
        </div>
      </div>

      <div class="result-box">
        <div class="result-title">${resultTitle}</div>
        <div class="result-conf">Confidence: ${data.confidence}%</div>
        <p style="font-size: 11px; color: #4B5563; margin: 4px 0 0 0;">
          ${data.decision_explanation || data.explanation || ''}
        </p>
      </div>

      <div class="why-box">
        <strong>${data.explanation_title || (isInconclusive ? 'Why is the result inconclusive?' : 'Why this result?')}</strong>
        <ul>${explanationBullets}</ul>
        ${data.recommendation ? `
          <div class="rec-box">
            <strong>Recommendation:</strong> ${escapeHtml(data.recommendation)}
          </div>
        ` : ''}
      </div>

      <div class="trust-box">
        <strong>Detection Reliability: ${data.reliability || 'Medium'}</strong>
        <ul>${reasonsList}</ul>
      </div>

      <div class="section-title">Media Information</div>
      <table>
        <tr>
          <th>Filename</th><td>${data.filename}</td>
          <th>Analysis Mode</th><td>${data.analysis_mode || (isVideo ? 'Video Multi-Frame' : 'Single Image')}</td>
        </tr>
        <tr>
          <th>Resolution</th><td>${data.metadata?.resolution || 'N/A'}</td>
          <th>File Size</th><td>${data.metadata?.file_size || 'N/A'}</td>
        </tr>
        <tr>
          <th>Duration / FPS</th><td>${data.metadata?.duration || 'N/A'} (${data.metadata?.fps || 'N/A'})</td>
          <th>Codec</th><td>${data.metadata?.codec || 'N/A'}</td>
        </tr>
      </table>

      ${qualityRows}

      <div class="section-title">Forensic Summary Metrics</div>
      <table>
        <tr>
          <th>${isVideo ? 'Frames Analyzed' : 'Face Detected'}</th><td>${isVideo ? (data.frames_analyzed || 24) : (data.usable_face_frames > 0 ? '✓' : 'None')}</td>
          <th>${isVideo ? 'Faces Detected' : 'Faces Analyzed'}</th><td>${isVideo ? (data.usable_face_frames || 1) : (data.faces_detected || 1)}</td>
        </tr>
        <tr>
          <th>${isVideo ? 'Suspicious Frames' : 'Image Quality'}</th><td>${isVideo ? (data.suspicious_frames_count || 0) : (data.face_quality || 'Good')}</td>
          <th>Processing Time</th><td>${data.processing_time_seconds || '0.85'} sec</td>
        </tr>
      </table>

      <div class="section-title">Forensic Indicators</div>
      <div class="indicators-grid">
        ${Object.keys(data.indicators || {}).map(k => {
          const item = data.indicators[k];
          return `
            <div class="indicator-card">
              <strong>${item.title}:</strong> ${item.status}
              <div style="color: #64748B; margin-top: 2px;">${item.description}</div>
            </div>
          `;
        }).join('')}
      </div>

      <div class="disclaimer">
        <strong>Project Disclaimer:</strong> Detection results are automated assessments and may not always be accurate. Model attention visualizations (Grad-CAM) are interpretive and should not be treated as definitive forensic proof.
      </div>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();

  window.App.showToast('Report opened in print preview.');
}

function escapeHtml(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

window.ReportModule = {
  init: initReportModule,
  generate: generatePdfReport
};
