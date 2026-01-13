const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const fileInfo = document.getElementById('file-info');
const processBtn = document.getElementById('process-btn');
const watermarkText = document.getElementById('watermark-text');

const resultSection = document.getElementById('result-section');
const previewImage = document.getElementById('preview-image');
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

function handleFileSelect(file) {
  if (!file.type.startsWith('image/')) {
    alert('Please upload an image file.');
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
      throw new Error('Processing failed');
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    
    // Show Result
    previewImage.src = url;
    downloadLink.href = url;
    
    // Set a nice default name for download (though server sets this too, valid for direct link click)
    // We can just rely on the browser handling the blob download or hint the name
    // downloadLink.download is set in HTML, let's update it dynamically if we want
    // But blob URLs don't always carry the filename cleanly unless clicked.
    
    resultSection.classList.remove('hidden');
    resultSection.scrollIntoView({ behavior: 'smooth' });

  } catch (error) {
    console.error(error);
    alert('Something went wrong. Please try again.');
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
