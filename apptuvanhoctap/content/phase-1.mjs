// Authored foundation content. This is an explicit import, never an automatic reset.
const scoring =
  "Quan sát 5 cơ hội thực hành theo tiêu chí của bài. Mỗi cơ hội: 20 điểm khi học sinh tự chọn hoặc thể hiện thông điệp phù hợp; 10 điểm khi làm được sau một gợi ý bổ sung; 0 điểm khi chưa thể hiện sau hỗ trợ. Tổng tối đa 100. Lời nói, chỉ hình, cử chỉ và AAC đều được chấp nhận như nhau. Công cụ hỗ trợ thường dùng không bị trừ điểm. Không yêu cầu nhìn vào mắt, nói thành tiếng hay đồng ý với người lớn để được điểm.";
const support =
  "Bắt đầu với 2 thẻ nếu nhiều lựa chọn gây khó khăn; tăng dần khi học sinh sẵn sàng. Đọc mẫu và chờ khoảng 5–10 giây, điều chỉnh thời gian theo từng em. Không cầm tay ép chọn. Chấp nhận từ chối hoặc xin nghỉ; chuyển phần quan sát sang buổi khác nếu học sinh không muốn tham gia. Không nhập 0 chỉ vì chưa có cơ hội đánh giá.";
function lesson(band, number, title, domain, goal, prompt, cards, guide) {
  return {
    id: `foundation-${band}-${String(number).padStart(2, "0")}`,
    title,
    domain,
    level: 1,
    goal,
    prompt,
    source: "custom",
    videoId: "",
    cards: cards.map(([text, icon]) => ({ text, icon })),
    teachingGuide: {
      band,
      phase: 1,
      durationMinutes: band === "primary" ? 10 : 15,
      scoring,
      support,
      ...guide,
    },
  };
}
export const phase1Lessons = [
  lesson(
    "primary",
    1,
    "Cấp 1 · Con chào và giới thiệu mình",
    "communication",
    "Thể hiện lời chào và một thông tin muốn chia sẻ về bản thân bằng lời nói, cử chỉ hoặc thẻ hình.",
    "Con chọn lời chào và điều con muốn giới thiệu.",
    [
      ["Con chào", "👋"],
      ["Tên con là", "🙋"],
      ["Con thích", "💚"],
      ["vẽ tranh", "🎨"],
      ["đọc sách", "📖"],
      ["Con chưa muốn nói", "✋"],
    ],
    {
      materials: [
        "Thẻ lời chào và sở thích",
        "Tờ giấy ghi tên học sinh hoặc thẻ tên riêng; không đưa địa chỉ/số điện thoại lên màn hình",
      ],
      steps: [
        "Cho học sinh chọn cách chào: vẫy tay, nói hoặc chỉ thẻ. Giáo viên làm mẫu một lần.",
        "Giới thiệu tên mình, sau đó mời học sinh dùng thẻ tên hoặc cách giao tiếp quen thuộc. Không yêu cầu đọc được tên.",
        "Đưa hai hoạt động quen thuộc để học sinh chọn sở thích thật; cho phép chọn “Con chưa muốn nói”.",
        "Đổi vai với một người quen khác và nhắc lại tình huống vào cuối buổi.",
      ],
      practice: [
        "Chào giáo viên khi đến lớp",
        "Chào một bạn quen",
        "Giới thiệu tên với giáo viên",
        "Chọn sở thích muốn chia sẻ",
        "Kết thúc bằng lời chào hoặc thể hiện chưa muốn nói",
      ],
      success:
        "Mỗi cơ hội, học sinh thể hiện được một thông điệp phù hợp với lựa chọn của mình. Không chấm khả năng đọc tên hay giao tiếp bằng mắt.",
      homePractice:
        "Trong một lần gặp người thân quen, cho con chọn cách chào hoặc chọn không chào lúc đó. Người lớn phản hồi tự nhiên, không bắt lặp lại nhiều lần.",
    },
  ),
  lesson(
    "primary",
    2,
    "Cấp 1 · Con nói điều mình cần",
    "communication",
    "Chủ động thể hiện nhu cầu nước uống, đồ dùng hoặc nghỉ ngơi trong tình huống quen thuộc.",
    "Con đang cần gì? Con có thể chọn một hoặc nhiều thẻ.",
    [
      ["Con cần", "🙋"],
      ["nước uống", "🥤"],
      ["bút", "✏️"],
      ["đi vệ sinh", "🚻"],
      ["nghỉ một chút", "🌿"],
      ["giúp con", "🤝"],
    ],
    {
      materials: [
        "Cốc nước và bút thật trong tầm nhìn",
        "Thẻ nhu cầu; luôn có cách báo đi vệ sinh và xin nghỉ",
      ],
      steps: [
        "Đặt hai lựa chọn gần gũi, hỏi mở “Con cần gì?”; không giữ lại nước hoặc quyền đi vệ sinh để tạo thử thách.",
        "Làm mẫu ghép “Con cần” với một thẻ, đồng thời chấp nhận học sinh chỉ riêng thẻ đồ vật.",
        "Đáp ứng nhu cầu nếu có thể. Nếu chưa thể, giải thích ngắn và đưa phương án thay thế.",
        "Thực hành lại ở góc học và trước một hoạt động khác; giảm lời nhắc dần.",
      ],
      practice: [
        "Chọn đồ dùng trước khi vẽ",
        "Báo cần nước khi muốn uống",
        "Chọn thẻ nghỉ trong tình huống đóng vai",
        "Báo cần giúp khi thiếu đồ dùng",
        "Đóng vai cách báo đi vệ sinh",
      ],
      success:
        "Thông điệp phải thể hiện nhu cầu học sinh chọn, không phải nhu cầu người lớn đoán. Thẻ đơn vẫn đạt nếu người nhận hiểu đúng.",
      homePractice:
        "Đặt bảng nhu cầu ở nơi con dễ với tới. Khi con tự sử dụng trong sinh hoạt, người lớn đáp lời và ghi lại một ví dụ.",
    },
  ),
  lesson(
    "primary",
    3,
    "Cấp 1 · Con nhờ giúp khi chưa hiểu",
    "receptive",
    "Báo chưa hiểu và chọn cách nhờ giải thích lại hoặc làm mẫu.",
    "Nếu chưa hiểu, con muốn cô/thầy giúp thế nào?",
    [
      ["Con chưa hiểu", "❓"],
      ["Nói lại giúp con", "🔁"],
      ["Làm mẫu giúp con", "👀"],
      ["Chậm hơn", "🐢"],
      ["Con muốn thử", "✋"],
      ["Con cần nghỉ", "🌿"],
    ],
    {
      materials: [
        "Bút, giấy và một nhiệm vụ đơn giản đã quen",
        "Thẻ nhờ nói lại, làm mẫu và xin nghỉ",
      ],
      steps: [
        "Giải thích rằng báo chưa hiểu là một cách học tốt. Người lớn làm mẫu nói “Con chưa hiểu”.",
        "Đưa một chỉ dẫn ngắn như đặt bút vào hộp; không cố tình gây bối rối kéo dài.",
        "Đóng vai một phần chưa rõ, mời học sinh chọn nói lại, chậm hơn hoặc làm mẫu.",
        "Thực hiện đúng cách hỗ trợ em chọn, rồi cho em thử lại hoặc nghỉ.",
      ],
      practice: [
        "Chọn thẻ nói lại",
        "Chọn thẻ làm mẫu",
        "Chọn thẻ chậm hơn",
        "Báo chưa hiểu trong một hoạt động khác",
        "Chọn thử lại hoặc xin nghỉ sau khi được hỗ trợ",
      ],
      success:
        "Học sinh đưa ra yêu cầu hỗ trợ có ý nghĩa. Không chấm đúng/sai của nhiệm vụ học thuật đang dùng làm bối cảnh.",
      homePractice:
        "Khi cùng làm một việc mới, để sẵn thẻ “Làm mẫu giúp con”. Người lớn làm mẫu ngay khi con yêu cầu.",
    },
  ),
  lesson(
    "primary",
    4,
    "Cấp 1 · Con nhận biết cảm xúc và xin nghỉ",
    "emotion",
    "Chọn cách diễn đạt cảm xúc hoặc cảm giác hiện tại và một hỗ trợ mong muốn.",
    "Con thấy thế nào? Không có cảm xúc nào là sai.",
    [
      ["Con thấy", "💬"],
      ["vui", "🙂"],
      ["buồn", "😔"],
      ["lo", "😟"],
      ["ồn quá", "🔊"],
      ["Con muốn nghỉ", "🌿"],
    ],
    {
      materials: [
        "Thẻ cảm xúc và thẻ nghỉ",
        "Một chỗ nghỉ quen thuộc, học sinh có thể lựa chọn",
      ],
      steps: [
        "Giáo viên kể tình huống nhẹ nhàng của chính mình, ví dụ vui khi gặp bạn; không gán cảm xúc cho học sinh.",
        "Mời học sinh chọn cảm xúc thật hoặc chọn không trả lời. Có thể dùng tranh nhân vật nếu em chưa muốn nói về mình.",
        "Giới thiệu cách xin nghỉ hoặc báo âm thanh quá lớn; không tạo tiếng ồn để thử phản ứng.",
        "Cho học sinh chọn một hỗ trợ và thực hiện hỗ trợ đó trong điều kiện thực tế.",
      ],
      practice: [
        "Chọn thẻ cho một nhân vật đang vui",
        "Chọn thẻ cho nhân vật có thể buồn",
        "Nêu cảm xúc của mình hoặc thể hiện không muốn chia sẻ",
        "Đóng vai báo ồn quá",
        "Chọn xin nghỉ hoặc tiếp tục hoạt động",
      ],
      success:
        "Chấm khả năng biểu đạt một lựa chọn và nhu cầu hỗ trợ. Với cảm xúc của học sinh, không chấm theo suy đoán của giáo viên.",
      homePractice:
        "Hỏi một lần vào thời điểm yên tĩnh: “Con thấy thế nào?”. Chấp nhận mọi câu trả lời và không ép kể lý do.",
    },
  ),
  lesson(
    "primary",
    5,
    "Cấp 1 · Con chuẩn bị góc học",
    "selfcare",
    "Chọn đồ dùng cần thiết và thực hiện một chuỗi chuẩn bị ngắn với hỗ trợ phù hợp.",
    "Con chọn đồ cần dùng, rồi bắt đầu từng bước nhé.",
    [
      ["Trước tiên", "1️⃣"],
      ["lấy vở", "📓"],
      ["lấy bút", "✏️"],
      ["đặt lên bàn", "🪑"],
      ["cất vào cặp", "🎒"],
      ["Con cần giúp", "🤝"],
    ],
    {
      materials: [
        "Cặp, một quyển vở, bút và mặt bàn dễ tiếp cận",
        "Bảng hình 3 bước; điều chỉnh thao tác cho học sinh có khó khăn vận động",
      ],
      steps: [
        "Cùng xem hoạt động sắp làm và chỉ chọn đồ thực sự cần.",
        "Giáo viên làm mẫu chuỗi lấy vở – lấy bút – đặt lên bàn.",
        "Để học sinh chọn thẻ hoặc hướng dẫn người hỗ trợ thực hiện từng bước; không bắt tự cầm nếu vượt khả năng vận động.",
        "Kết thúc bằng cất đồ và cho học sinh đánh dấu đã xong bằng cách quen thuộc.",
      ],
      practice: [
        "Chọn vở cho hoạt động viết/vẽ",
        "Chọn bút",
        "Chỉ hoặc thực hiện bước đặt đồ lên bàn",
        "Chọn bước cất đồ khi xong",
        "Yêu cầu hỗ trợ khi đồ ở ngoài tầm với",
      ],
      success:
        "Học sinh chọn đúng bước hoặc đồ dùng cho mục tiêu đã thống nhất. Chỉ dẫn người hỗ trợ thực hiện cũng là một đáp ứng hợp lệ.",
      homePractice:
        "Cùng con chuẩn bị hai đồ dùng cho một hoạt động ở nhà. Dùng cùng thứ tự hình và vị trí đồ quen thuộc.",
    },
  ),
  lesson(
    "primary",
    6,
    "Cấp 1 · Con xin lượt và nói không",
    "behavior",
    "Dùng thông điệp để xin lượt, chờ với hỗ trợ hoặc từ chối một đề nghị không muốn.",
    "Con muốn xin lượt, chờ hay nói không?",
    [
      ["Cho con một lượt", "🙋"],
      ["Đến lượt bạn", "🤝"],
      ["Con chờ", "⏳"],
      ["Không, cảm ơn", "✋"],
      ["Con dừng lại", "🛑"],
      ["Nhờ cô/thầy giúp", "🧑‍🏫"],
    ],
    {
      materials: [
        "Hoạt động chung ngắn do học sinh đồng ý, như vẽ hoặc ghép hình",
        "Thẻ xin lượt, dừng và từ chối",
      ],
      steps: [
        "Cho học sinh chọn có tham gia hay không. Giới thiệu thẻ “Không, cảm ơn” ngang hàng với thẻ xin lượt.",
        "Làm mẫu một lượt ngắn rồi mời học sinh xin lượt bằng cách của mình.",
        "Nếu học sinh chọn chờ, cho biết lượt tiếp theo rõ ràng và thời gian ngắn có thể điều chỉnh.",
        "Thực hành từ chối; người lớn phải tôn trọng thông điệp dừng, không chấm thấp vì không tiếp tục chơi.",
      ],
      practice: [
        "Xin một lượt",
        "Báo đến lượt bạn",
        "Chọn chờ hoặc hoạt động khác",
        "Từ chối một đề nghị trong đóng vai",
        "Báo dừng hoặc nhờ giúp khi không thoải mái",
      ],
      success:
        "Thông điệp rõ và phù hợp ý định của học sinh. Không lấy việc luôn nhường, luôn chờ hoặc luôn đồng ý làm tiêu chí đạt.",
      homePractice:
        "Chơi một hoạt động hai lượt trong vài phút. Người lớn dùng thẻ xin lượt và dừng giống con để làm mẫu.",
    },
  ),

  lesson(
    "secondary",
    1,
    "Cấp 2 · Em giới thiệu và chọn cách giao tiếp",
    "communication",
    "Giới thiệu một thông tin phù hợp và nói rõ cách giao tiếp hoặc hỗ trợ mình muốn sử dụng.",
    "Em muốn giới thiệu điều gì và trao đổi bằng cách nào?",
    [
      ["Em tên là", "🙋"],
      ["Em quan tâm đến", "💡"],
      ["Em dùng bảng hình", "🗂️"],
      ["Cho em thêm thời gian", "⏳"],
      ["Em muốn viết", "✍️"],
      ["Em chưa muốn chia sẻ", "✋"],
    ],
    {
      materials: [
        "Thẻ tên hoặc tên hiển thị do học sinh chọn",
        "Bảng AAC, giấy hoặc thiết bị giao tiếp thường dùng",
      ],
      steps: [
        "Trao đổi với học sinh về cách xưng hô và phương tiện giao tiếp em thấy thoải mái.",
        "Giáo viên giới thiệu một sở thích, không yêu cầu học sinh kể thông tin riêng tư.",
        "Đóng vai gặp giáo viên mới: giới thiệu tên hoặc sở thích và yêu cầu cách giao tiếp phù hợp.",
        "Đổi người nghe, cho học sinh tự chọn phần giữ lại hoặc không chia sẻ.",
      ],
      practice: [
        "Giới thiệu tên muốn được gọi",
        "Chọn sở thích muốn chia sẻ",
        "Nêu muốn dùng bảng hình hoặc viết",
        "Xin thêm thời gian phản hồi",
        "Từ chối chia sẻ thông tin riêng trong đóng vai",
      ],
      success:
        "Học sinh thể hiện được thông tin hoặc lựa chọn giao tiếp của mình. Từ chối chia sẻ rõ ràng được ghi nhận như một kỹ năng.",
      homePractice:
        "Cùng em chuẩn bị một thẻ “Cách trao đổi với em” gồm 1–2 lựa chọn do em quyết định; chỉ chia sẻ với người em đồng ý.",
    },
  ),
  lesson(
    "secondary",
    2,
    "Cấp 2 · Em hỏi lại yêu cầu học tập",
    "receptive",
    "Xác định phần chưa rõ và yêu cầu chia nhỏ, nhắc lại hoặc minh họa nhiệm vụ.",
    "Phần nào chưa rõ? Em chọn cách hỗ trợ mình cần.",
    [
      ["Em chưa rõ yêu cầu", "❓"],
      ["Chia từng bước", "🪜"],
      ["Cho em ví dụ", "📋"],
      ["Nhắc lại giúp em", "🔁"],
      ["Em cần thêm thời gian", "⏳"],
      ["Em đã sẵn sàng", "✅"],
    ],
    {
      materials: [
        "Một yêu cầu học tập quen thuộc gồm hai bước",
        "Bảng hình hoặc danh sách ngắn các bước",
      ],
      steps: [
        "Đọc một yêu cầu liên quan đến sinh hoạt lớp, không dùng kiến thức môn học làm rào cản.",
        "Mời học sinh chỉ phần chưa rõ hoặc chọn một hình thức giải thích.",
        "Chia nhỏ yêu cầu theo lựa chọn của em và kiểm tra bằng cách nhờ em chỉ bước đầu.",
        "Đổi sang một nhiệm vụ tương tự để em chủ động hỏi lại thay vì chờ người lớn đoán.",
      ],
      practice: [
        "Báo chưa rõ yêu cầu",
        "Xin chia từng bước",
        "Xin một ví dụ",
        "Xin nhắc lại hoặc thêm thời gian",
        "Chỉ bước đầu sau khi đã hiểu",
      ],
      success:
        "Học sinh yêu cầu được hỗ trợ và xác định một bước có thể bắt đầu. Không yêu cầu diễn đạt câu dài hay phát âm chuẩn.",
      homePractice:
        "Cho em tự chọn cách nhận hướng dẫn khi chuẩn bị đồ hoặc làm việc nhà: nghe, xem mẫu hay bảng bước.",
    },
  ),
  lesson(
    "secondary",
    3,
    "Cấp 2 · Em chuẩn bị theo thời khóa biểu",
    "cognition",
    "Dùng lịch hoặc bảng hình để chọn đồ cần mang cho một buổi học và kiểm tra lại.",
    "Em xem buổi học tiếp theo và chọn đồ cần chuẩn bị.",
    [
      ["Xem lịch học", "🗓️"],
      ["sách và vở", "📚"],
      ["bút", "✏️"],
      ["bình nước", "🥤"],
      ["Kiểm tra lại", "🔎"],
      ["Em cần hỗ trợ", "🤝"],
    ],
    {
      materials: [
        "Thời khóa biểu mẫu chỉ có 2–3 hoạt động quen thuộc",
        "Đồ thật hoặc ảnh của các đồ dùng tương ứng",
      ],
      steps: [
        "Chọn một buổi học làm ví dụ; dùng biểu tượng nếu em chưa đọc được tên môn.",
        "Cùng nối mỗi hoạt động với một đồ dùng cần thiết.",
        "Học sinh chuẩn bị hoặc chỉ dẫn người hỗ trợ chuẩn bị, rồi kiểm tra theo bảng.",
        "Thay một hoạt động trong lịch và mời em điều chỉnh một món đồ, không yêu cầu nhớ toàn bộ lịch.",
      ],
      practice: [
        "Xác định hoạt động đầu buổi",
        "Chọn đồ cho hoạt động đó",
        "Chọn một đồ dùng cá nhân cần thiết",
        "Kiểm tra món còn thiếu trong tình huống mẫu",
        "Nhờ hỗ trợ hoặc điều chỉnh khi lịch đổi",
      ],
      success:
        "Học sinh sử dụng được công cụ lịch để đưa ra lựa chọn. Dùng bảng nhắc thường xuyên không bị xem là làm sai.",
      homePractice:
        "Buổi tối, cùng em chọn đồ cho hoạt động đầu ngày hôm sau và đặt ở vị trí em thống nhất.",
    },
  ),
  lesson(
    "secondary",
    4,
    "Cấp 2 · Em báo quá tải và chọn hỗ trợ",
    "emotion",
    "Nhận diện tín hiệu không thoải mái theo cách của mình và yêu cầu một hỗ trợ khả thi.",
    "Em cần thay đổi điều gì để thấy dễ chịu hơn?",
    [
      ["Em thấy quá tải", "💬"],
      ["âm thanh lớn", "🔊"],
      ["chỗ đông người", "👥"],
      ["Em cần nghỉ", "🌿"],
      ["Chỗ yên tĩnh hơn", "🪑"],
      ["Nhờ người hỗ trợ", "🤝"],
    ],
    {
      materials: [
        "Thẻ nhu cầu hỗ trợ",
        "Thỏa thuận trước về người hỗ trợ và vị trí nghỉ phù hợp trong trường",
      ],
      steps: [
        "Trao đổi lúc học sinh đang thoải mái về điều em muốn người khác biết; không ép kể trải nghiệm khó chịu.",
        "Dùng tình huống giả định nhẹ như hành lang đông để chọn thông điệp. Không tạo tác nhân gây quá tải để kiểm tra.",
        "Cùng chọn hỗ trợ thực tế: nghỉ, đổi chỗ hoặc nhờ người tin cậy.",
        "Tập cách báo và đường đến chỗ hỗ trợ bằng hình hoặc sơ đồ quen thuộc.",
      ],
      practice: [
        "Chọn thẻ báo không thoải mái trong tình huống mẫu",
        "Chọn nguyên nhân muốn chia sẻ hoặc không chia sẻ",
        "Xin nghỉ",
        "Chọn chỗ yên tĩnh hoặc cách hỗ trợ khác",
        "Chọn người có thể giúp trong trường",
      ],
      success:
        "Học sinh thể hiện được nhu cầu hoặc phương án hỗ trợ. Không chấm khả năng chịu đựng tiếng ồn hay kiềm chế biểu hiện khó chịu.",
      homePractice:
        "Cùng em chọn một câu/thẻ báo cần nghỉ mà cả nhà hiểu và phản hồi thống nhất.",
    },
  ),
  lesson(
    "secondary",
    5,
    "Cấp 2 · Em giữ ranh giới và tìm người giúp",
    "behavior",
    "Nói không, yêu cầu dừng và xác định người hỗ trợ khi một tương tác làm mình không thoải mái.",
    "Em có quyền nói không và nhờ người mình tin cậy giúp.",
    [
      ["Không, cảm ơn", "✋"],
      ["Dừng lại", "🛑"],
      ["Em không thoải mái", "💬"],
      ["Em rời đi", "🚶"],
      ["Em cần giúp", "🤝"],
      ["Người em tin cậy", "🧑‍🏫"],
    ],
    {
      materials: [
        "Tranh tình huống trung tính về mượn đồ, chụp ảnh hoặc trêu chọc",
        "Danh sách người hỗ trợ do học sinh và người chăm sóc thống nhất",
      ],
      steps: [
        "Giải thích quyền từ chối cho mượn đồ hoặc chụp ảnh; tránh tình huống gây sợ.",
        "Đóng vai một đề nghị bình thường và để em tự chọn đồng ý hay từ chối.",
        "Đóng vai người kia chưa dừng: em chọn nhắc dừng, rời đi hoặc tìm hỗ trợ. Không dùng bạn thật để gây áp lực.",
        "Cùng xác định người hỗ trợ và cách báo việc xảy ra bằng lời hoặc thẻ.",
      ],
      practice: [
        "Từ chối một đề nghị không muốn",
        "Yêu cầu dừng",
        "Báo cảm giác không thoải mái",
        "Chọn rời đi hoặc tìm chỗ hỗ trợ",
        "Chọn người tin cậy và yêu cầu giúp",
      ],
      success:
        "Học sinh thể hiện lựa chọn bảo vệ ranh giới. Không yêu cầu em phải đối đáp dài hoặc tự giải quyết một mình mới đạt.",
      homePractice:
        "Tôn trọng lời từ chối của em trong tình huống hằng ngày; thống nhất hai người có thể tìm đến khi cần giúp.",
    },
  ),
  lesson(
    "secondary",
    6,
    "Cấp 2 · Em tham gia một việc nhóm",
    "communication",
    "Chọn vai trò vừa sức, yêu cầu hỗ trợ và báo kết thúc hoặc cần đổi nhiệm vụ trong hoạt động nhóm.",
    "Em muốn nhận phần việc nào? Em có thể đề nghị đổi hoặc nhờ giúp.",
    [
      ["Em chọn phần này", "🙋"],
      ["Em làm cùng bạn", "🤝"],
      ["Em cần hướng dẫn", "❓"],
      ["Em muốn đổi việc", "🔁"],
      ["Em đã xong", "✅"],
      ["Em cần nghỉ", "🌿"],
    ],
    {
      materials: [
        "Việc nhóm ngắn như sắp xếp góc lớp hoặc làm bảng tranh",
        "Hai vai trò rõ ràng, có cách tham gia phù hợp khả năng vận động và giao tiếp",
      ],
      steps: [
        "Giới thiệu mục tiêu chung và hai phần việc có thể chọn; em có quyền chưa tham gia.",
        "Học sinh chọn vai trò bằng thẻ, lời nói hoặc chỉ vào đồ dùng.",
        "Trong lúc làm, để sẵn cách xin hướng dẫn, đổi việc hoặc nghỉ; người lớn đáp ứng và điều chỉnh.",
        "Kết thúc bằng báo đã xong và cho em nêu điều muốn giữ hoặc thay đổi ở lần sau.",
      ],
      practice: [
        "Chọn một vai trò",
        "Trao đổi muốn làm cùng ai hoặc làm phần riêng",
        "Yêu cầu hướng dẫn khi cần",
        "Đề nghị đổi việc hoặc nghỉ trong đóng vai",
        "Báo đã xong và chọn điều muốn làm lần sau",
      ],
      success:
        "Học sinh dùng thông điệp để tham gia và điều chỉnh phần việc. Chấm giao tiếp chức năng, không chấm tốc độ hay mức độ hướng ngoại.",
      homePractice:
        "Cùng em chọn một phần việc nhỏ trong hoạt động gia đình, để em tự báo cần giúp và khi nào đã xong.",
    },
  ),
];
