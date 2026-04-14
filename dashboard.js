// === Dashboard State ===
let messageType = 'single';
let trackCount = 0;
let allMessages = []; // Loaded from GitHub
let editingMessageId = null;

// === Lifecycle ===
window.onload = () => {
  // 1. Handle Magic Setup Link (?setup=true)
  handleMagicLink();

  // 2. Load Configuration (Priority: local-config.js > localStorage > Defaults)
  loadConfiguration();

  // 3. Initial UI state
  setMessageType('single');

  if (window.location.protocol === 'file:') {
    alert('⚠️ WARNING: Local file detected. Use "Live Server" for API requests to work.');
  }
};

function loadConfiguration() {
  const local = window.__LOCAL_CONFIG__ || {};
  
  // Defaults
  const defRepo = "Nathy-Dev/awp-media";
  const defPath = "sermons.json";
  const defItem = "attitude5";
  const defProxy = "https://cors-anywhere.herokuapp.com/";

  // Map fields (LocalStorage vs LocalConfig vs Defaults)
  const fields = {
    'ia-access': local.IA_ACCESS || localStorage.getItem('awpw_ia_access') || '',
    'ia-secret': local.IA_SECRET || localStorage.getItem('awpw_ia_secret') || '',
    'github-token': local.GITHUB_TOKEN || localStorage.getItem('awpw_github_token') || '',
    'github-repo': local.GITHUB_REPO || localStorage.getItem('awpw_gh_repo') || defRepo,
    'github-path': local.GITHUB_PATH || localStorage.getItem('awpw_gh_path') || defPath,
    'cors-proxy': local.CORS_PROXY || localStorage.getItem('awpw_cors_proxy') || defProxy,
    'ia-item': local.DEFAULT_IA_ITEM || defItem
  };

  // Populate UI
  for (const [id, value] of Object.entries(fields)) {
    const el = document.getElementById(id);
    if (el) el.value = value;
  }
}

function handleMagicLink() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('setup') === 'true') {
    const keys = {
      'awpw_ia_access': params.get('ia_access'),
      'awpw_ia_secret': params.get('ia_secret'),
      'awpw_github_token': params.get('gh_token'),
      'awpw_gh_repo': params.get('gh_repo'),
      'awpw_gh_path': params.get('gh_path'),
      'awpw_cors_proxy': params.get('cors')
    };

    for (const [key, val] of Object.entries(keys)) {
      if (val) localStorage.setItem(key, val);
    }

    // Clean URL
    window.history.replaceState({}, document.title, window.location.pathname);
    alert('✨ Magic Setup Successful! Credentials saved to browser.');
  }
}

// === UI Interactions ===

function copyMagicLink() {
  const base = window.location.origin + window.location.pathname;
  const access = document.getElementById('ia-access').value;
  const secret = document.getElementById('ia-secret').value;
  const token = document.getElementById('github-token').value;
  const repo = document.getElementById('github-repo').value;
  const path = document.getElementById('github-path').value;
  const proxy = document.getElementById('cors-proxy').value;

  const link = `${base}?setup=true&ia_access=${encodeURIComponent(access)}&ia_secret=${encodeURIComponent(secret)}&gh_token=${encodeURIComponent(token)}&gh_repo=${encodeURIComponent(repo)}&gh_path=${encodeURIComponent(path)}&cors=${encodeURIComponent(proxy)}`;
  
  navigator.clipboard.writeText(link).then(() => {
    alert('✨ Magic Setup Link copied! Share this privately with other admins.');
  });
}

function exportConfig() {
  const config = {
    IA_ACCESS: document.getElementById('ia-access').value,
    IA_SECRET: document.getElementById('ia-secret').value,
    GITHUB_TOKEN: document.getElementById('github-token').value,
    GITHUB_REPO: document.getElementById('github-repo').value,
    GITHUB_PATH: document.getElementById('github-path').value,
    CORS_PROXY: document.getElementById('cors-proxy').value,
    DEFAULT_IA_ITEM: document.getElementById('ia-item').value
  };

  const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'local-config-copy.json';
  a.click();
}

function toggleManager() {
  const section = document.getElementById('manager-section');
  const isHidden = section.style.display === 'none';
  section.style.display = isHidden ? 'block' : 'none';
  if (isHidden && allMessages.length === 0) fetchExistingMessages();
}

function setMessageType(type) {
  messageType = type;
  const singleBtn = document.getElementById('toggle-single');
  const seriesBtn = document.getElementById('toggle-series');
  const singleSection = document.getElementById('single-upload-section');
  const seriesSection = document.getElementById('series-upload-section');

  if (type === 'single') {
    singleBtn.classList.add('active');
    seriesBtn.classList.remove('active');
    singleSection.style.display = 'block';
    seriesSection.style.display = 'none';
    if (document.querySelectorAll('.track-item').length === 0) addTrackRow();
  } else {
    seriesBtn.classList.add('active');
    singleBtn.classList.remove('active');
    singleSection.style.display = 'none';
    seriesSection.style.display = 'block';
    if (document.querySelectorAll('.track-item').length === 0) addTrackRow();
  }
}

function addTrackRow(existingData = null) {
  trackCount++;
  const container = document.getElementById('tracks-list');
  const row = document.createElement('div');
  row.className = 'track-item';
  row.id = `track-row-${trackCount}`;
  
  const label = existingData ? existingData.label : '';
  const fileLabel = existingData ? 'Existing Track (File Linked)' : 'Select MP3';
  const fileStyle = existingData ? 'color: var(--success); font-weight: 600;' : '';
  const fileUrl = existingData ? existingData.file : '';

  row.innerHTML = `
    <div class="reorder-controls">
      <i class="fas fa-chevron-up reorder-btn" onclick="moveTrack(${trackCount}, -1)"></i>
      <i class="fas fa-chevron-down reorder-btn" onclick="moveTrack(${trackCount}, 1)"></i>
    </div>
    <div class="track-details">
      <div class="form-group" style="margin-bottom: 10px;">
        <label>Track Label</label>
        <input type="text" class="track-label" value="${label}" placeholder="e.g. Part 1: The Intro">
      </div>
      <div class="form-group" style="margin-bottom: 0;">
        <div class="file-input-wrapper" style="padding: 12px;">
          <i class="fas fa-music" style="font-size: 1rem; color: var(--text-dim);"></i>
          <span id="label-track-${trackCount}" style="font-size: 0.85rem; ${fileStyle}">${fileLabel}</span>
          <input type="file" class="track-file" accept="audio/*" data-existing-url="${fileUrl}" onchange="updateLabel(null, 'label-track-${trackCount}', this)">
        </div>
      </div>
    </div>
    <div class="track-remove" onclick="removeTrackRow(${trackCount})">
      <i class="fas fa-trash"></i>
    </div>
  `;
  container.appendChild(row);
}

function moveTrack(id, direction) {
  const row = document.getElementById(`track-row-${id}`);
  const container = document.getElementById('tracks-list');
  if (direction === -1 && row.previousElementSibling) {
    container.insertBefore(row, row.previousElementSibling);
  } else if (direction === 1 && row.nextElementSibling) {
    container.insertBefore(row.nextElementSibling, row);
  }
}

function removeTrackRow(id) {
  const row = document.getElementById(`track-row-${id}`);
  row.style.opacity = '0';
  row.style.transform = 'translateX(20px)';
  setTimeout(() => row.remove(), 200);
}

function updateLabel(dummy, labelId, inputElement) {
  const label = document.getElementById(labelId);
  const input = inputElement || document.getElementById(dummy);
  if (input.files.length > 0) {
    label.textContent = input.files[0].name;
    label.style.color = 'var(--accent)';
    label.style.fontWeight = '600';
  }
}

// === Management Logic ===

async function fetchExistingMessages() {
  const token = localStorage.getItem('awpw_gh_token');
  const repo = localStorage.getItem('awpw_gh_repo');
  const path = localStorage.getItem('awpw_gh_path');
  const proxy = localStorage.getItem('awpw_cors_proxy');
  
  if (!token || !repo) return;

  try {
    const finalUrl = getFinalUrl(`https://api.github.com/repos/${repo}/contents/${path}`, proxy);
    const res = await fetch(finalUrl, { headers: { 'Authorization': `Bearer ${token}`, 'Cache-Control': 'no-cache' } });
    if (res.ok) {
      const data = await res.json();
      allMessages = JSON.parse(b64_to_utf8(data.content));
      handleSearch(); // Refresh list
    }
  } catch (e) { console.error('Fetch failed', e); }
}

function handleSearch() {
  const query = document.getElementById('search-input').value.toLowerCase();
  const resultsContainer = document.getElementById('search-results');
  resultsContainer.innerHTML = '';

  const filtered = allMessages.filter(m => m.title.toLowerCase().includes(query)).slice(0, 10);

  filtered.forEach(m => {
    const div = document.createElement('div');
    div.className = 'search-result-item';
    div.innerHTML = `<span>${m.title}</span> <span class="search-result-category">${m.category}</span>`;
    div.onclick = () => loadMessageForEdit(m);
    resultsContainer.appendChild(div);
  });
}

function loadMessageForEdit(msg) {
  editingMessageId = msg.id;
  document.getElementById('msg-title').value = msg.title;
  document.getElementById('msg-category').value = msg.category;
  
  // Try to extract IA item name from track URLs or image URL
  const sampleUrl = msg.image || (msg.tracks[0] ? msg.tracks[0].file : '');
  const iaMatch = sampleUrl.match(/download\/([^/]+)/);
  if (iaMatch) document.getElementById('ia-item').value = iaMatch[1];

  // UI Updates
  document.getElementById('edit-badge').style.display = 'flex';
  document.getElementById('editing-title-badge').textContent = msg.title;
  document.getElementById('manager-section').style.display = 'none';
  
  setMessageType('series');
  document.getElementById('tracks-list').innerHTML = '';
  msg.tracks.forEach(t => addTrackRow(t));

  window.scrollTo({ top: 300, behavior: 'smooth' });
}

function cancelEdit() {
  editingMessageId = null;
  document.getElementById('edit-badge').style.display = 'none';
  document.getElementById('msg-title').value = '';
  document.getElementById('tracks-list').innerHTML = '';
  addTrackRow();
}

// === Main Execution Logic ===

async function handleDashboardSubmit() {
  const title = document.getElementById('msg-title').value;
  const category = document.getElementById('msg-category').value;
  const itemName = document.getElementById('ia-item').value;
  const coverFileInput = document.getElementById('msg-cover');
  const coverFile = coverFileInput.files[0];

  const iaAccess = localStorage.getItem('awpw_ia_access');
  const iaSecret = localStorage.getItem('awpw_ia_secret');
  const ghToken = localStorage.getItem('awpw_gh_token');
  const ghRepo = localStorage.getItem('awpw_gh_repo');
  const ghPath = localStorage.getItem('awpw_gh_path');
  const corsProxy = localStorage.getItem('awpw_cors_proxy');

  if (!title || !itemName) { alert('Fill basic info.'); return; }
  
  const trackItems = document.querySelectorAll('.track-item');
  let tracksFinal = [];
  let tracksToUpload = [];

  trackItems.forEach(item => {
    const fileInput = item.querySelector('.track-file');
    const labelInput = item.querySelector('.track-label');
    const existingUrl = fileInput.getAttribute('data-existing-url');
    const newFile = fileInput.files[0];

    if (newFile) {
        tracksToUpload.push({ file: newFile, label: labelInput.value });
        // Temporary placeholder for the result
        tracksFinal.push({ label: labelInput.value, isNew: true, fileName: newFile.name });
    } else if (existingUrl) {
        tracksFinal.push({ label: labelInput.value, file: existingUrl });
    }
  });

  if (tracksFinal.length === 0) { alert('No tracks provided.'); return; }

  const statusBox = document.getElementById('status-box');
  const statusText = document.getElementById('status-text');
  const progressContainer = document.getElementById('progress-container');
  const progressFill = document.getElementById('progress-fill');
  const progressPercent = document.getElementById('progress-percent');
  const submitBtn = document.getElementById('submit-btn');

  statusBox.className = 'status-area status-loading';
  progressContainer.style.display = 'block';
  progressPercent.style.display = 'inline';
  submitBtn.disabled = true;

  try {
    // 1. Handle Cover Art
    let finalCoverUrl = "";
    if (editingMessageId && !coverFile) {
        // Reuse existing cover
        const msg = allMessages.find(m => m.id === editingMessageId);
        finalCoverUrl = msg ? msg.image : "";
    } else if (coverFile) {
        statusText.textContent = 'Uploading New Cover Art...';
        finalCoverUrl = await uploadToIA(coverFile, itemName, coverFile.name, iaAccess, iaSecret, corsProxy);
    } else {
        alert('Cover art required for new messages.'); throw new Error('Missing cover art');
    }
    updateProgress(15, 'Cover processed.');

    // 2. Upload New Tracks
    for (let i = 0; i < tracksToUpload.length; i++) {
        const t = tracksToUpload[i];
        statusText.textContent = `Uploading New Track: ${t.label}...`;
        const url = await uploadToIA(t.file, itemName, t.file.name, iaAccess, iaSecret, corsProxy);
        
        // Find matching item in tracksFinal and update URL
        const finalRef = tracksFinal.find(tf => tf.isNew && tf.fileName === t.file.name && tf.label === t.label);
        if (finalRef) {
            finalRef.file = url;
            delete finalRef.isNew;
            delete finalRef.fileName;
        }

        const p = 15 + ((i + 1) / tracksToUpload.length * 70);
        updateProgress(p, `Uploaded ${i+1}/${tracksToUpload.length} new tracks.`);
    }

    // 3. Update GitHub
    statusText.textContent = 'Updating Database...';
    const finalEntry = {
      id: editingMessageId || (itemName + '-' + Date.now()),
      title: title,
      category: category,
      image: finalCoverUrl,
      tracks: tracksFinal.map(({label, file}) => ({label, file}))
    };

    await updateGitHubJSON(finalEntry, ghToken, ghRepo, ghPath, corsProxy, editingMessageId);
    
    updateProgress(100, '✨ Done!');
    statusBox.className = 'status-area status-success';
    statusText.textContent = '✨ Message Saved! Refreshing in 3s...';
    setTimeout(() => location.reload(), 3000);

  } catch (error) {
    console.error(error);
    statusBox.className = 'status-area status-error';
    statusText.textContent = '❌ Error: ' + error.message;
    submitBtn.disabled = false;
  }
}

function updateProgress(percent, text) {
  document.getElementById('progress-fill').style.width = `${percent}%`;
  document.getElementById('progress-percent').textContent = `${Math.round(percent)}%`;
}

async function uploadToIA(file, itemName, fileName, access, secret, proxy) {
  const safeFileName = fileName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9.\-_]/g, '');
  const url = getFinalUrl(`https://s3.us.archive.org/${itemName}/${safeFileName}`, proxy);
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Authorization': `LOW ${access}:${secret}`, 'x-archive-auto-make-bucket': '1' },
    body: file
  });
  if (!res.ok) throw new Error('IA Upload failed');
  return `https://archive.org/download/${itemName}/${safeFileName}`;
}

async function updateGitHubJSON(newEntry, token, fullRepo, path, proxy, updateId) {
  const url = getFinalUrl(`https://api.github.com/repos/${fullRepo}/contents/${path}`, proxy);
  const getRes = await fetch(url, { headers: { 'Authorization': `Bearer ${token}`, 'Cache-Control': 'no-cache' } });
  const data = await getRes.json();
  let content = JSON.parse(b64_to_utf8(data.content));

  if (updateId) {
    const idx = content.findIndex(m => m.id === updateId);
    if (idx !== -1) content[idx] = newEntry;
    else content.unshift(newEntry);
  } else {
    content.unshift(newEntry);
  }

  const putRes = await fetch(url, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({
      message: `Admin: ${updateId ? 'Updated' : 'Added'} "${newEntry.title}"`,
      content: utf8_to_b64(JSON.stringify(content, null, 2)),
      sha: data.sha
    })
  });
  if (!putRes.ok) throw new Error('GitHub Save failed');
  return true;
}

let titleClicks = 0;
let clickTimer = null;

function handleTitleClick() {
  titleClicks++;
  clearTimeout(clickTimer);
  
  if (titleClicks === 5) {
    const section = document.getElementById('credential-section');
    section.style.display = section.style.display === 'none' ? 'block' : 'none';
    titleClicks = 0;
    if (section.style.display === 'block') {
        alert('🔓 Admin Setup Mode Active');
    }
  }

  clickTimer = setTimeout(() => {
    titleClicks = 0;
  }, 1000); // Reset clicks after 1 second of inactivity
}

function saveCredentials() {
  localStorage.setItem('awpw_ia_access', document.getElementById('ia-access').value.trim());
  localStorage.setItem('awpw_ia_secret', document.getElementById('ia-secret').value.trim());
  localStorage.setItem('awpw_github_token', document.getElementById('github-token').value.trim());
  localStorage.setItem('awpw_gh_repo', document.getElementById('github-repo').value.trim());
  localStorage.setItem('awpw_gh_path', document.getElementById('github-path').value.trim());
  localStorage.setItem('awpw_cors_proxy', document.getElementById('cors-proxy').value.trim());
  alert('✨ Credentials saved locally!');
  document.getElementById('credential-section').style.display = 'none'; // Hide again
}

async function testGitHubConnection() { 
    const repo = document.getElementById('github-repo').value;
    const path = document.getElementById('github-path').value;
    const token = document.getElementById('github-token').value;
    const proxy = document.getElementById('cors-proxy').value;
    const res = await fetch(getFinalUrl(`https://api.github.com/repos/${repo}/contents/${path}`, proxy), { headers: { 'Authorization': `Bearer ${token}` } });
    alert(res.ok ? '✅ GitHub Connection Successful!' : '❌ GitHub Connection Failed');
}

async function testIAConnection() {
    const access = document.getElementById('ia-access').value;
    const secret = document.getElementById('ia-secret').value;
    const proxy = document.getElementById('cors-proxy').value;
    const res = await fetch(getFinalUrl(`https://s3.us.archive.org/ping/ping.txt`, proxy), { method: 'PUT', headers: { 'Authorization': `LOW ${access}:${secret}`, 'x-archive-auto-make-bucket': '1' }, body: 'ping' });
    alert(res.ok ? '✅ Archive.org Connection Successful!' : '❌ IA Connection Failed');
}

function b64_to_utf8(str) { return decodeURIComponent(escape(window.atob(str.replace(/\s/g, '')))); }
function utf8_to_b64(str) { return window.btoa(unescape(encodeURIComponent(str))); }

function getFinalUrl(rawUrl, proxy) {
  if (!proxy) return rawUrl;
  
  // If the proxy uses a query parameter style (like corsproxy.io)
  if (proxy.includes('?url=')) {
    return proxy + encodeURIComponent(rawUrl);
  }
  
  // If the proxy is a simple prefix (like cors-anywhere)
  // Ensure we have a single slash between them
  const cleanProxy = proxy.replace(/\/$/, '');
  const cleanUrl = rawUrl.replace(/^\//, '');
  return `${cleanProxy}/${cleanUrl}`;
}
