const carouselConfigs = {
  'album-1': {
    name: '第一個圖集',
    images: [
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
    ]
  },
  'album-2': {
    name: '第二個圖集',
    images: [
      './其他1.png',
      './其他2.png',
      './其他3.png',
      './其他4.png',
      './其他5.png',
      './其他6.png',
      './其他7.png',
      './其他8.png',
      './其他9.png',
      './其他10.png',
      './其他11.png',
      './其他12.png',
      './其他13.png',
      './其他14.png'
    ]
  }
};

const INTERVAL_MS = 3500;
const FADE_DURATION_MS = 650;
const preloadedImages = new Map();

function preloadImage(src) {
  if (preloadedImages.has(src)) {
    return preloadedImages.get(src);
  }

  const task = new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(img);
    img.src = src;
  });

  preloadedImages.set(src, task);
  return task;
}

function createOffsets(index) {
  const rotations = [-2.3, -1.2, -0.6, 0.8, 1.6, 2.4];
  const shiftsX = [-8, -4, 0, 4, 8, 2];
  const shiftsY = [-5, -2, 0, 3, 5, 1];

  return {
    rotate: `${rotations[index % rotations.length]}deg`,
    x: `${shiftsX[index % shiftsX.length]}px`,
    y: `${shiftsY[index % shiftsY.length]}px`
  };
}

function applyImageState(imageEl, imageSrc, imageAlt, frameOffset) {
  imageEl.src = imageSrc;
  imageEl.alt = imageAlt;
  imageEl.style.setProperty('--img-rotate', frameOffset.rotate);
  imageEl.style.setProperty('--img-shift-x', frameOffset.x);
  imageEl.style.setProperty('--img-shift-y', frameOffset.y);
}

function initCarousel(carouselEl) {
  const carouselKey = carouselEl.dataset.carousel;
  const config = carouselConfigs[carouselKey];
  if (!config || !config.images.length) {
    return;
  }

  const initialImageEl = carouselEl.querySelector('img');
  const prevBtn = carouselEl.querySelector('.carousel__btn--prev');
  const nextBtn = carouselEl.querySelector('.carousel__btn--next');
  const viewportEl = carouselEl.querySelector('.carousel__viewport');

  const secondImageEl = initialImageEl.cloneNode(false);
  secondImageEl.removeAttribute('src');
  secondImageEl.alt = '';
  viewportEl.append(secondImageEl);

  initialImageEl.classList.add('is-active');

  let activeImageEl = initialImageEl;
  let inactiveImageEl = secondImageEl;
  let currentIndex = 0;
  let timer = null;
  let renderToken = 0;
  let cleanupTimer = null;

  config.images.forEach((src) => preloadImage(src));

  async function renderImage(shouldAnimate = true) {
    const token = ++renderToken;
    const currentImage = config.images[currentIndex];
    const preloaded = await preloadImage(currentImage);

    if (typeof preloaded.decode === 'function') {
      try {
        await preloaded.decode();
      } catch (error) {
        // ignore decode errors
      }
    }

    if (token !== renderToken) {
      return;
    }

    const frameOffset = createOffsets(currentIndex);
    const imageAlt = `${config.name}圖片（${currentIndex + 1}/${config.images.length}）`;

    viewportEl.style.setProperty('--album-bg', `url("${currentImage}")`);
    viewportEl.style.setProperty('--frame-rotate', frameOffset.rotate);
    viewportEl.style.setProperty('--frame-shift-x', frameOffset.x);
    viewportEl.style.setProperty('--frame-shift-y', frameOffset.y);

    if (!shouldAnimate) {
      applyImageState(activeImageEl, currentImage, imageAlt, frameOffset);
      activeImageEl.classList.add('is-active');
      inactiveImageEl.classList.remove('is-active');
    } else {
      applyImageState(inactiveImageEl, currentImage, imageAlt, frameOffset);
      inactiveImageEl.classList.add('is-active');
      activeImageEl.classList.remove('is-active');

      if (cleanupTimer) {
        clearTimeout(cleanupTimer);
      }

      const previousActiveImageEl = activeImageEl;
      activeImageEl = inactiveImageEl;
      inactiveImageEl = previousActiveImageEl;

      cleanupTimer = setTimeout(() => {
        inactiveImageEl.removeAttribute('src');
        inactiveImageEl.alt = '';
      }, FADE_DURATION_MS + 80);
    }

    const nextImage = config.images[(currentIndex + 1) % config.images.length];
    const prevImage = config.images[(currentIndex - 1 + config.images.length) % config.images.length];
    preloadImage(nextImage);
    preloadImage(prevImage);
  }

  function showNext() {
    currentIndex = (currentIndex + 1) % config.images.length;
    renderImage();
  }

  function showPrev() {
    currentIndex = (currentIndex - 1 + config.images.length) % config.images.length;
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

  renderImage(false);
  restartAutoPlay();
}

document.querySelectorAll('[data-carousel]').forEach((carouselEl) => {
  initCarousel(carouselEl);
});
