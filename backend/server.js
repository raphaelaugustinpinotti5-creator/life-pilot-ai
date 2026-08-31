import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, "..");

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
  : null;

app.use(cors());

app.use(
  express.json({
    limit: "10mb"
  })
);

// Fichiers de l'interface
app.use(express.static(ROOT_DIR));

// Page principale
app.get("/", (req, res) => {
  res.sendFile(path.join(ROOT_DIR, "index.html"));
});

// Vérification du serveur
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    application: "Life Pilot"
  });
});

// Analyse Life Pilot
app.post("/api/analyze", async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({
        success: false,
        error: "Aucune donnée reçue."
      });
    }

    const { situation, objective, tone } = req.body;

    if (
      typeof situation !== "string" ||
      !situation.trim()
    ) {
      return res.status(400).json({
        success: false,
        error: "Une situation est nécessaire."
      });
    }

    const userObjective =
      typeof objective === "string" && objective.trim()
        ? objective.trim()
        : "Aider l'utilisateur à comprendre et gérer sa situation.";

    const selectedTone =
      typeof tone === "string" && tone.trim()
        ? tone.trim()
        : "Réponse naturelle";

    if (!openai) {
      return res.status(500).json({
        success: false,
        error: "La clé API OpenAI n'est pas configurée."
      });
    }

    const response = await openai.responses.create({
      model: "gpt-5.6-luna",

      instructions: `
Tu es Life Pilot, un assistant intelligent destiné à aider
l'utilisateur à comprendre et gérer les situations du quotidien.

Tu dois être :
- clair
- naturel
- utile
- bienveillant
- précis
- facile à comprendre

Analyse la situation de l'utilisateur.

Tu dois :
1. Comprendre son problème.
2. Identifier ce qui est important.
3. Tenir compte de son objectif.
4. Donner une réponse concrète.
5. Donner des étapes lorsque c'est utile.

Ton :
${selectedTone}

Objectif :
${userObjective}

Ne prétends jamais être humain.

Ne donne pas de diagnostic médical.

Si une situation nécessite un professionnel,
indique-le clairement.

Réponds en français sauf demande contraire.
`,

      input: `
Situation de l'utilisateur :

${situation}
`
    });

    const answer = response.output_text?.trim();

    if (!answer) {
      return res.status(500).json({
        success: false,
        error: "Le moteur IA n'a retourné aucune réponse."
      });
    }

    return res.json({
      success: true,
      answer
    });

  } catch (error) {
    console.error("Erreur Life Pilot :", error);

    if (
      error?.status === 429 ||
      error?.code === "insufficient_quota" ||
      error?.code === "credit_balance_exhausted"
    ) {
      return res.status(503).json({
        success: false,
        error: "Le compte OpenAI n'a plus de crédits disponibles."
      });
    }

    if (error?.status === 401) {
      return res.status(500).json({
        success: false,
        error: "La clé API OpenAI est invalide."
      });
    }

    return res.status(500).json({
      success: false,
      error: "Impossible de contacter le moteur IA."
    });
  }
});

app.use("/api", (req, res) => {
  res.status(404).json({
    success: false,
    error: "Route API introuvable."
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Life Pilot backend running on port ${PORT}`);
});
