export const demoSpeeds = [0.5, 1, 1.5, 2, 3] as const;
export const whatsappEncodedSpeed = 3;

interface DemoSpeedOptions {
  root: HTMLElement;
  media: HTMLMediaElement;
  encodedSpeed?: number;
  takeControl: () => void;
  reportError: (message: string) => void;
}

export function setupDemoSpeed({ root, media, encodedSpeed = 1, takeControl, reportError }: DemoSpeedOptions) {
  const control = root.querySelector<HTMLElement>('.demo-speed')!;
  const select = control.querySelector<HTMLSelectElement>('select')!;

  function sync() {
    const speed = Number((media.playbackRate * encodedSpeed).toFixed(6));
    const value = String(speed);
    if (![...select.options].some((option) => option.value === value)) {
      select.add(new Option(`${speed}×`, value));
    }
    select.value = value;
    if (media.defaultPlaybackRate !== media.playbackRate) media.defaultPlaybackRate = media.playbackRate;
  }

  function apply() {
    try {
      const speed = Number(select.value);
      if (!Number.isFinite(speed) || speed <= 0) throw new RangeError('Invalid demo speed');
      const rate = speed / encodedSpeed;
      media.defaultPlaybackRate = rate;
      media.playbackRate = rate;
      media.preservesPitch = true;
    } catch {
      sync();
      reportError('הדפדפן לא הצליח לשנות את המהירות. בחרו מהירות אחרת ונסו להפעיל שוב.');
    }
  }

  apply();
  control.hidden = false;
  select.addEventListener('change', () => {
    takeControl();
    apply();
  });
  media.addEventListener('ratechange', sync);
}
