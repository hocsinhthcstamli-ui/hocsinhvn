const words=['Một khối','Hai khối','Ba khối','Bốn khối','Năm khối','Sáu khối'];
const count=n=>({label:words[n-1],picture:`/assets/fun/math/count-${n}.webp`});
const activity=(kind,n,title,items)=>({id:`math-fun-${kind}-${n}`,journeyId:'math',kind,title,items:items.map(v=>typeof v==='string'?{label:v}:Array.isArray(v)?{...(typeof v[0]==='number'?count(v[0]):{label:v[0]}),group:v[1]}:v)});
export const mathFunDefinitions=[
  activity('listen',1,'Nghe và chọn số lượng từ một đến bốn',[1,2,3,4].map(count)),
  activity('listen',2,'Nghe và chọn số lượng từ ba đến sáu',[3,4,5,6].map(count)),
  activity('listen',3,'Nghe tên các hình phẳng',['hình tròn','hình vuông','tam giác','hình thoi']),
  activity('listen',4,'Nghe hoạt động Toán trong đời sống',['đo độ dài','xem giờ','chia đều','mua đồ dùng']),
  activity('listen',5,'Nghe tên hình và phần của chiếc bánh',['hình phẳng','hình khối','một phần tư','khối đếm']),
  activity('sequence',1,'Đếm tăng dần: một, hai, ba khối',[1,2,3].map(count)),
  activity('sequence',2,'Đếm giảm dần: sáu, năm, bốn khối',[6,5,4].map(count)),
  activity('sequence',3,'Thêm hai mỗi lần: một, ba, năm khối',[1,3,5].map(count)),
  activity('sequence',4,'Thêm hai mỗi lần: hai, bốn, sáu khối',[2,4,6].map(count)),
  activity('sequence',5,'Lượt thực hành: chọn thước, đo rồi báo xong',['Con chọn','đo độ dài','Con xong rồi']),
  activity('sort',1,'Ít hơn ba và nhiều hơn ba khối',[[1,'Ít hơn ba'],[2,'Ít hơn ba'],[4,'Nhiều hơn ba'],[5,'Nhiều hơn ba']]),
  activity('sort',2,'Số lượng chẵn và lẻ',[[2,'Chẵn'],[4,'Chẵn'],[3,'Lẻ'],[5,'Lẻ']]),
  activity('sort',3,'Hình có ba cạnh và bốn cạnh',[['tam giác','Ba cạnh'],['tam giác vuông','Ba cạnh'],['hình vuông','Bốn cạnh'],['hình thoi','Bốn cạnh']]),
  activity('sort',4,'Hình học và hoạt động đời sống',[['hình phẳng','Hình học'],['hình khối','Hình học'],['mua đồ dùng','Hoạt động đời sống'],['xem giờ','Hoạt động đời sống']]),
  activity('sort',5,'Chia đều thành hai nhóm: số lượng chẵn hoặc lẻ',[[1,'Lẻ'],[3,'Lẻ'],[4,'Chẵn'],[6,'Chẵn']]),
  activity('pairs',1,'Tìm cặp số lượng một đến bốn',[1,2,3,4].map(count)),
  activity('pairs',2,'Tìm cặp số lượng ba đến sáu',[3,4,5,6].map(count)),
  activity('pairs',3,'Tìm cặp hình phẳng',['hình tròn','hình vuông','tam giác','hình thoi']),
  activity('pairs',4,'Tìm cặp hoạt động Toán',['đo độ dài','xem giờ','chia đều','mua đồ dùng']),
  activity('pairs',5,'Tìm cặp hình và phần chiếc bánh',['hình phẳng','hình khối','một phần tư','khối đếm']),
];
