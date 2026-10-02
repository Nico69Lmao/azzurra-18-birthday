const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const countdownScreen = $('#countdown-screen');
const experience = $('#experience');
const countdownFields = { hours: $('#hours'), minutes: $('#minutes'), seconds: $('#seconds') };
let midnightTimer;
let revealed = false;
// The surprise unlocks at midnight in Italy (CEST, UTC+02:00) on October 3, 2026.
const releaseAt = new Date('2026-10-03T00:00:00+02:00');

function revealBirthday() {
  if (revealed) return;
  revealed = true;
  window.clearInterval(midnightTimer);
  countdownScreen.hidden = true;
  experience.hidden = false;
  window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  startConfetti();
}

function updateCountdown() {
  const remaining = Math.max(0, releaseAt.getTime() - Date.now());
  if (!remaining) return revealBirthday();
  countdownFields.hours.textContent = String(Math.floor(remaining / 3_600_000)).padStart(2, '0');
  countdownFields.minutes.textContent = String(Math.floor((remaining % 3_600_000) / 60_000)).padStart(2, '0');
  countdownFields.seconds.textContent = String(Math.floor((remaining % 60_000) / 1_000)).padStart(2, '0');
}

updateCountdown();
if (!revealed) midnightTimer = window.setInterval(updateCountdown, 1_000);

function startConfetti() {
  if (prefersReducedMotion) return;
  const canvas = $('#confetti');
  const context = canvas.getContext('2d');
  if (!context) return;
  const ratio = Math.min(devicePixelRatio || 1, 2);
  let width = innerWidth;
  let height = innerHeight;
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  const colors = ['#f09882', '#e6c38a', '#dc8fa0', '#f7eee7', '#c9828c'];
  const pieces = Array.from({ length: 110 }, () => ({
    x: Math.random() * width, y: -20 - Math.random() * height * .7, size: 3 + Math.random() * 5,
    speed: 1.5 + Math.random() * 3.2, drift: (Math.random() - .5) * 1.5,
    angle: Math.random() * Math.PI, spin: (Math.random() - .5) * .12,
    color: colors[Math.floor(Math.random() * colors.length)],
  }));
  let frame = 0;
  function draw() {
    context.clearRect(0, 0, width, height);
    let active = false;
    for (const piece of pieces) {
      if (piece.y >= height + 20) continue;
      active = true;
      piece.y += piece.speed;
      piece.x += piece.drift + Math.sin(piece.y / 46) * .55;
      piece.angle += piece.spin;
      context.save();
      context.translate(piece.x, piece.y);
      context.rotate(piece.angle);
      context.fillStyle = piece.color;
      context.fillRect(-piece.size / 2, -piece.size, piece.size, piece.size * 1.7);
      context.restore();
    }
    frame += 1;
    if (active && frame < 420) requestAnimationFrame(draw);
    else context.clearRect(0, 0, width, height);
  }
  requestAnimationFrame(draw);
}

const chapterIds = ['greeting', 'quiz', 'game', 'album', 'letter'];
const chapterNumbers = { greeting: '01 / 05', quiz: '02 / 05', game: '03 / 05', album: '04 / 05', letter: '05 / 05' };
const chapterProgress = { greeting: '20%', quiz: '40%', game: '60%', album: '80%', letter: '100%' };
function showChapter(name) {
  for (const chapterId of chapterIds) {
    const chapter = $(`#chapter-${chapterId}`);
    chapter.hidden = chapterId !== name;
    chapter.classList.toggle('is-active', chapterId === name);
  }
  $('#chapter-count').textContent = chapterNumbers[name];
  $('#progress-fill').style.width = chapterProgress[name];
  window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
}

const questions = [
  { title: 'Quando ci siamo messi insieme ufficialmente?', choices: ['10 settembre 2026', '27 settembre 2026', '2 ottobre 2026'], answer: '10 settembre 2026', success: 'Esatto! Il nostro giorno, e il primo capitolo di noi. ♡', retry: 'Stupida, l\'anniversario di Charlie Kirk', nextLabel: 'Prossima domanda' },
  { title: 'Qual è il primo anime che abbiamo visto insieme?', choices: ['Horimiya', 'Cyberpunk', 'Girls Last Tour'], answer: 'Girls Last Tour', success: 'Mi ricordo ancora le tue lacrime quando abbiamo finito di vederlo', retry: 'L\'anime che ti ha fatto piangere', nextLabel: 'Ultima domanda' },
  { title: 'Chi ama di più nella nostra relazione?', choices: ['Nico', 'il tuo ragazzo', 'il mio amore', 'il tuo catboy'], answer: null, success: 'Ti amo di più io scema', retry: '', nextLabel: 'Continua' },
];
let currentQuestion = 0;
let questionCompleted = false;
function renderQuestion(index) {
  currentQuestion = index;
  questionCompleted = false;
  const question = questions[index];
  $('#quiz-number').innerHTML = `DOMANDA 0${index + 1} <span>♡</span>`;
  $('#question-text').textContent = question.title;
  $('#answer-feedback').textContent = '';
  $('.quiz-progress-fill').style.width = `${((index + 1) / questions.length) * 100}%`;
  $('.quiz-progress').setAttribute('aria-label', `Domanda ${index + 1} di ${questions.length}`);
  const answerList = $('#answer-list');
  answerList.replaceChildren();
  question.choices.forEach((choice) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'answer-option';
    button.innerHTML = `<span>${choice}</span><span class="answer-mark" aria-hidden="true">♡</span>`;
    button.addEventListener('click', () => selectAnswer(button, choice, question));
    answerList.append(button);
  });
}
function selectAnswer(button, choice, question) {
  if (questionCompleted) return;
  const feedback = $('#answer-feedback');
  const isCorrect = question.answer === null || choice === question.answer;
  button.classList.add(isCorrect ? 'is-correct' : 'is-incorrect');
  button.querySelector('.answer-mark').textContent = isCorrect ? '✓' : '↻';
  if (!isCorrect) { feedback.textContent = question.retry; return; }
  questionCompleted = true;
  feedback.textContent = question.success;
  $$('.answer-option', $('#answer-list')).forEach((option) => { option.disabled = true; });
  const nextButton = document.createElement('button');
  nextButton.type = 'button';
  nextButton.className = 'button button--primary quiz-next';
  nextButton.innerHTML = `<span>${question.nextLabel}</span><span aria-hidden="true">↗</span>`;
  nextButton.addEventListener('click', () => currentQuestion < questions.length - 1 ? renderQuestion(currentQuestion + 1) : showChapter('game'));
  $('#answer-list').append(nextButton);
}
$$('[data-next]').forEach((button) => button.addEventListener('click', () => {
  if (button.dataset.next === 'quiz') { showChapter('quiz'); renderQuestion(0); }
  else showChapter(button.dataset.next);
}));

// Endless Piano Tiles: the next key waits above the active key and travels down when the view advances.
const gameStart = $('#game-start');
const pianoBoard = $('#piano-board');
const pianoNotes = $('#piano-notes');
const pianoIdle = $('#piano-idle');
const gameOverScreen = $('#game-over');
const pianoPattern = [0, 2, 1, 3, 2, 0, 1, 2, 3, 1, 0, 2, 1, 3, 2, 1, 0, 3, 2, 0, 1, 3, 1, 2];
const pianoMelody = [523.25, 587.33, 659.25, 783.99, 659.25, 587.33, 523.25, 659.25];
const pianoRowHeight = 104;
let gameCombo = 0;
let currentNoteIndex = 0;
let audioContext;
let gameIsRunning = false;
const noteElements = new Map();
function updateGameScore() {
  $('#game-score').textContent = String(gameCombo);
}
function playPianoTone(patternIndex, duration = .28) {
  if (!audioContext || audioContext.state !== 'running') return;
  const oscillator = audioContext.createOscillator();
  const volume = audioContext.createGain();
  const now = audioContext.currentTime;
  oscillator.type = 'triangle';
  oscillator.frequency.setValueAtTime(pianoMelody[patternIndex % pianoMelody.length], now);
  volume.gain.setValueAtTime(.0001, now);
  volume.gain.exponentialRampToValueAtTime(.11, now + .025);
  volume.gain.exponentialRampToValueAtTime(.0001, now + duration);
  oscillator.connect(volume);
  volume.connect(audioContext.destination);
  oscillator.start(now);
  oscillator.stop(now + duration + .03);
}
async function enablePianoAudio() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  if (!audioContext) audioContext = new AudioContextClass();
  if (audioContext.state === 'suspended') await audioContext.resume();
}
function showGameOver() {
  if (!gameIsRunning) return;
  gameIsRunning = false;
  $('#game-over-score').textContent = `Aura x${gameCombo}`;
  gameOverScreen.hidden = false;
  $('#game-restart').focus({ preventScroll: true });
}
function positionPianoView() {
  const bottomRowOffset = pianoBoard.clientHeight - pianoRowHeight;
  pianoNotes.style.transform = `translateY(${bottomRowOffset + currentNoteIndex * pianoRowHeight}px)`;
}
function laneForNote(index) { return pianoPattern[index % pianoPattern.length]; }
function ensurePianoNotes() {
  for (let index = currentNoteIndex; index < currentNoteIndex + 6; index += 1) {
    if (noteElements.has(index)) continue;
    const lane = laneForNote(index);
    const note = document.createElement('button');
    note.type = 'button';
    note.className = `piano-note${index === currentNoteIndex ? ' is-current' : ''}`;
    note.style.left = `${lane * 25}%`;
    note.style.top = `${-index * pianoRowHeight}px`;
    note.setAttribute('aria-label', `Nota ${index + 1}, corsia ${lane + 1}`);
    note.tabIndex = index === currentNoteIndex ? 0 : -1;
    note.setAttribute('aria-label', `Tasto ${lane + 1}`);
    note.addEventListener('click', () => {
      if (!gameIsRunning) return;
      if (index !== currentNoteIndex) {
        showGameOver();
        return;
      }
      note.classList.remove('is-current');
      note.classList.add('is-hit');
      note.tabIndex = -1;
      gameCombo += 1;
      updateGameScore();
      playPianoTone(index);
      currentNoteIndex += 1;
      ensurePianoNotes();
      const nextNote = noteElements.get(currentNoteIndex);
      nextNote.classList.add('is-current');
      nextNote.tabIndex = 0;
      positionPianoView();
      $('#game-feedback').textContent = `Aura x${gameCombo}`;
      window.setTimeout(() => {
        note.remove();
        if (noteElements.get(index) === note) noteElements.delete(index);
      }, 300);
    });
    pianoNotes.append(note);
    noteElements.set(index, note);
  }
  for (const [index, note] of noteElements) {
    if (index < currentNoteIndex - 1 && note.classList.contains('is-hit')) {
      note.remove();
      noteElements.delete(index);
    }
  }
}
async function startPianoGame() {
  await enablePianoAudio();
  gameCombo = 0;
  currentNoteIndex = 0;
  noteElements.clear();
  pianoNotes.replaceChildren();
  gameIsRunning = true;
  updateGameScore();
  gameStart.hidden = true;
  gameOverScreen.hidden = true;
  pianoIdle.hidden = true;
  $('#game-feedback').textContent = 'Partita in corso. Seleziona la nota attiva in fondo per continuare.';
  ensurePianoNotes();
  positionPianoView();
}
gameStart.addEventListener('click', startPianoGame);
$('#game-restart').addEventListener('click', startPianoGame);
$('#game-over-album').addEventListener('click', () => showChapter('album'));
$('#skip-game').addEventListener('click', () => { gameIsRunning = false; showChapter('album'); });
pianoBoard.addEventListener('click', (event) => {
  if (!gameIsRunning || event.target.closest('.piano-note, .game-over-screen')) return;
  showGameOver();
});
window.addEventListener('resize', () => { if (gameIsRunning) positionPianoView(); }, { passive: true });

const photos = [
  { folder: '10 settembre', file: 'photo_2026-09-10_21-16-54.jpg', date: '10 settembre 2026', caption: 'La prima foto che ci siamo fatti e già sembravamo anime gemelle, Volevo guardare solo te quel giorno', shape: 'wide' },
  { folder: '10 settembre', file: 'photo_2026-09-10_21-27-00 (2).jpg', date: '10 settembre 2026', caption: 'Vederti cosi felice tra le mie braccia quando qualche settimana fa non ti sentivi di andare avanti mi ha riscaldato il cuore', shape: 'wide' },
  { folder: '10 settembre', file: 'photo_2026-10-02_16-01-12.jpg', date: '10 settembre · i primi ricordi', caption: 'Avrei voluto baciarmi per sempre con te quel giorno' },
  { folder: '10 settembre', file: 'photo_2026-10-02_16-01-18.jpg', date: '10 settembre · i primi ricordi', caption: 'Non sono una persona che si è mai fatto molte foto insieme ma con te era diverso' },
  { folder: '10 settembre', file: 'photo_2026-10-02_16-01-23.jpg', date: '10 settembre · i primi ricordi', caption: 'Non mi sono mai sentito cosi sicuro nelle mano di qualcuno' },
  { folder: '10 settembre', file: 'photo_2026-10-02_16-01-26.jpg', date: '10 settembre · i primi ricordi', caption: 'Le nostre bracciali simili come i nostri cuori' },
  { folder: '10 settembre', file: 'photo_2026-10-02_16-01-29.jpg', date: '10 settembre · i primi ricordi', caption: 'Anche quando tu guardavi i manga io non smettevo di guardarti' },
  { folder: '27 settembre', file: 'photo_2026-09-27_11-11-41.jpg', date: '27 settembre 2026', caption: 'La seconda volta che ci siamo visti. Stavo con te alle bancarelle quando avrei voluto limonarti su una panchina' },
  { folder: '27 settembre', file: 'photo_2026-10-02_16-00-45.jpg', date: '27 settembre · una giornata insieme', caption: 'Alla fine ho fatto anche quello' },
  { folder: '27 settembre', file: 'photo_2026-10-02_16-00-46.jpg', date: '27 settembre · una giornata insieme', caption: 'Anche se mi sono iniziato a sentire male c\'era il tuo viso che mi calmava il mio battito' },
  { folder: '27 settembre', file: 'photo_2026-10-02_16-00-48.jpg', date: '27 settembre · una giornata insieme', caption: 'le mie pupille quando ti guardo si illuminano' },
  { folder: '27 settembre', file: 'photo_2026-10-02_16-00-51.jpg', date: '27 settembre · una giornata insieme', caption: 'sapevo che si stava avvicinando il momento dove sarei dovuto andare' },
  { folder: '27 settembre', file: 'photo_2026-10-02_16-01-05.jpg', date: '27 settembre · una giornata insieme', caption: 'volevo che mi stavi addosso tutto il giorno' },
  { folder: '27 settembre', file: 'photo_2026-10-02_16-01-09.jpg', date: '27 settembre · una giornata insieme', caption: 'Adoravo che mi mostravi tutte le cose che trovavi interessante come una bambina' },
];
function encodedAssetPath(folder, file) { return `foto_nico_azzurra/${encodeURIComponent(folder)}/${encodeURIComponent(file)}`; }
function createMemoryCard({ date, caption, image, video, shape = 'portrait', index }) {
  const card = document.createElement('article');
  card.className = `memory-card${shape === 'portrait' ? ' memory-card--portrait' : ''}`;
  card.style.animationDelay = `${Math.min(index * 45, 500)}ms`;
  const dateRow = document.createElement('div');
  dateRow.className = 'memory-date';
  dateRow.innerHTML = `<span>${date}</span><span aria-hidden="true">♡</span>`;
  card.append(dateRow);
  if (image) {
    const button = document.createElement('button');
    button.className = 'memory-media';
    button.type = 'button';
    button.setAttribute('aria-label', `Apri la foto: ${caption}`);
    const img = document.createElement('img');
    img.src = encodedAssetPath(image.folder, image.file);
    img.alt = caption;
    img.loading = 'lazy';
    img.decoding = 'async';
    button.append(img);
    button.addEventListener('click', () => openPhoto(img.src, caption));
    card.append(button);
  } else if (video) {
    const player = document.createElement('video');
    player.className = 'memory-video';
    player.controls = true;
    player.preload = 'metadata';
    player.playsInline = true;
    player.setAttribute('aria-label', caption);
    const source = document.createElement('source');
    source.src = encodedAssetPath(video.folder, video.file);
    source.type = 'video/mp4';
    player.append(source);
    card.append(player);
    const fallback = document.createElement('a');
    fallback.className = 'video-fallback';
    fallback.href = source.src;
    fallback.target = '_blank';
    fallback.rel = 'noopener noreferrer';
    fallback.textContent = 'Il video non parte? Aprilo in una nuova scheda ↗';
    fallback.hidden = true;
    player.addEventListener('error', () => { fallback.hidden = false; });
    source.addEventListener('error', () => { fallback.hidden = false; });
    card.append(fallback);
  }
  const captionElement = document.createElement('div');
  captionElement.className = 'memory-caption';
  captionElement.innerHTML = `${caption}<small>${image ? 'una foto del nostro album' : 'un momento da rivedere insieme'}</small>`;
  card.append(captionElement);
  return card;
}
function renderAlbum() {
  const timeline = $('#timeline');
  if (timeline.childElementCount) return;
  const memories = [
    ...photos.map((image) => ({ date: image.date, caption: image.caption, image, shape: image.shape })),
    { date: '27 settembre · da rivedere', caption: 'Adoro scherzare con te e prenderti in giro ridendo tra di noi', video: { folder: '27 settembre', file: 'video_2026-10-02_16-10-43.mp4' }, shape: 'wide' },
    { date: '27 settembre · un altro momento', caption: 'Siamo scemi allo stesso punto', video: { folder: '27 settembre', file: 'video_2026-10-02_16-10-48.mp4' }, shape: 'wide' },
  ];
  memories.forEach((memory, index) => timeline.append(createMemoryCard({ ...memory, index })));
}
const dialog = $('#photo-dialog');
function openPhoto(source, caption) {
  $('#dialog-image').src = source;
  $('#dialog-image').alt = caption;
  $('#dialog-caption').textContent = caption;
  if (typeof dialog.showModal === 'function') dialog.showModal();
}
$('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
const albumObserver = new MutationObserver(() => {
  if (!$('#chapter-album').hidden) { renderAlbum(); albumObserver.disconnect(); }
});
albumObserver.observe($('#chapter-album'), { attributes: true, attributeFilter: ['hidden'] });
$('#restart-button').addEventListener('click', () => { showChapter('greeting'); renderQuestion(0); });
