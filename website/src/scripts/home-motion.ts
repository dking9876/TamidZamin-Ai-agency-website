const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const ease = 'cubic-bezier(0.16, 1, 0.3, 1)';

interface MotionGroup {
  element: HTMLElement;
  animations: Animation[];
  visible: boolean;
  started: boolean;
}

const groups = new Map<Element, MotionGroup>();
const hero = document.querySelector<HTMLElement>('.home-hero-image');
if (hero) hero.dataset.motion = 'hero';

function animate(group: MotionGroup, replay = false) {
  const { element } = group;
  const add = (target: Element, frames: Keyframe[], duration: number, delay = 0, fill: FillMode = 'none') => {
    const animation = target.animate(frames, { duration, delay, easing: ease, fill });
    group.animations.push(animation);
  };
  switch (element.dataset.motion) {
    case 'hero':
      add(element, [{ opacity: 0.65 }, { opacity: 1 }], 760);
      break;
    case 'signal':
      element.querySelectorAll('li > svg').forEach((icon, index) => {
        add(icon, [
          { color: 'var(--cyan)', transform: 'translateY(0)' },
          { color: 'var(--cyan)', transform: 'translateY(-3px)', offset: 0.4 },
          { color: 'inherit', transform: 'translateY(0)' },
        ], 640, index * 240);
      });
      break;
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
      element.querySelectorAll('.waveform i').forEach((bar, index) => {
        const frames = Array.from({ length: 11 }, (_, beat) => ({
          transform: `scaleY(${beat === 0 || beat === 10 ? 1 : 0.3 + ((index * 7 + beat * 3) % 11) / 10})`,
          opacity: beat === 0 || beat === 10 ? 1 : 0.65 + ((index + beat) % 4) / 10,
        }));
        const animation = bar.animate(frames, { duration: 2400, delay: 180, easing: 'ease-in-out' });
        group.animations.push(animation);
      });
      const voiceText = element.querySelector('.voice-phone > p');
      if (voiceText) add(voiceText, [{ opacity: 0.55 }, { opacity: 1 }], 500, 300);
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
    const replay = element.querySelector<HTMLButtonElement>('.demo-replay');
    if (replay) {
      replay.hidden = reducedMotion.matches;
      replay.addEventListener('click', () => {
        if (reducedMotion.matches || document.hidden) return;
        group.animations.forEach((animation) => animation.cancel());
        group.animations = [];
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
