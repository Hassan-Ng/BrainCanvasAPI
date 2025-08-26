const express = require('express');
const axios = require('axios');

const router = express.Router();

// Summarization endpoint
router.post('/summarize', async (req, res) => {
  const { text } = req.body;

  if (!text) return res.status(400).json({ error: 'No text provided' });

  try {
    // --- Option A: Gemini ---
    const response = await axios.post(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent",
      {
        contents: [{ parts: [{ text: `Summarize this in simple words:\n\n${text}` }] }]
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.GEMINI_API_KEY}`
        }
      }
    );

    const summary = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "No summary generated";

    res.json({ summary });

  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to summarize text' });
  }
});

module.exports = router;
