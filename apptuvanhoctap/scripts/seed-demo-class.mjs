// Explicit local-only demo: API writes preserve authorization and lesson locks.
import { DatabaseSync, backup } from 'node:sqlite';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { domains } from '../domain.mjs';
import { stageUnlocked } from '../pathways.mjs';
import { createApp } from '../server.mjs';
const base = 'http://127.0.0.1:3002';
const manifestPath = 'data/demo-class-39.json';
if (!process.env.DEMO_ADMIN_PASSWORD || !process.env.DEMO_TEACHER_PASSWORD || !process.env.DEMO_STUDENT_PASSWORD) throw Error('Set DEMO_ADMIN_PASSWORD, DEMO_TEACHER_PASSWORD and DEMO_STUDENT_PASSWORD.');
try { await fetch('http://127.0.0.1:3000/api/health'); throw Error('Stop the local server before seeding.'); } catch(e) { if(e.message==='Stop the local server before seeding.')throw e; }
let server=await createApp();
await new Promise(resolve=>server.listen(3002,'127.0.0.1',resolve));
process.on('uncaughtException',async error=>{console.error(error);await server.shutdown();process.exit(1);});
await mkdir('data/backups', {recursive:true});
let manifest;
try { manifest=JSON.parse(await readFile(manifestPath,'utf8')); } catch(e) { if(e.code!=='ENOENT')throw e; }
if(!manifest){
  const db=new DatabaseSync('data/aac.sqlite');
  const file=`data/backups/before-demo-39-${Date.now()}.sqlite`;
  await backup(db,file); db.close();
  manifest={backup:file,createdAt:new Date().toISOString(),completed:[],children:[]};
  await writeFile(manifestPath,JSON.stringify(manifest,null,2));
}
function client(){let cookie='';return async(route,body)=>{
  const r=await fetch(base+route,{method:body?'POST':'GET',headers:{Cookie:cookie,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
  if(r.headers.get('set-cookie'))cookie=r.headers.get('set-cookie').split(';')[0];
  const data=await r.json();if(!r.ok)throw Error(`${route}: ${r.status} ${JSON.stringify(data)}`);return data;
};}
const admin=client(),teacher=client();
await admin('/api/login',{username:'test1',role:'admin',password:process.env.DEMO_ADMIN_PASSWORD});
await teacher('/api/login',{username:'test2',role:'teacher',password:process.env.DEMO_TEACHER_PASSWORD});
// Read only the revision locally: the existing snapshot includes ~12 MB of images.
// All mutations still go through the authenticated API and its revision check.
const revisionDb=new DatabaseSync('data/aac.sqlite',{readOnly:true});
async function action(who,action,payload){const {version}=revisionDb.prepare('SELECT version FROM app_state WHERE id=1').get();return who('/api/action',{version,action,payload});}
async function once(key,fn){if(manifest.completed.includes(key))return;await fn();manifest.completed.push(key);await writeFile(manifestPath,JSON.stringify(manifest,null,2));}
const names=['Minh Anh','Gia Huy','Ngọc Linh','Bảo An','Đức Minh','Hà My','Tuấn Kiệt','Phương Anh','Khánh Nam','Mai Chi','Quốc Bảo','Thanh Hà','Nhật Minh','Hoài An','Đăng Khoa','Thảo Vy','Thiên Phúc','Ngọc Hân','Anh Tú','Quỳnh Như','Minh Khang','Bảo Ngọc','Trọng Nhân','Khánh Linh','Hải Đăng','Yến Nhi','Đức Anh','Bích Ngọc','Gia Bảo','Thanh Tâm','Hoàng Long','Minh Thư','Tuấn Anh','An Nhiên','Trung Hiếu','Hồng Nhung','Phúc Lâm','Diệu Linh','Quang Huy'];
const groups=['Tiến bộ đều','Cần hỗ trợ nhiều','Kết quả dao động','Vững kỹ năng nền','Điểm tốt nhưng cần nhắc','Mới bắt đầu'];
let {data}=await teacher('/api/state');
const templates=data.journeyTemplates;
if(templates.length<5)throw Error('Expected the five journey templates.');
for(let i=0;i<39;i++){
  if(i>0&&i%8===0){await server.shutdown();server=await createApp();await new Promise(resolve=>server.listen(3002,'127.0.0.1',resolve));}
  const code=String(i+1).padStart(2,'0'),name=`[DEMO ${code}] ${names[i]}`,group=i%6,username=`demo.hs${code}`;
  let state=await admin('/api/state'),child=state.data.children.find(c=>c.name===name);
  if(!child){state=await action(admin,'saveChild',{name,birthYear:2013+i%7});child=state.data.children.find(c=>c.name===name);}
  const childId=child.id;
  if(!manifest.children.some(c=>c.id===childId)){manifest.children.push({id:childId,name,username,scenario:groups[group]});await writeFile(manifestPath,JSON.stringify(manifest,null,2));}
  await once(`${code}:accounts`,async()=>{
    const users=await admin('/api/users'),t=users.find(u=>u.username==='test2');
    await admin('/api/users',{...t,childIds:[...new Set([...t.childIds,childId])]});
    if(!users.some(u=>u.username===username))await admin('/api/users',{username,name,role:'child',childIds:[childId],password:process.env.DEMO_STUDENT_PASSWORD});
  });
  // Assignment updates revoke the teacher's sessions.
  await teacher('/api/login',{username:'test2',role:'teacher',password:process.env.DEMO_TEACHER_PASSWORD});
  await once(`${code}:profile`,()=>action(teacher,'saveChild',{id:childId,goals:`DỮ LIỆU MÔ PHỎNG · ${groups[group]}. Luyện giao tiếp, tự lập và thực hành theo lộ trình.`,supportNote:'Hồ sơ giả lập để thử giao diện, không phải học sinh thật. Các buổi học và đánh giá là kịch bản mô phỏng.'}));
  for(const template of templates.slice(0,5)) await once(`${code}:plan:${template.id}`,()=>action(teacher,'savePlan',{...template,childId,journeyId:template.id}));
  if(group!==5)for(let a=0;a<3;a++)await once(`${code}:assessment:${a}`,()=>action(teacher,'assess',{childId,date:`2026-10-${String(1+a*5).padStart(2,'0')}`,scores:Object.fromEntries(domains.map(([id],d)=>[id,group===1?1:group===3?3+(d%2):group===4?2:group===0?Math.min(3,1+a):1+(d+a)%3]))}));
  // Grade only eligible stages using the teacher account, never the learner account.
  for(const template of templates.slice(0,5)){
    const plan=(await teacher('/api/state')).data.learningPlans.find(p=>p.childId===childId&&(p.journeyId||'life')===template.id);
    for(let si=0;si<plan.stages.length;si++){
      if(group===5 || (si>0&&group!==3) || !stageUnlocked(plan,si))break;
      for(const [li,lessonId] of plan.stages[si].lessonIds.entries()){
        const score=group===3?90+(i+li)%11:group===1?40+(i+li)%21:group===4?85+(i+li)%11:group===0?72+(i+li)%15:55+(i+li)%26;
        await once(`${code}:grade:${template.id}:${lessonId}`,()=>action(teacher,'gradeLesson',{childId,journeyId:template.id,stageId:plan.stages[si].id,lessonId,score}));
        plan.stages[si].lessonScores[lessonId]=score;
      }
    }
  }
  const learner=client();await learner('/api/login',{username,role:'child',password:process.env.DEMO_STUDENT_PASSWORD});
  const rounds=group===5?2:10;
  for(let n=0;n<rounds;n++){
    const template=templates[n%5],stage=template.stages[0],lessonId=stage.lessonIds[(n>=5?1:0)%stage.lessonIds.length];
    const date=`2026-10-${String(2+n).padStart(2,'0')}`;
    const correct=group===0?Math.min(10,4+Math.floor(n/2)):group===1?3+(i+n)%3:group===2?[8,4,7,5,9][n%5]:group===3?9+(n%2):group===4?8+(n%3):4+n;
    const prompt=group===1?3:group===4?2:group===0?Math.max(0,2-Math.floor(n/4)):group===3?0:1+(n%2);
    await once(`${code}:record:${n}`,()=>action(teacher,'saveRecord',{childId,lessonId,date,correct,total:10,prompt,focus:group===1?2:group===3?4:3,behavior:'Mô phỏng: thực hành theo hướng dẫn, nghỉ ngắn giữa lượt.',note:`[DEMO] ${groups[group]} · buổi ${n+1}. ${correct}/10 lượt đúng, mức nhắc ${prompt}/3. Dữ liệu giả lập để kiểm tra báo cáo.`}));
    await once(`${code}:practice:${n}`,()=>action(learner,'practice',{childId,lessonId,date,sentence:'Con muốn học. Con cần giúp. Con xong rồi.'}));
    await once(`${code}:activity:${n}`,()=>action(learner,'activityResult',{id:`demo39-${code}-${n}`,childId,journeyId:template.id,itemId:lessonId,kind:template.id==='math'?'math':template.id==='computer'?'computer':'sentences',total:5,completed:5,mistakes:group===3?n%2:group===1?6+n%4:10-correct}));
  }
  await learner('/api/logout',{});
  console.log(`${code}/39 ${groups[group]}: ${rounds} sessions saved`);
}
const final=(await teacher('/api/state')).data,ids=new Set(manifest.children.map(c=>c.id));
manifest.summary={students:ids.size,plans:final.learningPlans.filter(p=>ids.has(p.childId)).length,records:final.dailyRecords.filter(p=>ids.has(p.childId)).length,assessments:final.assessmentHistory.filter(p=>ids.has(p.childId)).length,practice:final.practiceSessions.filter(p=>ids.has(p.childId)).length,activities:final.activityResults.filter(p=>ids.has(p.childId)).length};
await writeFile(manifestPath,JSON.stringify(manifest,null,2));
console.log(JSON.stringify(manifest.summary));
await admin('/api/logout',{});await teacher('/api/logout',{});
revisionDb.close();
await server.shutdown();
