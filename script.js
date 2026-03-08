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
const MESSAGE_MAX_LENGTH = 500;
const MESSAGE_COLLECTION = 'messages';
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

function formatMessageTime(createdAt) {
  if (!createdAt) {
    return '刚刚';
  }

  const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);

  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

function createMessageItem(messageData) {
  const listItem = document.createElement('li');
  listItem.className = 'message-item';

  const contentEl = document.createElement('p');
  contentEl.className = 'message-item__content';
  contentEl.textContent = messageData.content || '';

  const timeEl = document.createElement('div');
  timeEl.className = 'message-item__time';
  timeEl.textContent = `发表时间：${formatMessageTime(messageData.createdAt)}`;

  listItem.append(contentEl, timeEl);
  return listItem;
}

function initMessageBoard() {
  const formEl = document.getElementById('message-form');
  const inputEl = document.getElementById('message-input');
  const countEl = document.getElementById('message-count');
  const statusEl = document.getElementById('message-status');
  const listEl = document.getElementById('message-list');

  if (!formEl || !inputEl || !countEl || !statusEl || !listEl) {
    return;
  }

  if (typeof firebase === 'undefined') {
    statusEl.textContent = '留言功能加载失败，请稍后重试。';
    return;
  }

  const firebaseConfig = {
    apiKey: 'AIzaSyCfsfWRhJGLvU5yidWgsrsavJwz4nnVPKI',
    authDomain: 'sound-euphonium-board-eef10.firebaseapp.com',
    projectId: 'sound-euphonium-board-eef10',
    storageBucket: 'sound-euphonium-board-eef10.firebasestorage.app',
    messagingSenderId: '1033381734993',
    appId: '1:1033381734993:web:341e3dc155ddb06815e670',
    measurementId: 'G-YJZ3BQ0H4L'
  };

  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }

  const db = firebase.firestore();
  const messagesRef = db.collection(MESSAGE_COLLECTION);

  inputEl.addEventListener('input', () => {
    countEl.textContent = `${inputEl.value.length} / ${MESSAGE_MAX_LENGTH}`;
  });

  statusEl.textContent = '正在加载留言...';

  messagesRef
    .orderBy('createdAt', 'desc')
    .limit(50)
    .onSnapshot(
      (snapshot) => {
        listEl.innerHTML = '';

        if (snapshot.empty) {
          const emptyEl = document.createElement('li');
          emptyEl.className = 'message-item';
          emptyEl.textContent = '还没有留言，来留下第一句吧~';
          listEl.append(emptyEl);
        } else {
          snapshot.forEach((doc) => {
            listEl.append(createMessageItem(doc.data()));
          });
        }

        statusEl.textContent = '';
      },
      () => {
        statusEl.textContent = '读取留言失败，请稍后刷新重试。';
      }
    );

  formEl.addEventListener('submit', async (event) => {
    event.preventDefault();

    const rawValue = inputEl.value.trim();
    if (!rawValue) {
      statusEl.textContent = '留言不能为空哦。';
      return;
    }

    const content = rawValue.slice(0, MESSAGE_MAX_LENGTH);
    const submitButton = formEl.querySelector('button[type="submit"]');

    submitButton.disabled = true;
    statusEl.textContent = '正在提交留言...';

    try {
      await messagesRef.add({
        content,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      inputEl.value = '';
      countEl.textContent = `0 / ${MESSAGE_MAX_LENGTH}`;
      statusEl.textContent = '留言已发表，感谢你的分享！';
    } catch (error) {
      statusEl.textContent = '提交失败，请稍后重试。';
    } finally {
      submitButton.disabled = false;
    }
  });
}

document.querySelectorAll('[data-carousel]').forEach((carouselEl) => {
  initCarousel(carouselEl);
});

initMessageBoard();
