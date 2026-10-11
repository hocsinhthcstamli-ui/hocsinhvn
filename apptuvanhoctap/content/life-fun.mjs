// Authored demo definitions. Materialized by scripts/seed-life-fun.mjs only.
const activity=(kind,n,title,items)=>({id:`life-fun-${kind}-${n}`,journeyId:'life',kind,title,items:items.map(v=>typeof v==='string'?{label:v}:{label:v[0],group:v[1]})});
export const lifeFunDefinitions=[
  activity('listen',1,'Nghe sinh hoạt hằng ngày',['nước','ăn cơm','đi vệ sinh','tắm']),
  activity('listen',2,'Nghe tên cảm xúc',['vui','buồn','sợ','mệt']),
  activity('listen',3,'Nghe lời giao tiếp',['Con chào','Con cần giúp','Con chờ','Con xong rồi']),
  activity('listen',4,'Nghe việc vệ sinh cá nhân',['rửa tay','đánh răng','rửa mặt','chải đầu']),
  activity('listen',5,'Nghe hoạt động vui chơi',['vẽ tranh','chơi bóng','chơi với bạn','xếp khối']),
  activity('sequence',1,'Rửa tay: ba bước minh họa',['mở nước','rửa tay','khóa nước']),
  activity('sequence',2,'Lấy đồ chơi ra, chơi rồi cất',['lấy ra','chơi bóng','cất đồ']),
  activity('sequence',3,'Gõ cửa, chờ được mời rồi chào',['gõ cửa','chờ','chào']),
  activity('sequence',4,'Bữa cơm: vệ sinh trước, dọn bàn sau',['rửa tay','ăn cơm','dọn bàn']),
  activity('sequence',5,'Lịch buổi sáng: rửa mặt, chải đầu, mặc áo',['rửa mặt','chải đầu','mặc áo']),
  activity('sort',1,'Thức ăn và đồ uống',[['bánh mì','Thức ăn'],['mì','Thức ăn'],['nước cam','Đồ uống'],['sữa đậu nành','Đồ uống']]),
  activity('sort',2,'Quần áo và bộ phận cơ thể',[['áo','Quần áo'],['quần','Quần áo'],['đầu','Bộ phận cơ thể'],['tai','Bộ phận cơ thể']]),
  activity('sort',3,'Vệ sinh cá nhân và vui chơi',[['rửa tay','Vệ sinh cá nhân'],['đánh răng','Vệ sinh cá nhân'],['vẽ','Vui chơi'],['chơi bóng','Vui chơi']]),
  activity('sort',4,'Đồ mặc và đồ ăn',[['váy','Đồ mặc'],['áo đầm','Đồ mặc'],['bánh mì','Đồ ăn'],['bánh','Đồ ăn']]),
  activity('sort',5,'Cảm giác cơ thể và hành động giao tiếp',[['đói','Cảm giác cơ thể'],['khát','Cảm giác cơ thể'],['chào','Hành động giao tiếp'],['giơ tay','Hành động giao tiếp']]),
  activity('pairs',1,'Tìm cặp đồ ăn quen thuộc',['bánh mì','bánh','mì','canh']),
  activity('pairs',2,'Tìm cặp quần áo',['áo','quần','váy','giầy']),
  activity('pairs',3,'Tìm cặp cảm xúc',['vui','buồn','sợ','mệt']),
  activity('pairs',4,'Tìm cặp lời giao tiếp',['chào','giúp','chờ','tạm biệt']),
  activity('pairs',5,'Tìm cặp việc tự chăm sóc',['rửa tay','đánh răng','rửa mặt','chải đầu']),
];
