import {DatabaseSync} from 'node:sqlite';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {validateBackup} from '../server.mjs';
const manifest=JSON.parse(await readFile('data/demo-class-39.json','utf8'));
const beforeDb=new DatabaseSync(manifest.backup,{readOnly:true});
const afterDb=new DatabaseSync('data/aac.sqlite',{readOnly:true});
const before=JSON.parse(beforeDb.prepare('SELECT data FROM app_state WHERE id=1').get().data);
const after=JSON.parse(afterDb.prepare('SELECT data FROM app_state WHERE id=1').get().data);
validateBackup(after);
for(const key of ['children','lessons','dailyRecords','assessmentHistory','practiceSessions','activityResults','journeyTemplates','funActivities']){
  for(const original of before[key]||[])assert.deepEqual(after[key].find(row=>row.id===original.id),original,`Changed existing ${key}: ${original.id}`);
}
for(const original of before.learningPlans)assert.deepEqual(after.learningPlans.find(p=>p.childId===original.childId&&(p.journeyId||'life')===(original.journeyId||'life')),original);
for(const user of beforeDb.prepare('SELECT * FROM users').all()){
  const current=afterDb.prepare('SELECT * FROM users WHERE id=?').get(user.id);
  assert.ok(JSON.stringify({...current,child_ids:user.child_ids})===JSON.stringify(user),`Existing account changed: ${user.username}`);
  for(const id of JSON.parse(user.child_ids))assert.ok(JSON.parse(current.child_ids).includes(id));
}
const ids=new Set(manifest.children.map(c=>c.id));
assert.equal(ids.size,39);
for(const child of manifest.children){
  assert.equal(after.learningPlans.filter(p=>p.childId===child.id&&!p.archived).length,5);
  const account=afterDb.prepare('SELECT * FROM users WHERE username=?').get(child.username);
  assert.equal(account.role,'child');assert.deepEqual(JSON.parse(account.child_ids),[child.id]);
}
const summary={students:39,plans:after.learningPlans.filter(p=>ids.has(p.childId)).length,records:after.dailyRecords.filter(r=>ids.has(r.childId)).length,assessments:after.assessmentHistory.filter(r=>ids.has(r.childId)).length,practice:after.practiceSessions.filter(r=>ids.has(r.childId)).length,activities:after.activityResults.filter(r=>ids.has(r.childId)).length};
manifest.summary=summary;manifest.preservedExistingData=true;
await writeFile('data/demo-class-39.json',JSON.stringify(manifest,null,2));
const groups=[...new Set(manifest.children.map(c=>c.scenario))].map(scenario=>{
  const members=manifest.children.filter(c=>c.scenario===scenario),groupIds=new Set(members.map(c=>c.id));
  const records=after.dailyRecords.filter(r=>groupIds.has(r.childId));
  return {scenario,students:members.length,sessions:records.length,averageCorrectPercent:Math.round(records.reduce((n,r)=>n+r.correct/r.total*100,0)/records.length),averagePrompt:Number((records.reduce((n,r)=>n+r.prompt,0)/records.length).toFixed(2))};
});
await mkdir('tmp/demo-class',{recursive:true});
await writeFile('tmp/demo-class/verification.json',JSON.stringify({summary,groups,preservedExistingData:true,browserCheck:manifest.browserCheck},null,2));
console.log(JSON.stringify({summary,groups,preservedExistingData:true}));
beforeDb.close();afterDb.close();
