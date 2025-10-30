// backend/utils/encouragementMessages.js

/**
 * Tạo lời động viên dựa trên cảm xúc
 * @param {String} emotion - happy, neutral, sad, angry, tired
 * @returns {Object} { message: String, emoji: String, tip: String }
 */
const getEncouragementMessage = (emotion) => {
  const messages = {
    happy: {
      messages: [
        "Thật tuyệt vời khi em vui vẻ! Hãy chia sẻ niềm vui này với bạn bè nhé! 🌟",
        "Cô rất vui khi thấy em hạnh phúc! Tiếp tục giữ nụ cười thật tươi nha! 😊",
        "Năng lượng tích cực của em thật tuyệt! Hãy lan tòa niềm vui đến mọi người! ✨",
        "Tâm trạng vui vẻ giúp em học tập hiệu quả hơn đấy! Keep it up! 🎉"
      ],
      emoji: "😊",
      color: "#22c55e",
      tips: [
        "Hãy chia sẻ điều gì khiến em vui với bạn bè",
        "Viết nhật ký về những khoảnh khắc vui trong ngày",
        "Chơi thể thao để giữ tâm trạng tốt"
      ]
    },
    neutral: {
      messages: [
        "Cảm ơn em đã chia sẻ! Cô hi vọng em sẽ có những trải nghiệm thú vị hơn! 💛",
        "Không sao cả! Mỗi ngày đều có những điều thú vị riêng. Chúc em ngày mới tốt lành! 🌤️",
        "Ngày bình thường cũng là ngày tốt! Hãy tìm điều nhỏ nhỏ để vui nhé! 🌸",
        "Em đang cảm thấy ổn, điều đó cũng rất tốt rồi! 👍"
      ],
      emoji: "😐",
      color: "#f59e0b",
      tips: [
        "Thử làm một điều mới mẻ hôm nay",
        "Trò chuyện với bạn bè về sở thích",
        "Nghe nhạc hoặc đọc truyện yêu thích"
      ]
    },
    sad: {
      messages: [
        "Cô hiểu em đang buồn. Mọi chuyện rồi sẽ ổn thôi, cô luôn ở đây! 💙",
        "Em đừng lo lắng nhé! Hãy nói chuyện với cô hoặc bạn bè khi cần. Cô luôn lắng nghe! 🤗",
        "Không sao đâu em! Buồn là cảm xúc bình thường. Cô sẽ giúp em vượt qua! 💜",
        "Em rất dũng cảm khi chia sẻ! Mọi thứ sẽ tốt lên thôi, cô tin em! 🌈"
      ],
      emoji: "😔",
      color: "#3b82f6",
      tips: [
        "Nói chuyện với cô hoặc người thân",
        "Viết ra những gì em đang nghĩ",
        "Làm những việc em thích để cải thiện tâm trạng"
      ]
    },
    angry: {
      messages: [
        "Cô hiểu em đang tức giận. Hãy thở sâu và cho cô biết em cần giúp gì nhé! 🧡",
        "Tức giận là bình thường! Hãy tìm cách xả stress lành mạnh nhé em! 💪",
        "Cô biết em đang không vui. Chúng ta cùng tìm cách giải quyết nhé! 🤝",
        "Hít thở sâu 3 lần, em sẽ cảm thấy tốt hơn đấy! Cô luôn sẵn sàng lắng nghe! ❤️"
      ],
      emoji: "😡",
      color: "#ef4444",
      tips: [
        "Thở sâu 10 lần để bình tĩnh",
        "Viết ra nguyên nhân và cách giải quyết",
        "Tập thể dục nhẹ hoặc vẽ tranh",
        "Nói chuyện với người lớn nếu cần"
      ]
    },
    tired: {
      messages: [
        "Em có vẻ mệt nhỉ! Hãy nghỉ ngơi đủ và ăn uống đầy đủ nhé! 💚",
        "Cô nghĩ em cần thư giãn! Hãy chăm sóc bản thân em thật tốt! 🌙",
        "Mệt mỏi là dấu hiệu cơ thể cần nghỉ ngơi. Hãy ngủ đủ giấc nhé! 😴",
        "Em đã cố gắng rất nhiều rồi! Giờ hãy dành thời gian nghỉ ngơi! ⭐"
      ],
      emoji: "😴",
      color: "#8b5cf6",
      tips: [
        "Ngủ đủ 8-10 tiếng mỗi ngày",
        "Ăn đủ bữa và uống đủ nước",
        "Giảm thời gian xem điện thoại trước khi ngủ",
        "Nghỉ ngơi 10 phút giữa các buổi học"
      ]
    }
  };

  const emotionData = messages[emotion] || messages.neutral;
  
  // Random chọn 1 message
  const randomMessage = emotionData.messages[
    Math.floor(Math.random() * emotionData.messages.length)
  ];
  
  // Random chọn 1 tip
  const randomTip = emotionData.tips[
    Math.floor(Math.random() * emotionData.tips.length)
  ];

  return {
    message: randomMessage,
    emoji: emotionData.emoji,
    color: emotionData.color,
    tip: randomTip
  };
};

/**
 * Map emotion từ tiếng Anh sang tiếng Việt
 */
const emotionLabels = {
  happy: "Vui vẻ",
  neutral: "Bình thường",
  sad: "Buồn",
  angry: "Tức giận",
  tired: "Mệt mỏi"
};

/**
 * Emoji cho mỗi cảm xúc
 */
const emotionEmojis = {
  happy: "😊",
  neutral: "😐",
  sad: "😔",
  angry: "😡",
  tired: "😴"
};

module.exports = {
  getEncouragementMessage,
  emotionLabels,
  emotionEmojis
};