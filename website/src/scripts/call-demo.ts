import transcript from '../data/call-transcript.json';
import { activeCueIndex, formatCallTime, transcriptAnchorIndex } from '../lib/call-transcript';
import { observeDemoPlayback } from '../lib/demo-playback';

const root = document.querySelector<HTMLElement>('.call-demo');

if (root) {
  const phone = root.querySelector<HTMLElement>('.recording-phone')!;
  const audio = root.querySelector<HTMLMediaElement>('#demo-call-audio')!;
  const toggle = root.querySelector<HTMLButtonElement>('.recording-toggle')!;
  const action = root.querySelector<HTMLElement>('.recording-action')!;
  const controls = root.querySelector<HTMLElement>('.recording-controls')!;
  const seek = root.querySelector<HTMLInputElement>('.recording-seek')!;
  const elapsed = root.querySelector<HTMLElement>('.recording-elapsed')!;
  const duration = root.querySelector<HTMLElement>('.recording-duration')!;
  const status = root.querySelector<HTMLElement>('.recording-status')!;
  const download = root.querySelector<HTMLAnchorElement>('.recording-download')!;
  const transcriptViewport = root.querySelector<HTMLElement>('.recording-transcript')!;
  const cueElements = [...root.querySelectorAll<HTMLElement>('.transcript-cue')];
  const follow = root.querySelector<HTMLButtonElement>('.recording-follow')!;
  const followNote = root.querySelector<HTMLElement>('.transcript-follow-note')!;
  const sound = root.querySelector<HTMLButtonElement>('.recording-sound')!;
  const soundLabel = sound.querySelector<HTMLElement>('span')!;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let wantsPlayback = false;
  let request = 0;
  let currentCue = -1;
  let following = true;
  let frame = 0;

  type State = 'idle' | 'loading' | 'playing' | 'paused' | 'ended' | 'error';
  const labels: Record<State, [string, string]> = {
    idle: ['לחצו להאזנה', 'לחצו להאזנה לשיחת ההדגמה'],
    loading: ['טוען… ביטול', 'טוען… ביטול טעינת שיחת ההדגמה'],
    playing: ['השהיה', 'השהיה של שיחת ההדגמה'],
    paused: ['המשך האזנה', 'המשך האזנה לשיחת ההדגמה'],
    ended: ['להאזנה שוב', 'להאזנה שוב לשיחת ההדגמה'],
    error: ['נסו שוב', 'נסו שוב להאזין לשיחת ההדגמה'],
  };

  function setState(state: State) {
    phone.dataset.state = state;
    action.textContent = labels[state][0];
    toggle.setAttribute('aria-label', labels[state][1]);
  }

  function updateSound() {
    sound.dataset.muted = String(audio.muted);
    soundLabel.textContent = audio.muted ? 'הפעלת קול' : 'השתקת קול';
    sound.setAttribute('aria-label', audio.muted ? 'הפעלת קול בשיחת ההדגמה' : 'השתקת קול בשיחת ההדגמה');
  }

  function setFollowing(value: boolean) {
    following = value;
    follow.hidden = value;
    followNote.hidden = !value;
  }

  function scrollToCue(index: number, immediate: boolean) {
    const cue = cueElements[index];
    const viewport = transcriptViewport.getBoundingClientRect();
    const bounds = cue.getBoundingClientRect();
    if (immediate || bounds.top < viewport.top + 12 || bounds.bottom > viewport.bottom - 12) {
      // Scroll the transcript only, never the surrounding page or keyboard focus.
      transcriptViewport.scrollTo({
        top: transcriptViewport.scrollTop + bounds.top - viewport.top - transcriptViewport.clientTop - 12,
        behavior: immediate || reducedMotion.matches ? 'instant' : 'smooth',
      });
    }
  }

  function syncTranscript(immediate = false) {
    const next = activeCueIndex(transcript, audio.currentTime);
    if (next === currentCue && !immediate) return;
    cueElements[currentCue]?.removeAttribute('aria-current');
    currentCue = next;
    cueElements[currentCue]?.setAttribute('aria-current', 'true');
    if (following && (currentCue >= 0 || immediate)) {
      scrollToCue(currentCue >= 0 ? currentCue : transcriptAnchorIndex(transcript, audio.currentTime), immediate);
    }
  }

  function stopTranscriptClock() {
    cancelAnimationFrame(frame);
    frame = 0;
  }

  function tickTranscript() {
    syncTranscript();
    if (!audio.paused && !audio.ended) frame = requestAnimationFrame(tickTranscript);
  }

  function updateTime() {
    const hasDuration = Number.isFinite(audio.duration) && audio.duration > 0;
    seek.disabled = !hasDuration || !!audio.error;
    if (hasDuration) {
      seek.max = String(audio.duration);
      duration.textContent = formatCallTime(audio.duration);
    }
    seek.value = String(audio.currentTime);
    elapsed.textContent = formatCallTime(audio.currentTime);
    seek.setAttribute('aria-valuetext', `${elapsed.textContent} מתוך ${duration.textContent}`);
    syncTranscript();
  }

  function pause() {
    wantsPlayback = false;
    request++;
    audio.pause();
    stopTranscriptClock();
    setState(audio.currentTime > 0 ? 'paused' : 'idle');
  }

  function fail(message: string) {
    wantsPlayback = false;
    request++;
    audio.pause();
    stopTranscriptClock();
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
    if (audio.error) audio.load();
    if (audio.ended) audio.currentTime = 0;
    setFollowing(true);
    syncTranscript(true);
    try {
      await audio.play();
    } catch (error) {
      // A newer click or page lifecycle event may have cancelled this request.
      if (currentRequest !== request) return;
      fail(error instanceof DOMException && error.name === 'NotAllowedError'
        ? 'הדפדפן חסם את ההשמעה. לחצו שוב להאזנה או פתחו את ההקלטה ישירות.'
        : 'לא הצלחנו לטעון את ההקלטה. נסו שוב או פתחו אותה ישירות.');
    }
  }

  const playback = observeDemoPlayback({
    frame: phone,
    start: () => {
      audio.muted = true;
      updateSound();
      void play();
    },
    pause,
    isActive: () => wantsPlayback || !audio.paused,
  });

  toggle.addEventListener('click', () => {
    playback.takeControl();
    if (wantsPlayback || !audio.paused) pause();
    else {
      audio.muted = false;
      updateSound();
      void play();
    }
  });
  root.querySelector<HTMLButtonElement>('.recording-restart')!.addEventListener('click', () => {
    playback.takeControl();
    audio.muted = false;
    updateSound();
    setFollowing(true);
    audio.currentTime = 0;
    updateTime();
    syncTranscript(true);
    void play();
  });
  seek.addEventListener('input', () => {
    playback.takeControl();
    setFollowing(true);
    audio.currentTime = seek.valueAsNumber;
    updateTime();
    syncTranscript(true);
    if (!wantsPlayback) setState('paused');
  });
  sound.addEventListener('click', () => {
    playback.takeControl();
    if (audio.muted) {
      pause();
      audio.muted = false;
      updateSound();
      void play();
    } else {
      audio.muted = true;
      updateSound();
    }
  });
  audio.addEventListener('volumechange', updateSound);

  audio.addEventListener('playing', () => {
    if (!wantsPlayback) { audio.pause(); return; }
    setState('playing');
    updateTime();
    stopTranscriptClock();
    tickTranscript();
  });
  audio.addEventListener('waiting', () => {
    if (wantsPlayback) setState('loading');
    stopTranscriptClock();
  });
  audio.addEventListener('pause', () => {
    if (!audio.paused || audio.ended || phone.dataset.state === 'error') return;
    wantsPlayback = false;
    stopTranscriptClock();
    syncTranscript();
    setState(audio.currentTime > 0 ? 'paused' : 'idle');
  });
  audio.addEventListener('ended', () => {
    wantsPlayback = false;
    request++;
    stopTranscriptClock();
    setState('ended');
    updateTime();
  });
  audio.addEventListener('error', () => fail('לא הצלחנו לטעון את ההקלטה. נסו שוב או פתחו אותה ישירות.'));
  for (const event of ['loadedmetadata', 'durationchange', 'timeupdate']) audio.addEventListener(event, updateTime);
  for (const event of ['seeking', 'seeked']) audio.addEventListener(event, () => syncTranscript(true));
  for (const event of ['wheel', 'touchstart', 'pointerdown']) {
    transcriptViewport.addEventListener(event, () => setFollowing(false), { passive: true });
  }
  transcriptViewport.addEventListener('keydown', (event) => {
    if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) setFollowing(false);
  });
  follow.addEventListener('click', () => {
    setFollowing(true);
    syncTranscript(true);
    transcriptViewport.focus({ preventScroll: true });
  });
  window.addEventListener('resize', () => syncTranscript(true));
  updateSound();
  audio.controls = false;
  audio.hidden = true;
  root.querySelector<HTMLElement>('.transcript-follow-row')!.hidden = false;
  toggle.hidden = false;
  controls.hidden = false;
}

export {};
