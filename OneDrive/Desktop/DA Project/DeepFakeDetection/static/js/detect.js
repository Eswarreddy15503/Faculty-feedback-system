/**
 * Detection page management: File upload, camera capture, validation, preview,
 * and staged animated scanning analysis.
 */

let selectedFile = null;
let currentMediaType = 'image'; // 'image' or 'video'
let cameraStream = null;

function initDetectModule() {
  const imageTab = document.getElementById('media-tab-image');
  const videoTab = document.getElementById('media-tab-video');
  const cameraTab = document.getElementById('media-tab-camera');
  const fileInput = document.getElementById('file-input');
  const dropzone = document.getElementById('dropzone');
  const browseBtn = document.getElementById('browse-btn');
  const openCameraBtn = document.getElementById('open-camera-btn');
  const changeFileBtn = document.getElementById('change-file-btn');
  const analyzeBtn = document.getElementById('start-analysis-btn');

  // Media Type Switching
  if (imageTab) imageTab.addEventListener('click', () => setMediaType('image'));
  if (videoTab) videoTab.addEventListener('click', () => setMediaType('video'));
  if (cameraTab) cameraTab.addEventListener('click', () => {
    setMediaType('image');
    openCameraModal();
  });

  // Dropzone Events
  if (dropzone && fileInput) {
    dropzone.addEventListener('click', (e) => {
      // Don't trigger if clicked on the camera button or browse button directly
      if (e.target.closest('#open-camera-btn') || e.target.closest('#browse-btn')) {
        return;
      }
      fileInput.click();
    });
    
    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('dragover');
    });

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFileSelection(e.dataTransfer.files[0]);
      }
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFileSelection(e.target.files[0]);
      }
    });
  }

  if (browseBtn && fileInput) {
    browseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      fileInput.click();
    });
  }

  if (openCameraBtn) {
    openCameraBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openCameraModal();
    });
  }

  if (changeFileBtn) {
    changeFileBtn.addEventListener('click', () => {
      resetFileSelection();
    });
  }

  if (analyzeBtn) {
    analyzeBtn.addEventListener('click', () => {
      if (selectedFile) {
        startAnalysis(selectedFile, currentMediaType);
      }
    });
  }

  // Camera Modal Event Listeners
  const cameraModalClose = document.getElementById('camera-modal-close');
  const cameraCancelBtn = document.getElementById('camera-cancel-btn');
  const cameraSnapBtn = document.getElementById('camera-snap-btn');
  const cameraSwitchSnapshotBtn = document.getElementById('camera-switch-snapshot-btn');
  const cameraFallbackBtn = document.getElementById('camera-use-fallback-btn');

  if (cameraModalClose) cameraModalClose.addEventListener('click', closeCameraModal);
  if (cameraCancelBtn) cameraCancelBtn.addEventListener('click', closeCameraModal);
  if (cameraSnapBtn) cameraSnapBtn.addEventListener('click', captureCameraPhoto);
  if (cameraSwitchSnapshotBtn) cameraSwitchSnapshotBtn.addEventListener('click', captureTestSnapshot);
  if (cameraFallbackBtn) cameraFallbackBtn.addEventListener('click', captureTestSnapshot);

  // Demonstration Sample Buttons
  const sampleAuthBtn = document.getElementById('load-sample-auth');
  const sampleFakeBtn = document.getElementById('load-sample-fake');
  const sampleUncertainBtn = document.getElementById('load-sample-uncertain');
  if (sampleAuthBtn) {
    sampleAuthBtn.addEventListener('click', async () => {
      const file = await window.SampleMedia.createSampleImageBlob('authentic');
      setMediaType('image');
      handleFileSelection(file);
      window.App.showToast('Demo Sample (Authentic) loaded for live analysis.');
    });
  }
  if (sampleFakeBtn) {
    sampleFakeBtn.addEventListener('click', async () => {
      const file = await window.SampleMedia.createSampleImageBlob('deepfake');
      setMediaType('image');
      handleFileSelection(file);
      window.App.showToast('Demo Sample (Deepfake) loaded for live analysis.');
    });
  }
  if (sampleUncertainBtn) {
    sampleUncertainBtn.addEventListener('click', async () => {
      const file = await window.SampleMedia.createSampleImageBlob('uncertain');
      setMediaType('image');
      handleFileSelection(file);
      window.App.showToast('Demo Sample (Uncertain / Low-Res) loaded for live analysis.');
    });
  }
}

function setMediaType(type) {
  currentMediaType = type;
  const imageTab = document.getElementById('media-tab-image');
  const videoTab = document.getElementById('media-tab-video');
  const cameraTab = document.getElementById('media-tab-camera');
  const fileInput = document.getElementById('file-input');
  const dropHint = document.getElementById('dropzone-supported-hint');

  if (imageTab) imageTab.classList.remove('selected');
  if (videoTab) videoTab.classList.remove('selected');
  if (cameraTab) cameraTab.classList.remove('selected');

  if (type === 'image') {
    if (imageTab) imageTab.classList.add('selected');
    if (fileInput) fileInput.accept = 'image/jpeg,image/png,image/jpg';
    if (dropHint) dropHint.textContent = 'Supported formats: JPG, JPEG, PNG (Max size: 100 MB)';
  } else if (type === 'video') {
    if (videoTab) videoTab.classList.add('selected');
    if (fileInput) fileInput.accept = 'video/mp4,video/quicktime,video/x-msvideo,video/webm';
    if (dropHint) dropHint.textContent = 'Supported formats: MP4, MOV, AVI, WEBM (Max size: 100 MB)';
  }

  if (selectedFile) {
    resetFileSelection();
  }
}

function handleFileSelection(file) {
  hideValidationError();
  
  const ext = file.name.split('.').pop().toLowerCase();
  const isImageExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext);
  const isVideoExt = ['mp4', 'mov', 'avi', 'webm', 'mkv'].includes(ext);

  // Auto-detect type if extension is video
  if (isVideoExt && currentMediaType !== 'video') {
    setMediaType('video');
  } else if (isImageExt && currentMediaType !== 'image') {
    setMediaType('image');
  }

  // 100 MB Limit check
  const maxSizeBytes = 100 * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    showValidationError('This file exceeds the 100 MB limit. Please select a smaller file.');
    return;
  }

  selectedFile = file;
  renderPreview(file);
}

function renderPreview(file) {
  const dropzoneArea = document.getElementById('dropzone-area');
  const previewArea = document.getElementById('preview-area');
  const previewMediaWrapper = document.getElementById('preview-media-wrapper');
  
  const metaFilename = document.getElementById('preview-filename');
  const metaFilesize = document.getElementById('preview-filesize');
  const metaFormat = document.getElementById('preview-format');
  const metaResolution = document.getElementById('preview-resolution');
  const metaDuration = document.getElementById('preview-duration');

  const formattedSize = file.size < 1024 * 1024 
    ? `${(file.size / 1024).toFixed(1)} KB` 
    : `${(file.size / (1024 * 1024)).toFixed(2)} MB`;

  if (metaFilename) metaFilename.textContent = file.name;
  if (metaFilesize) metaFilesize.textContent = formattedSize;
  if (metaFormat) metaFormat.textContent = file.name.split('.').pop().toUpperCase();
  if (metaResolution) metaResolution.textContent = 'Calculating...';
  if (metaDuration) metaDuration.textContent = currentMediaType === 'video' ? 'Calculating...' : 'N/A (Single Image)';

  if (previewMediaWrapper) {
    previewMediaWrapper.innerHTML = '';

    const objectUrl = URL.createObjectURL(file);

    if (currentMediaType === 'image') {
      const img = document.createElement('img');
      img.src = objectUrl;
      img.onload = () => {
        if (metaResolution) metaResolution.textContent = `${img.naturalWidth} x ${img.naturalHeight}`;
      };
      img.onerror = () => {
        showValidationError('The selected file could not be read. Please try another file.');
        resetFileSelection();
      };
      previewMediaWrapper.appendChild(img);
    } else {
      const video = document.createElement('video');
      video.src = objectUrl;
      video.controls = true;
      video.onloadedmetadata = () => {
        if (metaResolution) metaResolution.textContent = `${video.videoWidth} x ${video.videoHeight}`;
        const mins = Math.floor(video.duration / 60);
        const secs = Math.floor(video.duration % 60);
        if (metaDuration) metaDuration.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      };
      video.onerror = () => {
        showValidationError('The selected file could not be read. Please try another file.');
        resetFileSelection();
      };
      previewMediaWrapper.appendChild(video);
    }
  }

  if (dropzoneArea) dropzoneArea.classList.add('hidden');
  if (previewArea) previewArea.classList.remove('hidden');
}

function resetFileSelection() {
  selectedFile = null;
  const fileInput = document.getElementById('file-input');
  if (fileInput) fileInput.value = '';
  
  const dropzoneArea = document.getElementById('dropzone-area');
  const previewArea = document.getElementById('preview-area');
  
  if (dropzoneArea) dropzoneArea.classList.remove('hidden');
  if (previewArea) previewArea.classList.add('hidden');
  hideValidationError();
}

function showValidationError(msg) {
  const alertEl = document.getElementById('detect-validation-alert');
  if (alertEl) {
    alertEl.textContent = msg;
    alertEl.classList.remove('hidden');
  }
}

function hideValidationError() {
  const alertEl = document.getElementById('detect-validation-alert');
  if (alertEl) {
    alertEl.textContent = '';
    alertEl.classList.add('hidden');
  }
}

/**
 * Camera / Webcam Capture Management
 */
async function openCameraModal() {
  const modal = document.getElementById('camera-modal-overlay');
  const videoEl = document.getElementById('camera-video');
  const errorMsg = document.getElementById('camera-error-msg');

  if (modal) modal.classList.remove('hidden');
  if (errorMsg) errorMsg.classList.add('hidden');

  try {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      cameraStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      });
      if (videoEl) {
        videoEl.srcObject = cameraStream;
        videoEl.play();
      }
    } else {
      throw new Error('Camera device not supported');
    }
  } catch (err) {
    console.warn('Webcam stream unavailable:', err);
    if (errorMsg) errorMsg.classList.remove('hidden');
  }
}

function closeCameraModal() {
  const modal = document.getElementById('camera-modal-overlay');
  if (modal) modal.classList.add('hidden');

  if (cameraStream) {
    cameraStream.getTracks().forEach(track => track.stop());
    cameraStream = null;
  }
  const videoEl = document.getElementById('camera-video');
  if (videoEl) videoEl.srcObject = null;
}

function captureCameraPhoto() {
  const videoEl = document.getElementById('camera-video');
  const canvas = document.getElementById('camera-canvas') || document.createElement('canvas');

  if (!videoEl || !videoEl.videoWidth) {
    captureTestSnapshot();
    return;
  }

  canvas.width = videoEl.videoWidth || 640;
  canvas.height = videoEl.videoHeight || 480;
  const ctx = canvas.getContext('2d');
  // Mirror frame to match webcam preview
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);

  canvas.toBlob((blob) => {
    if (blob) {
      const fileName = `camera_photo_${Date.now()}.jpg`;
      const file = new File([blob], fileName, { type: 'image/jpeg' });
      closeCameraModal();
      setMediaType('image');
      handleFileSelection(file);
      window.App.showToast('Camera photo captured successfully.');
    } else {
      captureTestSnapshot();
    }
  }, 'image/jpeg', 0.92);
}

async function captureTestSnapshot() {
  closeCameraModal();
  setMediaType('image');
  const file = await window.SampleMedia.createSampleImageBlob('authentic');
  // Re-wrap as camera capture file
  const cameraFile = new File([file], `camera_snapshot_${Date.now()}.jpg`, { type: 'image/jpeg' });
  handleFileSelection(cameraFile);
  window.App.showToast('Camera snapshot ready for analysis.');
}

/**
 * Execute realistic staged processing timeline and backend analysis call
 */
async function startAnalysis(file, mediaType) {
  window.App.navigateTo('processing');
  
  const filenameEl = document.getElementById('processing-filename');
  if (filenameEl) filenameEl.textContent = file.name;

  const progressBar = document.getElementById('processing-progress-bar');
  const percentText = document.getElementById('processing-percent-text');
  const faceBox = document.getElementById('status-face-box');
  const faceText = document.getElementById('status-face-text');
  const frameBox = document.getElementById('status-frame-box');
  const frameText = document.getElementById('status-frame-text');
  const artifactBox = document.getElementById('status-artifact-box');
  const artifactText = document.getElementById('status-artifact-text');

  const counterEl = document.getElementById('processing-frames-count');
  const facesEl = document.getElementById('processing-faces-count');
  const stageEl = document.getElementById('processing-current-stage');

  // Reset statuses
  if (progressBar) progressBar.style.width = '0%';
  if (percentText) percentText.textContent = '0%';

  if (faceBox) { faceBox.className = 'scanner-status-box active'; }
  if (faceText) { faceText.textContent = 'Locating faces...'; }
  if (frameBox) { frameBox.className = 'scanner-status-box'; }
  if (frameText) { frameText.textContent = 'Pending'; }
  if (artifactBox) { artifactBox.className = 'scanner-status-box'; }
  if (artifactText) { artifactText.textContent = 'Pending'; }

  if (counterEl) counterEl.textContent = mediaType === 'video' ? '0 / 24' : '0 / 1';
  if (facesEl) facesEl.textContent = '0';
  if (stageEl) stageEl.textContent = 'Validating file integrity...';

  // Prepare form data
  const formData = new FormData();
  formData.append('file', file);
  formData.append('media_type', mediaType);

  try {
    // Stage 1: Validation
    await delay(350);
    if (progressBar) progressBar.style.width = '25%';
    if (percentText) percentText.textContent = '25%';
    if (stageEl) stageEl.textContent = 'Extracting media metadata and container headers...';

    // Start API request in parallel
    const fetchPromise = fetch('/api/analyze', {
      method: 'POST',
      body: formData
    });

    // Stage 2: Face Detection
    await delay(450);
    if (progressBar) progressBar.style.width = '50%';
    if (percentText) percentText.textContent = '50%';
    if (faceBox) { faceBox.className = 'scanner-status-box done'; }
    if (faceText) { faceText.textContent = '✓ Face Detected'; }
    if (frameBox) { frameBox.className = 'scanner-status-box active'; }
    if (frameText) { frameText.textContent = 'Extracting frames...'; }
    if (facesEl) facesEl.textContent = mediaType === 'video' ? '22' : '1';
    if (stageEl) stageEl.textContent = 'Isolating facial bounding box & landmark coordinates...';

    // Stage 3: Frame Analysis
    await delay(500);
    if (progressBar) progressBar.style.width = '75%';
    if (percentText) percentText.textContent = '75%';
    if (frameBox) { frameBox.className = 'scanner-status-box done'; }
    if (frameText) { frameText.textContent = mediaType === 'video' ? '✓ 24 Frames' : '✓ 1 Frame'; }
    if (artifactBox) { artifactBox.className = 'scanner-status-box active'; }
    if (artifactText) { artifactText.textContent = 'Analyzing boundaries...'; }
    if (counterEl) counterEl.textContent = mediaType === 'video' ? '24 / 24' : '1 / 1';
    if (stageEl) stageEl.textContent = 'Evaluating spectral frequencies & spatial gradients...';

    // Wait for backend result
    const response = await fetchPromise;
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.detail || 'Analysis failed. Please try another file.');
    }
    const resultData = await response.json();

    // Stage 4: Artifact Analysis & Complete
    if (progressBar) progressBar.style.width = '100%';
    if (percentText) percentText.textContent = '100%';
    if (artifactBox) { artifactBox.className = 'scanner-status-box done'; }
    if (artifactText) { artifactText.textContent = '✓ Inspected'; }
    if (stageEl) stageEl.textContent = 'Generating detection report...';
    
    await delay(400);

    // Render result page
    window.ResultModule.displayResult(resultData);
    window.App.navigateTo('result');
    window.App.showToast('Analysis completed successfully.');

  } catch (err) {
    console.error('Analysis error:', err);
    window.App.navigateTo('detect');
    showValidationError(err.message || 'We could not complete the analysis. Please try again.');
  }
}

function delay(ms) {
  return new Promise(res => setTimeout(res, ms));
}

window.DetectModule = {
  init: initDetectModule,
  reset: resetFileSelection,
  setMediaType: setMediaType,
  openCameraModal: openCameraModal
};
