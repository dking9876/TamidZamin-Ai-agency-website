const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const ease = 'cubic-bezier(0.16, 1, 0.3, 1)';

interface MotionGroup {
  element: HTMLElement;
  animations: Animation[];
  visible: boolean;
  started: boolean;
  cancelled: boolean;
}

const groups = new Map<Element, MotionGroup>();
function animate(group: MotionGroup, replay = false) {
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
      if (!replay) {
        add(element, [{ transform: 'translateY(12px)', opacity: 0.8 }, { transform: 'none', opacity: 1 }], 620);
      }
      element.querySelectorAll('.bubble').forEach((bubble, index) => {
        const direction = bubble.classList.contains('outgoing') ? -1 : 1;
        add(bubble, [
          { transform: `translateX(${direction * 10}px) scale(0.98)`, opacity: 0 },
          { transform: 'translateX(0) scale(1)', opacity: 1 },
        ], 460, 180 + index * 520, 'backwards');
      });
      const summary = element.querySelector('.chat-summary');
      if (summary) {
        add(summary, [
          { clipPath: 'inset(0 0 0 100%)', opacity: 0.4 },
          { clipPath: 'inset(0)', opacity: 1 },
        ], 540, 1800, 'backwards');
      }
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
  const replay = group.element.querySelector<HTMLButtonElement>('.demo-replay');
  if (replay) replay.hidden = reducedMotion.matches;
  if (reducedMotion.matches) {
    group.animations.forEach((animation) => animation.cancel());
    group.started = true;
    group.cancelled = true;
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
    const group: MotionGroup = { element, animations: [], visible: false, started: false, cancelled: false };
    groups.set(element, group);
    const replay = element.querySelector<HTMLButtonElement>('.demo-replay');
    if (replay) {
      replay.hidden = reducedMotion.matches;
      replay.addEventListener('click', () => {
        if (reducedMotion.matches || document.hidden) return;
        group.animations.forEach((animation) => animation.cancel());
        group.animations = [];
        group.cancelled = false;
        animate(group, true);
        sync(group);
      });
    }
    observer.observe(element);
  });
  document.addEventListener('visibilitychange', () => groups.forEach(sync));
  reducedMotion.addEventListener('change', () => groups.forEach(sync));
  window.addEventListener('pagehide', () => groups.forEach((group) => group.animations.forEach((animation) => {
    if (animation.playState === 'running') animation.pause();
  })));
  window.addEventListener('pageshow', () => groups.forEach(sync));
}
