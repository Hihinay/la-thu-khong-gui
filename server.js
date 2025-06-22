const express = require("express");
const fs = require("fs");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use("/", express.static(__dirname));

const THU_FILE = path.join(__dirname, "thu.json");
const THU_CHO_FILE = path.join(__dirname, "thu-dang-cho.json");

// Khởi tạo file nếu chưa có
if (!fs.existsSync(THU_CHO_FILE)) fs.writeFileSync(THU_CHO_FILE, "[]");
if (!fs.existsSync(THU_FILE)) fs.writeFileSync(THU_FILE, "[]");

// POST gửi thư mới – luôn được ghi vào hàng chờ
app.post("/api/thu", (req, res) => {
  const { content } = req.body;
  const now = new Date();

  if (!content || content.trim().length < 20 || content.length > 2000) {
    return res.status(400).json({
      success: false,
      error: "Nội dung thư không hợp lệ.",
    });
  }

  let thuCho = [];
  try {
    thuCho = JSON.parse(fs.readFileSync(THU_CHO_FILE));
  } catch {}

  thuCho.push({
    content: content.trim(),
    submittedAt: now.toISOString(),
  });

  fs.writeFileSync(THU_CHO_FILE, JSON.stringify(thuCho, null, 2));
  res.json({ success: true });
});

// GET thư đang hiển thị trên web
app.get("/api/thu", (req, res) => {
  let data = [];
  try {
    data = JSON.parse(fs.readFileSync(THU_FILE));
  } catch {}
  res.json(data);
});

// HÀM: kiểm tra giờ tròn và cập nhật thư mới mỗi giờ
function capNhatThuMoi() {
  const now = new Date();
  const minute = now.getMinutes();

  // Chỉ chạy vào phút 0 mỗi giờ (ví dụ: 13:00, 14:00...)
  if (minute === 0) {
    let thuCho = [];
    try {
      thuCho = JSON.parse(fs.readFileSync(THU_CHO_FILE));
    } catch {}

    if (thuCho.length > 0) {
      const next = thuCho.shift(); // Lấy thư đầu tiên
      const newThu = {
        content: next.content,
        time: new Date().toISOString(),
      };

      fs.writeFileSync(THU_FILE, JSON.stringify([newThu], null, 2));
      fs.writeFileSync(THU_CHO_FILE, JSON.stringify(thuCho, null, 2));
      console.log("✅ Đã cập nhật thư mới lúc", now.toLocaleTimeString());
    }
  }
}

// Kiểm tra mỗi phút
setInterval(capNhatThuMoi, 60 * 1000);

// Trang chủ
app.get("/", (req, res) => {
  res.redirect("/html/index.html");
});

app.listen(PORT, () => {
  console.log(`✅ Server chạy tại http://localhost:${PORT}/html/index.html`);
});
