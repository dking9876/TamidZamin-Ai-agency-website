const edits = [
  ['01-a-service-day', 'A service day', 'A doorstep greeting, a plumber at the sink, an HVAC repair, and a homeowner making contact.'],
  ['02-hands-at-work', 'Hands at work', 'Closer views of the plumber and HVAC technician working, followed by a friendly doorstep moment.'],
  ['03-from-home-to-help', 'From home to help', 'The homeowner starts the story, followed by the greeting and two hands-on trade scenes.']
];
const params = new URLSearchParams(location.search);
let edit = Number(params.get('edit') || 0);
if (!Number.isInteger(edit) || !edits[edit]) edit = 0;
const film = document.getElementById('film');
const pause = document.getElementById('pause');
const status = document.getElementById('status');
const small = matchMedia('(max-width:880px)');
const reduced = matchMedia('(prefers-reduced-motion:reduce)');
let requestedPlay = !reduced.matches;
let visible = true;
let loadId = 0;
const template = params.get('layout') === 'phone-template';

async function syncPlayback() {
  const token = loadId;
  if (template || !requestedPlay || !visible || document.hidden) { film.pause(); return; }
  try { await film.play(); }
  catch (error) {
    if (token !== loadId || error.name === 'AbortError') return;
    requestedPlay = false;
    pause.textContent = 'Play video';
    status.textContent = error.name === 'NotAllowedError'
      ? 'Automatic playback was blocked. Press Play video to watch.'
      : `Playback could not start: ${error.message}. Try the download link.`;
  }
}

function selectEdit(index) {
  edit = index; loadId++;
  const [file, name, description] = edits[edit];
  document.getElementById('edit-title').textContent = name;
  document.getElementById('description').textContent = description;
  document.getElementById('download').href = `videos/${file}.mp4`;
  document.getElementById('phone-download').href = `videos/${file}-phone-preview.mp4`;
  document.getElementById('phone-label').textContent = `${name} - animation preview`;
  document.querySelectorAll('[data-edit]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.edit) === edit)));
  if (template) return;
  const suffix = small.matches ? '-mobile' : '';
  film.poster = `posters/${file}${suffix}.jpg`;
  film.src = `videos/${file}${suffix}.mp4`;
  film.load();
  status.textContent = 'Loading the video...';
  pause.textContent = requestedPlay ? 'Pause video' : 'Play video';
}

if (template) document.body.classList.add('phone-template');
document.querySelectorAll('[data-edit]').forEach(button => button.addEventListener('click', () => selectEdit(Number(button.dataset.edit))));
pause.addEventListener('click', () => {
  requestedPlay = !requestedPlay;
  pause.textContent = requestedPlay ? 'Pause video' : 'Play video';
  status.textContent = requestedPlay ? 'Silent loop. Sample CTA is inactive.' : 'Video paused.';
  syncPlayback();
});
document.getElementById('raw').addEventListener('click', event => {
  const raw = document.body.classList.toggle('raw');
  event.currentTarget.setAttribute('aria-pressed', String(raw));
});
film.addEventListener('loadeddata', () => {
  status.textContent = requestedPlay ? 'Silent loop. Sample CTA is inactive.' : 'Video paused. Press Play video to watch.';
  syncPlayback();
});
film.addEventListener('error', () => {
  requestedPlay = false;
  pause.textContent = 'Play video';
  status.textContent = 'The video could not load. Check that the videos folder is included, or use the Google Drive copy.';
});
small.addEventListener('change', () => selectEdit(edit));
reduced.addEventListener('change', event => {
  if (event.matches) {
    requestedPlay = false;
    pause.textContent = 'Play video';
    status.textContent = 'Motion reduced. Press Play video to watch.';
    syncPlayback();
  }
});
document.addEventListener('visibilitychange', syncPlayback);
new IntersectionObserver(entries => {
  visible = entries[0].isIntersecting;
  syncPlayback();
}, { threshold: .12 }).observe(film);
selectEdit(edit);
