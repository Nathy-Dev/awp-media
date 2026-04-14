// === Dashboard State ===
let messageType = 'single';
let trackCount = 0;
let allMessages = []; // Loaded from GitHub
let editingMessageId = null;

// === Lifecycle ===
window.onload = () => {
  // Load saved credentials
  document.getElementById('ia-access').value = localStorage.getItem('awpw_ia_access') || '';
  document.getElementById('ia-secret').value = localStorage.getItem('awpw_ia_secret') || '';
  document.getElementById('github-token').value = localStorage.getItem('awpw_gh_token') || '';
  document.getElementById('github-repo').value = localStorage.getItem('awpw_gh_repo') || '';
  document.getElementById('github-path').value = localStorage.getItem('awpw_gh_path') || 'sermons.json';
  document.getElementById('cors-proxy').value = localStorage.getItem('awpw_cors_proxy') || 'https://cors-anywhere.herokuapp.com/';

  // Initial UI state
  setMessageType('single');

  if (window.location.protocol === 'file:') {
    alert('⚠️ WARNING: Local file detected. Use "Live Server" for API requests to work.');
  }
};

// === UI Interactions ===

function toggleCredentials() {
  const form = document.getElementById('credentials-form');
  const isHidden = form.style.display === 'none';
  form.style.display = isHidden ? 'block' : 'none';
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

function saveCredentials() { /* Re-implementing helper to avoid mismatch */
  localStorage.setItem('awpw_ia_access', document.getElementById('ia-access').value.trim());
  localStorage.setItem('awpw_ia_secret', document.getElementById('ia-secret').value.trim());
  localStorage.setItem('awpw_github_token', document.getElementById('github-token').value.trim());
  localStorage.setItem('awpw_gh_repo', document.getElementById('github-repo').value.trim());
  localStorage.setItem('awpw_gh_path', document.getElementById('github-path').value.trim());
  localStorage.setItem('awpw_cors_proxy', document.getElementById('cors-proxy').value.trim());
  alert('Saved!'); toggleCredentials();
}

async function testGitHubConnection() { /* minimal implementation */
    const res = await fetch(getFinalUrl(`https://api.github.com/repos/${localStorage.getItem('awpw_gh_repo')}/contents/${localStorage.getItem('awpw_gh_path')}`, localStorage.getItem('awpw_cors_proxy')), { headers: { 'Authorization': `Bearer ${localStorage.getItem('awpw_gh_token')}` } });
    alert(res.ok ? '✅ OK' : '❌ Failed');
}

async function testIAConnection() { /* minimal implementation */
    const res = await fetch(getFinalUrl(`https://s3.us.archive.org/ping/ping.txt`, localStorage.getItem('awpw_cors_proxy')), { method: 'PUT', headers: { 'Authorization': `LOW ${localStorage.getItem('awpw_ia_access')}:${localStorage.getItem('awpw_ia_secret')}`, 'x-archive-auto-make-bucket': '1' }, body: 'ping' });
    alert(res.ok ? '✅ OK' : '❌ Failed');
}

function b64_to_utf8(str) { return decodeURIComponent(escape(window.atob(str.replace(/\s/g, '')))); }
function utf8_to_b64(str) { return window.btoa(unescape(encodeURIComponent(str))); }
function getFinalUrl(url, proxy) { return proxy ? proxy.replace(/\/$/, '') + '/' + url : url; }
