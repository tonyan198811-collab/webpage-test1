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
const MESSAGE_NAME_MAX_LENGTH = 16;
const MESSAGE_CONTENT_MAX_LENGTH = 100;
const MESSAGE_COLLECTION = 'messages';
const POPULAR_SIZE = 3;
const PAGE_SIZE = 10;
const LIKE_COOLDOWN_MS = 1200;
const FLOATING_MIN_WIDTH = 180;
const FLOATING_DESKTOP_MEDIA = '(max-width: 700px)';
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
    return '剛剛';
  }

  const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) {
    return '剛剛';
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} 分鐘前`;
  }

  const isSameDay =
    now.getFullYear() === date.getFullYear() &&
    now.getMonth() === date.getMonth() &&
    now.getDate() === date.getDate();

  if (isSameDay) {
    return `今天 ${new Intl.DateTimeFormat('zh-TW', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(date)}`;
  }

  return new Intl.DateTimeFormat('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(date);
}

function sortByTimeDesc(messages) {
  return [...messages].sort((a, b) => {
    const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt || 0).getTime();
    const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt || 0).getTime();
    return bTime - aTime;
  });
}

function getPopularMessages(messages) {
  return [...messages]
    .sort((a, b) => {
      const likeDiff = (b.likes || 0) - (a.likes || 0);
      if (likeDiff !== 0) {
        return likeDiff;
      }

      const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt || 0).getTime();
      const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt || 0).getTime();
      return bTime - aTime;
    })
    .slice(0, POPULAR_SIZE);
}

function createMessageItem(messageData, onLike) {
  const listItem = document.createElement('li');
  listItem.className = 'message-item';

  const headerEl = document.createElement('div');
  headerEl.className = 'message-item__header';

  const signEl = document.createElement('span');
  signEl.className = 'message-item__name';
  signEl.textContent = `署名：${messageData.name || '匿名'}`;

  const timeEl = document.createElement('span');
  timeEl.className = 'message-item__time';
  timeEl.textContent = formatMessageTime(messageData.createdAt);
  headerEl.append(signEl, timeEl);

  const contentEl = document.createElement('p');
  contentEl.className = 'message-item__content';
  contentEl.textContent = `${messageData.name || '匿名'}：${messageData.content || ''}`;

  const footerEl = document.createElement('div');
  footerEl.className = 'message-item__footer';

  const likesEl = document.createElement('span');
  likesEl.className = 'message-item__likes';
  likesEl.textContent = `♡ ${messageData.likes || 0}`;

  const likeBtn = document.createElement('button');
  likeBtn.type = 'button';
  likeBtn.className = 'message-item__like-btn';
  likeBtn.setAttribute('aria-label', '点赞');
  likeBtn.title = '点赞';
  likeBtn.textContent = '♥';
  likeBtn.addEventListener('click', () => onLike(messageData.id, likeBtn));

  footerEl.append(likesEl, likeBtn);
  listItem.append(headerEl, contentEl, footerEl);
  return listItem;
}

function pickFloatingMessage(messages) {
  if (!messages.length) {
    return null;
  }

  const popularFirst = getPopularMessages(messages)[0];
  if (popularFirst) {
    return popularFirst;
  }

  return sortByTimeDesc(messages)[0] || null;
}

function createFloatingArtController() {
  const mainEl = document.querySelector('main.container');
  const floatingEl = document.getElementById('floating-message-art');
  const textEl = document.getElementById('floating-message-text');
  const showcaseEl = document.querySelector('.showcase');
  const messageBoardEl = document.querySelector('.message-board');

  if (!mainEl || !floatingEl || !textEl || !showcaseEl || !messageBoardEl) {
    return {
      setMessage() {}
    };
  }

  const mobileMedia = window.matchMedia(FLOATING_DESKTOP_MEDIA);
  let x = 0;
  let y = 0;
  let vx = 0.16;
  let vy = 0.11;
  let lastTs = 0;
  let rafId = null;

  function computeBounds() {
    const mainRect = mainEl.getBoundingClientRect();
    const showcaseRect = showcaseEl.getBoundingClientRect();
    const boardRect = messageBoardEl.getBoundingClientRect();
    const artRect = floatingEl.getBoundingClientRect();

    const width = Math.max(FLOATING_MIN_WIDTH, artRect.width || FLOATING_MIN_WIDTH);
    const height = Math.max(62, artRect.height || 62);
    const startY = Math.max(18, showcaseRect.bottom - mainRect.top + 14);
    const endY = Math.max(startY + 22, boardRect.top - mainRect.top - height - 16);

    return {
      minX: 12,
      maxX: Math.max(12, mainRect.width - width - 12),
      minY: startY,
      maxY: endY
    };
  }

  function stop() {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    floatingEl.classList.remove('is-visible');
  }

  function frame(ts) {
    if (!lastTs) {
      lastTs = ts;
    }

    const delta = Math.min(48, ts - lastTs);
    lastTs = ts;
    const bounds = computeBounds();

    x += vx * delta;
    y += vy * delta;

    if (x <= bounds.minX) {
      x = bounds.minX;
      vx = Math.abs(vx);
    } else if (x >= bounds.maxX) {
      x = bounds.maxX;
      vx = -Math.abs(vx);
    }

    if (y <= bounds.minY) {
      y = bounds.minY;
      vy = Math.abs(vy);
    } else if (y >= bounds.maxY) {
      y = bounds.maxY;
      vy = -Math.abs(vy);
    }

    floatingEl.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
    rafId = requestAnimationFrame(frame);
  }

  function ensureStartPosition() {
    const bounds = computeBounds();
    if (!Number.isFinite(x) || x === 0) {
      x = bounds.maxX;
    }
    if (!Number.isFinite(y) || y === 0) {
      y = Math.max(bounds.minY, Math.min(bounds.maxY, bounds.minY + 12));
    }
  }

  return {
    setMessage(messageData) {
      if (!messageData || mobileMedia.matches) {
        stop();
        return;
      }

      textEl.textContent = `${messageData.name || '匿名'}：${messageData.content || ''}`;
      floatingEl.classList.add('is-visible');
      ensureStartPosition();

      if (rafId === null) {
        lastTs = 0;
        rafId = requestAnimationFrame(frame);
      }
    }
  };
}

function initMessageBoard() {
  const formEl = document.getElementById('message-form');
  const nameEl = document.getElementById('name-input');
  const inputEl = document.getElementById('message-input');
  const nameCountEl = document.getElementById('name-count');
  const countEl = document.getElementById('message-count');
  const statusEl = document.getElementById('message-status');
  const listEl = document.getElementById('message-list');
  const popularListEl = document.getElementById('popular-list');
  const prevPageEl = document.getElementById('prev-page');
  const nextPageEl = document.getElementById('next-page');
  const pageIndicatorEl = document.getElementById('page-indicator');

  if (
    !formEl ||
    !nameEl ||
    !inputEl ||
    !nameCountEl ||
    !countEl ||
    !statusEl ||
    !listEl ||
    !popularListEl ||
    !prevPageEl ||
    !nextPageEl ||
    !pageIndicatorEl
  ) {
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
  const likeCooldownMap = new Map();
  const floatingArt = createFloatingArtController();

  let allMessages = [];
  let currentPage = 1;

  function renderLists() {
    const popular = getPopularMessages(allMessages);
    const popularIds = new Set(popular.map((item) => item.id));
    const normalMessages = sortByTimeDesc(allMessages.filter((item) => !popularIds.has(item.id)));

    const totalPages = Math.max(1, Math.ceil(normalMessages.length / PAGE_SIZE));
    if (currentPage > totalPages) {
      currentPage = totalPages;
    }

    const pageStart = (currentPage - 1) * PAGE_SIZE;
    const currentPageData = normalMessages.slice(pageStart, pageStart + PAGE_SIZE);

    popularListEl.innerHTML = '';
    listEl.innerHTML = '';

    if (popular.length === 0) {
      const emptyPopularEl = document.createElement('li');
      emptyPopularEl.className = 'message-item message-item--empty';
      emptyPopularEl.textContent = '尚無人氣留言，等你來留言與點讚~';
      popularListEl.append(emptyPopularEl);
    } else {
      popular.forEach((item) => {
        popularListEl.append(createMessageItem(item, handleLike));
      });
    }

    if (currentPageData.length === 0) {
      const emptyEl = document.createElement('li');
      emptyEl.className = 'message-item message-item--empty';
      emptyEl.textContent = '还没有留言，来留下第一句吧~';
      listEl.append(emptyEl);
    } else {
      currentPageData.forEach((item) => {
        listEl.append(createMessageItem(item, handleLike));
      });
    }

    prevPageEl.disabled = currentPage <= 1;
    nextPageEl.disabled = currentPage >= totalPages;
    pageIndicatorEl.textContent = totalPages > 1 ? `Page ${currentPage} / ${totalPages}` : `Page ${currentPage}`;
  }

  async function handleLike(messageId, buttonEl) {
    const now = Date.now();
    const lastLikeAt = likeCooldownMap.get(messageId) || 0;

    if (now - lastLikeAt < LIKE_COOLDOWN_MS) {
      statusEl.textContent = '點讚太快了，請稍後再試~';
      return;
    }

    likeCooldownMap.set(messageId, now);
    buttonEl.disabled = true;

    try {
      await messagesRef.doc(messageId).update({
        likes: firebase.firestore.FieldValue.increment(1)
      });
      statusEl.textContent = '';
    } catch (error) {
      statusEl.textContent = '點讚失败，请稍后重试。';
      likeCooldownMap.delete(messageId);
    } finally {
      setTimeout(() => {
        buttonEl.disabled = false;
      }, LIKE_COOLDOWN_MS);
    }
  }

  nameEl.addEventListener('input', () => {
    nameCountEl.textContent = `${nameEl.value.length} / ${MESSAGE_NAME_MAX_LENGTH}`;
  });

  inputEl.addEventListener('input', () => {
    countEl.textContent = `${inputEl.value.length} / ${MESSAGE_CONTENT_MAX_LENGTH}`;
  });

  prevPageEl.addEventListener('click', () => {
    currentPage -= 1;
    renderLists();
  });

  nextPageEl.addEventListener('click', () => {
    currentPage += 1;
    renderLists();
  });

  statusEl.textContent = '正在加载留言...';

  messagesRef.orderBy('createdAt', 'desc').limit(200).onSnapshot(
    (snapshot) => {
      allMessages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        likes: typeof doc.data().likes === 'number' ? doc.data().likes : 0
      }));

      renderLists();
      floatingArt.setMessage(pickFloatingMessage(allMessages));
      statusEl.textContent = '';
    },
    () => {
      statusEl.textContent = '读取留言失败，请稍后刷新重试。';
    }
  );

  formEl.addEventListener('submit', async (event) => {
    event.preventDefault();

    const rawName = nameEl.value.trim();
    const rawContent = inputEl.value.trim();

    if (!rawName) {
      statusEl.textContent = '署名不能为空哦。';
      return;
    }

    if (!rawContent) {
      statusEl.textContent = '留言不能为空哦。';
      return;
    }

    const name = rawName.slice(0, MESSAGE_NAME_MAX_LENGTH);
    const content = rawContent.slice(0, MESSAGE_CONTENT_MAX_LENGTH);
    const submitButton = formEl.querySelector('button[type="submit"]');

    submitButton.disabled = true;
    statusEl.textContent = '正在提交留言...';

    try {
      await messagesRef.add({
        name,
        content,
        likes: 0,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      formEl.reset();
      nameCountEl.textContent = `0 / ${MESSAGE_NAME_MAX_LENGTH}`;
      countEl.textContent = `0 / ${MESSAGE_CONTENT_MAX_LENGTH}`;
      currentPage = 1;
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
