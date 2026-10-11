import { test } from "node:test";
import assert from "node:assert/strict";
import { createVietnameseSpeaker, createRecordedVietnameseSpeaker } from "../speech.mjs";
import { voiceClips } from "../voice-manifest.mjs";
import { completeSeedData } from "../content/seed.mjs";
import { stat } from "node:fs/promises";
function fixture(voices = []) {
  const synth = new EventTarget();
  const spoken = [],
    notices = [];
  synth.getVoices = () => voices;
  synth.cancel = () => {};
  synth.speak = (utterance) => spoken.push(utterance);
  class Utterance {
    constructor(text) {
      this.text = text;
    }
  }
  return {
    synth,
    voices,
    spoken,
    notices,
    speak: createVietnameseSpeaker(
      synth,
      Utterance,
      (...args) => notices.push(args),
      25,
    ),
  };
}
test("Vietnamese voice is explicitly selected for cards and sentences", async () => {
  const vi = { lang: "vi-VN" },
    f = fixture([{ lang: "en-US", default: true }, vi]);
  for (const text of ["con chó", "Con muốn con mèo"]) await f.speak(text);
  assert.equal(f.spoken.length, 2);
  assert.ok(f.spoken.every((u) => u.voice === vi && u.lang === "vi-VN"));
});
test("waits for asynchronously loaded Vietnamese voice and only reads latest tap", async () => {
  const f = fixture([{ lang: "en-US" }]);
  const first = f.speak("xe"),
    last = f.speak("con mèo");
  f.voices.push({ lang: "vi_VN" });
  f.synth.dispatchEvent(new Event("voiceschanged"));
  await Promise.all([first, last]);
  assert.deepEqual(
    f.spoken.map((u) => u.text),
    ["con mèo"],
  );
});
test("missing Vietnamese voice never falls back to English", async () => {
  const f = fixture([{ lang: "en-US", default: true }]);
  await f.speak("Con muốn");
  assert.equal(f.spoken.length, 0);
  assert.equal(f.notices.length, 1);
  assert.match(f.notices[0][0], /tiếng Việt/);
});

test("Every built-in card has a bundled Vietnamese recording", async () => {
  for (const lesson of completeSeedData().lessons) {
    for (const card of lesson.cards) {
      const file = voiceClips[card.text.toLocaleLowerCase("vi").trim()];
      assert.ok(file, `Missing recording: ${card.text}`);
      assert.ok((await stat(new URL(`..${file}`, import.meta.url))).size > 1000);
    }
  }
});

function audioFixture() {
  const played = [], notices = [];
  const audio = { pause() {}, play() { played.push(this.src); return Promise.resolve(); } };
  const speak = createRecordedVietnameseSpeaker({ audio, synth: null, Utterance: null, notify: (...args) => notices.push(args) });
  return { audio, played, notices, speak };
}
test("Recordings play a sentence in order with no OS speech engine", async () => {
  const f = audioFixture();
  const done = f.speak(["Con muốn", "con chó"]);
  assert.equal(f.played[0], voiceClips["con muốn"]);
  f.audio.onended();
  await Promise.resolve();
  assert.equal(f.played[1], voiceClips["con chó"]);
  f.audio.onended();
  await done;
  assert.equal(f.notices.length, 0);
});
test("Latest tap cancels the sentence and ignores stale playback rejection", async () => {
  const f = audioFixture();
  let rejectOld;
  f.audio.play = function () { f.played.push(this.src); return new Promise((_, reject) => { rejectOld = reject; }); };
  const old = f.speak(["Con muốn", "con chó"]);
  f.audio.play = function () { f.played.push(this.src); return Promise.resolve(); };
  const latest = f.speak("xe");
  rejectOld(new Error("aborted"));
  await Promise.resolve();
  assert.equal(typeof f.audio.onended, "function");
  f.audio.onended();
  await Promise.all([old, latest]);
  assert.deepEqual(f.played, [voiceClips["con muốn"], voiceClips.xe]);
  assert.equal(f.notices.length, 0);
});
test("Playback failure is reported; unknown custom text never plays the wrong recording", async () => {
  const f = audioFixture();
  const done = f.speak("xe");
  f.audio.onerror();
  await done;
  assert.equal(f.notices.length, 1);
  await f.speak("A custom sentence without a recording");
  assert.equal(f.played.length, 1);
  assert.equal(f.notices.length, 2);
});
