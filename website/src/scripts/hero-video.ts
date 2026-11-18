const hero = document.querySelector<HTMLElement>('.home-hero');
const video = hero?.querySelector<HTMLVideoElement>('.hero-video');
const toggle = hero?.querySelector<HTMLButtonElement>('.hero-video-toggle');
const label = toggle?.querySelector('span');
const videoStatus = hero?.querySelector<HTMLElement>('.hero-video-status');

if (hero && video && toggle && label && videoStatus && video.dataset.src) {
  const source = video.dataset.src;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let visible = false;
  let pageActive = true;
  let userPaused = false;
  let failed = false;
  let playPending = false;

  const updateControl = () => {
    const playing = !video.paused;
    toggle.dataset.playing = String(playing);
    toggle.setAttribute('aria-label', playing ? 'השהיית סרטון הרקע' : 'הפעלת סרטון הרקע');
    label.textContent = playing ? 'השהיית סרטון' : 'הפעלת סרטון';
    toggle.hidden = reducedMotion.matches || failed;
  };
  const shouldPlay = () => visible && pageActive && !document.hidden
    && !reducedMotion.matches && !userPaused && !failed;
  const showFailure = () => {
    if (failed) return;
    failed = true;
    video.pause();
    delete hero.dataset.videoReady;
    videoStatus.textContent = 'סרטון הרקע אינו זמין. מוצגת תמונה במקומו.';
    console.warn('Hero background video unavailable', video.error?.code);
    updateControl();
  };
  const sync = async () => {
    updateControl();
    if (!shouldPlay()) {
      video.pause();
      return;
    }
    if (playPending || !video.paused) return;
    if (!video.hasAttribute('src')) video.src = source;
    video.muted = true;
    playPending = true;
    try {
      await video.play();
      if (!shouldPlay()) video.pause();
    } catch (error) {
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        userPaused = true;
        videoStatus.textContent = 'הדפדפן עצר את ההפעלה האוטומטית. אפשר להפעיל את הסרטון בכפתור.';
      } else if (!(error instanceof DOMException && error.name === 'AbortError')) {
        showFailure();
      }
    } finally {
      playPending = false;
      updateControl();
    }
    if (shouldPlay() && video.paused) void sync();
  };

  video.addEventListener('playing', () => {
    hero.dataset.videoReady = '';
    videoStatus.textContent = '';
    updateControl();
  });
  video.addEventListener('pause', updateControl);
  video.addEventListener('error', showFailure);
  toggle.addEventListener('click', () => {
    userPaused = !video.paused;
    void sync();
  });
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) {
      userPaused = true;
      delete hero.dataset.videoReady;
    }
    void sync();
  });
  document.addEventListener('visibilitychange', () => { void sync(); });
  window.addEventListener('pagehide', () => { pageActive = false; void sync(); });
  window.addEventListener('pageshow', () => { pageActive = true; void sync(); });

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      void sync();
    });
    observer.observe(hero);
  } else {
    visible = true;
  }
  void sync();
}
