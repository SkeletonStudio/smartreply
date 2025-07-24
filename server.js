const express = require("express");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 3000;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "smartreply_verify_token";

app.use(bodyParser.json());

// التحقق من Webhook
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ Webhook verified!");
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// استقبال الرسائل من ميتا
app.post("/webhook", (req, res) => {
  const body = req.body;

  console.log("📩 Webhook Event Received:");
  console.dir(body, { depth: null });

  res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
