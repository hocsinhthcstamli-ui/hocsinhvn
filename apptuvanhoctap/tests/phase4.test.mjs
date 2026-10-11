import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {createApp} from '../server.mjs';
import {seedData} from '../domain.mjs';
import {phase2Lessons} from '../content/phase-2.mjs';
import {importPhase2} from '../scripts/seed-phase2.mjs';
import {attachReviewedVideos, importPhase4} from '../scripts/seed-phase4.mjs';

test('Reviewed video attachment skips edits, uploaded files, existing and explicitly removed links', () => {
  const data = seedData();
  data.lessons.push(...structuredClone(phase2Lessons));
  const result = attachReviewedVideos(data);
  assert.deepEqual(result.attached, ['primary-school-01']);
  assert.equal(result.data.lessons.find(l=>l.id==='primary-school-01').youtube.channel, 'UNICEF Viet Nam');
  assert.ok(!Object.hasOwn(data.lessons.find(l=>l.id==='primary-school-01'),'youtube'));
  for(const patch of [{drive:null},{drive:{url:'https://drive.google.com/file/d/sample_file_123456/view',title:'Drive',channel:'Teacher',note:''}},{title:'Teacher title'},{youtube:null},{youtube:result.data.lessons.find(l=>l.id==='primary-school-01').youtube},{videoId:'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'}]) {
    const changed=structuredClone(data);
    Object.assign(changed.lessons.find(l=>l.id==='primary-school-01'),patch);
    const outcome=attachReviewedVideos(changed);
    assert.equal(outcome.attached.length,0);
    assert.deepEqual(outcome.data,changed);
  }
  assert.equal(attachReviewedVideos(seedData()).attached.length,0);
});

test('Phase 4 creates a backup, updates only the selected video and is idempotent', async t => {
  const dir=await mkdtemp(path.join(tmpdir(),'aac-phase4-'));
  const dbPath=path.join(dir,'app.sqlite');
  t.after(()=>rm(dir,{recursive:true,force:true}));
  const server=await createApp({dbPath});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  await new Promise(r=>server.close(r));
  await importPhase2(dbPath);
  const read=p=>{const db=new DatabaseSync(p,{readOnly:true});const row=db.prepare('SELECT version,data FROM app_state WHERE id=1').get();db.close();return {...row,data:JSON.parse(row.data)};};
  const before=read(dbPath);
  const result=await importPhase4(dbPath);
  assert.deepEqual(result.attached,['primary-school-01']);
  assert.deepEqual(read(result.backup),before);
  const after=read(dbPath);
  assert.equal(after.version,before.version+1);
  const restored=structuredClone(after.data);
  delete restored.lessons.find(l=>l.id==='primary-school-01').youtube;
  assert.deepEqual(restored,before.data);
  const repeated=await importPhase4(dbPath);
  assert.deepEqual(repeated.attached,[]);
  assert.equal(repeated.backup,null);
  assert.deepEqual(read(dbPath),after);
});
