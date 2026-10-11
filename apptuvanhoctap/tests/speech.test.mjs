import { test } from "node:test";
import assert from "node:assert/strict";
import { createVietnameseSpeaker } from "../speech.mjs";
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
