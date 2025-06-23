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
    if (fs.existsSync(THU_FILE)) {
      danhSach = JSON.parse(fs.readFileSync(THU_FILE));
    }
  } catch (e) {
    console.error("❌ Lỗi đọc file:", e);
  }

  const newThu = {
    content: content.trim(),
    time: new Date().toISOString(),
    displayed: false,
  };

  danhSach.push(newThu);

  try {
    fs.writeFileSync(THU_FILE, JSON.stringify(danhSach, null, 2));
    console.log("✅ Thêm thư mới:", newThu);
    res.json({ success: true });
  } catch (e) {
    console.error("❌ Không thể ghi file:", e);
    res.status(500).json({ success: false, error: "Lỗi ghi file." });
  }
});

// Lấy thư đang hiển thị (mỗi giờ 1 thư, hiển thị tuần tự)
app.get("/api/thu", (req, res) => {
  let danhSach = [];
  try {
    danhSach = JSON.parse(fs.readFileSync(THU_FILE));
  } catch {}

  const now = new Date();
  const hienTai = danhSach.find((thu) => thu.displayed === true);

  if (hienTai) {
    const diffHours = (now - new Date(hienTai.time)) / (1000 * 60 * 60);
    if (diffHours >= 1) {
      // Hết hạn: ẩn thư hiện tại
      const updatedDanhSach = danhSach.map((thu) => {
        if (thu === hienTai) return { ...thu, displayed: false };
        return thu;
      });

      const next = updatedDanhSach.find((thu) => !thu.displayed);
      if (next) {
        next.displayed = true;
        next.time = now.toISOString();
        fs.writeFileSync(THU_FILE, JSON.stringify(updatedDanhSach, null, 2));
        console.log("🔁 Hiển thị thư kế tiếp:", next);
        return res.json([next]);
      } else {
        fs.writeFileSync(THU_FILE, JSON.stringify(updatedDanhSach, null, 2));
        return res.json([]);
      }
    } else {
      return res.json([hienTai]);
    }
  } else {
    const next = danhSach.find((thu) => !thu.displayed);
    if (next) {
      next.displayed = true;
      next.time = now.toISOString();
      fs.writeFileSync(THU_FILE, JSON.stringify(danhSach, null, 2));
      console.log("🆕 Hiển thị thư đầu tiên:", next);
      return res.json([next]);
    }
  }

  return res.json([]);
});

// Trang chủ
app.get("/", (req, res) => {
  res.redirect("/index.html");
});

app.listen(PORT, () => {
  console.log(`✅ Server chạy tại http://localhost:${PORT}/index.html`);
});
