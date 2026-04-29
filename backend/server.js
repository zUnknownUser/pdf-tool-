import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const prompts = {
  summary: "Resuma este texto de forma clara, curta e objetiva.",
  explain: "Explique este conteúdo de forma simples, como se fosse para um estudante.",
  important: "Extraia os pontos mais importantes deste texto em tópicos.",
  questions: "Crie perguntas e respostas com base neste texto.",
};

app.post("/ai/pdf-tools", async (req, res) => {
  try {
    const { action, text } = req.body;

    if (!text) {
      return res.status(400).json({
        error: "Texto não enviado.",
      });
    }

    const instruction = prompts[action] || prompts.summary;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `
${instruction}

Texto:
${text}
      `,
    });

    return res.json({
      result: response.text,
    });
  } catch (error) {
    console.error("Erro Gemini:", error);

    return res.status(500).json({
      error: "Erro ao processar IA com Gemini.",
    });
  }
});

app.listen(3000, () => {
  console.log("Servidor Gemini rodando na porta 3000");
});