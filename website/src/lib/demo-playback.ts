interface DemoPlayback {
  frame: HTMLElement;
  start: () => void;
  pause: () => void;
  isActive: () => boolean;
}

export function observeDemoPlayback({ frame, start, pause, isActive }: DemoPlayback) {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let attempted = reducedMotion.matches;
  let userControlled = false;
  let pageActive = true;

  const stop = () => {
    if (isActive()) pause();
  };
  const takeControl = () => {
    attempted = true;
    userControlled = true;
  };

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || entry.intersectionRatio < .15) {
        stop();
        return;
      }
      if (entry.intersectionRatio < .4 || attempted || reducedMotion.matches || document.hidden || !pageActive) return;
      attempted = true;
      start();
    }, { threshold: [0, .15, .4] });
    observer.observe(frame);
  }

  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) {
      attempted = true;
      if (!userControlled) stop();
    }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
  });
  window.addEventListener('pagehide', () => {
    pageActive = false;
    stop();
  });
  window.addEventListener('pageshow', () => { pageActive = true; });

  return { takeControl };
}
