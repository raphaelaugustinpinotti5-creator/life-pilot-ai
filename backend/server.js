import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

// --------------------------------------------------
// CONFIGURATION
// --------------------------------------------------

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --------------------------------------------------
// OPENAI
// --------------------------------------------------

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
  : null;

// --------------------------------------------------
// MIDDLEWARES
// --------------------------------------------------

app.use(cors());

app.use(
  express.json({
    limit: "10mb"
  })
);

// Permet à Render de servir index.html,
// app.js, style.css et les autres fichiers
// présents à la racine du projet.
app.use(express.static(path.join(__dirname, "..")));

// --------------------------------------------------
// PAGE PRINCIPALE
// --------------------------------------------------

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "index.html"));
});

// --------------------------------------------------
// VÉRIFICATION DU SERVEUR
// --------------------------------------------------

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    application: "Life Pilot",
    backend: "running"
  });
});

// --------------------------------------------------
// ANALYSE LIFE PILOT
// --------------------------------------------------

app.post("/api/analyze", async (req, res) => {
  try {
    // Vérification du corps de la requête
    if (!req.body) {
      return res.status(400).json({
        success: false,
        error: "Aucune donnée reçue."
      });
    }

    const { situation, objective } = req.body;

    // Vérification de la situation
    if (
      typeof situation !== "string" ||
      !situation.trim()
    ) {
      return res.status(400).json({
        success: false,
        error: "Une situation est nécessaire."
      });
    }

    // Objectif facultatif
    const userObjective =
      typeof objective === "string" && objective.trim()
        ? objective.trim()
        : "Aider l'utilisateur à comprendre et gérer sa situation.";

    // Vérification de la clé API
    if (!openai) {
      console.error("OPENAI_API_KEY manquante.");

      return res.status(500).json({
        success: false,
        error: "La connexion au moteur IA n'est pas configurée."
      });
    }

    // ------------------------------------------------
    // APPEL À OPENAI
    // ------------------------------------------------

    const response = await openai.responses.create({
      model: "gpt-5.6-luna",

      instructions: `
Tu es Life Pilot, un assistant intelligent conçu pour aider
l'utilisateur dans les situations de la vie quotidienne.

Ton rôle est d'être :

- clair
- naturel
- utile
- bienveillant
- précis
- facile à comprendre

Tu dois comprendre la situation de l'utilisateur et lui fournir
une réponse concrète et directement exploitable.

Tu dois :

1. Comprendre la situation.
2. Identifier le problème principal.
3. Tenir compte de l'objectif de l'utilisateur.
4. Proposer une solution claire.
5. Donner des étapes concrètes lorsque c'est utile.
6. Éviter les réponses inutilement longues.
7. Utiliser un langage naturel et simple.

Ne prétends jamais être humain.

Ne donne pas de diagnostic médical.

Lorsque la situation nécessite l'intervention d'un professionnel,
indique clairement que l'utilisateur devrait consulter un
professionnel approprié.

Réponds en français sauf si l'utilisateur demande explicitement
une autre langue.

Objectif de l'utilisateur :
${userObjective}
`,

      input: `
Situation de l'utilisateur :

${situation}
`
    });

    // ------------------------------------------------
    // RÉPONSE
    // ------------------------------------------------

    const answer = response.output_text;

    if (!answer || !answer.trim()) {
      return res.status(500).json({
        success: false,
        error: "Le moteur IA n'a retourné aucune réponse."
      });
    }

    return res.json({
      success: true,
      answer: answer.trim()
    });

  } catch (error) {
    console.error("Erreur Life Pilot :", error);

    // Erreur de quota/crédits OpenAI
    if (
      error?.status === 429 ||
      error?.code === "insufficient_quota" ||
      error?.code === "credit_balance_exhausted"
    ) {
      return res.status(503).json({
        success: false,
        error: "Le moteur IA n'a actuellement plus de crédits disponibles."
      });
    }

    // Erreur d'authentification
    if (
      error?.status === 401 ||
      error?.code === "invalid_api_key"
    ) {
      return res.status(500).json({
        success: false,
        error: "La clé API du moteur IA est invalide."
      });
    }

    // Autre erreur
    return res.status(500).json({
      success: false,
      error: "Impossible de contacter le moteur IA."
    });
  }
});

// --------------------------------------------------
// ROUTE 404 API
// --------------------------------------------------

app.use("/api", (req, res) => {
  res.status(404).json({
    success: false,
    error: "Route API introuvable."
  });
});

// --------------------------------------------------
// DÉMARRAGE DU SERVEUR
// --------------------------------------------------

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Life Pilot backend running on port ${PORT}`);
  console.log(`Port utilisé : ${PORT}`);
});
