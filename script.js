// === Global Variables ===
const nav = document.getElementById("navLinks");
const toggle = document.querySelector(".menu-toggle");
const main = document.querySelector(".main-content");
const closeMenu = document.querySelector(".closeMenu");
const searchInput = document.getElementById('searchInput');

let allSermons = [];

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
    const response = await fetch('sermons.json');
    allSermons = await response.json();
    return allSermons;
  } catch (error) {
    console.error('Error fetching sermons:', error);
    return [];
  }
}

function renderSermons(containerId, category = 'all') {
  const list = document.getElementById(containerId);
  if (!list) return;

  const filtered = category === 'all' 
    ? allSermons 
    : allSermons.filter(s => s.category === category);

  // Un-hide the container if it was hidden
  list.classList.remove('hidden');

  list.innerHTML = filtered.map(sermon => `
    <div class="sermon-card" data-title="${sermon.title.toLowerCase()}">
      <a href="/template/sermons.html?id=${sermon.id}">
        <img src="${sermon.image.startsWith('..') ? sermon.image.substring(3) : sermon.image}" alt="${sermon.title}" loading="lazy" width="100%">
        <h3 class="sermon-title">${sermon.title}</h3>
      </a>
    </div>
  `).join('');
}

// === 3. Sermon Search Setup ===
function setupSearch() {
  if (!searchInput) return;

  searchInput.addEventListener('input', function () {
    const query = this.value.toLowerCase();
    const cards = document.querySelectorAll('.sermon-card');

    cards.forEach(card => {
      const title = card.getAttribute('data-title');
      if (title.includes(query)) {
        card.style.display = 'block';
      } else {
        card.style.display = 'none';
      }
    });
  });
}

// === 4. Load Sermon Details (for sermons.html template) ===
async function loadSermonDetails() {
  const detail = document.getElementById("sermon-detail");
  if (!detail) return;

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  
  try {
    // Handle relative path for template folder
    const response = await fetch('../sermons.json');
    const sermons = await response.json();
    const sermon = sermons.find(s => s.id === id);

    if (!sermon) {
      detail.innerHTML = "<p>Sermon not found.</p>";
      return;
    }

    detail.innerHTML = ''; // Clear previous content

    // Display sermon image
    const imageDiv = document.createElement('div');
    imageDiv.className = 'sermon-card';
    imageDiv.innerHTML = `<img src="${sermon.image}" alt="${sermon.title}" width="100%">`;
    detail.appendChild(imageDiv);

    // Display tracks
    const tracksDiv = document.createElement('div');
    tracksDiv.className = 'tracks';

    sermon.tracks.forEach(track => {
      const p = document.createElement('p');
      p.style.fontSize = '1.1rem';

      // Build proxy URL for download
      const encodedUrl = encodeURIComponent(track.file);
      const encodedLabel = encodeURIComponent(track.label);
      const proxyUrl = `https://nathydev.free.nf/download.php?url=${encodedUrl}&label=${encodedLabel}`;

      const a = document.createElement('a');
      a.href = proxyUrl;

      const img = document.createElement('img');
      img.src = '../images/download-icon.svg';
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

  if (path.includes('/foundation')) {
    await fetchSermons();
    renderSermons('sermonList', 'foundation');
  } else if (path.includes('/discipleship')) {
    await fetchSermons();
    renderSermons('sermonList', 'discipleship');
  } else if (path.includes('/workers')) {
    await fetchSermons();
    renderSermons('sermonList', 'workers');
  } else if (path.includes('/template/sermons.html')) {
    await loadSermonDetails();
  } else if (path.includes('index.html') || path === '/' || path.endsWith('/')) {
    await fetchSermons();
    renderSermons('sermonList', 'general');
  } else if (path.includes('/more-messages')) {
    await fetchSermons();
    renderSermons('sermonList', 'general');
  }

  setupSearch();
  
  // Breadcrumbs highlight
  const breadCrumbs = document.querySelectorAll('.breadCrumbs');
  breadCrumbs.forEach(crumb => {
    const currentUrl = window.location.href;
    if (crumb.href === currentUrl) {
      crumb.style.backgroundColor = '#47A9FF';
    }
  });

  hideLoader();
});
