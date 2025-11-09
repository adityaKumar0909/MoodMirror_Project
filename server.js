const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config(); // ⚠️ You forgot `.config()` here

const app = express();
app.use(cors());
app.use(express.json());

const SENTIMENT_MODEL = "https://router.huggingface.co/hf-inference/models/j-hartmann/emotion-english-distilroberta-base";
const TOPIC_MODEL = "https://router.huggingface.co/hf-inference/models/facebook/bart-large-mnli";
const HF_TOKEN = process.env.HF_TOKEN;
const PORT = process.env.PORT || 3000;

console.log("✅ Server starting...");
console.log("🔑 HuggingFace Token:", HF_TOKEN ? "Loaded" : "MISSING");

app.post('/analyze', async (req, res) => {
    console.log("\n📩 Incoming /analyze request...");
    try {
        const text = req.body.text || "";
        console.log("📝 Received text:", text);

        if (!text) {
            console.log("⚠️ No text provided!");
            return res.status(400).json({ error: "No text provided" });
        }

        const headers = {
            "Authorization": `Bearer ${HF_TOKEN}`,
            "Content-Type": "application/json"
        };

        console.log("📡 Sending sentiment request...");
        let sentimentResponse = await axios.post(SENTIMENT_MODEL, { inputs: text }, { headers });
        console.log("✅ Sentiment response received");

        let sentiments = sentimentResponse.data;
        console.log("📊 Raw sentiment data:", JSON.stringify(sentiments, null, 2));

        if (Array.isArray(sentiments[0])) sentiments = sentiments[0];

        const topSentiment = sentiments.length
            ? sentiments.reduce((max, item) => item.score > max.score ? item : max)
            : { label: "neutral", score: 0 };
        const emotion = topSentiment.label.toLowerCase();

        console.log("💡 Detected emotion:", emotion);

        const candidateLabels = [
            "politics", "technology", "sports", "finance", "entertainment",
            "education", "science", "relationships", "crime", "mental health", "insult",
            "racism", "humor", "motivation", "violence", "social issues", "religion",
            "personal life", "news"
        ];

        console.log("📡 Sending topic classification request...");
        let topicResponse = await axios.post(
            TOPIC_MODEL,
            { inputs: text, parameters: { candidate_labels: candidateLabels } },
            { headers }
        );
        console.log("✅ Topic response received");

                const topicData = topicResponse.data;
        console.log("📊 Raw topic data:", JSON.stringify(topicData, null, 2));

        let topics = [];

        if (Array.isArray(topicData)) {
            // ✅ New format: array of { label, score }
            topics = topicData
                .sort((a, b) => b.score - a.score)
                .slice(0, 3)
                .map(item => item.label);
        } else if (topicData.labels && topicData.scores) {
            // ✅ Old format: object with arrays
            topics = topicData.labels
                .map((label, i) => ({ label, score: topicData.scores[i] }))
                .sort((a, b) => b.score - a.score)
                .slice(0, 3)
                .map(x => x.label);
        }

        console.log("🏷️ Top topics:", topics);


        res.json({
            emotion: { sentiment: emotion },
            topic: { labels: topics }
        });

        console.log("✅ Response sent successfully.");

    } catch (error) {
        console.error("❌ Error analyzing text:", error.response?.data || error.message);
        res.status(500).json({
            error: "Analysis failed",
            details: error.response?.data || error.message
        });
    }
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
