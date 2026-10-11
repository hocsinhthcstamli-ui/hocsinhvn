import {DatabaseSync,backup} from 'node:sqlite';
import {readFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {vehiclesFunDefinitions} from '../content/vehicles-fun.mjs';
import {cardImage} from '../card-art.mjs';
import {voiceClips} from '../voice-manifest.mjs';
import {validateFun} from '../fun-model.mjs';
import {validateBackup} from '../server.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const marker='vehicles-fun-v1';
export async function materializeVehiclesFun(){
  const media=async(url,type)=>{if(!url?.startsWith('/assets/'))throw Error('Missing reviewed asset: '+url);return `data:${type};base64,${(await readFile(path.join(root,url.slice(1)))).toString('base64')}`;};
  return Promise.all(vehiclesFunDefinitions.map(async a=>validateFun({...a,items:await Promise.all(a.items.map(async item=>{
    const image=cardImage({text:item.label});if(!image)throw Error('Missing picture: '+item.label);
    const audio=a.kind==='listen'?voiceClips[item.label.toLowerCase().trim()]:null;
    if(a.kind==='listen'&&!audio)throw Error('Missing recording: '+item.label);
    return {...item,image:await media(image,'image/webp'),audio:audio?await media(audio,'audio/mpeg'):''};
  }))})));
}
export function mergeVehiclesFun(data,activities){
  if(data.contentImports?.includes(marker))return 0;
  const existing=data.funActivities ||= [];
  const additions=activities.filter(a=>!existing.some(old=>old.id===a.id));
  if(existing.length+additions.length>200)throw Error('Activity limit exceeded.');
  existing.push(...structuredClone(additions));(data.contentImports ||= []).push(marker);
  return additions.length;
}
export async function importVehiclesFun(dbPath=path.join(root,'data/aac.sqlite')){
  const activities=await materializeVehiclesFun();
  const db=new DatabaseSync(dbPath);db.exec('PRAGMA busy_timeout=5000');
  try{
    const before=db.prepare('SELECT data FROM app_state WHERE id=1').get();if(!before)throw Error('Initialize the application first.');
    if(JSON.parse(before.data).contentImports?.includes(marker))return {added:0,alreadyImported:true};
    const folder=path.join(path.dirname(dbPath),'backups');await mkdir(folder,{recursive:true});
    const backupPath=path.join(folder,`before-vehicles-fun-${Date.now()}.sqlite`);await backup(db,backupPath);
    db.exec('BEGIN IMMEDIATE');
    try{
      const row=db.prepare('SELECT data FROM app_state WHERE id=1').get(),data=JSON.parse(row.data);
      const added=mergeVehiclesFun(data,activities);validateBackup(data);
      const serialized=JSON.stringify(data);if(Buffer.byteLength(serialized)>22*1024*1024)throw Error('Snapshot exceeds 22 MB.');
      db.prepare('UPDATE app_state SET data=?,version=version+1 WHERE id=1').run(serialized);
      db.prepare('INSERT INTO audit(at,user_id,action) VALUES(?,?,?)').run(new Date().toISOString(),'system:vehicles-fun',`importVehiclesFun:${added}`);
      db.exec('COMMIT');return {added,backup:backupPath,bytes:Buffer.byteLength(serialized)};
    }catch(e){db.exec('ROLLBACK');throw e;}
  }finally{db.close();}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log(JSON.stringify(await importVehiclesFun(process.argv[2]?path.resolve(process.argv[2]):undefined),null,2));
