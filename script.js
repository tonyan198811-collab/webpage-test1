const albumImages = [
  './SCAN_01-2 (1).jpg',
  './SCAN_01-2 (2).jpg',
  './SCAN_01-2 (3).jpg',
  './SCAN_01-2 (4).jpg',
  './SCAN_01-2 (5).jpg',
  './SCAN_04.jpg',
  './SCAN_09.jpg',
  './SCAN_18.jpg',
  './SCAN_19.jpg',
  './SCAN_19-2.jpg',
  './SCAN_20-2.jpg',
  './SCAN_2.jpg',
  './SCAN_5.jpg',
  './SCAN_5-1.jpg'
];

const imageEl = document.getElementById('album-image');
const prevBtn = document.querySelector('.carousel__btn--prev');
const nextBtn = document.querySelector('.carousel__btn--next');
const viewportEl = document.querySelector('.carousel__viewport');

let currentIndex = 0;
let timer = null;
const INTERVAL_MS = 3500;

const preloadedImages = new Map();

function preloadImage(src) {
  if (preloadedImages.has(src)) {
    return preloadedImages.get(src);
  }

  const task = new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(src);
    img.onerror = () => resolve(src);
    img.src = src;
  });

  preloadedImages.set(src, task);
  return task;
}

function preloadAllImages() {
  albumImages.forEach((src) => {
    preloadImage(src);
  });
}

async function renderImage() {
  const currentImage = albumImages[currentIndex];
  await preloadImage(currentImage);

  viewportEl.style.setProperty('--album-bg', `url("${currentImage}")`);
  imageEl.style.opacity = '0.92';
  imageEl.src = currentImage;
  imageEl.alt = `吹響吧！上低音號影集圖片（${currentIndex + 1}/${albumImages.length}）`;

  requestAnimationFrame(() => {
    imageEl.style.opacity = '1';
  });
}

function showNext() {
  currentIndex = (currentIndex + 1) % albumImages.length;
  renderImage();
}

function showPrev() {
  currentIndex = (currentIndex - 1 + albumImages.length) % albumImages.length;
  renderImage();
}

function restartAutoPlay() {
  if (timer) {
    clearInterval(timer);
  }
  timer = setInterval(showNext, INTERVAL_MS);
}

nextBtn.addEventListener('click', () => {
  showNext();
  restartAutoPlay();
});

prevBtn.addEventListener('click', () => {
  showPrev();
  restartAutoPlay();
});

preloadAllImages();
renderImage();
restartAutoPlay();
