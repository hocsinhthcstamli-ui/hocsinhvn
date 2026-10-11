import {buildTopicLessons} from './topic-journeys.mjs';

const rows=[
  ['Em nhận biết thiết bị máy tính','receptive','Chọn màn hình, bàn phím và chuột theo chức năng.', ['màn hình','bàn phím','chuột máy tính','Con cần giúp'], 'Chỉ từng thiết bị thật rồi đối chiếu với ảnh; nói chức năng bằng câu ngắn. Không yêu cầu tháo máy hoặc chạm ổ điện.', 'Tìm màn hình; tìm bàn phím; tìm chuột; chọn thiết bị để gõ; chọn thiết bị để xem hình.'],
  ['Em ngồi học và nghỉ đúng lúc','selfcare','Điều chỉnh tư thế thoải mái và truyền đạt nhu cầu nghỉ.', ['nghỉ mắt','máy tính','Con muốn nghỉ','Con cần giúp'], 'Cùng điều chỉnh ghế, đỡ chân và đặt màn hình dễ nhìn. Tạo cơ hội nghỉ, nhìn ra xa, vận động nhẹ phù hợp cơ thể; không bắt giữ một tư thế cứng nhắc.', 'Nhờ chỉnh ghế; chọn khoảng nhìn thoải mái; báo mỏi mắt; xin nghỉ; quay lại khi sẵn sàng.'],
  ['Em dùng chuột và bàn phím','cognition','Thực hành chọn, gõ và sửa trong tài liệu mẫu.', ['chuột máy tính','bàn phím','gõ phím','Con cần giúp'], 'Dùng tài liệu trống trên máy: chọn ô nhập, gõ một từ, dùng phím cách và Backspace. Có thể thay chuột bằng cảm ứng hoặc công cụ truy cập phù hợp.', 'Chọn ô nhập; gõ một từ; thêm khoảng trắng; xóa ký tự trước con trỏ; nhờ giúp khi thao tác khó.'],
  ['Em lưu và tìm lại bài làm','cognition','Lưu tài liệu vào thư mục được hướng dẫn và tìm lại tệp.', ['thư mục','lưu bài','màn hình','Con chưa biết'], 'Tạo tài liệu thử, lưu bằng tên không chứa thông tin riêng; chọn thư mục lớp học. Mở lại đúng tệp để kiểm tra; không xóa dữ liệu thật khi luyện.', 'Chọn nơi lưu; đặt tên dễ nhớ; bấm lưu; mở lại bài; nhờ tìm bài khi chưa thấy.'],
  ['Em bảo vệ tài khoản và thông tin','selfcare','Nhận biết thông tin riêng và nhờ người phụ trách khi có yêu cầu lạ.', ['bảo vệ tài khoản','nhờ giáo viên','Con không muốn','Con cần giúp'], 'Dùng tình huống giả định, không nhập mật khẩu thật. Luyện từ chối gửi mật khẩu, mã xác nhận, địa chỉ và ảnh riêng cho người lạ; báo giáo viên hoặc người chăm sóc tin cậy.', 'Giữ kín mật khẩu; không gửi mã xác nhận; từ chối chia sẻ địa chỉ; báo tin nhắn lạ; đăng xuất máy dùng chung.'],
  ['Em tìm hỗ trợ khi dùng mạng','communication','Dừng thao tác chưa rõ và tìm người tin cậy hỗ trợ.', ['nhờ giáo viên','bảo vệ tài khoản','Con cần giúp','Con muốn nghỉ'], 'Đóng vai thông báo trúng thưởng, yêu cầu tải tệp hoặc lời nói gây khó chịu bằng tranh. Không mở link hoặc tệp lạ thật; hỗ trợ học sinh báo sự việc mà không trách phạt.', 'Báo cửa sổ lạ; nhờ kiểm tra nguồn; không tải tệp chưa rõ; báo lời nói gây khó chịu; xin nghỉ khỏi màn hình.'],
];
export const computerLessons=buildTopicLessons('computer',{secondary:rows}).map(l=>({...l,prompt:'Em chọn thẻ để trao đổi và thực hành từng bước. Có thể dùng cảm ứng, chuột hoặc công cụ hỗ trợ phù hợp.',teachingGuide:{...l.teachingGuide,phase:8,materials:['Thẻ hình và tình huống mô phỏng','Máy tính hoặc máy tính bảng, tài liệu thử không có dữ liệu riêng'],support:'Chấp nhận AAC, chỉ hình, lời nói hoặc cử chỉ. Giảm số lựa chọn và cho nghỉ theo nhu cầu. Không yêu cầu nhập thông tin, mật khẩu thật hoặc mở liên kết lạ để thực hành.',homePractice:'Cùng người chăm sóc chọn một thao tác trên tài liệu thử, rồi trao đổi điều cần giúp. Không luyện bằng tài khoản hoặc thông tin riêng.'}}));
export function computerTemplate(){return {id:'computer',kind:'computer',title:'Làm chủ máy tính',description:'THCS · Nhận biết thiết bị, thao tác cơ bản và sử dụng mạng an toàn.',stages:[['Nhận biết thiết bị','Làm quen máy tính và thói quen học thoải mái.'],['Thao tác và ứng dụng','Dùng chuột, bàn phím, lưu và tìm bài làm.'],['An toàn trên mạng','Bảo vệ thông tin và biết tìm sự hỗ trợ.']].map(([title,goal],i)=>({id:String(i+1),title,goal,lessonIds:computerLessons.filter(l=>l.level===i+1).map(l=>l.id),lessonScores:{}}))};}
export function addComputerContent(data){
  if(data.contentImports?.includes('computer-v1'))return false;
  for(const lesson of computerLessons)if(!data.lessons.some(l=>l.id===lesson.id))data.lessons.push(structuredClone(lesson));
  data.journeyTemplates ||= [];
  if(!data.journeyTemplates.some(t=>t.id==='computer'))data.journeyTemplates.push(computerTemplate());
  (data.contentImports ||= []).push('computer-v1');return true;
}
const q=(text,answer,choices,image)=>({text,answer,choices,image});
export const computerQuestions={
  'computer-secondary-01':[
    q('Thiết bị nào hiển thị hình ảnh và bài học?','màn hình',['màn hình','bàn phím','chuột máy tính'],'computer-devices'),
    q('Em dùng thiết bị nào để gõ chữ?','bàn phím',['chuột máy tính','bàn phím','màn hình']),
    q('Thiết bị nào giúp di chuyển con trỏ trên máy tính để bàn?','chuột máy tính',['màn hình','chuột máy tính','bàn phím']),
    q('Thiết bị trong hình là gì?','chuột máy tính',['bàn phím','chuột máy tính','màn hình'],'computer-mouse'),
    q('Thiết bị có nhiều phím trong hình là gì?','bàn phím',['bàn phím','màn hình','chuột máy tính'],'computer-keyboard')],
  'computer-secondary-02':[
    q('Mỏi mắt khi học, em nên chọn việc nào?','nghỉ mắt',['nghỉ mắt','cố nhìn tiếp','ngồi sát màn hình'],'computer-break'),
    q('Ghế quá cao khiến em khó ngồi. Em có thể làm gì?','Con cần giúp',['cố chịu','Con cần giúp','đứng lên ghế']),
    q('Khi ngồi học, cách nào phù hợp?','ngồi thoải mái',['ngồi thoải mái','cúi sát màn hình','giữ cứng người']),
    q('Muốn nghỉ một chút, em có thể nói gì?','Con muốn nghỉ',['Con xong rồi','Con muốn nghỉ','bàn phím']),
    q('Sau khi được nghỉ, em vẫn khó chịu. Em nên làm gì?','nhờ giáo viên',['cố học tiếp','nhờ giáo viên','giấu cảm giác'])],
  'computer-secondary-03':[
    q('Muốn gõ vào ô nhập, trước tiên em làm gì?','chọn ô nhập',['chọn ô nhập','tắt máy','rút dây'],'computer-typing'),
    q('Phím nào thường tạo khoảng trắng giữa hai từ?','phím cách',['phím cách','phím Enter','phím Backspace']),
    q('Phím nào thường xóa ký tự ngay trước con trỏ?','phím Backspace',['phím Enter','phím Backspace','phím cách']),
    q('Trong tài liệu văn bản, phím nào thường xuống đoạn mới?','phím Enter',['phím cách','phím Enter','phím Backspace']),
    q('Khó dùng chuột, em có thể làm gì?','Con cần giúp',['Con cần giúp','đập chuột','rút dây'])],
  'computer-secondary-04':[
    q('Để giữ bài làm trên máy, em cần làm gì?','lưu bài',['tắt ngay','lưu bài','xóa bài'],'computer-folder'),
    q('Nơi giúp nhóm các tệp bài học được gọi là gì?','thư mục',['chuột máy tính','thư mục','bàn phím']),
    q('Tên tệp nào dễ tìm và không cần thông tin riêng?','Bai-tap-1',['Bai-tap-1','mật khẩu của em','địa chỉ nhà']),
    q('Làm sao kiểm tra bài đã lưu đúng?','mở lại bài',['mở lại bài','xóa bài','rút dây']),
    q('Chưa tìm được tệp đã lưu, em chọn gì?','nhờ giáo viên',['xóa mọi tệp','nhờ giáo viên','tải tệp lạ'])],
  'computer-secondary-05':[
    q('Người lạ hỏi mật khẩu của em. Em nên làm gì?','không chia sẻ',['gửi ngay','không chia sẻ','đăng công khai'],'computer-safe'),
    q('Có người xin mã xác nhận đăng nhập. Em nên chọn gì?','không chia sẻ',['không chia sẻ','gửi ngay','đăng công khai']),
    q('Thông tin nào cần giữ riêng?','địa chỉ nhà',['tên một con vật','địa chỉ nhà','màu yêu thích']),
    q('Dùng xong tài khoản trên máy dùng chung, em nên làm gì?','đăng xuất',['để mở tài khoản','đăng xuất','gửi mật khẩu']),
    q('Em lỡ gửi thông tin riêng. Nên làm gì tiếp?','nhờ giáo viên',['giấu sự việc','gửi thêm','nhờ giáo viên'])],
  'computer-secondary-06':[
    q('Thông báo lạ nói em trúng thưởng. Em nên chọn gì?','nhờ giáo viên',['bấm nhận ngay','nhờ giáo viên','gửi địa chỉ'],'computer-help'),
    q('Người lạ gửi tệp chưa rõ nguồn. Em nên làm gì?','chưa mở tệp',['mở ngay','chưa mở tệp','gửi cho mọi người']),
    q('Có người nói điều khiến em khó chịu trên mạng. Em chọn gì?','nhờ giáo viên',['giấu cảm giác','nhờ giáo viên','gửi mật khẩu']),
    q('Em không hiểu thông báo trên máy. Có thể nói gì?','Con cần giúp',['Con cần giúp','Con xong rồi','màn hình']),
    q('Ai phù hợp để nhờ kiểm tra tình huống lạ ở lớp?','giáo viên tin cậy',['người lạ nhắn tin','giáo viên tin cậy','tài khoản trúng thưởng'])],
};
