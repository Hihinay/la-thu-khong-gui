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

app.post("/api/thu", (req, res) => {
  const { content } = req.body;
  const now = new Date();

  // Lọc thư rác
  const badPattern = /[^a-zA-Z0-9\s.,!?áàảãạâăêôơưđÁÀẢÃẠÂĂÊÔƠƯĐ]/g;
  if (
    !content ||
    content.trim().length < 20 ||
    badPattern.test(content) ||
    content.length > 2000
  ) {
    return res.status(400).json({
      success: false,
      error: "Nội dung thư không hợp lệ.",
    });
  }

  // Luôn ghi đè thư cũ
  const newThu = {
    content: content.trim(),
    time: now.toISOString(),
  };

  fs.writeFileSync(THU_FILE, JSON.stringify([newThu], null, 2));
  res.json({ success: true });
});

app.get("/api/thu", (req, res) => {
  let data = [];
  try {
    data = JSON.parse(fs.readFileSync(THU_FILE));
  } catch {}

  if (data.length > 0) {
    const now = new Date();
    const lastTime = new Date(data[0].time);
    const diffMs = now - lastTime;
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours >= 3) {
      // Thư đã quá 3 tiếng → không trả về thư
      return res.json([]);
    }
  }

  res.json(data);
});

app.listen(PORT, () => {
  console.log(`✅ Server chạy tại http://localhost:${PORT}/html/index.html`);
});
