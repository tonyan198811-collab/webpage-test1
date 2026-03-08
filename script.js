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

function getForegroundDisplayProfile(img) {
  const naturalWidth = img.naturalWidth || 1;
  const naturalHeight = img.naturalHeight || 1;
  const ratio = naturalWidth / naturalHeight;

  if (ratio < 0.9) {
    const portraitStrength = Math.min(1, Math.max(0, (0.9 - ratio) / 0.35));
    const verticalFocus = 50 + portraitStrength * 4;

    return {
      mode: 'portrait',
      objectPosition: `center ${verticalFocus.toFixed(1)}%`
    };
  }

  return {
    mode: 'landscape',
    objectPosition: 'center center'
  };
}

function applyImageState(imageEl, imageSrc, imageAlt, displayProfile) {
  imageEl.src = imageSrc;
  imageEl.alt = imageAlt;
  imageEl.style.setProperty('--fg-object-position', displayProfile.objectPosition);
}

function applyViewportMode(viewportEl, displayProfile) {
  viewportEl.classList.toggle('is-portrait', displayProfile.mode === 'portrait');
  viewportEl.classList.toggle('is-landscape', displayProfile.mode !== 'portrait');
  viewportEl.style.setProperty('--fg-object-position', displayProfile.objectPosition);
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

    const imageAlt = `${config.name}圖片（${currentIndex + 1}/${config.images.length}）`;
    const displayProfile = getForegroundDisplayProfile(preloaded);

    viewportEl.style.setProperty('--album-bg', `url("${currentImage}")`);
    applyViewportMode(viewportEl, displayProfile);

    if (!shouldAnimate) {
      applyImageState(activeImageEl, currentImage, imageAlt, displayProfile);
      activeImageEl.classList.add('is-active');
      inactiveImageEl.classList.remove('is-active');
    } else {
      applyImageState(inactiveImageEl, currentImage, imageAlt, displayProfile);
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
