const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Pointing to Python AI Engine
const AI_BASE_URL = process.env.AI_ENGINE_URL || 'http://localhost:5000';
const AI_SERVICE_URL = `${AI_BASE_URL}/analyze-coast`;
const AI_REPORT_URL = `${AI_BASE_URL}/generate-report`;
const AI_PREDICTOR_URL = `${AI_BASE_URL}/ai-predictor`;

app.post('/api/coastal-analysis', async (req, res) => {
    try {
        const { bbox, future_year, show_transects } = req.body;
        
        console.log(`⚡ Processing GIS Request | Year: +${future_year}`);

        const response = await axios.post(AI_SERVICE_URL, {
            bbox, 
            future_year: future_year || 0,
            show_transects: show_transects
        });

        res.json(response.data);
        
    } catch (error) {
        console.error("❌ AI Engine Failure:", error.message);
        res.status(500).json({ error: "Neural Network Unreachable" });
    }
});

// Report generation proxy
app.post('/api/generate-report', async (req, res) => {
    try {
        console.log("📄 Generating Strategic Report...");
        const response = await axios.post(AI_REPORT_URL, req.body);
        res.json(response.data);
    } catch (error) {
        console.error("Report Error:", error.message);
        res.status(500).json({ error: "Report Gen Failed" });
    }
});

// AI Predictor proxy
app.post('/api/ai-predictor', async (req, res) => {
    try {
        console.log("🤖 Running AI Predictor...");
        const response = await axios.post(AI_PREDICTOR_URL, req.body);
        res.json(response.data);
    } catch (error) {
        console.error("AI Predictor Error:", error.message);
        res.status(500).json({ error: "AI Predictor Failed" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 CoAspire Core running on port ${PORT}`));