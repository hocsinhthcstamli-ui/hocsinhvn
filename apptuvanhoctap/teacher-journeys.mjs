import {funKinds} from './fun-model.mjs';
import {defaultPlan, stageProgress} from './pathways.mjs';
import {makeTopicPlan} from './content/topic-journeys.mjs';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function initialTemplates(lessons) {
  return [['life','Giao tiếp & kỹ năng sống'],['animals','Khám phá động vật'],['vehicles','Khám phá xe cộ']].map(([id,title])=>({
    id,title,description:'Bộ mẫu ban đầu. Giáo viên điều chỉnh trước khi giao cho bé.',kind:id,
    stages:(id==='life'?defaultPlan('template',lessons):makeTopicPlan('template',id)).stages,
  }));
}
export function templateLibrary(templates) {
  return `<section class="panel"><div class="section-heading"><h2>Thư viện lộ trình mẫu</h2><button class="primary" data-action="newTemplate">+ Tạo lộ trình mẫu</button></div><p>Mẫu dùng chung cho giáo viên. Giao một bản riêng cho bé đang chọn; sửa mẫu không thay đổi bản đã giao.</p><div class="profile-grid">${templates.map(t=>`<article class="panel"><h3>${esc(t.title)}</h3><p>${esc(t.description)}</p><p>${t.stages.reduce((n,s)=>n+s.lessonIds.length,0)} bài · 3 đích đến</p><div class="button-row"><button class="primary" data-action="assignTemplate" data-id="${esc(t.id)}">Xem trước & giao cho bé</button><button class="secondary" data-action="editTemplate" data-id="${esc(t.id)}">Sửa mẫu</button><button class="text-button" data-action="deleteTemplate" data-id="${esc(t.id)}">Xóa mẫu</button></div></article>`).join('')||'<p>Chưa có mẫu. Giáo viên có thể tạo mẫu đầu tiên.</p>'}</div></section>`;
}
export function teacherProgress(data,childId,journeyId='') {
  const plans=data.learningPlans.filter(p=>p.childId===childId&&(!journeyId||(p.journeyId||'life')===journeyId));
  const results=(data.activityResults||[]).filter(r=>r.childId===childId&&(!journeyId||r.journeyId===journeyId)).slice().sort((a,b)=>b.at.localeCompare(a.at));
  const labels={...funKinds,computer:'Bài tập Máy tính',math:'Bài tập Toán',puzzle:'Ghép ảnh',sentences:'Luyện câu',video:'Câu hỏi video'};
  return `<section class="panel"><h2>Tiến độ và kết quả thực hành</h2><p>Điểm do giáo viên chấm quyết định mở đích đến. Lượt thực hành do ứng dụng ghi nhận riêng, không thay điểm đánh giá.</p>${plans.map(p=>`<p><strong>${esc(p.title||({life:'Giao tiếp & kỹ năng sống',animals:'Động vật',vehicles:'Xe cộ'}[p.journeyId||'life'])||'Lộ trình riêng')}</strong>${p.archived?' · Đã gỡ khỏi màn học':''}: ${p.stages.map((s,i)=>`đích ${i+1}: ${stageProgress(s).percent}%`).join(' · ')}</p>`).join('')}<p>${results.length} lượt hoạt động đã lưu · ${data.practiceSessions.filter(r=>r.childId===childId).length} lượt ghép câu tự do</p><div class="table-scroll"><table><thead><tr><th>Thời gian</th><th>Hoạt động</th><th>Bài / tranh</th><th>Hoàn thành</th><th>Lần thử chưa khớp</th></tr></thead><tbody>${results.slice(0,50).map(r=>`<tr><td>${esc(new Date(r.at).toLocaleString('vi-VN'))}</td><td>${labels[r.kind]}</td><td>${esc(r.label)}</td><td>${r.completed}/${r.total}</td><td>${r.mistakes}</td></tr>`).join('')||'<tr><td colspan="5">Chưa có kết quả hoạt động mới. Các lượt chơi trước khi bật ghi kết quả không được tính lại.</td></tr>'}</tbody></table></div></section>`;
}
