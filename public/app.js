// public/app.js
const fileInput = document.getElementById("file");
const startBtn  = document.getElementById("start");
const statusBox = document.getElementById("status");
const videoPreview = document.getElementById("videoPreview");
const previewVideo = document.getElementById("previewVideo");
const fileLabel = document.querySelector(".file-input-label");

fileInput.addEventListener("change", () => {
  const file = fileInput.files?.[0];
  startBtn.disabled = !file;
  
  if (file) {
    // Update label style
    fileLabel.classList.add("has-file");
    fileLabel.innerHTML = `
      <i class="fas fa-check-circle"></i>
      <span>${file.name}</span>
      <small>${(file.size / (1024 * 1024)).toFixed(1)} MB</small>
    `;
    
    // Show video preview
    const videoURL = URL.createObjectURL(file);
    previewVideo.src = videoURL;
    previewVideo.style.display = "block";
    videoPreview.querySelector(".placeholder-content").style.display = "none";
    
    // Clear status
    statusBox.innerHTML = "";
    statusBox.className = "status-card";
  } else {
    // Reset UI
    fileLabel.classList.remove("has-file");
    fileLabel.innerHTML = `
      <i class="fas fa-plus"></i>
      <span>Choose MP4 file</span>
      <small>Maximum 12 MB</small>
    `;
    
    previewVideo.style.display = "none";
    videoPreview.querySelector(".placeholder-content").style.display = "flex";
    if (previewVideo.src) {
      URL.revokeObjectURL(previewVideo.src);
    }
  }
});

startBtn.addEventListener("click", async () => {
  const file = fileInput.files?.[0];
  if (!file) return;

  try {
    // Update button state
    startBtn.disabled = true;
    startBtn.innerHTML = `
      <i class="fas fa-spinner fa-spin"></i>
      <span>Processing...</span>
    `;
    
    // Update status
    statusBox.textContent = 'Uploading your video...';
    statusBox.className = 'status-card processing';
    
    const fd = new FormData();
    fd.append('file', file);

    // 1) Upload
    const upRes = await fetch('/api/subtitle', { method: 'POST', body: fd });
    const upData = await upRes.json();
    if (!upRes.ok) {
      throw new Error(upData?.error || 'Upload failed');
    }

    // Update status
    statusBox.textContent = `✓ Uploaded successfully! Generating subtitles with AI...`;

    // 2) Process
    const body = new URLSearchParams();
    body.set('filename', upData.filename);

    const procRes = await fetch(`/api/subtitle/${encodeURIComponent(upData.id)}/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString()
    });
    const procData = await procRes.json();

    if (!procRes.ok || !procData.ok) {
      throw new Error(procData?.error || 'Process failed');
    }

    // Success - show download links
    statusBox.className = 'status-card success';
    statusBox.innerHTML = `
      <div style="text-align: center;">
        <div style="display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin-bottom: 1rem;">
          <i class="fas fa-check-circle" style="color: var(--success); font-size: 1.25rem;"></i>
          <strong>Processing Complete!</strong>
        </div>
        <div class="download-links">
          <a href="${procData.downloadUrl}" class="download-link">
            <i class="fas fa-download"></i>
            Download Video with Subtitles
          </a>
          <a href="${procData.txtUrl}" class="download-link">
            <i class="fas fa-file-text"></i>
            Download Subtitle File
          </a>
        </div>
      </div>
    `;

  } catch (e) {
    statusBox.textContent = `❌ Error: ${e.message}`;
    statusBox.className = 'status-card error';
  } finally {
    // Reset button
    startBtn.disabled = false;
    startBtn.innerHTML = `
      <i class="fas fa-magic"></i>
      <span>Generate Subtitles</span>
    `;
  }
});
