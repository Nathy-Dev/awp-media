// === Global Variables ===
const nav = document.getElementById("navLinks");
const toggle = document.querySelector(".menu-toggle");
const main = document.querySelector(".main-content");
const closeMenu = document.querySelector(".closeMenu");
const searchInput = document.getElementById('searchInput');
const sermonCards = document.querySelectorAll('.sermon-card');

// === 1. Navigation Menu Setup ===
function setupMenu() {
  if (!nav || !toggle || !main || !closeMenu) return;

  toggle.addEventListener("click", () => {
    nav.classList.toggle("show");
    main.classList.add("blur");
    closeMenu.style.display = "block";
    toggle.style.display = "none";
    document.body.classList.add("no-scroll");
  });

  closeMenu.addEventListener("click", () => {
    nav.classList.remove("show");
    main.classList.remove("blur");
    closeMenu.style.display = "none";
    toggle.style.display = "block";
    document.body.classList.remove("no-scroll");
  });

  document.addEventListener("click", function (event) {
    const isClickInsideMenu = nav.contains(event.target);
    const isClickOnToggle = toggle.contains(event.target);

    if (!isClickInsideMenu && !isClickOnToggle && nav.classList.contains("show")) {
      nav.classList.remove("show");
      main.classList.remove("blur");
      closeMenu.style.display = "none";
      toggle.style.display = "block";
      document.body.classList.remove("no-scroll");
    }
  });
}

// === 2. Sermon Search Setup ===
function setupSearch() {
  if (!searchInput || sermonCards.length === 0) return;

  searchInput.addEventListener('input', function () {
    const query = this.value.toLowerCase();

    sermonCards.forEach(card => {
      const content = card.textContent.toLowerCase();
      const isHidden = card.classList.contains('hidden');
      const matchesSearch = content.includes(query);

      if (query === '') {
        card.style.display = isHidden ? 'none' : 'block';
      } else {
        card.style.display = matchesSearch ? 'block' : 'none';
      }
    });
  });
}

// === 3. Contact Form Submission ===
function handleSubmit(event) {
  event.preventDefault();
  alert("Thank you for contacting us. We'll get back to you shortly.");
  event.target.reset();
}

// === 4. Toggle Series View ===
function toggleSeries(id) {
  const content = document.getElementById(id);
  if (content) {
    content.style.display = content.style.display === "none" ? "block" : "none";
    content.classList.toggle("active");
  }
}

// === 5. Load All Sermons (Assumes 'sermons' is defined globally) ===
function loadSermons() {
  const list = document.getElementById("sermon-list");
  if (!list || typeof sermons === 'undefined') return;

  sermons.forEach(sermon => {
    const card = document.createElement("div");
    card.className = "sermon-card";
    card.innerHTML = `
      <h2>${sermon.title}</h2>
      <p>${sermon.description}</p>
      <a href="sermon-template.html?id=${sermon.id}">View Messages</a>
    `;
    list.appendChild(card);
  });
}

// === 6. Load Sermon Detail by ID ===
function loadSermonDetails() {
  const detail = document.getElementById("sermon-detail");
  if (!detail || typeof sermons === 'undefined') return;

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const sermon = sermons.find(s => s.id === id);

  if (!sermon) {
    detail.innerHTML = "<p>Sermon not found.</p>";
    return;
  }

  detail.innerHTML = `
    <h2>${sermon.title}</h2>
    <p>${sermon.description}</p>
    <ul>
      ${sermon.messages.map(msg =>
        `<li>${msg.title} - <a href="downloads/${msg.file}" download>Download</a></li>`
      ).join("")}
    </ul>
    <a href="sermons.html">← Back to Sermons</a>
  `;
}

// === 7. Hide Loader on Page Load ===
function hideLoader() {
  const loader = document.getElementById('loading-indicator');
  if (loader) {
    setTimeout(() => loader.style.display = 'none', 500); // Optional fade delay
  }
}

// === 8. Run Everything on DOMContentLoaded and Load ===
window.addEventListener("DOMContentLoaded", () => {
  setupMenu();
  setupSearch();
  loadSermons();
  loadSermonDetails();
});

window.addEventListener("load", hideLoader);



// if ('serviceWorker' in navigator) {
//   window.addEventListener('load', () => {
//     navigator.serviceWorker.register('/service-worker.js')
//       .then(reg => console.log("Service Worker Registered"))
//       .catch(err => console.log("Service Worker Failed", err));
//   });
// }




// sermons.js

// document.addEventListener('DOMContentLoaded', async () => {
//   const loadingIndicator = document.getElementById('loading-indicator');
//   const sermonDetail = document.getElementById('sermon-detail');

//   try {
//     const response = await fetch('../sermons.json');
//     const sermons = await response.json();

//     // Get ID from URL query parameter (?id=attitude-to-gods-word)
//     const urlParams = new URLSearchParams(window.location.search);
//     const sermonId = urlParams.get('id');

//     const sermon = sermons.find(s => s.id === sermonId);

//     if (!sermon) {
//       sermonDetail.innerHTML = '<p style="color: red;">Sermon not found.</p>';
//       return;
//     }

//     // Set image
//     const imageDiv = document.createElement('div');
//     imageDiv.className = 'sermon-card';
//     imageDiv.innerHTML = `<img src="${sermon.image}" alt="${sermon.title}" width="100%">`;
//     sermonDetail.appendChild(imageDiv);

//     // Set tracks
//     const tracksDiv = document.createElement('div');
//     tracksDiv.className = 'tracks';

//     sermon.tracks.forEach(track => {
//       const p = document.createElement('p');
//       p.style.fontSize = '1.1rem';

//       const a = document.createElement('a');
//       a.href = track.file;
//       a.download = `${track.label}.mp3`; // Set download filename from label

//       const img = document.createElement('img');
//       img.src = '../images/download-icon.svg';
//       img.alt = track.label;

//       a.appendChild(img);
//       p.textContent = track.label + ' ';
//       p.appendChild(a);
//       tracksDiv.appendChild(p);
//     });

//     sermonDetail.appendChild(tracksDiv);
//   } catch (error) {
//     sermonDetail.innerHTML = '<p style="color: red;">Error loading sermon data.</p>';
//     console.error('Error fetching sermons:', error);
//   } finally {
//     loadingIndicator.style.display = 'none';
//   }
// });


// sermons.js

document.addEventListener('DOMContentLoaded', async () => {
  const loadingIndicator = document.getElementById('loading-indicator');
  const sermonDetail = document.getElementById('sermon-detail');

  try {
    const response = await fetch('../sermons.json');
    const sermons = await response.json();

    const urlParams = new URLSearchParams(window.location.search);
    const sermonId = urlParams.get('id');

    const sermon = sermons.find(s => s.id === sermonId);

    if (!sermon) {
      sermonDetail.innerHTML = '<p style="color: red;">Sermon not found.</p>';
      return;
    }

    // Display sermon image
    const imageDiv = document.createElement('div');
    imageDiv.className = 'sermon-card';
    imageDiv.innerHTML = `<img src="${sermon.image}" alt="${sermon.title}" width="100%">`;
    sermonDetail.appendChild(imageDiv);

    // Display tracks
    const tracksDiv = document.createElement('div');
    tracksDiv.className = 'tracks';

    sermon.tracks.forEach(track => {
      const p = document.createElement('p');
      p.style.fontSize = '1.1rem';

      // Build proxy URL for download
      const encodedUrl = encodeURIComponent(track.file);
      const encodedLabel = encodeURIComponent(track.label);
      const encodedArtist = sermon.artist ? encodeURIComponent(sermon.artist) : '';
      const proxyUrl = `https://nathydev.free.nf/download.php?url=${encodedUrl}&label=${encodedLabel}${encodedArtist ? `&artist=${encodedArtist}` : ''}`;

      const a = document.createElement('a');
      a.href = proxyUrl;

      // a.download is not necessary when server sets headers
      // a.download = `${track.label}.mp3`;

      const img = document.createElement('img');
      img.src = '../images/download-icon.svg';
      img.alt = track.label;

      a.appendChild(img);
      p.textContent = track.label + ' ';
      p.appendChild(a);
      tracksDiv.appendChild(p);
    });

    sermonDetail.appendChild(tracksDiv);
  } catch (error) {
    sermonDetail.innerHTML = '<p style="color: red;">Error loading sermon data.</p>';
    console.error('Error fetching sermons:', error);
  } finally {
    loadingIndicator.style.display = 'none';
  }
});

const breadCrumbs = document.querySelectorAll('.breadCrumbs');
breadCrumbs.forEach(crumb => {
  if (crumb.href === window.location.href) {
    crumb.style.backgroundColor = '#47A9FF';
  }
});
