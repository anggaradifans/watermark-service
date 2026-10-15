const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const fileInfo = document.getElementById('file-info');
const processBtn = document.getElementById('process-btn');
const watermarkText = document.getElementById('watermark-text');

const resultSection = document.getElementById('result-section');
const previewImage = document.getElementById('preview-image');
const previewPdf = document.getElementById('preview-pdf');
const downloadLink = document.getElementById('download-link');
const resetBtn = document.getElementById('reset-btn');

let selectedFile = null;

// Event Listeners for Drag & Drop
dropZone.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  
  if (e.dataTransfer.files.length) {
    handleFileSelect(e.dataTransfer.files[0]);
  }
});

fileInput.addEventListener('change', (e) => {
  if (e.target.files.length) {
    handleFileSelect(e.target.files[0]);
  }
});

function isPdf(file) {
  return file.type === 'application/pdf';
}

function handleFileSelect(file) {
  if (!file.type.startsWith('image/') && !isPdf(file)) {
    alert('Please upload an image or PDF file.');
    return;
  }
  
  selectedFile = file;
  fileInfo.textContent = `Selected: ${file.name}`;
  processBtn.disabled = false;
  
  // Hide previous results if any
  resultSection.classList.add('hidden');
}

processBtn.addEventListener('click', async () => {
  if (!selectedFile) return;

  const text = watermarkText.value.trim() || 'FOTOCOPY';
  const formData = new FormData();
  formData.append('image', selectedFile);
  formData.append('text', text);

  // UI Loading State
  processBtn.classList.add('loading');
  processBtn.disabled = true;

  try {
    const response = await fetch('/api/watermark', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || 'Processing failed');
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    
    // Show Result
    const pdf = isPdf(selectedFile);
    previewImage.classList.toggle('hidden', pdf);
    previewPdf.classList.toggle('hidden', !pdf);
    if (pdf) {
      previewPdf.src = url;
    } else {
      previewImage.src = url;
    }
    downloadLink.href = url;
    
    // Blob URLs don't carry the server's filename, so copy it from the response header
    const disposition = response.headers.get('Content-Disposition') || '';
    const match = disposition.match(/filename="([^"]+)"/);
    downloadLink.download = match ? match[1] : '';
    
    resultSection.classList.remove('hidden');
    resultSection.scrollIntoView({ behavior: 'smooth' });

  } catch (error) {
    console.error(error);
    alert(`Something went wrong: ${error.message}`);
  } finally {
    processBtn.classList.remove('loading');
    processBtn.disabled = false;
  }
});

resetBtn.addEventListener('click', () => {
  selectedFile = null;
  fileInput.value = '';
  fileInfo.textContent = '';
  processBtn.disabled = true;
  resultSection.classList.add('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
});
