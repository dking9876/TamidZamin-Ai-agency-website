import { formatCallTime } from '../lib/call-transcript';

interface DemoVideo extends HTMLVideoElement {
  webkitEnterFullscreen?: () => void;
}

const root = document.querySelector<HTMLElement>('.whatsapp-demo');

if (root) {
  const video = root.querySelector<DemoVideo>('video')!;
  const toggle = root.querySelector<HTMLButtonElement>('.whatsapp-toggle')!;
  const action = root.querySelector<HTMLElement>('.whatsapp-action')!;
  const seek = root.querySelector<HTMLInputElement>('.whatsapp-seek')!;
  const elapsed = root.querySelector<HTMLElement>('.whatsapp-elapsed')!;
  const duration = root.querySelector<HTMLElement>('.whatsapp-duration')!;
  const status = root.querySelector<HTMLElement>('.whatsapp-status')!;
  const download = root.querySelector<HTMLAnchorElement>('.whatsapp-download')!;
  const fullscreen = root.querySelector<HTMLButtonElement>('.whatsapp-fullscreen')!;
  let wantsPlayback = false;
  let request = 0;

  type State = 'idle' | 'loading' | 'playing' | 'paused' | 'ended' | 'error';
  const labels: Record<State, [string, string]> = {
    idle: ['לצפייה בדמו', 'לצפייה בדמו הוואטסאפ המוקלט'],
    loading: ['טוען… ביטול', 'טוען… ביטול טעינת הדגמת הוואטסאפ'],
    playing: ['השהיה', 'השהיה של הדגמת הוואטסאפ'],
    paused: ['המשך צפייה', 'המשך צפייה בהדגמת הוואטסאפ'],
    ended: ['לצפייה שוב', 'לצפייה שוב בהדגמת הוואטסאפ'],
    error: ['נסו שוב', 'נסו שוב לצפות בהדגמת הוואטסאפ'],
  };

  function setState(state: State) {
    root!.dataset.state = state;
    action.textContent = labels[state][0];
    toggle.setAttribute('aria-label', labels[state][1]);
  }

  function updateTime() {
    const hasDuration = Number.isFinite(video.duration) && video.duration > 0;
    seek.disabled = !hasDuration || !!video.error;
    if (hasDuration) {
      seek.max = String(video.duration);
      duration.textContent = formatCallTime(video.duration);
    }
    seek.value = String(video.currentTime);
    elapsed.textContent = formatCallTime(video.currentTime);
    seek.setAttribute('aria-valuetext', `${elapsed.textContent} מתוך ${duration.textContent}`);
  }

  function pause() {
    wantsPlayback = false;
    request++;
    video.pause();
    setState(video.currentTime > 0 ? 'paused' : 'idle');
  }

  function fail(message: string) {
    wantsPlayback = false;
    request++;
    video.pause();
    setState('error');
    status.textContent = message;
    download.hidden = false;
    updateTime();
  }

  async function play() {
    const currentRequest = ++request;
    wantsPlayback = true;
    status.textContent = '';
    download.hidden = true;
    setState('loading');
    if (video.error) video.load();
    if (video.ended) video.currentTime = 0;
    try {
      await video.play();
    } catch (error) {
      if (currentRequest !== request) return;
      fail(error instanceof DOMException && error.name === 'NotAllowedError'
        ? 'הדפדפן חסם את ההפעלה. לחצו שוב לצפייה או פתחו את הסרטון ישירות.'
        : 'לא הצלחנו לטעון את הסרטון. נסו שוב או פתחו אותו ישירות.');
    }
  }

  toggle.addEventListener('click', () => {
    if (wantsPlayback || !video.paused) pause();
    else void play();
  });
  root.querySelector<HTMLButtonElement>('.whatsapp-restart')!.addEventListener('click', () => {
    video.currentTime = 0;
    updateTime();
    void play();
  });
  seek.addEventListener('input', () => {
    video.currentTime = seek.valueAsNumber;
    updateTime();
    if (!wantsPlayback) setState('paused');
  });
  video.addEventListener('play', () => {
    // Native fullscreen controls can also initiate playback.
    if (video.controls && !video.paused) wantsPlayback = true;
  });
  video.addEventListener('playing', () => {
    if (!wantsPlayback) { video.pause(); return; }
    setState('playing');
    updateTime();
  });
  video.addEventListener('waiting', () => {
    if (wantsPlayback) setState('loading');
  });
  video.addEventListener('pause', () => {
    if (!video.paused || video.ended || root.dataset.state === 'error') return;
    wantsPlayback = false;
    request++;
    setState(video.currentTime > 0 ? 'paused' : 'idle');
  });
  video.addEventListener('ended', () => {
    wantsPlayback = false;
    request++;
    setState('ended');
    updateTime();
  });
  video.addEventListener('error', () => fail('לא הצלחנו לטעון את הסרטון. נסו שוב או פתחו אותו ישירות.'));
  for (const event of ['loadedmetadata', 'durationchange', 'timeupdate', 'seeked']) video.addEventListener(event, updateTime);

  fullscreen.hidden = !document.fullscreenEnabled && !video.webkitEnterFullscreen;
  fullscreen.addEventListener('click', async () => {
    video.controls = true;
    try {
      if (document.fullscreenEnabled) await video.requestFullscreen();
      else video.webkitEnterFullscreen?.();
    } catch {
      video.controls = false;
      status.textContent = 'לא הצלחנו לפתוח מסך מלא. אפשר להמשיך כאן או לפתוח את הסרטון ישירות.';
      download.hidden = false;
    }
  });
  document.addEventListener('fullscreenchange', () => {
    video.controls = document.fullscreenElement === video;
  });
  video.addEventListener('webkitendfullscreen', () => { video.controls = false; });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && (wantsPlayback || !video.paused)) pause();
  });
  window.addEventListener('pagehide', () => {
    if (wantsPlayback || !video.paused) pause();
  });

  video.controls = false;
  root.querySelector<HTMLElement>('.whatsapp-controls')!.hidden = false;
}

export {};
