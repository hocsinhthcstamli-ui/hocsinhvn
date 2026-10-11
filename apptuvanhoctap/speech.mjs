import { voiceClips } from "./voice-manifest.mjs";

// Public lesson recordings work even when the OS has no Vietnamese voice.
export function createRecordedVietnameseSpeaker({
  audio = new Audio(),
  synth = globalThis.speechSynthesis,
  Utterance = globalThis.SpeechSynthesisUtterance,
  notify = () => {},
  clips = voiceClips,
} = {}) {
  let request = 0;
  let finishCurrent;
  let nativeSpeaker;
  const stop = () => {
    ++request;
    audio.pause();
    finishCurrent?.();
    synth?.cancel();
    nativeSpeaker?.stop();
  };
  const speak = async (value) => {
    stop();
    const id = request;
    const words = (Array.isArray(value) ? value : [value]).filter(Boolean);
    const urls = words.map((text) => clips[text.normalize("NFC").trim().toLocaleLowerCase("vi")]);
    if (!words.length) return;
    if (urls.some((url) => !url)) {
      if (synth && Utterance) {
        nativeSpeaker ||= createVietnameseSpeaker(synth, Utterance, notify);
        return nativeSpeaker(words.join(" "));
      }
      notify("Nội dung mới này chưa có bản đọc tiếng Việt. Các thẻ có sẵn vẫn đọc được.", true);
      return;
    }
    for (const url of urls) {
      if (id !== request) return;
      try {
        await new Promise((resolve, reject) => {
          let finished = false;
          const finish = (error) => {
            if (finished) return;
            finished = true;
            clearTimeout(timer);
            audio.onended = audio.onerror = null;
            finishCurrent = undefined;
            error ? reject(error) : resolve();
          };
          const timer = setTimeout(() => finish(new Error("audio-timeout")), 20000);
          finishCurrent = () => finish();
          audio.onended = () => finish();
          audio.onerror = () => finish(new Error("audio-unavailable"));
          audio.src = url;
          // Invoke play within the user's tap, including on mobile browsers.
          Promise.resolve(audio.play()).catch(finish);
        });
      } catch {
        if (id === request) {
          audio.pause();
          notify("Chưa tải được âm thanh. Kiểm tra kết nối rồi chạm Đọc câu để thử lại.", true);
        }
        return;
      }
    }
  };
  speak.stop = stop;
  return speak;
}

// For teacher-authored text only; never substitute an English voice.
export function createVietnameseSpeaker(
  synth,
  Utterance,
  notify,
  waitMs = 1800,
) {
  let request = 0;
  const findVoice = () =>
    synth.getVoices().find((voice) => /^vi(?:[-_]|$)/i.test(voice.lang));
  function waitForVoice() {
    const voice = findVoice();
    if (voice) return Promise.resolve(voice);
    return new Promise((resolve) => {
      const finish = () => {
        clearTimeout(timer);
        synth.removeEventListener("voiceschanged", changed);
        resolve(findVoice());
      };
      const changed = () => {
        if (findVoice()) finish();
      };
      const timer = setTimeout(finish, waitMs);
      synth.addEventListener("voiceschanged", changed);
      changed();
    });
  }
  const speak = async (text) => {
    const id = ++request;
    synth.cancel();
    const voice = await waitForVoice();
    if (id !== request) return;
    if (!voice) {
      notify(
        "Nội dung mới này chưa có bản đọc tiếng Việt. Các thẻ có sẵn vẫn đọc được.",
        true,
      );
      return;
    }
    const utterance = new Utterance(text);
    utterance.lang = "vi-VN";
    utterance.voice = voice;
    utterance.rate = 0.85;
    utterance.onerror = (event) => {
      if (id === request && !["interrupted", "canceled"].includes(event.error))
        notify(
          "Chưa phát được nội dung này. Hãy thử lại hoặc chọn một thẻ có sẵn.",
          true,
        );
    };
    synth.speak(utterance);
  };
  speak.stop = () => {
    ++request;
    synth.cancel();
  };
  return speak;
}
