// === Dashboard Logic ===

function toggleCredentials() {
  const form = document.getElementById('credentials-form');
  form.style.display = form.style.display === 'none' ? 'block' : 'none';
}

function saveCredentials() {
  const iaAccess = document.getElementById('ia-access').value.trim();
  const iaSecret = document.getElementById('ia-secret').value.trim();
  const ghToken = document.getElementById('github-token').value.trim();
  const ghRepo = document.getElementById('github-repo').value.trim();
  const ghPath = document.getElementById('github-path').value.trim() || 'awp-media/sermons.json';
  const corsProxy = document.getElementById('cors-proxy').value.trim() || '';

  localStorage.setItem('awpw_ia_access', iaAccess);
  localStorage.setItem('awpw_ia_secret', iaSecret);
  localStorage.setItem('awpw_gh_token', ghToken);
  localStorage.setItem('awpw_gh_repo', ghRepo);
  localStorage.setItem('awpw_gh_path', ghPath);
  localStorage.setItem('awpw_cors_proxy', corsProxy);

  alert('Credentials saved locally!');
  toggleCredentials();
}

// Load credentials on startup
window.onload = () => {
  document.getElementById('ia-access').value = localStorage.getItem('awpw_ia_access') || '';
  document.getElementById('ia-secret').value = localStorage.getItem('awpw_ia_secret') || '';
  document.getElementById('github-token').value = localStorage.getItem('awpw_gh_token') || '';
  document.getElementById('github-repo').value = localStorage.getItem('awpw_gh_repo') || '';
  document.getElementById('github-path').value = localStorage.getItem('awpw_gh_path') || 'awp-media/sermons.json';
  document.getElementById('cors-proxy').value = localStorage.getItem('awpw_cors_proxy') || 'https://cors-anywhere.herokuapp.com/';

  if (window.location.protocol === 'file:') {
    alert('⚠️ WARNING: You are running this dashboard as a local file. API requests will be blocked by the browser. Please use a local server like "Live Server" or push to GitHub and access it via HTTPS.');
  }
};

function updateLabel(inputId, labelId) {
  const input = document.getElementById(inputId);
  const label = document.getElementById(labelId);
  if (input.files.length > 0) {
    label.textContent = input.files[0].name;
    label.style.color = '#47A9FF';
  }
}

// --- Helper Functions ---

function getFinalUrl(rawUrl, proxy) {
  if (!proxy) return rawUrl;
  return proxy.replace(/\/$/, '') + '/' + rawUrl;
}

// Robust UTF-8 Base64 Helpers
function utf8_to_b64(str) {
  return window.btoa(unescape(encodeURIComponent(str)));
}
function b64_to_utf8(str) {
  return decodeURIComponent(escape(window.atob(str.replace(/\s/g, ''))));
}

// --- Connectivity Tests ---

async function testGitHubConnection() {
  const token = localStorage.getItem('awpw_gh_token');
  const repo = localStorage.getItem('awpw_gh_repo');
  const path = (localStorage.getItem('awpw_gh_path') || 'awp-media/sermons.json').trim();
  const proxy = localStorage.getItem('awpw_cors_proxy');
  
  if (!token || !repo) { alert('Please save GitHub credentials first.'); return; }
  
  try {
    const rawUrl = `https://api.github.com/repos/${repo}/contents/${path}`;
    const finalUrl = getFinalUrl(rawUrl, proxy);

    const res = await fetch(finalUrl, {
      headers: { 
        'Authorization': `Bearer ${token}`, // Use Bearer for modern PATs
        'Cache-Control': 'no-cache'
      }
    });

    if (res.ok) {
      const data = await res.json();
      alert(`✅ GitHub Connection Successful (via ${proxy ? 'Proxy' : 'Direct'})!\nFile Path Found: ${data.path}\nSize: ${data.size} bytes`);
    } else {
      const err = await res.json();
      console.log('GitHub API Error:', res.status, err);
      alert(`❌ GitHub Error (${res.status}): ${err.message}\n\nTip: Check repo name ("username/repo") and file path ("folder/file.json").`);
    }
  } catch (e) {
    console.error('GitHub Connection Error:', e);
    alert(`❌ GitHub Connection Failed: ${e.message}\n\nTip: Try re-enabling your CORS proxy.`);
  }
}

async function testIAConnection() {
  const access = localStorage.getItem('awpw_ia_access');
  const secret = localStorage.getItem('awpw_ia_secret');
  const proxy = localStorage.getItem('awpw_cors_proxy');
  const testItem = document.getElementById('ia-item').value || 'awpw-test-connection';

  if (!access || !secret) { alert('Please save IA credentials first.'); return; }

  try {
    const rawUrl = `https://s3.us.archive.org/${testItem}/test-ping.txt`;
    const finalUrl = getFinalUrl(rawUrl, proxy);
    
    const res = await fetch(finalUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `LOW ${access}:${secret}`,
        'x-archive-auto-make-bucket': '1',
        'Content-Type': 'text/plain'
      },
      body: 'ping'
    });

    if (res.ok) {
      alert('✅ Archive.org S3 Connection Successful!');
    } else {
      const text = await res.text();
      console.log("IA Response Error:", res.status, text);
      alert(`❌ IA Error: ${res.status} ${res.statusText}\n${text}`);
    }
  } catch (e) {
    alert(`❌ IA Connection Failed: ${e.message}\n\nTIP: Visit your CORS proxy URL once to click "Request temporary access".`);
  }
}

// --- Main Upload Logic ---

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
  const ghPath = localStorage.getItem('awpw_gh_path');
  const corsProxy = localStorage.getItem('awpw_cors_proxy');

  const statusBox = document.getElementById('status-box');
  const statusText = document.getElementById('status-text');
  const progressContainer = document.getElementById('progress-container');
  const progressFill = document.getElementById('progress-fill');
  const progressPercent = document.getElementById('progress-percent');

  if (!title || !itemName || !coverFile || !msgFile) {
    alert('Please fill all message fields and select both files.');
    return;
  }
  if (!iaAccess || !iaSecret || !ghToken || !ghRepo || !ghPath) {
    alert('Please setup and save all API credentials first.');
    return;
  }

  statusBox.className = 'status-area status-loading';
  statusText.textContent = 'Initializing upload process...';
  progressContainer.style.display = 'block';

  try {
    // 1. Upload Cover Image to IA
    statusText.textContent = `[Step 1/3] Uploading Cover Art to Archive.org...`;
    const coverUrl = await uploadToIA(coverFile, itemName, coverFile.name, iaAccess, iaSecret, corsProxy);
    progressFill.style.width = '35%';
    progressPercent.textContent = '35%';

    // 2. Upload MP3 to IA
    statusText.textContent = `[Step 2/3] Uploading Audio File (Large file, please wait)...`;
    const audioUrl = await uploadToIA(msgFile, itemName, msgFile.name, iaAccess, iaSecret, corsProxy);
    progressFill.style.width = '75%';
    progressPercent.textContent = '75%';

    // 3. Update sermons.json on GitHub
    statusText.textContent = `[Step 3/3] Updating sermons.json database on GitHub...`;
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
    
    await updateGitHubJSON(newSermon, ghToken, ghRepo, ghPath, corsProxy);
    
    progressFill.style.width = '100%';
    progressPercent.textContent = '100%';
    statusBox.className = 'status-area status-success';
    statusText.textContent = '✨ Success! Message uploaded and database updated. Site will reflect changes in 2-5 minutes.';

  } catch (error) {
    console.error('Final Step Error:', error);
    statusBox.className = 'status-area status-error';
    statusText.textContent = '❌ Error: ' + error.message;
  }
}

async function uploadToIA(file, itemName, fileName, access, secret, proxy) {
  const safeFileName = fileName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9.\-_]/g, '');
  const rawUrl = `https://s3.us.archive.org/${itemName}/${safeFileName}`;
  const finalUrl = getFinalUrl(rawUrl, proxy);

  const response = await fetch(finalUrl, {
    method: 'PUT',
    headers: {
      'Authorization': `LOW ${access}:${secret}`,
      'x-archive-auto-make-bucket': '1',
      'x-archive-queue-derive': '0',
      'x-archive-meta01-access-control-allow-origin': '*',
      'Content-Type': file.type
    },
    body: file
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Archive.org upload failed (${response.status}): ${response.statusText}`);
  }

  return `https://archive.org/download/${itemName}/${safeFileName}`;
}

async function updateGitHubJSON(newEntry, token, fullRepo, path, proxy) {
  const rawUrl = `https://api.github.com/repos/${fullRepo}/contents/${path}`;
  const finalUrl = getFinalUrl(rawUrl, proxy);

  // 1. Get current file content
  const getResponse = await fetch(finalUrl, {
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Cache-Control': 'no-cache'
    }
  });

  if (!getResponse.ok) {
    throw new Error(`GitHub 404: "sermons.json" not found at "${path}". Check your Repository Path setting.`);
  }

  const data = await getResponse.json();
  const sha = data.sha;
  
  let currentContent;
  try {
    currentContent = JSON.parse(b64_to_utf8(data.content));
  } catch (e) {
    throw new Error('Failed to parse database content from GitHub.');
  }

  // 2. Append new entry
  currentContent.unshift(newEntry);

  // 3. Commit back
  const updatedContentBase64 = utf8_to_b64(JSON.stringify(currentContent, null, 2));
  
  const putResponse = await fetch(finalUrl, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: `Admin: Added message "${newEntry.title}"`,
      content: updatedContentBase64,
      sha: sha
    })
  });

  if (!putResponse.ok) {
    const err = await putResponse.json();
    throw new Error(`GitHub Save Error (${putResponse.status}): ${err.message}`);
  }

  return true;
}
