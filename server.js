const express = require('express');
const cors = require('cors');
const axios = require('axios'); // <-- use axios instead of fetch
require('dotenv');

const app = express();
app.use(cors());
app.use(express.json());

const SENTIMENT_MODEL = "https://router.huggingface.co/hf-inference/models/j-hartmann/emotion-english-distilroberta-base"
const TOPIC_MODEL = "https://router.huggingface.co/hf-inference/models/facebook/bart-large-mnli"
const HF_TOKEN = process.env.HF_TOKEN;
const PORT = process.env.PORT || 3000;

app.post('/analyze', async (req, res) => {
    try {
        const text = req.body.text || "";
        if (!text) return res.status(400).json({ error: "No text provided" });

        const headers = {
            "Authorization": `Bearer ${HF_TOKEN}`,
            "Content-Type": "application/json"
        };

        // --- Sentiment Analysis ---
        let sentimentResponse = await axios.post(SENTIMENT_MODEL, { inputs: text }, { headers });
        let sentiments = sentimentResponse.data;

        if (Array.isArray(sentiments[0])) sentiments = sentiments[0];
        const topSentiment = sentiments.length
            ? sentiments.reduce((max, item) => item.score > max.score ? item : max)
            : { label: "neutral", score: 0 };
        const emotion = topSentiment.label.toLowerCase();

        // --- Topic Classification ---
        const candidateLabels = ["politics","technology","sports","finance","entertainment",
            "education","science","relationships","crime","mental health","insult",
            "racism","humor","motivation","violence","social issues","religion",
            "personal life","news"
        ];

        let topicResponse = await axios.post(TOPIC_MODEL, 
            { inputs: text, parameters: { candidate_labels: candidateLabels } }, 
            { headers }
        );

        const topicData = topicResponse.data;
        const topics = (topicData.labels && topicData.scores)
            ? topicData.labels.map((label,i)=>({label,score:topicData.scores[i]}))
              .sort((a,b)=>b.score-a.score).slice(0,3).map(x=>x.label)
            : [];

        res.json({ emotion:{sentiment:emotion}, topic:{labels:topics} });

    } catch (error) {
        console.error('Error analyzing text:', error.response?.data || error.message);
        res.status(500).json({ error:"Analysis failed", details:error.response?.data || error.message });
    }
});

app.listen(PORT, ()=>console.log(`Server running on port ${PORT}`));
