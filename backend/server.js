import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.get("/", (req, res) => {
    res.json({
        status: "ok",
        application: "Life Pilot",
        message: "Life Pilot backend is running."
    });
});

app.get("/api/health", (req, res) => {
    res.json({
        status: "ok"
    });
});

app.post("/api/analyze", async (req, res) => {
    try {
        const { situation, objective } = req.body;

        if (!situation || !situation.trim()) {
            return res.status(400).json({
                error: "Une situation est nécessaire."
            });
        }

        /*
         * La connexion au fournisseur IA sera ajoutée ici.
         * Aucune clé secrète ne doit être placée dans le code.
         */

        return res.status(501).json({
            error: "Le moteur IA n'est pas encore connecté.",
            status: "AI_NOT_CONFIGURED"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Une erreur interne est survenue."
        });
    }
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Life Pilot backend running on port ${PORT}`);
});
