// public/app.js
const fileInput = document.getElementById("file");
const startBtn  = document.getElementById("start");
const statusBox = document.getElementById("status");

fileInput.addEventListener("change", () => {
  startBtn.disabled = !fileInput.files?.[0];
});

startBtn.addEventListener("click", async () => {
  const file = fileInput.files?.[0];
  if (!file) return;

  try {
    statusBox.textContent = 'Uploading...';
    const fd = new FormData();
    fd.append('file', file);

    // 1) Upload
    const upRes = await fetch('/api/subtitle', { method: 'POST', body: fd });
    const upData = await upRes.json();
    if (!upRes.ok) {
      statusBox.textContent = `Error: ${upData?.error || 'Upload failed'}`;
      return;
    }

    // Mostrar exactamente lo que devuelve el server
    statusBox.textContent = `Uploaded (id=${upData.id}, filename=${upData.filename}). Processing...`;

    // 2) Process (enviamos id y filename por robustez)
    const body = new URLSearchParams();
    body.set('filename', upData.filename);

    const procRes = await fetch(`/api/subtitle/${encodeURIComponent(upData.id)}/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString()
    });
    const procData = await procRes.json();

    if (!procRes.ok || !procData.ok) {
      statusBox.textContent = `Error: ${procData?.error || 'Process failed'}`;
      return;
    }

    statusBox.innerHTML = `
      <div style="margin-top: 1rem;">
        <strong>✓ Done!</strong> 
        <div style="margin-top: 0.8rem; display: flex; flex-direction: column; gap: 0.5rem;">
          <a href="${procData.downloadUrl}" class="download-link">🎥 Download Video (MP4)</a>
          <a href="${procData.txtUrl}" class="download-link">📄 Download Subtitles (TXT)</a>
        </div>
      </div>
    `;

  } catch (e) {
    statusBox.textContent = `Error: ${e.message}`;
  }
});
