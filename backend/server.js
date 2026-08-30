import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Vérification du serveur
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    application: "Life Pilot",
    message: "Life Pilot backend is running."
  });
});

// Vérification de l'API
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok"
  });
});

// Analyse d'une situation
app.post("/api/analyze", async (req, res) => {
  try {
    const { situation, objective } = req.body;

    if (!situation || !situation.trim()) {
      return res.status(400).json({
        error: "Une situation est nécessaire."
      });
    }

    const userObjective =
      objective && objective.trim()
        ? objective.trim()
        : "Aider l'utilisateur à comprendre et gérer sa situation.";

    const response = await openai.responses.create({
      model: "gpt-5.6-luna",

      instructions: `
Tu es Life Pilot, un assistant intelligent destiné à aider l'utilisateur
à comprendre et gérer ses messages, documents et situations du quotidien.

Ton rôle est d'être :
- clair
- utile
- naturel
- bienveillant
- précis
- facile à comprendre

Tu dois analyser la situation fournie par l'utilisateur et proposer une
réponse concrète.

Ne prétends jamais être humain.
Ne donne pas de diagnostic médical.
Ne présente pas tes réponses comme des conseils professionnels lorsque
la situation nécessite un professionnel.

Réponds en français sauf si l'utilisateur demande explicitement une autre langue.

Objectif de l'utilisateur :
${userObjective}
`,

      input: `
Situation de l'utilisateur :

${situation}
`
    });

    return res.json({
      success: true,
      answer: response.output_text
    });

  } catch (error) {
    console.error("Erreur Life Pilot :", error);

    return res.status(500).json({
      success: false,
      error: "Impossible de contacter le moteur IA."
    });
  }
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`Life Pilot backend running on port ${PORT}`);
});
