import {buildTopicLessons} from './topic-journeys.mjs';

const rows = [
  ['Em đếm và tính trong phạm vi quen thuộc','cognition','Đếm nhóm vật và giải phép cộng, trừ đơn giản bằng công cụ hỗ trợ.', ['khối đếm','chia đều','Con chọn','Con cần giúp'], 'Dùng sáu khối thật: đếm từng khối, ghép hai nhóm, bớt một nhóm. Cho dùng bảng số hoặc máy tính theo nhu cầu.', 'Đếm sáu khối; gộp ba và hai; bớt hai từ sáu; so sánh bốn và sáu; nói cần giúp khi chưa rõ.'],
  ['Em chia đều và nhận biết một phần tư','cognition','Chia sáu đồ vật thành ba nhóm bằng nhau và nhận biết một phần tư.', ['chia đều','một phần tư','khối đếm','Con chưa biết'], 'Chia sáu bút vào ba khay, mỗi khay hai bút. Dùng hình bánh chia bốn phần bằng nhau để chỉ một phần tư; không coi phần bất kỳ là một phần tư.', 'Chia sáu bút cho ba bạn; đếm mỗi nhóm; chỉ một trong bốn phần bằng nhau; nhận ra hai phần tư; nhờ kiểm tra cách chia.'],
  ['Em phân biệt hình phẳng và hình khối','cognition','Phân biệt hình phẳng với hình khối bằng vật thật và hình vẽ.', ['hình phẳng','hình khối','Con chọn','Con cần giúp'], 'Quan sát hình tròn, vuông, tam giác trên giấy; so sánh với khối lập phương, cầu, trụ. Cho sờ mô hình nếu học sinh muốn.', 'Chọn hình có ba cạnh; chọn hình có bốn cạnh bằng nhau; nhận biết hình tròn; tìm khối cầu; tìm khối lập phương.'],
  ['Em đo độ dài bằng thước','cognition','Đặt đầu vật tại vạch 0, chọn đơn vị và đọc số đo từ tình huống rõ ràng.', ['đo độ dài','thước kẻ','Con chọn','Con cần giúp'], 'Làm mẫu bằng thước thật có vạch số: đặt đầu bút tại vạch 0, nhìn vuông góc và đọc vạch cuối. Ảnh minh họa không có số nên không dùng ảnh để đoán độ dài.', 'Chọn thước đo; đặt đúng vạch 0; đọc vật từ 0 đến 8 cm; tính đoạn từ 2 đến 7 cm; chọn đơn vị cho chiều dài bút.'],
  ['Em tính tiền khi mua đồ dùng','selfcare','Tính tổng và tiền thừa trong tình huống mua sắm mô phỏng.', ['mua đồ dùng','Con chọn','Con chưa biết','Con cần giúp'], 'Dùng bảng giá viết rõ bằng số và tiền mô phỏng: vở 10.000 đồng, bút 5.000 đồng. Cho dùng máy tính; phân biệt tổng tiền với tiền đưa và tiền thừa.', 'Tính một vở và một bút; tính hai bút; tính tiền thừa từ 20.000 đồng; chọn món trong ngân sách; nhờ người bán xác nhận giá.'],
  ['Em xem giờ và chia thời gian học','selfcare','Đọc giờ đúng và tính khoảng thời gian đơn giản để lập kế hoạch.', ['xem giờ','chia đều','Con muốn nghỉ','Con cần giúp'], 'Quan sát đồng hồ 3 giờ: kim ngắn chỉ 3, kim dài chỉ 12. Dùng lịch bằng số rõ ràng để tính giờ bắt đầu, kết thúc và thời gian nghỉ.', 'Nhận biết 3 giờ; chỉ kim giờ; tính từ 15 giờ đến 16 giờ; cộng 15 phút vào 15 giờ; chọn nghỉ sau hoạt động.'],
];
export const mathLessons=buildTopicLessons('math',{secondary:rows}).map(l=>({...l,prompt:'Em chọn thẻ để trao đổi. Có thể dùng vật thật, bảng số hoặc máy tính và nhờ giúp khi cần.',teachingGuide:{...l.teachingGuide,phase:7,materials:['Thẻ hình, giấy, bút và bảng số hoặc máy tính','Khối đếm, thước thật, đồng hồ mô hình và tiền mô phỏng'],support:'Điều chỉnh mức tính theo nhu cầu thực tế, không suy ra năng lực từ tuổi. Chấp nhận chỉ hình, AAC, lời nói hoặc cử chỉ; cho thời gian chờ và nghỉ.'}}));
export function mathTemplate(){return {id:'math',kind:'math',title:'Toán học trong cuộc sống',description:'THCS · Số và phép tính, hình học, đo lường, tiền bạc và thời gian.',stages:[['Số và phép tính','Đếm, tính và chia đều bằng vật thật.'],['Hình học và đo lường','Nhận biết hình và sử dụng thước.'],['Toán trong cuộc sống','Vận dụng tiền bạc và thời gian.']].map(([title,goal],i)=>({id:String(i+1),title,goal,lessonIds:mathLessons.filter(l=>l.level===i+1).map(l=>l.id),lessonScores:{}}))};}
// One-time additive library import. Assignment remains the teacher's decision.
export function addMathContent(data){
  if(data.contentImports?.includes('math-v1'))return false;
  for(const lesson of mathLessons)if(!data.lessons.some(l=>l.id===lesson.id))data.lessons.push(structuredClone(lesson));
  data.journeyTemplates ||= [];
  if(!data.journeyTemplates.some(t=>t.id==='math'))data.journeyTemplates.push(mathTemplate());
  (data.contentImports ||= []).push('math-v1');return true;
}

const q=(text,answer,choices,image)=>({text,answer,choices,image});
export const mathQuestions={
  'math-secondary-01':[
    q('Có tất cả bao nhiêu khối trong hình?','6',['4','6','8'],'math-counting'),
    q('3 + 2 bằng bao nhiêu?','5',['4','5','6']),
    q('Có 6 khối, bớt 2 khối. Còn bao nhiêu?','4',['2','4','6']),
    q('Số nào lớn hơn 4?','6',['3','4','6']),
    q('2 + 2 + 2 bằng bao nhiêu?','6',['4','5','6'])],
  'math-secondary-02':[
    q('6 bút chia đều cho 3 bạn. Mỗi bạn nhận mấy bút?','2',['2','3','6'],'math-sharing'),
    q('Bánh chia 4 phần bằng nhau. Một phần là bao nhiêu chiếc bánh?','1/4',['1/2','1/4','1'],'math-fractions'),
    q('Hai phần tư bằng bao nhiêu chiếc bánh?','1/2',['1/2','1/4','1']),
    q('8 đồ vật chia đều vào 4 nhóm. Mỗi nhóm có bao nhiêu?','2',['2','4','8']),
    q('Muốn mỗi bạn có số bút như nhau, em cần làm gì?','chia đều',['chia đều','xem giờ','đo độ dài'])],
  'math-secondary-03':[
    q('Hình phẳng nào có 3 cạnh?','hình tam giác',['hình tròn','hình tam giác','hình vuông'],'math-shapes'),
    q('Hình nào có 4 cạnh bằng nhau và 4 góc vuông?','hình vuông',['hình vuông','hình tròn','hình tam giác']),
    q('Hình phẳng nào không có cạnh thẳng?','hình tròn',['hình tam giác','hình tròn','hình vuông']),
    q('Quả bóng có hình dạng gần với khối nào?','khối cầu',['khối trụ','khối lập phương','khối cầu'],'math-solids'),
    q('Con xúc xắc có hình dạng gần với khối nào?','khối lập phương',['khối cầu','khối lập phương','khối trụ'])],
  'math-secondary-04':[
    q('Dụng cụ nào dùng để đo độ dài bút?','thước kẻ',['thước kẻ','xem giờ','chia đều'],'math-measuring'),
    q('Để đo dễ dàng, đặt đầu bút tại vạch nào?','0',['0','1','2']),
    q('Vật bắt đầu ở vạch 0 cm và kết thúc ở vạch 8 cm. Dài bao nhiêu?','8 cm',['6 cm','8 cm','10 cm']),
    q('Đoạn thẳng từ vạch 2 cm đến vạch 7 cm dài bao nhiêu?','5 cm',['5 cm','7 cm','9 cm']),
    q('Đơn vị nào phù hợp để ghi độ dài cây bút?','cm',['cm','giờ','đồng'])],
  'math-secondary-05':[
    q('Vở 10.000 đồng, bút 5.000 đồng. Mua cả hai hết bao nhiêu?','15.000 đồng',['10.000 đồng','15.000 đồng','20.000 đồng'],'math-shopping'),
    q('Mỗi bút 5.000 đồng. Hai bút hết bao nhiêu?','10.000 đồng',['5.000 đồng','10.000 đồng','15.000 đồng']),
    q('Mua hết 15.000 đồng, đưa 20.000 đồng. Nhận lại bao nhiêu?','5.000 đồng',['5.000 đồng','10.000 đồng','20.000 đồng']),
    q('Có 10.000 đồng. Mua món giá 15.000 đồng thì còn thiếu bao nhiêu?','5.000 đồng',['5.000 đồng','10.000 đồng','15.000 đồng']),
    q('Chưa hiểu giá tiền, em có thể nói gì?','Con cần giúp',['Con xong rồi','Con cần giúp','xem giờ'])],
  'math-secondary-06':[
    q('Đồng hồ trong hình chỉ mấy giờ?','3 giờ',['3 giờ','6 giờ','12 giờ'],'math-clock'),
    q('Kim nào chỉ giờ trên đồng hồ kim?','kim ngắn',['kim ngắn','kim dài','cả hai giống nhau']),
    q('Từ 15 giờ đến 16 giờ là bao lâu?','1 giờ',['1 giờ','2 giờ','3 giờ']),
    q('Bắt đầu lúc 15 giờ, học 15 phút. Kết thúc lúc nào?','15 giờ 15 phút',['15 giờ','15 giờ 15 phút','16 giờ']),
    q('Học 20 phút và nghỉ 10 phút. Tổng cộng bao nhiêu phút?','30 phút',['10 phút','20 phút','30 phút'])],
};
