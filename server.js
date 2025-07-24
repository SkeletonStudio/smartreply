const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(express.json());

// 🧠 ENV
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "smartreply_token";

// 📲 CHANNEL TOKENS
const MESSENGER_TOKEN = process.env.MESSENGER_TOKEN;
const INSTAGRAM_TOKEN = process.env.INSTAGRAM_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// 📍 ROUTE FOR VERIFICATION
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ Webhook verified");
    return res.status(200).send(challenge);
  } else {
    return res.sendStatus(403);
  }
});

// 📥 ROUTE FOR RECEIVING MESSAGES
app.post("/webhook", async (req, res) => {
  const body = req.body;

  try {
    if (body.object === "page") {
      for (const entry of body.entry) {
        for (const event of entry.messaging) {
          const senderId = event.sender.id;
          const message = event.message?.text;

          if (senderId && message) {
            const reply = await getAIReply(message);

            if (senderId.startsWith("IG")) {
              await sendInstagramReply(senderId, reply);
            } else {
              await sendMessengerReply(senderId, reply);
            }
          }
        }
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Error:", err);
    res.sendStatus(500);
  }
});

// 🔁 SMART REPLY via OpenAI
async function getAIReply(message) {
  try {
    const res = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: message }],
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );
    return res.data.choices[0].message.content.trim();
  } catch (err) {
    console.error("OpenAI Error:", err.message);
    return "Sorry, I couldn't understand that.";
  }
}

// 📤 MESSENGER REPLY
async function sendMessengerReply(recipientId, message) {
  await axios.post(
    `https://graph.facebook.com/v18.0/me/messages?access_token=${MESSENGER_TOKEN}`,
    {
      recipient: { id: recipientId },
      message: { text: message },
    }
  );
}

// 📤 INSTAGRAM REPLY
async function sendInstagramReply(recipientId, message) {
  await axios.post(
    `https://graph.facebook.com/v18.0/me/messages?access_token=${INSTAGRAM_TOKEN}`,
    {
      recipient: { id: recipientId },
      message: { text: message },
    }
  );
}

// 🚀 START
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
