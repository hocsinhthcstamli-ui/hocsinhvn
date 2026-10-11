import { attachTopicVideos } from "./topic-videos.mjs";
// Additive authored AAC content. Existing lessons, assignments and scores are never replaced.
export const topicDefinitions = {
  vehicles: {
    title: "Khám phá xe cộ",
    stages: [
      ["Làm quen xe cộ", "Nhận biết phương tiện và chọn hình theo tình huống."],
      ["Giao tiếp về chuyến đi", "Bày tỏ lựa chọn, nhu cầu và yêu cầu hỗ trợ trên đường."],
      ["Đi lại cùng người đồng hành", "Chuẩn bị, chờ đúng nơi và tìm người hỗ trợ khi cần."],
    ],
  },
  animals: {
    title: "Khám phá động vật",
    stages: [
      ["Làm quen động vật", "Nhận biết con vật và thể hiện lựa chọn bằng hình ảnh."],
      ["Giao tiếp về động vật", "Chia sẻ sở thích, cảm giác và yêu cầu hỗ trợ."],
      ["Quan sát & tương tác an toàn", "Giữ khoảng cách, xin phép và chăm sóc cùng người lớn."],
    ],
  },
};

const animalUnits = {
  primary: [
    ["Con tìm mèo và thỏ", "receptive", "Chọn hình mèo hoặc thỏ theo lời mời trong hai lựa chọn.", ["mèo", "thỏ", "Con chọn", "Con muốn nghỉ"], "Đặt hai hình mèo và thỏ; đọc tên một con, chờ trẻ chọn rồi đổi vị trí hai hình.", "Tìm mèo trong tranh gia đình; tìm thỏ trong sách; đổi vị trí hai thẻ; chọn lại hình vừa thấy; chọn hình muốn xem thêm."],
    ["Con khám phá gà và vịt", "cognition", "Nhận ra gà mái và vịt qua hình ảnh khác nhau.", ["gà mái", "vịt", "Con chọn", "Con chưa biết"], "Quan sát mỏ, chân và hình dáng qua tranh; không dùng tiếng kêu làm dấu hiệu duy nhất.", "Tìm gà mái; tìm vịt; ghép hai tranh cùng con vật; tìm con vật trong tranh lớn; xin xem lại khi chưa rõ."],
    ["Con thích con vật nào?", "communication", "Dùng thẻ để bày tỏ sở thích thật, kể cả không thích.", ["Con thích", "mèo", "thỏ", "Con không thích", "Con chọn"], "Làm mẫu câu Con thích + hình con vật, sau đó cho trẻ tự chọn; phản hồi theo lựa chọn của trẻ.", "Chọn con vật thích; chia sẻ với cô; chia sẻ với bạn; thay đổi lựa chọn; thể hiện không thích."],
    ["Con cần đứng xa hơn", "emotion", "Thể hiện khó chịu, xin giúp hoặc xin nghỉ khi xem con vật.", ["Con sợ", "Con cần giúp", "Con muốn nghỉ", "mèo", "chó"], "Dùng tranh giả định con vật ở gần; làm mẫu xin giúp và lùi ra xa cùng người lớn. Không đưa động vật đến để thử phản ứng.", "Xin giúp khi lo; chọn nghỉ; chỉ hình khiến con ngại; gọi người lớn; chọn tiếp tục khi sẵn sàng."],
    ["Con quan sát từ xa", "selfcare", "Chọn cách dừng lại và nhờ người lớn trước khi đến gần con vật.", ["Con chờ", "Con cần giúp", "Con không muốn", "chó", "mèo"], "Dùng thú bông đóng vai: dừng lại, đứng cách xa, hỏi người lớn. Không chạm, đuổi hoặc cho con vật lạ ăn.", "Gặp chó lạ trong tranh; thấy mèo đang ăn; thấy con vật đang ngủ; muốn lại gần thú bông; chọn không tham gia."],
    ["Con chăm sóc cùng người lớn", "selfcare", "Chọn một việc chăm sóc an toàn trong hoạt động mô phỏng.", ["nước", "Con cần giúp", "Con chờ", "rửa tay", "Con xong rồi"], "Cho thú bông uống nước bằng bát rỗng; cất đồ rồi mô phỏng rửa tay. Việc cho ăn hay tiếp xúc thật do người lớn hướng dẫn.", "Chọn bát nước; nhờ người lớn; chờ đến lượt; cất đồ; chọn rửa tay sau hoạt động."],
  ],
  secondary: [
    ["Em phân biệt động vật quanh mình", "cognition", "Nhận biết dê, cừu, voi và ếch qua hình; yêu cầu giải thích khi chưa rõ.", ["dê", "cừu", "voi", "ếch", "Con chưa biết"], "So sánh từng cặp ảnh, nói một đặc điểm nhìn thấy; chấp nhận câu hỏi thay vì đoán bắt buộc.", "Chọn dê; chọn cừu; nhận biết voi; nhận biết ếch; yêu cầu xem thêm một ảnh."],
    ["Em tìm thông tin từ hình ảnh", "receptive", "Chọn con vật được nhắc trong tình huống và nhận ra khi thiếu thông tin.", ["mèo", "thỏ", "vịt", "voi", "Con chưa biết"], "Đưa từng tranh có hai đến bốn con vật, đọc một câu mô tả ngắn và cho em chỉ hình; không đòi hỏi đọc chữ.", "Tìm con vật cô vừa nhắc; tìm con vật trong ảnh khác; chọn giữa ba ảnh; nói chưa biết khi ảnh mờ; xin xem lại."],
    ["Em chia sẻ điều mình quan tâm", "communication", "Ghép thông điệp về con vật và duy trì một lượt trao đổi tự chọn.", ["Con thích", "Con chọn", "mèo", "voi", "Con không thích", "Con chưa biết"], "Cho em chọn chủ đề, làm mẫu Con chọn + hình; người nghe hỏi thêm một câu và chấp nhận việc kết thúc trao đổi.", "Chia sẻ con vật quan tâm; trả lời bạn bằng hình; nêu điều không thích; hỏi khi chưa rõ; kết thúc trao đổi."],
    ["Em đặt giới hạn khi tiếp xúc", "emotion", "Bày tỏ đồng ý, từ chối hoặc yêu cầu hỗ trợ trong tình huống có động vật.", ["Con không muốn", "Con sợ", "Con cần giúp", "Con muốn nghỉ", "Con chờ"], "Đóng vai lời mời xem thú cưng qua ảnh; luyện từ chối và tìm người hỗ trợ. Tôn trọng lựa chọn không tiếp xúc.", "Từ chối chạm; xin đứng xa; xin nghỉ khi ồn; nhờ người lớn; chọn xem ảnh thay thế."],
    ["Em xử lý khi gặp động vật lạ", "selfcare", "Nhận ra tình huống cần giữ khoảng cách và gọi người lớn quen thuộc.", ["chó", "mèo", "Con chờ", "Con cần giúp", "Con không muốn"], "Dùng tranh gặp động vật đi lạc hoặc bị thương: giữ khoảng cách, không tự bắt hay cho ăn, báo người lớn. Không diễn tập với con vật thật.", "Gặp chó đi lạc; thấy mèo bị thương; bạn rủ chạm con vật lạ; con vật đang ăn; cần gọi người hỗ trợ."],
    ["Em lập việc chăm sóc có hỗ trợ", "selfcare", "Chọn thứ tự việc chăm sóc mô phỏng và biết phần cần người lớn hỗ trợ.", ["nước", "Con cần giúp", "Con chờ", "rửa tay", "Con xong rồi"], "Lập ba bước bằng hình: hỏi người lớn, chuẩn bị vật dụng phù hợp, vệ sinh sau việc làm. Không giao thuốc hoặc thức ăn thật cho học sinh tự xử lý.", "Chọn việc muốn làm; hỏi người phụ trách; chuẩn bị bát rỗng; chọn rửa tay; báo đã xong hoặc cần giúp."],
  ],
};

export function buildTopicLessons(topic, units) {
  return Object.entries(units).flatMap(([band, rows]) => rows.map(([title, domain, goal, cards, activity, practice], index) => ({
    id: `${topic}-${band}-${String(index + 1).padStart(2, "0")}`,
    title: `${band === "primary" ? "Cấp 1" : "Cấp 2"} · ${title}`,
    domain, level: Math.floor(index / 2) + 1, goal,
    prompt: "Con chạm hình để nghe. Chọn thẻ để nói điều con muốn; con có thể xin giúp hoặc nghỉ.",
    source: "topic", videoId: "",
    cards: cards.map(text => ({ text, icon: "💬" })),
    teachingGuide: {
      band, phase: topic === "animals" ? 5 : 6, durationMinutes: band === "primary" ? 10 : 15,
      materials: ["Thẻ hình trong bài; giấy hoặc bảng AAC quen thuộc", "Tranh tình huống hoặc đồ vật mô phỏng; người lớn đồng hành"],
      steps: ["Cho học sinh chọn cách tham gia. Bắt đầu với hai hình nếu cần, đọc mẫu và chờ 5–10 giây hoặc lâu hơn theo nhu cầu.", activity, band === "primary" ? "Luyện từng lượt ngắn trong bối cảnh quen thuộc; nghỉ giữa lượt nếu cần." : "Đổi người trao đổi và bối cảnh phù hợp tuổi; mời học sinh giải thích bằng hình hoặc cử chỉ, không bắt nói thành tiếng.", "Kết thúc bằng một lựa chọn thật của học sinh; ghi mức hỗ trợ và điều cần điều chỉnh."],
      practice: practice.split("; "),
      success: goal + " Chấp nhận AAC, chỉ hình, lời nói và cử chỉ; không chấm việc nhìn mắt hay sự vâng lời.",
      scoring: "Quan sát 5 cơ hội theo các tình huống của bài: 20 điểm khi thể hiện kỹ năng độc lập với công cụ hỗ trợ thường dùng, 10 điểm khi cần một gợi ý bổ sung, 0 điểm khi chưa thể hiện dù đã có cơ hội và hỗ trợ. Tổng tối đa 100. Không nhập điểm khi chưa đủ cơ hội; từ chối hoặc xin nghỉ là giao tiếp hợp lệ. Giáo viên nhập điểm sau quan sát; số lần bấm thẻ hoặc xem video không tạo điểm.",
      support: "Không ép chạm, nói hay tiếp xúc thật. Giảm số thẻ, tăng thời gian chờ và cho phép nghỉ. Chọn cấp học theo nhu cầu với giáo viên, không dùng tuổi để suy ra năng lực. Hoạt động ngoài đời luôn có người lớn chịu trách nhiệm giám sát.",
      homePractice: "Cùng người thân xem một tranh phù hợp bài, tạo một cơ hội dùng thông điệp trong sinh hoạt rồi phản hồi tự nhiên. Dừng khi học sinh không muốn; không kiểm tra dồn dập.",
    },
  })));
}
const vehicleUnits = {
  primary: [
    ["Con tìm xe quen thuộc", "receptive", "Chọn đúng hình ô tô, xe máy hoặc xe buýt khi được nhắc tên.", ["ô tô", "xe máy", "xe buýt", "Con chọn", "Con chưa biết"], "Bắt đầu với hai phương tiện, đọc tên và để trẻ chọn; thay vị trí ảnh rồi thêm phương tiện thứ ba khi phù hợp.", "Tìm ô tô; tìm xe máy; tìm xe buýt; chọn xe trong tranh đường phố; xin xem lại khi chưa rõ."],
    ["Con khám phá thuyền và máy bay", "cognition", "Nhận ra thuyền, trực thăng và tàu điện qua hình ảnh.", ["thuyền", "trực thăng", "tàu điện", "Con chọn", "Con chưa biết"], "Cho xem từng ảnh, nói ngắn về nơi phương tiện di chuyển; luyện ghép hai ảnh cùng phương tiện bằng thẻ, không yêu cầu đọc chữ.", "Tìm thuyền; tìm trực thăng; tìm tàu điện; ghép cặp hình giống nhau; chọn phương tiện muốn tìm hiểu."],
    ["Con nói về chuyến đi", "communication", "Ghép lựa chọn phương tiện với thông điệp muốn đi cùng người thân.", ["Con muốn đi", "ô tô", "xe buýt", "đi cùng con", "Con không muốn"], "Dùng tranh chuyến đi cùng gia đình, làm mẫu Con muốn đi + phương tiện. Người lớn giải thích lựa chọn khả thi; không hứa chuyến đi chưa có kế hoạch.", "Chọn phương tiện muốn đi; nhờ đi cùng; chọn giữa hai cách đi; bày tỏ không muốn; đổi lựa chọn sau giải thích."],
    ["Con xin nghỉ khi di chuyển", "emotion", "Dùng thẻ để báo mệt, sợ hoặc cần người lớn giúp trong chuyến đi.", ["Con muốn nghỉ", "Con sợ", "Con cần giúp", "nước", "Con chờ"], "Đóng vai chuyến xe bằng ghế trong lớp; trẻ báo nhu cầu, người lớn phản hồi và chỉ dừng xe ở nơi được phép, an toàn.", "Báo cần nghỉ; xin nước; báo sợ tiếng ồn; nhờ người lớn; chờ người lớn hỗ trợ."],
    ["Con chuẩn bị trước khi đi", "selfcare", "Nhận biết đồ bảo vệ phù hợp và nhờ người lớn kiểm tra trước chuyến đi.", ["đội mũ bảo hiểm", "thắt dây an toàn", "xe máy", "ô tô", "Con cần giúp"], "Dùng tranh hoặc đồ chơi: xe máy cần mũ đúng cỡ cài quai; ô tô dùng ghế hoặc thiết bị bảo vệ phù hợp cơ thể, cài dây đúng cách. Người lớn kiểm tra, không coi một động tác là đủ an toàn.", "Chọn mũ khi đi xe máy; chọn dây khi đi ô tô; nhờ người lớn kiểm tra; báo chưa sẵn sàng; chọn chờ trước khi đi."],
    ["Con dừng và chờ người lớn", "selfcare", "Dừng ở nơi chờ an toàn và yêu cầu đi cùng trước khi qua đường.", ["Con dừng lại", "Con chờ", "đi cùng con", "Con cần giúp", "Con không muốn"], "Dùng băng giấy làm đường giả trong lớp: dừng trước mép đường, chờ và nhờ người lớn đi cùng. Không luyện tự qua đường; đèn xanh không có nghĩa được chạy qua ngay.", "Dừng trước đường giả; chờ người đồng hành; nhờ đi cùng; dừng khi bạn rủ chạy; báo khi không thấy người đi cùng."],
  ],
  secondary: [
    ["Em chọn phương tiện theo tình huống", "cognition", "Nhận biết phương tiện và chọn phương án di chuyển để trao đổi với người lớn.", ["xe buýt", "tàu điện", "ô tô", "thuyền", "Con chưa biết"], "Dùng tranh chuyến đi học hoặc thăm người thân; so sánh hai lựa chọn theo thông tin có sẵn, không đánh giá theo sở thích của giáo viên.", "Chọn phương tiện đi học; nhận biết tàu điện; nhận biết thuyền; hỏi khi thiếu thông tin; đổi lựa chọn khi được giải thích."],
    ["Em nhận biết xe hỗ trợ khẩn cấp", "receptive", "Nhận biết xe cứu thương và chọn tìm người lớn khi có tình huống cần giúp.", ["xe cứu thương", "ô tô", "xe máy", "Con cần giúp", "Con chờ"], "Dùng ảnh xe cứu thương để phân biệt với ô tô thường; luyện báo người lớn khi thấy người cần giúp. Không bật còi lớn, không gọi thử số khẩn cấp.", "Chọn xe cứu thương; phân biệt ô tô thường; chỉ người có thể hỗ trợ trong tranh; yêu cầu giúp; chờ ở vị trí an toàn."],
    ["Em trao đổi kế hoạch chuyến đi", "communication", "Bày tỏ phương tiện muốn đi và xác nhận cần người đồng hành.", ["Con muốn đi", "xe buýt", "tàu điện", "đi cùng con", "Con chưa biết", "Con không muốn"], "Thảo luận một chuyến đi giả định phù hợp tuổi: chọn phương tiện, người đi cùng và điều chưa rõ. Có thể dùng bảng AAC riêng để bổ sung điểm đến, không nhập địa chỉ riêng vào bài chung.", "Chọn phương tiện; yêu cầu đi cùng; hỏi điều chưa rõ; từ chối phương án chưa phù hợp; xác nhận lại lựa chọn."],
    ["Em báo nhu cầu trên chuyến đi", "communication", "Truyền đạt nhu cầu nghỉ, nước hoặc giúp đỡ cho người đồng hành.", ["Con cần giúp", "Con muốn nghỉ", "nước", "Con sợ", "Con chờ"], "Đóng vai chuyến xe đông người hoặc thay đổi kế hoạch; em chọn thông điệp, người đồng hành xác nhận và thống nhất bước tiếp theo. Không tự xuống xe để giải quyết.", "Báo khó chịu; xin nghỉ; xin nước; báo lo khi đổi kế hoạch; chờ người đồng hành phản hồi."],
    ["Em kiểm tra trước khi khởi hành", "selfcare", "Thực hiện bảng kiểm bằng hình và yêu cầu hỗ trợ nếu chưa sẵn sàng.", ["đội mũ bảo hiểm", "thắt dây an toàn", "Con cần giúp", "Con chờ", "Con xong rồi"], "Luyện bảng kiểm trên ghế mô phỏng: đồ bảo vệ phù hợp phương tiện và cơ thể, người lớn kiểm tra, báo sẵn sàng. Không sử dụng dây hoặc mũ không đúng cỡ để thực hành thật.", "Chọn đồ bảo vệ; nhờ kiểm tra cách cài; báo chưa xong; chờ kiểm tra; xác nhận sẵn sàng bằng cách giao tiếp của em."],
    ["Em tìm hỗ trợ khi lạc người đi cùng", "selfcare", "Chọn dừng ở nơi an toàn và tìm nhân viên phụ trách khi không thấy người đồng hành.", ["Con dừng lại", "Con cần giúp", "Con chờ", "đi cùng con", "Con không muốn"], "Đóng vai tại điểm chờ giả trong lớp: đứng xa xe và mép đường, tìm nhân viên có quầy hoặc vị trí làm việc rõ ràng, nhờ liên hệ người đồng hành. Không đi theo người lạ ra nơi khác; không công khai thông tin riêng trên thẻ chung.", "Dừng khi không thấy người đi cùng; chọn vị trí chờ an toàn trong tranh; tìm nhân viên phụ trách; nhờ liên hệ người thân; từ chối đi theo người lạ."],
  ],
};
export const topicLessons = [...buildTopicLessons("animals", animalUnits), ...buildTopicLessons("vehicles", vehicleUnits)];
export function makeTopicPlan(childId, journeyId, band = "primary") {
  if (!topicDefinitions[journeyId] || !["primary", "secondary"].includes(band)) throw new Error("Lộ trình hoặc cấp học không hợp lệ.");
  return { childId, journeyId, stages: topicDefinitions[journeyId].stages.map(([title, goal], index) => ({
    id: String(index + 1), title, goal,
    lessonIds: topicLessons.filter(l => l.id.startsWith(`${journeyId}-${band}-`) && l.level === index + 1).map(l => l.id),
    lessonScores: {},
  })) };
}
export function addTopicContent(data) {
  let changed = false;
  for (const lesson of topicLessons) if (!data.lessons.some(l => l.id === lesson.id)) {
    data.lessons.push(structuredClone(lesson)); changed = true;
  }
  for (const child of data.children) for (const id of Object.keys(topicDefinitions)) {
    if (!data.learningPlans.some(p => p.childId === child.id && p.journeyId === id)) {
      const life = data.learningPlans.find(p => p.childId === child.id && (!p.journeyId || p.journeyId === "life"));
      const band = data.lessons.find(l => life?.stages.some(s => s.lessonIds.includes(l.id)) && l.teachingGuide)?.teachingGuide.band || "primary";
      data.learningPlans.push(makeTopicPlan(child.id, id, band)); changed = true;
    }
  }
  return attachTopicVideos(data, topicLessons).length > 0 || changed;
}
