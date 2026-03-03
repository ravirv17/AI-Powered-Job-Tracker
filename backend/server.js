const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const OpenAI = require("openai");

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: "2mb" }));

const openaiApiKey = process.env.OPENAI_API_KEY;
const openai =
  openaiApiKey &&
  new OpenAI({
    apiKey: openaiApiKey,
  });

app.get("/", (req, res) => {
  res.json({ ok: true, message: "AI-Powered Job Tracker backend running" });
});

app.post("/api/ai-suggestions", async (req, res) => {
  if (!openaiApiKey || !openai) {
    return res
      .status(500)
      .json({ error: "OpenAI API key not configured on server." });
  }

  const { resumeText, jobDescription } = req.body || {};

  if (!resumeText) {
    return res.status(400).json({ error: "Missing resumeText in request." });
  }

  try {
    const prompt = `
You are assisting a job seeker using an AI-powered job tracker app.

They provided this RESUME:
---
${resumeText}
---

${jobDescription ? `They are considering this JOB DESCRIPTION:\n---\n${jobDescription}\n---\n` : ""}

Give them:
1) A short summary of their profile.
2) 3–5 tailored suggestions to improve their resume for this type of role.
3) 3 concrete next actions for their job search.

Keep it concise and practical.
    `.trim();

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a concise, practical career coach helping with job search and resume improvements.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.4,
    });

    const message = completion.choices[0]?.message?.content?.trim();

    res.json({ suggestions: message || "No suggestions generated." });
  } catch (error) {
    console.error("OpenAI error:", error);
    res
      .status(500)
      .json({ error: "Failed to generate AI suggestions. Try again later." });
  }
});

app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
});

