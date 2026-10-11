// Never let the browser substitute its default (often English) voice.
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
  return async (text) => {
    const id = ++request;
    synth.cancel();
    const voice = await waitForVoice();
    if (id !== request) return;
    if (!voice) {
      notify(
        "Thiết bị chưa có giọng đọc tiếng Việt. Hãy thêm giọng tiếng Việt trong cài đặt giọng nói của thiết bị rồi mở lại ứng dụng.",
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
          "Chưa phát được giọng tiếng Việt. Kiểm tra âm lượng và giọng nói đã cài trên thiết bị.",
          true,
        );
    };
    synth.speak(utterance);
  };
}
