// Activities for journey 2; imported explicitly, never overwrite teacher edits.
const activity=(kind,n,title,items)=>({id:`animals-fun-${kind}-${n}`,journeyId:'animals',kind,title,items:items.map(v=>typeof v==='string'?{label:v}:{label:v[0],group:v[1]})});
export const animalsFunDefinitions=[
  activity('listen',1,'Nghe tên những bạn nhỏ quen thuộc',['mèo','thỏ','gà mái','vịt']),
  activity('listen',2,'Nghe tên con vật ở trang trại',['dê','cừu','con bò','con ngựa']),
  activity('listen',3,'Nghe tên động vật trong thiên nhiên',['voi','ếch','hổ','khỉ']),
  activity('listen',4,'Nghe tên động vật biển',['cá heo','cá voi','cá mập','sao biển']),
  activity('listen',5,'Nghe và phân biệt bốn con vật',['chó','mèo','dê','cừu']),
  activity('sequence',1,'Gặp chó lạ: báo người lớn rồi chờ hỗ trợ',['chó','Con cần giúp','Con chờ']),
  activity('sequence',2,'Tình huống: thấy mèo, cảm thấy sợ và nhờ giúp',['mèo','Con sợ','Con cần giúp']),
  activity('sequence',3,'Lượt xem tranh: chọn, xem thỏ rồi báo xong',['Con chọn','thỏ','Con xong rồi']),
  activity('sequence',4,'Chuẩn bị chăm sóc: nhờ giúp, chuẩn bị nước, chờ người lớn',['Con cần giúp','nước','Con chờ']),
  activity('sequence',5,'Kết thúc chăm sóc mô phỏng: cất đồ, rửa tay, báo xong',['cất đồ','rửa tay','Con xong rồi']),
  activity('sort',1,'Chim và thú',[['gà mái','Chim'],['vịt','Chim'],['mèo','Thú'],['thỏ','Thú']]),
  activity('sort',2,'Con vật có hai chân và bốn chân',[['gà mái','Hai chân'],['vịt','Hai chân'],['dê','Bốn chân'],['cừu','Bốn chân']]),
  activity('sort',3,'Động vật sống ở biển và trên cạn',[['cá heo','Sống ở biển'],['cá voi','Sống ở biển'],['voi','Sống trên cạn'],['thỏ','Sống trên cạn']]),
  activity('sort',4,'Con vật có cánh và không có cánh',[['gà mái','Có cánh'],['vịt','Có cánh'],['mèo','Không có cánh'],['dê','Không có cánh']]),
  activity('sort',5,'Con vật và việc vệ sinh',[['mèo','Con vật'],['thỏ','Con vật'],['rửa tay','Việc vệ sinh'],['lau bàn','Việc vệ sinh']]),
  activity('pairs',1,'Tìm cặp mèo, thỏ, gà và vịt',['mèo','thỏ','gà mái','vịt']),
  activity('pairs',2,'Tìm cặp con vật trang trại',['dê','cừu','con bò','con ngựa']),
  activity('pairs',3,'Tìm cặp động vật thiên nhiên',['voi','ếch','hổ','khỉ']),
  activity('pairs',4,'Tìm cặp động vật biển',['cá heo','cá voi','cá mập','sao biển']),
  activity('pairs',5,'Tìm cặp chó, mèo, dê và cừu',['chó','mèo','dê','cừu']),
];
