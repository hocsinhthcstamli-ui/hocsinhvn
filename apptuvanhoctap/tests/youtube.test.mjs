import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { youtubeId, youtubeValue, videoSuggestions } from '../youtube.mjs';
import { createApp, validateBackup } from '../server.mjs';
import { seedData } from '../domain.mjs';
import { phase1Lessons } from '../content/phase-1.mjs';
import { phase2Lessons } from '../content/phase-2.mjs';
import { phase3Lessons } from '../content/phase-3.mjs';

const video = {url: 'https://youtu.be/8dWqtK8jI9o?si=ignored', title: 'Video tiếng Việt', channel: 'UNICEF Viet Nam', note: 'Xem rồi thực hành.'};
test('YouTube normalization rejects foreign hosts, scripts and invalid video references', () => {
  for (const url of [video.url, 'https://www.youtube.com/watch?v=8dWqtK8jI9o&list=ignored', 'https://m.youtube.com/shorts/8dWqtK8jI9o', 'https://youtube.com/embed/8dWqtK8jI9o']) assert.equal(youtubeId(url), '8dWqtK8jI9o');
  for (const url of ['javascript:alert(1)', 'http://youtu.be/8dWqtK8jI9o', 'https://youtube.com.evil.test/watch?v=8dWqtK8jI9o', 'https://user@youtube.com/watch?v=8dWqtK8jI9o', 'https://youtube.com/playlist?list=abc', 'https://youtu.be/abc', 'https://youtube.com:444/watch?v=8dWqtK8jI9o']) assert.throws(() => youtubeId(url));
  assert.equal(youtubeValue(video).url, 'https://www.youtube.com/watch?v=8dWqtK8jI9o');
  assert.throws(() => youtubeValue({...video, channel: ''}));
  assert.throws(() => youtubeValue({...video, note: 'x'.repeat(1001)}));
  const data = seedData();
  data.lessons[0].youtube = video;
  assert.deepEqual(validateBackup(data).lessons[0].youtube, youtubeValue(video));
  data.lessons[0].videoId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  assert.throws(() => validateBackup(data));
});

test('Curriculum audit: every suggested source maps to real lessons, no unreviewed source is auto-assigned', () => {
  const lessons = [...phase1Lessons, ...phase2Lessons, ...phase3Lessons];
  assert.equal(lessons.length, 36);
  for (const band of ['primary', 'secondary']) for (const level of [1, 2, 3]) assert.equal(lessons.filter(l => l.teachingGuide.band === band && l.level === level).length, 6);
  for (const lesson of lessons) {
    assert.ok(!lesson.youtube && !lesson.videoId);
    assert.equal(lesson.cards.length, 6);
    assert.equal(lesson.teachingGuide.practice.length, 5);
    for (const text of [lesson.title, lesson.goal, lesson.prompt, ...lesson.cards.map(c => c.text), ...lesson.teachingGuide.steps]) assert.ok(text.trim() && !text.includes('\uFFFD'));
  }
  for (const suggestion of videoSuggestions) {
    assert.equal(youtubeId(`https://youtu.be/${suggestion.id}`), suggestion.id);
    assert.ok(suggestion.lessonIds.every(id => lessons.some(l => l.id === id)));
  }
});

test('Teacher can save, preserve and remove YouTube metadata; role, validation and backup rules hold', async t => {
  const directory = await mkdtemp(path.join(tmpdir(), 'aac-youtube-'));
  const server = await createApp({dbPath: path.join(directory, 'app.sqlite')});
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => { await new Promise(resolve => server.close(resolve)); await rm(directory, {recursive:true, force:true}); });
  const base = `http://127.0.0.1:${server.address().port}`;
  function client() {
    let cookie = '';
    const json = async (route, body) => {
      const response = await fetch(base + route, {method: body ? 'POST' : 'GET', headers: {Cookie:cookie, 'Content-Type':'application/json'}, ...(body ? {body:JSON.stringify(body)} : {})});
      if (response.headers.get('set-cookie')) cookie = response.headers.get('set-cookie').split(';')[0];
      return {status:response.status, ...(await response.json())};
    };
    return {json, action: async (action,payload) => json('/api/action',{action,payload,version:(await json('/api/state')).version})};
  }
  const admin = client(), teacher = client();
  await admin.json('/api/setup',{username:'admin',password:'123456'});
  await admin.json('/api/users',{username:'teacher',role:'teacher',password:'123456',childIds:[]});
  assert.equal((await teacher.json('/api/login',{username:'teacher',role:'teacher',password:'123456'})).status,200);
  const before = await teacher.json('/api/state');
  const lesson = before.data.lessons[0];
  assert.equal((await admin.action('saveLesson',{...lesson,youtube:video})).status,403);
  assert.equal((await teacher.action('saveLesson',{...lesson,youtube:{...video,url:'https://evil.test/'}})).status,400);
  const saved = await teacher.action('saveLesson',{...lesson,youtube:video});
  assert.equal(saved.status,200);
  assert.deepEqual(saved.data.lessons.find(l=>l.id===lesson.id).youtube,youtubeValue(video));
  assert.deepEqual(saved.data.learningPlans,before.data.learningPlans);
  const preserved = await teacher.action('saveLesson',lesson);
  assert.deepEqual(preserved.data.lessons.find(l=>l.id===lesson.id).youtube,youtubeValue(video));
  assert.deepEqual(validateBackup(preserved.data).lessons.find(l=>l.id===lesson.id).youtube,youtubeValue(video));
  const removed = await teacher.action('saveLesson',{...lesson,youtube:null});
  assert.equal(removed.data.lessons.find(l=>l.id===lesson.id).youtube,null);
  const res = await fetch(base + '/');
  assert.match(res.headers.get('Content-Security-Policy'), /frame-src https:\/\/www.youtube-nocookie.com https:\/\/drive.google.com;/);
});
