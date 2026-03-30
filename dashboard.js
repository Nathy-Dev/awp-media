// === Dashboard Logic ===

function toggleCredentials() {
  const form = document.getElementById('credentials-form');
  form.style.display = form.style.display === 'none' ? 'block' : 'none';
}

function saveCredentials() {
  const iaAccess = document.getElementById('ia-access').value;
  const iaSecret = document.getElementById('ia-secret').value;
  const ghToken = document.getElementById('github-token').value;
  const ghRepo = document.getElementById('github-repo').value;

  localStorage.setItem('awpw_ia_access', iaAccess);
  localStorage.setItem('awpw_ia_secret', iaSecret);
  localStorage.setItem('awpw_gh_token', ghToken);
  localStorage.setItem('awpw_gh_repo', ghRepo);

  alert('Credentials saved locally!');
  toggleCredentials();
}

// Load credentials on startup
window.onload = () => {
  document.getElementById('ia-access').value = localStorage.getItem('awpw_ia_access') || '';
  document.getElementById('ia-secret').value = localStorage.getItem('awpw_ia_secret') || '';
  document.getElementById('github-token').value = localStorage.getItem('awpw_gh_token') || '';
  document.getElementById('github-repo').value = localStorage.getItem('awpw_gh_repo') || '';
};

function updateLabel(inputId, labelId) {
  const input = document.getElementById(inputId);
  const label = document.getElementById(labelId);
  if (input.files.length > 0) {
    label.textContent = input.files[0].name;
    label.style.color = '#47A9FF';
  }
}

async function handleDashboardSubmit() {
  const title = document.getElementById('msg-title').value;
  const category = document.getElementById('msg-category').value;
  const itemName = document.getElementById('ia-item').value;
  const coverFile = document.getElementById('msg-cover').files[0];
  const msgFile = document.getElementById('msg-file').files[0];

  const iaAccess = localStorage.getItem('awpw_ia_access');
  const iaSecret = localStorage.getItem('awpw_ia_secret');
  const ghToken = localStorage.getItem('awpw_gh_token');
  const ghRepo = localStorage.getItem('awpw_gh_repo');

  const statusBox = document.getElementById('status-box');
  const statusText = document.getElementById('status-text');
  const progressContainer = document.getElementById('progress-container');
  const progressFill = document.getElementById('progress-fill');
  const progressPercent = document.getElementById('progress-percent');

  if (!title || !itemName || !coverFile || !msgFile || !iaAccess || !iaSecret || !ghToken || !ghRepo) {
    alert('Please fill all fields and setup credentials first.');
    return;
  }

  statusBox.className = 'status-area status-loading';
  statusText.textContent = 'Initializing upload process...';
  progressContainer.style.display = 'block';

  try {
    // 1. Upload Cover Image to IA
    statusText.textContent = `Uploading Cover Art to Archive.org...`;
    const coverUrl = await uploadToIA(coverFile, itemName, coverFile.name, iaAccess, iaSecret);
    progressFill.style.width = '30%';
    progressPercent.textContent = '30%';

    // 2. Upload MP3 to IA
    statusText.textContent = `Uploading Audio File to Archive.org (This may take a while)...`;
    const audioUrl = await uploadToIA(msgFile, itemName, msgFile.name, iaAccess, iaSecret);
    progressFill.style.width = '70%';
    progressPercent.textContent = '70%';

    // 3. Update sermons.json on GitHub
    statusText.textContent = `Updating sermons.json on GitHub...`;
    const newSermon = {
      id: itemName + '-' + Date.now(),
      title: title,
      category: category,
      image: coverUrl,
      tracks: [
        {
          label: title,
          file: audioUrl
        }
      ]
    };
    
    await updateGitHubJSON(newSermon, ghToken, ghRepo);
    
    progressFill.style.width = '100%';
    progressPercent.textContent = '100%';
    statusBox.className = 'status-area status-success';
    statusText.textContent = 'Success! Message uploaded and site updated. It may take a few minutes for GitHub Pages to reflect the changes.';

  } catch (error) {
    console.error(error);
    statusBox.className = 'status-area status-error';
    statusText.textContent = 'Error: ' + error.message;
  }
}

async function uploadToIA(file, itemName, fileName, access, secret) {
  const url = `https://s3.us.archive.org/${itemName}/${fileName}`;
  
  // Clean filename for URL
  const safeFileName = fileName.replace(/\s+/g, '_');
  const targetUrl = `https://s3.us.archive.org/${itemName}/${safeFileName}`;

  const response = await fetch(targetUrl, {
    method: 'PUT',
    headers: {
      'Authorization': `LOW ${access}:${secret}`,
      'x-archive-auto-make-bucket': '1',
      'x-archive-queue-derive': '0',
      'Content-Type': file.type
    },
    body: file
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Archive.org upload failed: ${response.statusText} - ${errorText}`);
  }

  // IA URL pattern: https://archive.org/download/{item}/{file}
  return `https://archive.org/download/${itemName}/${safeFileName}`;
}

async function updateGitHubJSON(newEntry, token, fullRepo) {
  // path for sermons.json in repo
  const filePath = 'awp-media/sermons.json';
  const apiUrl = `https://api.github.com/repos/${fullRepo}/contents/${filePath}`;

  // 1. Get current file content
  const getResponse = await fetch(apiUrl, {
    headers: { 'Authorization': `token ${token}` }
  });

  if (!getResponse.ok) {
    throw new Error('Failed to fetch sermons.json from GitHub.');
  }

  const data = await getResponse.json();
  const sha = data.sha;
  const currentContent = JSON.parse(atob(data.content));

  // 2. Append new entry
  currentContent.unshift(newEntry); // Add to beginning

  // 3. Commit back
  const updatedContentBase64 = btoa(unescape(encodeURIComponent(JSON.stringify(currentContent, null, 2))));
  
  const putResponse = await fetch(apiUrl, {
    method: 'PUT',
    headers: {
      'Authorization': `token ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: `Added new message: ${newEntry.title}`,
      content: updatedContentBase64,
      sha: sha
    })
  });

  if (!putResponse.ok) {
    const err = await putResponse.json();
    throw new Error('GitHub update failed: ' + (err.message || 'unknown error'));
  }

  return true;
}
