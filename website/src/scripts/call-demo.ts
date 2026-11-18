const root = document.querySelector<HTMLElement>('.call-demo');

if (root) {
  const phone = root.querySelector<HTMLElement>('.recording-phone')!;
  const audio = root.querySelector<HTMLAudioElement>('audio')!;
  const toggle = root.querySelector<HTMLButtonElement>('.recording-toggle')!;
  const action = root.querySelector<HTMLElement>('.recording-action')!;
  const controls = root.querySelector<HTMLElement>('.recording-controls')!;
  const seek = root.querySelector<HTMLInputElement>('.recording-seek')!;
  const elapsed = root.querySelector<HTMLElement>('.recording-elapsed')!;
  const duration = root.querySelector<HTMLElement>('.recording-duration')!;
  const status = root.querySelector<HTMLElement>('.recording-status')!;
  const download = root.querySelector<HTMLAnchorElement>('.recording-download')!;
  let wantsPlayback = false;
  let request = 0;

  type State = 'idle' | 'loading' | 'playing' | 'paused' | 'ended' | 'error';
  const labels: Record<State, [string, string]> = {
    idle: ['לחצו להאזנה', 'האזנה לשיחת ההדגמה'],
    loading: ['טוען את השיחה…', 'ביטול טעינת שיחת ההדגמה'],
    playing: ['השיחה מתנגנת', 'השהיית שיחת ההדגמה'],
    paused: ['המשך האזנה', 'המשך האזנה לשיחת ההדגמה'],
    ended: ['להאזנה שוב', 'האזנה חוזרת לשיחת ההדגמה'],
    error: ['נסו שוב', 'ניסיון נוסף להאזנה לשיחת ההדגמה'],
  };

  function setState(state: State) {
    phone.dataset.state = state;
    action.textContent = labels[state][0];
    toggle.setAttribute('aria-label', labels[state][1]);
  }

  function formatTime(seconds: number) {
    const time = Math.max(0, Math.floor(seconds));
    return `${Math.floor(time / 60)}:${String(time % 60).padStart(2, '0')}`;
  }

  function updateTime() {
    const hasDuration = Number.isFinite(audio.duration) && audio.duration > 0;
    seek.disabled = !hasDuration || !!audio.error;
    if (hasDuration) {
      seek.max = String(audio.duration);
      duration.textContent = formatTime(audio.duration);
    }
    seek.value = String(audio.currentTime);
    elapsed.textContent = formatTime(audio.currentTime);
    seek.setAttribute('aria-valuetext', `${elapsed.textContent} מתוך ${duration.textContent}`);
  }

  function pause() {
    wantsPlayback = false;
    request++;
    audio.pause();
    setState(audio.currentTime > 0 ? 'paused' : 'idle');
  }

  function fail(message: string) {
    wantsPlayback = false;
    request++;
    audio.pause();
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

  toggle.addEventListener('click', () => {
    if (wantsPlayback || !audio.paused) pause();
    else void play();
  });
  root.querySelector<HTMLButtonElement>('.recording-restart')!.addEventListener('click', () => {
    audio.currentTime = 0;
    updateTime();
    void play();
  });
  seek.addEventListener('input', () => {
    audio.currentTime = seek.valueAsNumber;
    updateTime();
    if (!wantsPlayback) setState('paused');
  });

  audio.addEventListener('playing', () => {
    if (!wantsPlayback) { audio.pause(); return; }
    setState('playing');
    updateTime();
  });
  audio.addEventListener('waiting', () => {
    if (wantsPlayback) setState('loading');
  });
  audio.addEventListener('pause', () => {
    if (!audio.paused || audio.ended || phone.dataset.state === 'error') return;
    wantsPlayback = false;
    setState(audio.currentTime > 0 ? 'paused' : 'idle');
  });
  audio.addEventListener('ended', () => {
    wantsPlayback = false;
    request++;
    setState('ended');
    updateTime();
  });
  audio.addEventListener('error', () => fail('לא הצלחנו לטעון את ההקלטה. נסו שוב או פתחו אותה ישירות.'));
  for (const event of ['loadedmetadata', 'durationchange', 'timeupdate']) audio.addEventListener(event, updateTime);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && (wantsPlayback || !audio.paused)) pause();
  });
  window.addEventListener('pagehide', pause);

  audio.controls = false;
  audio.hidden = true;
  root.querySelector<HTMLElement>('.recording-fallback')!.hidden = true;
  toggle.hidden = false;
  controls.hidden = false;
}

export {};
