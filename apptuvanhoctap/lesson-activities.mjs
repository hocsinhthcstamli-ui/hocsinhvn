import {cardImage} from './card-art.mjs';
import {mathQuestions} from './content/math-journey.mjs';
import {computerQuestions} from './content/computer-journey.mjs';
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const question = (text, answer, choices) => ({text, answer, choices});
export const videoQuestions = {
  JuD8GXnjJQw: [
    question('Xem đoạn 0:40–0:57. Con vật nào có trong đoạn này?', 'thỏ', ['mèo','thỏ','vịt']),
    question('Xem đoạn 1:14–1:26. Con chọn hình chú mèo trong video nhé.', 'mèo', ['thỏ','mèo','ếch']),
    question('Xem đoạn 1:40–1:50. Con vật màu xanh là con gì?', 'ếch', ['ếch','dê','mèo']),
    question('Xem đoạn 2:02–2:23. Con chọn hình con cừu nhé.', 'cừu', ['dê','thỏ','cừu']),
    question('Xem đoạn 2:24–2:32. Con vật nào vừa được giới thiệu?', 'dê', ['cừu','dê','vịt']),
  ],
  PLPaBj9yYUA: [
    question('Xem đoạn 0:08–0:29. Ảnh nào là ô tô con giống loại xe trong video?', 'ô tô', ['xe máy','ô tô','thuyền']),
    question('Xem đoạn 1:07–1:22. Con chọn chiếc xe cứu thương nhé.', 'xe cứu thương', ['xe buýt','xe máy','xe cứu thương']),
    question('Trong đoạn 1:07–1:22, xe nào đưa người bệnh đi cấp cứu?', 'xe cứu thương', ['xe cứu thương','thuyền','ô tô']),
    question('Nhớ lại đoạn đầu: con chọn loại xe được gọi là ô tô con.', 'ô tô', ['tàu điện','ô tô','xe máy']),
    question('Con thích loại xe nào? Chọn theo ý con, không có đáp án sai.', null, ['ô tô','xe cứu thương','xe buýt']),
  ],
  eRQkxlFQRMs: [
    question('Xem đoạn 1:19–2:00. Các bạn đang nói về việc gì?', 'đội mũ bảo hiểm', ['rửa tay','đội mũ bảo hiểm','nước']),
    question('Trước khi đi xe máy, con chọn việc cần làm giống lời nhắc trong phim.', 'đội mũ bảo hiểm', ['Con xong rồi','đội mũ bảo hiểm','Con muốn nghỉ']),
    question('Con chưa cài được quai mũ. Con nói gì để nhờ người lớn?', 'Con cần giúp', ['Con cần giúp','Con xong rồi','nước']),
    question('Người lớn đang kiểm tra mũ. Con chọn cách chờ an toàn.', 'Con chờ', ['Con xong rồi','Con chờ','nước']),
    question('Con muốn xem lại hay nghỉ một chút? Chọn điều con muốn.', null, ['Con chọn','Con muốn nghỉ','Con cần giúp']),
  ],
};
export function activitiesFor(lesson) {
  const cards = lesson.cards.map(c => c.text);
  const fragments = /^(con muốn|con cần|con thích|con thấy|tên con là|em tên là|em quan tâm đến|đầu tiên|tiếp theo|sau đó|trước tiên)$/i;
  const objects = cards.filter(t => !fragments.test(t) && !/^(con |em |không|cho |đến lượt|nói lại|làm mẫu)/i.test(t));
  const candidates = cards.filter(t => !fragments.test(t) && !/^(con cần giúp|con xong rồi)$/i.test(t));
  const model = text => {
    if (/đánh bạn|cắn|bắt nạt|bỏ chạy|ổ điện|ném đồ/i.test(text)) return ['Con không muốn', text];
    if (/^đau /i.test(text)) return ['Con bị', text];
    if (['vui','buồn','nóng','lạnh','mệt','sợ','đói','khát'].includes(text.toLowerCase())) return ['Con thấy',text];
    if (/^(con |em |không|đi cùng|cho |đến lượt|nói lại|làm mẫu)/i.test(text) && !/^con (chó|mèo|thỏ|gà|vịt|dê|cừu|voi|ếch)/i.test(text)) return [text];
    return ['Con chọn', text];
  };
  const preferred = lesson.id.startsWith('animals-') || lesson.id.startsWith('vehicles-') ? [...objects,...candidates] : candidates;
  const models = [...new Set(preferred)].map(model);
  if (fragments.test(cards[0]) && /^(con muốn|con cần|con thích|con thấy)$/i.test(cards[0]) && objects[0]) models.unshift([cards[0],objects[0]]);
  const distinct = [...new Map(models.map(words=>[words.join(' '),words])).values()];
  const fallback = [['Con chọn'],['Con muốn nghỉ'],['Con chưa biết']];
  const rounds = [0,1,2].map(i => ({
    prompt: `Con dùng thẻ để nói: “${(distinct[i] || fallback[i]).join(' ')}”. Người đồng hành làm mẫu rồi chờ con chọn.`,
    words: distinct[i] || fallback[i],
  }));
  rounds.push({prompt:'Khi chưa làm được hoặc chưa rõ, con có thể nhờ giúp.', words:['Con cần giúp']});
  rounds.push({prompt:'Khi muốn kết thúc hoạt động, con báo với người đồng hành.', words:['Con xong rồi']});
  return {rounds,kind:computerQuestions[lesson.id]?'computer':mathQuestions[lesson.id]?'math':'video',questions:computerQuestions[lesson.id] || mathQuestions[lesson.id] || (lesson.youtube ? (videoQuestions[lesson.youtube.url?.match(/[?&]v=([\w-]+)/)?.[1]] || []) : [])};
}
export function activityMarkup(lesson) {
  return `<lesson-activities data-content="${esc(JSON.stringify(activitiesFor(lesson)))}"></lesson-activities>`;
}
function pictureChoice(text) {
  const src=cardImage({text});
  return `${src ? `<img src="${esc(src)}" alt="" width="150" height="150">` : '<span aria-hidden="true">💬</span>'}<strong>${esc(text)}</strong>`;
}
class LessonActivities extends (globalThis.HTMLElement || class {}) {
  connectedCallback() {
    this.content=JSON.parse(this.dataset.content); this.round=0;this.quiz=0;this.built=[];this.done=new Set();this.answers=new Set();this.quizMistakes=0;this.sentenceMistakes=0;this.sentencesSaved=false;this.quizSaved=false;
    const title={math:'Cùng giải 5 câu hỏi Toán',computer:'Cùng thực hành 5 câu hỏi Máy tính'}[this.content.kind]||'Xem video rồi chọn hình';
    const hint={math:'Em có thể dùng vật thật, bảng số hoặc máy tính. Kết quả thực hành không thay điểm giáo viên.',computer:'Quan sát hình và chọn cách xử lý. Em có thể nhờ hỗ trợ; kết quả thực hành không thay điểm giáo viên.'}[this.content.kind]||'Con có thể dừng video để trả lời từng câu.';
    this.innerHTML=`${this.content.questions.length ? `<section class="panel video-activity"><h2>${title}</h2><p>${hint}</p><div class="video-question"></div></section>` : ''}<section class="panel guided-activity"><h2>Cùng luyện 5 câu bằng thẻ</h2><p>Nghe mẫu · Chọn thẻ · Đọc câu.</p><div class="guided-round"></div></section>`;
    this.addEventListener('click',this.handler=e=>this.click(e));this.drawQuiz();this.drawRound();
  }
  disconnectedCallback(){this.removeEventListener('click',this.handler);this.dispatchEvent(new CustomEvent('activity-stop',{bubbles:true}));}
  result(kind,mistakes){this.dispatchEvent(new CustomEvent("learning-result",{bubbles:true,detail:{kind,total:5,completed:5,mistakes}}));}
  speak(words){this.dispatchEvent(new CustomEvent('activity-speak',{bubbles:true,detail:words}));}
  drawQuiz(){
    if(!this.content.questions.length)return;
    const q=this.content.questions[this.quiz];
    this.querySelector('.video-question').innerHTML=`<p class="eyebrow">Câu hỏi ${this.quiz+1}/5 · Đã trả lời đúng ${this.answers.size}/5</p><h3>${esc(q.text)}</h3>${q.image?`<img class="math-question-image" src="/assets/art/${esc(q.image)}.webp" alt="${esc({'math-counting':'Hai hàng khối đếm','math-sharing':'Ba đĩa bút chia đều','math-fractions':'Bánh chia bốn phần bằng nhau','math-clock':'Đồng hồ kim dài chỉ 12, kim ngắn chỉ 3'}[q.image]||'Hình minh họa tình huống')}">`:''}<div class="activity-options">${q.choices.map((text,i)=>`<button class="activity-choice" data-activity="answer" aria-label="Trả lời: ${esc(text)}" data-index="${i}">${this.content.kind==='math'?`<strong>${esc(text)}</strong>`:this.content.kind==='computer'&&!cardImage({text})?`<strong>${esc(text)}</strong>`:pictureChoice(text)}</button>`).join('')}</div><p class="activity-feedback" role="status">${this.answers.size===5?'✓ Đã hoàn thành 5 câu hỏi.':this.answers.has(this.quiz)?'✓ Em đã trả lời đúng câu này.':''}</p><div class="button-row"><button class="secondary" data-activity="quizPrev" ${this.quiz===0?'disabled':''}>← Câu trước</button><button class="primary" data-activity="quizNext" ${this.quiz===4?'disabled':''}>Câu tiếp →</button></div>`;
  }
  drawRound(){
    const r=this.content.rounds[this.round];this.built=[];
    // Reverse the model tokens so a multi-card answer requires arranging them.
    this.options=[...r.words].reverse();
    this.querySelector('.guided-round').innerHTML=`<p class="eyebrow">Câu luyện ${this.round+1}/5 · Đã luyện ${this.done.size}/5</p><h3>Câu mẫu: ${esc(r.words.join(' '))}</h3><button class="secondary" data-activity="model">🔊 Nghe câu mẫu</button><div class="guided-sentence" aria-live="polite">Con chọn thẻ để ghép câu.</div><div class="activity-options">${this.options.map((text,i)=>`<button class="activity-choice" data-activity="word" aria-label="Thẻ luyện: ${esc(text)}" data-index="${i}">${pictureChoice(text)}</button>`).join('')}</div><div class="button-row"><button class="secondary" data-activity="read">🔊 Nghe câu con ghép</button><button class="text-button" data-activity="clear">Ghép lại</button></div><p class="guided-feedback" role="status"></p><div class="button-row"><button class="secondary" data-activity="prev" ${this.round===0?'disabled':''}>← Câu trước</button><button class="primary" data-activity="next" ${this.round===4?'disabled':''}>Câu tiếp →</button></div>`;
  }
  click(e){
    const b=e.target.closest('[data-activity]');if(!b||b.disabled)return;
    const action=b.dataset.activity;
    if(action==='answer'){
      const q=this.content.questions[this.quiz], chosen=q.choices[Number(b.dataset.index)], correct=q.answer===null||chosen===q.answer;
      if(correct)this.answers.add(this.quiz);else this.quizMistakes++;
      this.querySelector('.video-question .eyebrow').textContent=`Câu hỏi ${this.quiz+1}/5 · Đã trả lời đúng ${this.answers.size}/5`;
      if(this.answers.size===5&&!this.quizSaved){this.quizSaved=true;this.result(this.content.kind||'video',this.quizMistakes);}
      this.speak([chosen]);this.querySelector('.activity-feedback').textContent=correct?(q.answer===null?'✓ Con đã chia sẻ lựa chọn của mình.':'✓ Đúng rồi! Con có thể xem lại đoạn video và chọn câu tiếp.'):'Mình xem lại đoạn video rồi thử chọn hình khác nhé.';
      if(['math','computer'].includes(this.content.kind))this.querySelector('.activity-feedback').textContent=correct?(this.answers.size===5?'✓ Em đã hoàn thành 5 câu hỏi!':'✓ Đúng rồi! Em có thể sang câu tiếp. Với câu khó, em được dùng công cụ hỗ trợ.'):'Chưa khớp. Em xem lại đề hoặc nhờ giúp rồi thử lại nhé.';
      return;
    }
    if(action==='quizNext'||action==='quizPrev'){this.quiz+=action==='quizNext'?1:-1;this.drawQuiz();return;}
    if(action==='prev'||action==='next'){this.round+=action==='next'?1:-1;this.drawRound();return;}
    const r=this.content.rounds[this.round];
    if(action==='model'){this.speak(r.words);return;}
    if(action==='clear'){this.drawRound();return;}
    if(action==='read'){if(this.built.length)this.speak(this.built);else this.querySelector('.guided-feedback').textContent='Con chọn thẻ trước nhé.';return;}
    if(action==='word'){
      const word=this.options[Number(b.dataset.index)];this.built.push(word);b.disabled=true;this.speak([word]);
      this.querySelector('.guided-sentence').textContent=this.built.join(' ');
      if(this.built.length===r.words.length){
        const matches=this.built.every((w,i)=>w===r.words[i]);
        if(matches)this.done.add(this.round);else this.sentenceMistakes++;
        if(this.done.size===5&&!this.sentencesSaved){this.sentencesSaved=true;this.result("sentences",this.sentenceMistakes);}
        this.querySelector('.guided-feedback').textContent=matches?(this.done.size===5?'✓ Con đã luyện đủ 5 câu!':'✓ Con ghép được câu mẫu rồi. Bấm Đọc câu hoặc sang câu tiếp nhé.'):'Câu này khác thứ tự câu mẫu. Con có thể nghe lại rồi bấm Ghép lại.';
      }
    }
  }
}
if(typeof customElements!=='undefined')customElements.define('lesson-activities',LessonActivities);
