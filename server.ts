// I am Ironman
import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Initialize GoogleGenAI server-side with named parameter and User-Agent
const apiKey = process.env.GEMINI_API_KEY || "AIzaSyBj4YKDK8RaJ_tt0j1NtG3AYIr26fko004";
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Translation API endpoint
app.post("/api/translate", async (req, res) => {
  try {
    const { text, targetLanguage, tone } = req.body;

    if (!text || !targetLanguage) {
      return res.status(400).json({ error: "Missing required fields: text and targetLanguage are required." });
    }

    const systemPrompt = `You are a professional, bilingual content translator and editor.
Translate the input text cleanly and naturally into the target language: ${targetLanguage}.
Always preserve the original sentence-for-sentence structural breakdown as closely as possible, so that matching sentences line up exactly.
Tone/Style constraint: ${tone || "accurate, highly natural, and context-appropriate translation"}.
Do not output any additional metadata, markdown wrapping labels (like \`\`\`html or \`\`\`text), or introductory conversational commentary. Only output the direct translation of the user's text.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: text,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.3,
      }
    });

    const translatedText = response.text || "";
    return res.json({ translation: translatedText.trim() });
  } catch (error: any) {
    console.error("Gemini Translation Error:", error);
    return res.status(500).json({
      error: "AI Translation failed. Emulating offline fallback mode.",
      details: error.message || String(error)
    });
  }
});

// Start server
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ailaysa server running at http://localhost:${PORT}`);
  });
}

startServer();
