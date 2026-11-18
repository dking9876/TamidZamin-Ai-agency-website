import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import transcript from '../src/data/call-transcript.json';
import { activeCueIndex, formatCallTime, transcriptAnchorIndex } from '../src/lib/call-transcript';

const originalTurns = [
  'הלו?',
  'שלום, מה נשמע?',
  'שלום, הגעתם לתריס מאסטר. אני העוזר הדיגיטלי של העסק. איך אפשר לעזור?',
  'היי, התריס שלי התקלקל. הוא לא עולה ולא יורד. הוא תקוע.',
  'רק רגע. מצטער לשמוע. בשביל לפתוח בקשה לטכנאי, מה השם, בבקשה?',
  'דניאל ויצר.',
  'תודה, דניאל ויצר. מה הכתובת לביקור? עיר, רחוב ומספר בית.',
  'אה, שלמה שמונה עשרה, תל אביב.',
  'הבנתי, תל אביב, שלמה 18. האם יש קומה או דירה שצריך לציין?',
  'לא, זה בית פרטי.',
  'בסדר. עד כמה הנושא דחוף?',
  'אז הקלה ממש ממש דחופה. אני לא מצליח לצאת החוצה.',
  'הבנתי. מתי נוח לטכנאי להגיע? אפשר לציין תאריך ושעה, או לומר שאין העדפה.',
  'אה, אני אשמח שהוא יגיע מחר. אני פנוי כל היום.',
  'מחר זה יום חמישי, 19 בנובמבר 2026, כל היום. האם תריס מאסטר רשאי ליצור איתכם קשר במספר שמנו אתכם כעת?',
  'כי אני אשמח שיתקשר אליי דרך המספר הזה. אוי אוי, שלח לי הודעה.',
  'הבנתי, נשתמש במספר שממנו אתם מתקשרים. לפני השליחה, אני חוזר על הפרטים: השם דניאל ויצר, הכתובת תל אביב, שלמה 18, בית פרטי. התריס התקלקל, הוא לא עולה ולא יורד והוא תקוע. הדחיפות לפי מה שאמרתם: הקלה ממש ממש דחופה, אני לא מצליח לצאת החוצה. הביקור המבוקש מחר, יום חמישי, 19 בנובמבר, כל היום. הטכנאי יחזור אליכם במספר שממנו אתם מתקשרים. האם הפרטים נכונים?',
  'כן, המוגנים יכולים.',
  'רק רגע. הבקשה התקבלה. נציג יחזור אליכם כדי לתאם את הביקור. יש עוד משהו שאפשר לעזור בו?',
  'לא, תודה רבה.',
  'תודה שפניתם לתריס מאסטר. להתראות.',
];

test('all supplied Hebrew turns are preserved verbatim and in order', () => {
  const turns = originalTurns.map((_, turn) => transcript.filter((cue) => cue.turn === turn).map((cue) => cue.text).join(' '));
  assert.deepEqual(turns, originalTurns);
  assert.deepEqual([...new Set(transcript.map((cue) => cue.turn))], originalTurns.map((_, index) => index));
  for (const cue of transcript) {
    assert.equal(cue.speaker, cue.turn % 2 === 0 ? 'agent' : 'customer');
    assert.ok(cue.text.length <= 160, 'Long turns must be split into readable spoken phrases');
  }
});

test('timings are finite, ordered, non-overlapping and within the original recording', () => {
  assert.ok(transcript.length > originalTurns.length);
  for (let index = 0; index < transcript.length; index++) {
    const cue = transcript[index];
    assert.ok(Number.isFinite(cue.start) && Number.isFinite(cue.end));
    assert.ok(cue.start >= 0 && cue.end > cue.start && cue.end <= 135);
    if (index > 0) assert.ok(transcript[index - 1].end <= cue.start, `Overlapping cue ${index}`);
    assert.equal(activeCueIndex(transcript, cue.start), index);
    assert.equal(activeCueIndex(transcript, (cue.start + cue.end) / 2), index);
    assert.notEqual(activeCueIndex(transcript, cue.end), index);
  }
  assert.equal(activeCueIndex(transcript, 135), -1);
});

test('active cues use half-open audio-time intervals, including silence and exact transitions', () => {
  const cues = [{ start: .25, end: 1 }, { start: 1.4, end: 3 }, { start: 3, end: 4 }];
  for (const [time, expected] of [[0, -1], [.25, 0], [.99, 0], [1, -1], [1.399, -1], [1.4, 1], [3, 2], [4, -1]]) {
    assert.equal(activeCueIndex(cues, time), expected);
  }
  assert.equal(activeCueIndex([], 0), -1);
});

test('seek anchors preserve context through gaps and return to the start on replay', () => {
  const cues = [{ start: .25, end: 1 }, { start: 1.4, end: 3 }];
  assert.equal(transcriptAnchorIndex(cues, 0), 0);
  assert.equal(transcriptAnchorIndex(cues, 1.2), 0);
  assert.equal(transcriptAnchorIndex(cues, 1.4), 1);
  assert.equal(transcriptAnchorIndex(cues, 4), 1);
});

test('timestamps use consistent minutes and zero-padded seconds', () => {
  assert.equal(formatCallTime(0), '0:00');
  assert.equal(formatCallTime(59.99), '0:59');
  assert.equal(formatCallTime(60), '1:00');
  assert.equal(formatCallTime(135), '2:15');
});

test('the audio is still the exact owner recording used for alignment', () => {
  const audio = readFileSync(new URL('../public/media/demo-call.mp3', import.meta.url));
  assert.equal(createHash('sha256').update(audio).digest('hex'), '363c48fa31ac18088552e84f92d39b4190e334519abd87e299e6f3e13a7cac59');
});
