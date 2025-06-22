const express = require("express");
const fs = require("fs");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
const PORT = 3000;
const THU_FILE = path.join(__dirname, "thu.json");

app.use(cors());
app.use(bodyParser.json());
app.use("/", express.static(__dirname));

// Gửi thư: luôn được ghi vào hàng đợi
app.post("/api/thu", (req, res) => {
  const { content } = req.body;
  if (!content || content.trim().length < 20 || content.length > 2000) {
    return res.status(400).json({
      success: false,
      error: "Nội dung thư không hợp lệ.",
    });
  }

  let danhSach = [];
  try {
    danhSach = JSON.parse(fs.readFileSync(THU_FILE));
  } catch {}

  danhSach.push({
    content: content.trim(),
    time: new Date().toISOString(),
    displayed: false,
  });

  fs.writeFileSync(THU_FILE, JSON.stringify(danhSach, null, 2));
  res.json({ success: true });
});

// GET thư đang hiển thị
app.get("/api/thu", (req, res) => {
  let danhSach = [];
  try {
    danhSach = JSON.parse(fs.readFileSync(THU_FILE));
  } catch {}

  const now = new Date();

  // Tìm thư đang hiển thị
  let hienTai = danhSach.find((thu) => thu.displayed === true);

  if (hienTai) {
    const diffHours = (now - new Date(hienTai.time)) / (1000 * 60 * 60);
    if (diffHours >= 3) {
      // Hết hạn → chuyển sang thư tiếp theo
      const currentIndex = danhSach.indexOf(hienTai);
      danhSach[currentIndex].displayed = false;

      const next = danhSach.find((thu, i) => i > currentIndex && !thu.displayed);
      if (next) {
        next.displayed = true;
        next.time = now.toISOString();
        fs.writeFileSync(THU_FILE, JSON.stringify(danhSach, null, 2));
        return res.json([next]);
      } else {
        // Không còn thư mới → không hiển thị gì
        fs.writeFileSync(THU_FILE, JSON.stringify(danhSach, null, 2));
        return res.json([]);
      }
    } else {
      return res.json([hienTai]);
    }
  } else {
    // Lần đầu tiên → hiển thị thư đầu tiên nếu có
    const next = danhSach.find((thu) => !thu.displayed);
    if (next) {
      next.displayed = true;
      next.time = now.toISOString();
      fs.writeFileSync(THU_FILE, JSON.stringify(danhSach, null, 2));
      return res.json([next]);
    }
  }

  return res.json([]);
});

// Trang chủ
app.get("/", (req, res) => {
  res.redirect("/html/index.html");
});

app.listen(PORT, () => {
  console.log(`✅ Server chạy tại http://localhost:${PORT}/html/index.html`);
});
