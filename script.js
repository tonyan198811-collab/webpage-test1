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

let currentIndex = 0;
let timer = null;
const INTERVAL_MS = 3500;

function renderImage() {
  imageEl.src = albumImages[currentIndex];
  imageEl.alt = `吹響吧！上低音號影集圖片（${currentIndex + 1}/${albumImages.length}）`;
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

renderImage();
restartAutoPlay();
