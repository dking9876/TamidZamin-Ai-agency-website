const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const ease = 'cubic-bezier(0.16, 1, 0.3, 1)';

interface MotionGroup {
  element: HTMLElement;
  animations: Animation[];
  visible: boolean;
  started: boolean;
}

const groups = new Map<Element, MotionGroup>();
function animate(group: MotionGroup) {
  const { element } = group;
  const add = (target: Element, frames: Keyframe[], duration: number, delay = 0, fill: FillMode = 'none') => {
    const animation = target.animate(frames, { duration, delay, easing: ease, fill });
    group.animations.push(animation);
  };
  switch (element.dataset.motion) {
    case 'hero': {
      element.querySelectorAll('.hero-title-line').forEach((line, index) => {
        add(line, [
          { transform: 'translateX(18px)', filter: 'blur(3px)', opacity: 0.6 },
          { transform: 'translateX(0)', filter: 'blur(0)', opacity: 1 },
        ], 640, index * 90);
      });
      const light = element.querySelector('.hero-light');
      if (light) {
        add(light, [
          { clipPath: 'inset(0 0 0 100%)' },
          { clipPath: 'inset(0)' },
        ], 900, 120, 'backwards');
      }
      break;
    }
    case 'devices':
      add(element, [{ transform: 'translateY(12px)', opacity: 0.8 }, { transform: 'none', opacity: 1 }], 620);
      break;
    case 'photo':
      add(element, [{ clipPath: 'inset(0 8% 0 0)', opacity: 0.8 }, { clipPath: 'inset(0)', opacity: 1 }], 650);
      break;
    case 'handoff':
      element.querySelectorAll('.step-icon').forEach((icon, index) => {
        add(icon, [
          { transform: 'scale(1)', opacity: 1 },
          { transform: 'scale(1.08)', opacity: 1, offset: 0.45 },
          { transform: 'scale(1)', opacity: 1 },
        ], 620, index * 380);
      });
      element.querySelectorAll('.flow-line > span').forEach((line, index) => {
        add(line, [
          { transform: 'scaleX(0)', opacity: 1 },
          { transform: 'scaleX(1)', opacity: 1, offset: 0.75 },
          { transform: 'scaleX(1)', opacity: 0.25 },
        ], 450, index * 380 + 180);
      });
      break;
  }
  group.started = true;
}

function sync(group: MotionGroup) {
  if (reducedMotion.matches) {
    group.animations.forEach((animation) => animation.cancel());
    group.started = true;
    return;
  }
  const shouldPlay = group.visible && !document.hidden;
  if (shouldPlay && !group.started) animate(group);
  group.animations.forEach((animation) => {
    if (animation.playState === 'finished' || animation.playState === 'idle') return;
    if (shouldPlay && animation.playState === 'paused') animation.play();
    else if (!shouldPlay && animation.playState === 'running') animation.pause();
  });
}

// Content is visible before enhancement, after cancellation, and if an API is unavailable.
if ('IntersectionObserver' in window && typeof Element.prototype.animate === 'function') {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const group = groups.get(entry.target);
      if (!group) return;
      group.visible = entry.isIntersecting && entry.intersectionRatio >= 0.15;
      sync(group);
    });
  }, { threshold: 0.15 });

  document.querySelectorAll<HTMLElement>('[data-motion]').forEach((element) => {
    const group: MotionGroup = { element, animations: [], visible: false, started: false };
    groups.set(element, group);
    observer.observe(element);
  });
  document.addEventListener('visibilitychange', () => groups.forEach(sync));
  reducedMotion.addEventListener('change', () => groups.forEach(sync));
  window.addEventListener('pagehide', () => groups.forEach((group) => group.animations.forEach((animation) => {
    if (animation.playState === 'running') animation.pause();
  })));
  window.addEventListener('pageshow', () => groups.forEach(sync));
}
