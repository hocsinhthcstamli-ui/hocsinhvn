export const funKinds={listen:'Nghe rồi chọn hình',sequence:'Xếp đúng trình tự',sort:'Kéo thả phân loại',pairs:'Lật thẻ tìm cặp'};
export function validateFun(v){
  const text=(s,max)=>typeof s==='string'&&s.trim()&&s.length<=max;
  if(!v||!Object.hasOwn(funKinds,v.kind)||!text(v.title,150)||!text(v.journeyId,100))throw Error('Tên, loại hoặc lộ trình không hợp lệ.');
  if(!Array.isArray(v.items)||v.items.length<2||v.items.length>8)throw Error('Mỗi hoạt động cần từ 2 đến 8 ảnh.');
  const items=v.items.map(i=>{
    if(!text(i.label,80)||typeof i.image!=='string'||i.image.length>400000||!/^data:image\/(png|jpeg|webp);base64,[a-zA-Z0-9+/=]+$/.test(i.image))throw Error('Mỗi thẻ cần tên và ảnh PNG, JPEG hoặc WebP (tối đa 300 KB).');
    const audio=i.audio||'',group=i.group||'';
    if(typeof audio!=='string'||audio.length>1400000||(audio&&!/^data:audio\/(mpeg|mp3|wav|x-wav|ogg|webm);base64,[a-zA-Z0-9+/=]+$/.test(audio)))throw Error('Âm thanh không hợp lệ (tối đa 1 MB).');
    if(v.kind==='listen'&&!audio)throw Error('Mỗi thẻ nghe cần tệp giọng đọc tiếng Việt.');
    if(typeof group!=='string'||group.length>60||(v.kind==='sort'&&!group.trim()))throw Error('Mỗi ảnh phân loại cần tên nhóm.');
    return {label:i.label.trim(),image:i.image,audio,group:group.trim()};
  });
  if(v.kind==='sort'&&(new Set(items.map(i=>i.group)).size<2||new Set(items.map(i=>i.group)).size>4))throw Error('Phân loại cần từ 2 đến 4 nhóm.');
  return {id:v.id,journeyId:v.journeyId,title:v.title.trim(),kind:v.kind,items};
}
