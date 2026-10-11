import { picture } from "./art.mjs";
import { stageProgress } from "./pathways.mjs";

const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);

// Each journey has its own learner plan and teacher scores.
export const journeyCatalog = [
  { id: "life", number: 1, title: "Giao tiếp & kỹ năng sống", cover: "journey-life", ready: true, description: "Từng bước làm quen, thực hành hằng ngày và giao tiếp tự lập." },
  { id: "animals", number: 2, title: "Khám phá động vật", cover: "journey-animals", ready: true, description: "Làm quen những người bạn nhỏ quanh con.", stages: [
    { title: "Làm quen động vật", image: "animals-discover", description: "Khám phá hình ảnh các con vật quen thuộc." },
    { title: "Giao tiếp về động vật", image: "animals-communicate", description: "Chọn hình để bày tỏ điều con muốn chia sẻ." },
    { title: "Quan sát & tương tác an toàn", image: "animals-practice", description: "Cùng người đồng hành tìm hiểu cách ở gần con vật." },
  ] },
  { id: "vehicles", number: 3, title: "Khám phá xe cộ", cover: "journey-vehicles", ready: true, description: "Cùng tìm hiểu những chuyến đi quanh con.", stages: [
    { title: "Làm quen xe cộ", image: "journey-vehicles", description: "Khám phá hình ảnh các phương tiện quen thuộc." },
    { title: "Giao tiếp về chuyến đi", image: "vehicles-communicate", description: "Chọn hình để chia sẻ về nơi con muốn đến." },
    { title: "Đi lại cùng người đồng hành", image: "vehicles-practice", description: "Tìm hiểu những tình huống đi lại trong cuộc sống." },
  ] },
  {id:'math',number:4,title:'Toán học trong cuộc sống',cover:'journey-math',ready:true,description:'THCS · Cùng khám phá số, hình học, tiền bạc và thời gian.',stages:[
    {image:'math-counting'}, {image:'math-stage-2'}, {image:'math-shopping'},
  ]},
  {id:'computer',number:5,title:'Làm chủ máy tính',cover:'journey-computer',ready:true,description:'THCS · Thiết bị, thao tác và an toàn trên mạng.',stages:[{image:'computer-devices'},{image:'computer-practice'},{image:'computer-help'}]},
];

export function assignedJourneys(plans) {
  return plans.filter(p=>!p.archived).map((p,i)=>{ const id=p.journeyId||"life", base=journeyCatalog.find(j=>j.id===(p.kind||id))||journeyCatalog[0]; return {...base,id,number:i+1,title:p.title||base.title,description:p.description??base.description}; });
}
export function journeyChooser(plans, name) {
  if(!assignedJourneys(plans).length)return '<section class="panel"><h2>Chưa có lộ trình được giao</h2><p>Giáo viên sẽ chọn lộ trình phù hợp để con bắt đầu học.</p></section>';
  return `<section class="pathway-intro journey-selector-heading"><div class="journey-greeting">${picture("sticker-explore", "greeting-buddy", true)}<div><p class="eyebrow">CÙNG CON KHÁM PHÁ</p><h2>Lộ trình của ${esc(name)}</h2><p>Chọn một hành trình. Mỗi lộ trình có 3 đích đến.</p></div></div></section><div class="journey-selector">${assignedJourneys(plans).map((journey) => { const plan = plans.find(p => (p.journeyId || "life") === journey.id); const completed = (plan?.stages || []).filter(s => stageProgress(s).passed).length; return `<article class="journey-choice" data-journey="${journey.id}"><div class="journey-cover">${picture(journey.cover, "", true)}</div><div class="journey-choice-body"><p class="eyebrow">LỘ TRÌNH ${journey.number}</p><h3>${esc(journey.title)}</h3><p class="journey-description">${esc(journey.description)}</p><div class="journey-card-meta"><span>3 đích đến</span><span class="badge">${journey.ready ? (plan ? "Có bài học" : "Chờ giáo viên giao bài") : "Chưa có bài học"}</span></div>${journey.ready && plan ? `<p class="journey-ready-status">${completed}/3 đích đến đạt trên 80%</p>` : '<p class="journey-preview-status">Xem trước hình ảnh hành trình</p>'}<button class="${journey.ready ? "primary" : "secondary"}" data-action="openJourney" data-id="${journey.id}">${journey.ready ? "Vào lộ trình" : "Xem sơ đồ"}</button></div></article>`; }).join("")}</div>`;
}

export const backToJourneys = '<button class="text-button journey-back" data-action="showJourneys">← Chọn lộ trình khác</button>';

export function journeyPreview(id) {
  const journey = journeyCatalog.find((item) => item.id === id && !item.ready);
  if (!journey) return "";
  return `${backToJourneys}<section class="pathway-intro journey-preview-heading"><p class="eyebrow">LỘ TRÌNH ${journey.number} · XEM TRƯỚC</p><h2>${esc(journey.title)}</h2><p>Hình ảnh cho 3 đích đến đã sẵn sàng. Bài học đang được chuẩn bị.</p></section><div class="journey-map journey-preview-map" aria-label="Sơ đồ 3 đích đến của lộ trình ${journey.number}"><svg class="journey-road" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true"><path class="road-edge" d="M 240 0 C 970 0 970 500 760 500 S 30 500 240 1000"/><path class="road-fill" d="M 240 0 C 970 0 970 500 760 500 S 30 500 240 1000"/><path class="road-dashes" d="M 240 0 C 970 0 970 500 760 500 S 30 500 240 1000"/></svg>${journey.stages.map((stage, i) => `<article class="pathway-card map-stage preview-stage stage-${i + 1}"><span class="stage-pin" aria-hidden="true">${i + 1}</span><div class="pathway-art">${picture(stage.image, "preview-stage-art", true)}</div><div class="stage-content"><p class="eyebrow">ĐÍCH ĐẾN ${i + 1}</p><h3>${esc(stage.title)}</h3><p>${esc(stage.description)}</p><p class="badge">Chưa có bài học</p></div></article>`).join("")}</div><aside class="journey-milestone">${picture("sticker-care", "milestone-art")}<div><strong>Hẹn con ở hành trình mới</strong><p>Con có thể học ở lộ trình 1 trong lúc chờ.</p><button class="primary" data-action="openJourney" data-id="life">Về lộ trình 1</button></div></aside>`;
}
