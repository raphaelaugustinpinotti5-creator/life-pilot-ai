"use strict";

/*
========================================================
 LIFE PILOT — APPLICATION FRONTEND
========================================================
*/

// Adresse de ton backend Render
const API_URL = "https://life-pilot-ai-5fkm.onrender.com";

/*
========================================================
 RÉCUPÉRATION DES ÉLÉMENTS HTML
========================================================
*/

const startButton = document.getElementById("start");

const goButton = document.getElementById("go");

const problemInput = document.getElementById("problem");

const goalInput = document.getElementById("goal");

const fileInput = document.getElementById("file");

const filesContainer = document.getElementById("files");

const resultContainer = document.getElementById("result");

const loadingContainer = document.getElementById("loading");

const errorContainer = document.getElementById("error");

const toastContainer = document.getElementById("toast");

const toneContainer = document.getElementById("tones");

/*
========================================================
 TON PAR DÉFAUT
========================================================
*/

let selectedTone = "Réponse naturelle";

/*
========================================================
 OUTILS
========================================================
*/

function showElement(element) {
    if (!element) return;

    element.hidden = false;
    element.style.display = "";
}

function hideElement(element) {
    if (!element) return;

    element.hidden = true;
}

function showError(message) {
    if (!errorContainer) {
        alert(message);
        return;
    }

    errorContainer.textContent = message;
    showElement(errorContainer);

    errorContainer.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}

function clearError() {
    if (!errorContainer) return;

    errorContainer.textContent = "";
    hideElement(errorContainer);
}

function showLoading() {
    clearError();

    if (loadingContainer) {
        showElement(loadingContainer);

        loadingContainer.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
    }

    if (goButton) {
        goButton.disabled = true;
        goButton.textContent = "Analyse en cours...";
    }
}

function hideLoading() {
    if (loadingContainer) {
        hideElement(loadingContainer);
    }

    if (goButton) {
        goButton.disabled = false;
        goButton.textContent = "Comprendre exactement";
    }
}

function showToast(message) {
    if (!toastContainer) return;

    toastContainer.textContent = message;
    showElement(toastContainer);

    setTimeout(() => {
        hideElement(toastContainer);
    }, 3000);
}

/*
========================================================
 BOUTON "COMMENCER"
========================================================
*/

if (startButton) {
    startButton.addEventListener("click", function () {
        const target =
            problemInput ||
            document.querySelector("#problem") ||
            document.querySelector("textarea");

        if (target) {
            target.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });

            setTimeout(() => {
                target.focus();
            }, 500);
        }
    });
}

/*
========================================================
 GESTION DES TONS
========================================================
*/

function setupTones() {
    if (!toneContainer) return;

    const toneButtons = toneContainer.querySelectorAll(
        "button, .tone"
    );

    toneButtons.forEach((button) => {
        button.addEventListener("click", function () {

            toneButtons.forEach((btn) => {
                btn.classList.remove("active");
            });

            button.classList.add("active");

            selectedTone =
                button.dataset.tone ||
                button.textContent.trim() ||
                "Réponse naturelle";
        });
    });
}

setupTones();

/*
========================================================
 SI LES BOUTONS DE TON SONT DIRECTEMENT DANS LA PAGE
========================================================
*/

document.querySelectorAll(".tone").forEach((button) => {
    button.addEventListener("click", function () {

        document.querySelectorAll(".tone").forEach((btn) => {
            btn.classList.remove("active");
        });

        button.classList.add("active");

        selectedTone =
            button.dataset.tone ||
            button.textContent.trim() ||
            "Réponse naturelle";
    });
});

/*
========================================================
 GESTION DES FICHIERS
========================================================
*/

if (fileInput) {

    fileInput.addEventListener("change", function () {

        if (!filesContainer) return;

        filesContainer.innerHTML = "";

        const files = Array.from(fileInput.files || []);

        if (files.length === 0) {
            filesContainer.textContent = "Aucun fichier choisi";
            return;
        }

        files.forEach((file) => {

            const fileElement = document.createElement("div");

            fileElement.className = "selected-file";

            fileElement.textContent =
                `${file.name} (${formatFileSize(file.size)})`;

            filesContainer.appendChild(fileElement);
        });
    });
}

function formatFileSize(bytes) {

    if (bytes < 1024) {
        return `${bytes} o`;
    }

    if (bytes < 1024 * 1024) {
        return `${Math.round(bytes / 1024)} Ko`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

/*
========================================================
 LECTURE DES FICHIERS TEXTE
========================================================
*/

async function readTextFiles(files) {

    const texts = [];

    for (const file of files) {

        const type = file.type || "";

        const isText =
            type.startsWith("text/") ||
            file.name.endsWith(".txt") ||
            file.name.endsWith(".md") ||
            file.name.endsWith(".csv");

        if (!isText) {
            continue;
        }

        try {

            const text = await file.text();

            texts.push(
                `\n\n--- Fichier : ${file.name} ---\n${text}`
            );

        } catch (error) {

            console.warn(
                "Impossible de lire le fichier :",
                file.name,
                error
            );
        }
    }

    return texts.join("");
}

/*
========================================================
 VALIDATION
========================================================
*/

function validateInputs() {

    const situation =
        problemInput?.value?.trim() || "";

    const objective =
        goalInput?.value?.trim() || "";

    if (!situation) {

        showError(
            "Décris d'abord ce qui se passe dans la zone « Que se passe-t-il ? »."
        );

        if (problemInput) {
            problemInput.focus();
        }

        return false;
    }

    return {
        situation,
        objective
    };
}

/*
========================================================
 CONSTRUCTION DU MESSAGE
========================================================
*/

function buildSituation(situation, objective, fileText) {

    let finalSituation = situation;

    if (objective) {

        finalSituation +=
            `\n\nObjectif de l'utilisateur :\n${objective}`;
    }

    if (selectedTone) {

        finalSituation +=
            `\n\nTon souhaité pour la réponse :\n${selectedTone}`;
    }

    if (fileText) {

        finalSituation +=
            `\n\nInformations provenant des fichiers joints :${fileText}`;
    }

    return finalSituation;
}

/*
========================================================
 AFFICHAGE DE LA RÉPONSE
========================================================
*/

function displayResult(answer) {

    if (!resultContainer) {

        alert(answer);

        return;
    }

    resultContainer.innerHTML = "";

    const title = document.createElement("h2");

    title.textContent = "Voici ce que Life Pilot vous conseille";

    const content = document.createElement("div");

    content.className = "result-content";

    /*
    On transforme les retours à la ligne en paragraphes
    sans utiliser innerHTML avec la réponse de l'IA.
    */

    const lines = answer
        .split(/\n+/)
        .map(line => line.trim())
        .filter(Boolean);

    if (lines.length === 0) {

        content.textContent = answer;

    } else {

        lines.forEach((line) => {

            const paragraph =
                document.createElement("p");

            paragraph.textContent = line;

            content.appendChild(paragraph);
        });
    }

    resultContainer.appendChild(title);
    resultContainer.appendChild(content);

    showElement(resultContainer);

    resultContainer.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

/*
========================================================
 APPEL AU BACKEND
========================================================
*/

async function analyzeSituation() {

    clearError();

    const values = validateInputs();

    if (!values) {
        return;
    }

    const {
        situation,
        objective
    } = values;

    showLoading();

    try {

        /*
        Lecture éventuelle des fichiers texte.
        */

        let fileText = "";

        if (fileInput && fileInput.files.length > 0) {

            fileText = await readTextFiles(
                Array.from(fileInput.files)
            );
        }

        const finalSituation =
            buildSituation(
                situation,
                objective,
                fileText
            );

        /*
        Appel à ton serveur Render.
        */

        const response = await fetch(
            `${API_URL}/api/analyze`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    situation: finalSituation,
                    objective: objective
                })
            }
        );

        /*
        On essaye toujours de récupérer le JSON,
        même lorsqu'il y a une erreur.
        */

        let data;

        try {

            data = await response.json();

        } catch (jsonError) {

            throw new Error(
                "Le serveur a renvoyé une réponse invalide."
            );
        }

        /*
        Gestion des erreurs du serveur.
        */

        if (!response.ok) {

            const serverMessage =
                data?.error ||
                `Erreur serveur (${response.status}).`;

            throw new Error(serverMessage);
        }

        /*
        Vérification de la réponse de l'IA.
        */

        if (
            !data ||
            !data.success ||
            !data.answer
        ) {

            throw new Error(
                "Le serveur n'a pas renvoyé de réponse de l'IA."
            );
        }

        /*
        Affichage.
        */

        hideLoading();

        displayResult(data.answer);

        showToast("Analyse terminée.");

    } catch (error) {

        console.error(
            "Erreur Life Pilot :",
            error
        );

        hideLoading();

        let message =
            "Impossible d'obtenir la réponse de Life Pilot.";

        if (error instanceof TypeError) {

            message =
                "Impossible de contacter le serveur Life Pilot. Vérifie que le backend Render est bien en ligne.";

        } else if (error?.message) {

            message = error.message;
        }

        showError(message);
    }
}

/*
========================================================
 BOUTON "COMPRENDRE EXACTEMENT"
========================================================
*/

if (goButton) {

    goButton.addEventListener(
        "click",
        analyzeSituation
    );
}

/*
========================================================
 PERMETTRE CTRL + ENTRÉE DANS LA ZONE DE SITUATION
========================================================
*/

if (problemInput) {

    problemInput.addEventListener(
        "keydown",
        function (event) {

            if (
                event.ctrlKey &&
                event.key === "Enter"
            ) {

                event.preventDefault();

                analyzeSituation();
            }
        }
    );
}

/*
========================================================
 INITIALISATION
========================================================
*/

document.addEventListener(
    "DOMContentLoaded",
    function () {

        /*
        Sécurité : le bouton doit être cliquable.
        */

        if (goButton) {
            goButton.disabled = false;
        }

        /*
        Ton par défaut.
        */

        const firstTone =
            document.querySelector(".tone");

        if (firstTone) {
            firstTone.classList.add("active");

            selectedTone =
                firstTone.dataset.tone ||
                firstTone.textContent.trim() ||
                "Réponse naturelle";
        }

        /*
        Message de démarrage dans la console.
        */

        console.log(
            "Life Pilot frontend chargé."
        );

        console.log(
            "Backend :",
            API_URL
        );
    }
);
