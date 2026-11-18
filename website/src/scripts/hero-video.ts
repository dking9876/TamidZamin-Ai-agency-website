const hero = document.querySelector<HTMLElement>('.home-hero');
const video = hero?.querySelector<HTMLVideoElement>('.hero-video');
const toggle = hero?.querySelector<HTMLButtonElement>('.hero-video-toggle');
const label = toggle?.querySelector('span');
const videoStatus = hero?.querySelector<HTMLElement>('.hero-video-status');

if (hero && video && toggle && label && videoStatus && video.dataset.src && video.dataset.mobileSrc) {
  const source = video.dataset.src;
  const mobileSource = video.dataset.mobileSrc;
  const phonePortrait = matchMedia('(max-width: 600px) and (orientation: portrait)');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let visible = false;
  let pageActive = true;
  let userPaused = false;
  let failed = false;
  let playPending = false;
  let resumeTime: number | null = null;

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
    const selectedSource = phonePortrait.matches ? mobileSource : source;
    if (video.hasAttribute('src') && video.getAttribute('src') !== selectedSource) {
      if (video.readyState >= HTMLMediaElement.HAVE_METADATA) resumeTime = video.currentTime;
      video.pause();
      delete hero.dataset.videoReady;
      video.removeAttribute('src');
      video.load();
      failed = false;
    }
    updateControl();
    if (!shouldPlay()) {
      video.pause();
      return;
    }
    if (playPending || !video.paused) return;
    if (!video.hasAttribute('src')) video.src = selectedSource;
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

  video.addEventListener('loadedmetadata', () => {
    if (resumeTime !== null) {
      video.currentTime = Math.min(resumeTime, Math.max(0, video.duration - 0.1));
      resumeTime = null;
    }
  });
  video.addEventListener('playing', () => {
    hero.dataset.videoReady = '';
    videoStatus.textContent = '';
    updateControl();
  });
  video.addEventListener('pause', updateControl);
  video.addEventListener('error', showFailure);
  phonePortrait.addEventListener('change', () => { void sync(); });
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
