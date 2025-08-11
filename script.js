// Rotating subtitles
const subtitles = [
  'Forever prototyping.',
  'Learning is a design problem.',
  'Builder of strange and curious things.'
];
let subtitleIndex = 0;
const subtitleEl = document.getElementById('subtitle');
if (subtitleEl) {
  setInterval(() => {
    subtitleIndex = (subtitleIndex + 1) % subtitles.length;
    subtitleEl.textContent = subtitles[subtitleIndex];
  }, 3000);
}

// Mobile navigation toggle
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');
if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('show');
  });
}

// Future vibe toggle placeholder
const vibeToggle = document.getElementById('vibe-toggle');
if (vibeToggle) {
  vibeToggle.addEventListener('click', () => {
    // TODO: Implement vibe toggling
  });
}

// Last one. You're good at this!
