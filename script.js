// === Global Variables ===
const nav = document.getElementById("navLinks");
const toggle = document.querySelector(".menu-toggle");
const main = document.querySelector(".main-content");
const closeMenu = document.querySelector(".closeMenu");
const searchInput = document.getElementById('searchInput');

let allSermons = [];
let currentPage = 1;
const messagesPerPage = 24;
let currentCategory = 'all';

// === 1. Navigation Menu Setup ===
function setupMenu() {
  if (!nav || !toggle || !main || !closeMenu) return;

  toggle.addEventListener("click", () => {
    nav.classList.toggle("show");
    main.classList.add("blur");
    if (closeMenu) closeMenu.style.display = "block";
    toggle.style.display = "none";
    document.body.classList.add("no-scroll");
  });

  if (closeMenu) {
    closeMenu.addEventListener("click", () => {
      nav.classList.remove("show");
      main.classList.remove("blur");
      closeMenu.style.display = "none";
      toggle.style.display = "block";
      document.body.classList.remove("no-scroll");
    });
  }

  document.addEventListener("click", function (event) {
    const isClickInsideMenu = nav.contains(event.target);
    const isClickOnToggle = toggle.contains(event.target);

    if (!isClickInsideMenu && !isClickOnToggle && nav.classList.contains("show")) {
      nav.classList.remove("show");
      main.classList.remove("blur");
      if (closeMenu) closeMenu.style.display = "none";
      toggle.style.display = "block";
      document.body.classList.remove("no-scroll");
    }
  });
}

// === 2. Dynamic Sermon Rendering ===
async function fetchSermons() {
  try {
    const response = await fetch('/sermons.json');
    const data = await response.json();
    // Return original order (User revert request)
    allSermons = data;
    return allSermons;
  } catch (error) {
    console.error('Error fetching sermons:', error);
    return [];
  }
}

// Helper to resolve local vs external image paths to root-absolute paths
function resolveImagePath(path) {
  if (!path || path.startsWith('http') || path.startsWith('/')) return path;
  
  // Convert "../images/..." to "/images/..." (root-relative)
  if (path.startsWith('..')) {
    return path.substring(2); 
  }
  
  // Ensure local "images/..." paths are also root-relative
  if (path.startsWith('images/')) {
    return '/' + path;
  }
  
  return path;
}

function renderSermons(containerId, category = 'all', page = 1, isSearch = false) {
  const list = document.getElementById(containerId);
  if (!list) return;

  currentCategory = category;
  currentPage = page;

  let filtered = category === 'all' 
    ? allSermons 
    : allSermons.filter(s => s.category === category);

  // If searching, show all matching results without pagination level
  if (isSearch) {
    const query = searchInput.value.toLowerCase();
    filtered = filtered.filter(s => s.title.toLowerCase().includes(query));
  }

  const totalItems = filtered.length;
  
  // Apply pagination only if NOT searching and NOT an excluded category
  const excludedCategories = ['foundation', 'discipleship', 'workers'];
  const isExcluded = excludedCategories.includes(category);

  let displaySermons = filtered;
  if (!isSearch && !isExcluded) {
    const start = (page - 1) * messagesPerPage;
    const end = start + messagesPerPage;
    displaySermons = filtered.slice(start, end);
  }

  list.classList.remove('hidden');
  list.innerHTML = displaySermons.map(sermon => `
    <div class="sermon-card" data-title="${sermon.title.toLowerCase()}">
      <a href="/template/sermons.html?id=${sermon.id}">
        <img src="${resolveImagePath(sermon.image)}" alt="${sermon.title}" loading="lazy" width="100%">
        <h3 class="sermon-title">${sermon.title}</h3>
      </a>
    </div>
  `).join('');

  // Render Pagination Controls if not searching, not an excluded category, and we have more than one page
  if (!isSearch && !isExcluded) {
    renderPaginationControls(containerId, totalItems);
  } else {
    // Clear pagination if searching
    const existingControls = document.getElementById('pagination-controls');
    if (existingControls) existingControls.remove();
  }
}

function renderPaginationControls(containerId, totalItems) {
  let controls = document.getElementById('pagination-controls');
  if (!controls) {
    controls = document.createElement('div');
    controls.id = 'pagination-controls';
    controls.className = 'pagination-container';
    const list = document.getElementById(containerId);
    list.after(controls);
  }

  const totalPages = Math.ceil(totalItems / messagesPerPage);
  if (totalPages <= 1) {
    controls.style.display = 'none';
    return;
  }
  controls.style.display = 'flex';

  controls.innerHTML = `
    <button class="pagination-btn" id="prevPage" ${currentPage === 1 ? 'disabled' : ''} onclick="changePage('${containerId}', ${currentPage - 1})">
      <i class="fas fa-chevron-left"></i> <span>Previous</span>
    </button>
    <div class="page-indicator">Page ${currentPage} of ${totalPages}</div>
    <button class="pagination-btn" id="nextPage" ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage('${containerId}', ${currentPage + 1})">
      <span>Next</span> <i class="fas fa-chevron-right"></i>
    </button>
  `;
}

function changePage(containerId, newPage) {
  // Update the URL without reloading the page
  const url = new URL(window.location);
  url.searchParams.set('page', newPage);
  window.history.pushState({ page: newPage }, '', url);

  renderSermons(containerId, currentCategory, newPage);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// === 3. Sermon Search Setup ===
function setupSearch() {
  if (!searchInput) return;

  searchInput.addEventListener('input', function () {
    const query = this.value.toLowerCase();
    
    // If search is empty, go back to first page of current category
    if (query === '') {
      renderSermons('sermonList', currentCategory, 1);
    } else {
      // Show all matching results
      renderSermons('sermonList', currentCategory, 1, true);
    }
  });
}

// === 4. Load Sermon Details (for sermons.html template) ===
async function loadSermonDetails() {
  const detail = document.getElementById("sermon-detail");
  if (!detail) return;

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  
  try {
    const response = await fetch('/sermons.json');
    const sermons = await response.json();
    const sermon = sermons.find(s => s.id === id);

    if (!sermon) {
      detail.innerHTML = "<p>Sermon not found.</p>";
      return;
    }

    detail.innerHTML = ''; 

    const imageDiv = document.createElement('div');
    imageDiv.className = 'sermon-card';
    imageDiv.innerHTML = `<img src="${resolveImagePath(sermon.image)}" alt="${sermon.title}" width="100%">`;
    detail.appendChild(imageDiv);

    const tracksDiv = document.createElement('div');
    tracksDiv.className = 'tracks';

    sermon.tracks.forEach(track => {
      const p = document.createElement('p');
      p.style.fontSize = '1.1rem';

      const encodedUrl = encodeURIComponent(track.file);
      const encodedLabel = encodeURIComponent(track.label);
      const proxyUrl = `https://nathydev.free.nf/download.php?url=${encodedUrl}&label=${encodedLabel}`;

      const a = document.createElement('a');
      a.href = proxyUrl;

      const img = document.createElement('img');
      img.src = '/images/download-icon.svg';
      img.alt = track.label;

      a.appendChild(img);
      p.textContent = track.label + ' ';
      p.appendChild(a);
      tracksDiv.appendChild(p);
    });

    detail.appendChild(tracksDiv);
  } catch (err) {
    console.error('Error loading details:', err);
    detail.innerHTML = "<p>Error loading sermon details.</p>";
  }
}

// === 5. Hide Loader ===
function hideLoader() {
  const loader = document.getElementById('loading-indicator');
  if (loader) {
    setTimeout(() => loader.style.display = 'none', 500);
  }
}

// === 6. Initialization ===
window.addEventListener("DOMContentLoaded", async () => {
  setupMenu();
  
  const path = window.location.pathname;
  console.log("Current path:", path);

  const sermons = await fetchSermons();

  const params = new URLSearchParams(window.location.search);
  const urlPage = parseInt(params.get('page')) || 1;

  if (path.includes('/foundation')) {
    renderSermons('sermonList', 'foundation');
  } else if (path.includes('/discipleship')) {
    renderSermons('sermonList', 'discipleship');
  } else if (path.includes('/workers')) {
    renderSermons('sermonList', 'workers');
  } else if (path.includes('/template/sermons.html')) {
    await loadSermonDetails();
  } else if (path.includes('index.html') || path === '/' || path.endsWith('/')) {
    const defaultPage = parseInt(params.get('page')) || 1;
    renderSermons('sermonList', 'general', defaultPage);
  } else if (path.includes('/more-messages')) {
    const defaultPage = parseInt(params.get('page')) || 2;
    renderSermons('sermonList', 'general', defaultPage);
  }

  setupSearch();
  
  const breadCrumbs = document.querySelectorAll('.breadCrumbs');
  breadCrumbs.forEach(crumb => {
    const currentUrl = window.location.href;
    if (crumb.href === currentUrl) {
      crumb.style.backgroundColor = '#47A9FF';
    }
  });

  hideLoader();
});
