"use strict";

/* =========================================================
   LIFE PILOT — APP.JS
   Gestion complète de l'interface utilisateur
   ========================================================= */


/* =========================================================
   CONFIGURATION
   ========================================================= */

const API_URL = window.location.origin;

let selectedTone = "Réponse naturelle";
let selectedFiles = [];


/* =========================================================
   TONS DISPONIBLES
   ========================================================= */

const tones = [
  {
    name: "Réponse naturelle",
    description: "Une réponse claire et naturelle."
  },
  {
    name: "Très simple",
    description: "Des explications faciles à comprendre."
  },
  {
    name: "Professionnelle",
    description: "Une réponse structurée et professionnelle."
  },
  {
    name: "Courte et directe",
    description: "L'essentiel, sans détour."
  },
  {
    name: "Rassurante",
    description: "Une réponse calme et rassurante."
  }
];


/* =========================================================
   RÉCUPÉRATION DES ÉLÉMENTS HTML
   ========================================================= */

const problemInput = document.getElementById("problem");
const goalInput = document.getElementById("goal");

const toneContainer = document.getElementById("tones");

const fileInput = document.getElementById("file");
const filesContainer = document.getElementById("files");

const analyzeButton = document.getElementById("go");

const loadingContainer = document.getElementById("loading");
const resultContainer = document.getElementById("result");
const errorContainer = document.getElementById("error");

const toastContainer = document.getElementById("toast");


/* =========================================================
   INITIALISATION
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  initializeTones();

  updateAnalyzeButton();

  initializeInputs();

  initializeKeyboardShortcuts();

});


/* =========================================================
   INITIALISATION DES CHAMPS
   ========================================================= */

function initializeInputs() {

  if (problemInput) {
    problemInput.addEventListener(
      "input",
      updateAnalyzeButton
    );
  }

  if (goalInput) {
    goalInput.addEventListener(
      "input",
      updateAnalyzeButton
    );
  }

  if (fileInput) {
    fileInput.addEventListener(
      "change",
      handleFileSelection
    );
  }

}


/* =========================================================
   INITIALISATION DES RACCOURCIS
   ========================================================= */

function initializeKeyboardShortcuts() {

  if (!problemInput) {
    return;
  }

  problemInput.addEventListener("keydown", (event) => {

    /*
      Ctrl + Entrée
      permet de lancer l'analyse rapidement.
    */

    if (
      event.ctrlKey &&
      event.key === "Enter"
    ) {

      event.preventDefault();

      if (!analyzeButton?.disabled) {
        analyze();
      }

    }

  });

}


/* =========================================================
   GESTION DES TONS
   ========================================================= */

function initializeTones() {

  if (!toneContainer) {
    return;
  }

  toneContainer.innerHTML = "";

  tones.forEach((tone, index) => {

    const button = document.createElement("button");

    button.type = "button";

    button.className = "tone";

    button.textContent = tone.name;

    button.title = tone.description;

    if (index === 0) {
      button.classList.add("active");
    }

    button.addEventListener("click", () => {

      selectedTone = tone.name;

      document
        .querySelectorAll(".tone")
        .forEach((item) => {
          item.classList.remove("active");
        });

      button.classList.add("active");

    });

    toneContainer.appendChild(button);

  });

}


/* =========================================================
   ACTIVATION / DÉSACTIVATION DU BOUTON
   ========================================================= */

function updateAnalyzeButton() {

  if (!analyzeButton) {
    return;
  }

  const situation =
    problemInput?.value.trim() || "";

  const hasFiles =
    selectedFiles.length > 0;

  analyzeButton.disabled =
    situation.length === 0 &&
    !hasFiles;

}


/* =========================================================
   GESTION DES FICHIERS
   ========================================================= */

function handleFileSelection() {

  if (!fileInput) {
    return;
  }

  selectedFiles =
    Array.from(fileInput.files || []);

  displayFiles();

  updateAnalyzeButton();

}


/* =========================================================
   AFFICHAGE DES FICHIERS
   ========================================================= */

function displayFiles() {

  if (!filesContainer) {
    return;
  }

  filesContainer.innerHTML = "";

  if (selectedFiles.length === 0) {
    return;
  }

  selectedFiles.forEach((file, index) => {

    const fileElement =
      document.createElement("div");

    fileElement.className =
      "file-pill";

    const fileName =
      document.createElement("span");

    fileName.textContent =
      file.name;

    const fileSize =
      document.createElement("small");

    fileSize.textContent =
      formatFileSize(file.size);

    const removeButton =
      document.createElement("button");

    removeButton.type = "button";

    removeButton.textContent = "×";

    removeButton.title =
      "Supprimer ce fichier";

    removeButton.addEventListener(
      "click",
      () => {

        removeFile(index);

      }
    );

    fileElement.appendChild(fileName);

    fileElement.appendChild(fileSize);

    fileElement.appendChild(removeButton);

    filesContainer.appendChild(
      fileElement
    );

  });

}


/* =========================================================
   SUPPRIMER UN FICHIER
   ========================================================= */

function removeFile(index) {

  selectedFiles.splice(index, 1);

  /*
    On recrée un DataTransfer afin de
    synchroniser l'input file.
  */

  if (fileInput) {

    const dataTransfer =
      new DataTransfer();

    selectedFiles.forEach((file) => {

      dataTransfer.items.add(file);

    });

    fileInput.files =
      dataTransfer.files;

  }

  displayFiles();

  updateAnalyzeButton();

}


/* =========================================================
   TAILLE DES FICHIERS
   ========================================================= */

function formatFileSize(bytes) {

  if (!Number.isFinite(bytes)) {
    return "";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;

}


/* =========================================================
   LANCER L'ANALYSE
   ========================================================= */

async function analyze() {

  const situation =
    problemInput?.value.trim() || "";

  const objective =
    goalInput?.value.trim() || "";

  /*
    Vérification minimale.
  */

  if (!situation) {

    showError(
      "Décris d'abord ta situation."
    );

    problemInput?.focus();

    return;
  }

  hideError();

  startLoading();

  try {

    const response =
      await fetch(
        `${API_URL}/api/analyze`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            situation,
            objective,
            tone: selectedTone
          })
        }
      );


    /*
      On tente de lire la réponse JSON.
    */

    let data = null;

    try {

      data =
        await response.json();

    } catch {

      data = null;

    }


    /*
      Si le serveur renvoie une erreur.
    */

    if (!response.ok) {

      const message =
        data?.error ||
        data?.message ||
        `Erreur du serveur (${response.status}).`;

      throw new Error(message);

    }


    /*
      Vérification de la réponse.
    */

    if (
      !data ||
      data.success !== true
    ) {

      throw new Error(
        data?.error ||
        "Le serveur n'a pas retourné une analyse valide."
      );

    }


    if (
      typeof data.answer !== "string" ||
      !data.answer.trim()
    ) {

      throw new Error(
        "Life Pilot n'a retourné aucune réponse."
      );

    }


    /*
      Affichage du résultat.
    */

    displayResult(data.answer);


    /*
      Faire défiler automatiquement
      vers le résultat.
    */

    if (resultContainer) {

      setTimeout(() => {

        resultContainer.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });

      }, 100);

    }


  } catch (error) {

    console.error(
      "Erreur Life Pilot :",
      error
    );

    showError(
      getFriendlyErrorMessage(error)
    );

  } finally {

    stopLoading();

  }

}


/* =========================================================
   MESSAGE D'ERREUR UTILISATEUR
   ========================================================= */

function getFriendlyErrorMessage(error) {

  const message =
    error?.message || "";

  /*
    Erreur de crédits OpenAI.
  */

  if (
    message.includes("crédits") ||
    message.includes("credits") ||
    message.includes("crédit")
  ) {

    return (
      "Le moteur IA est actuellement indisponible " +
      "car le compte API n'a plus de crédits."
    );

  }


  /*
    Erreur réseau.
  */

  if (
    error instanceof TypeError ||
    message.toLowerCase().includes("failed to fetch")
  ) {

    return (
      "Impossible de contacter Life Pilot. " +
      "Vérifie ta connexion puis réessaie."
    );

  }


  /*
    Erreur générique.
  */

  return message ||
    "Une erreur est survenue. Réessaie dans quelques instants.";

}


/* =========================================================
   AFFICHAGE DU CHARGEMENT
   ========================================================= */

function startLoading() {

  loadingContainer?.classList.add("on");

  resultContainer?.classList.remove("on");

  analyzeButton?.classList.add("loading");

  if (analyzeButton) {

    analyzeButton.disabled = true;

    analyzeButton.textContent =
      "Analyse en cours...";

  }

}


/* =========================================================
   FIN DU CHARGEMENT
   ========================================================= */

function stopLoading() {

  loadingContainer?.classList.remove("on");

  analyzeButton?.classList.remove("loading");

  if (analyzeButton) {

    analyzeButton.textContent =
      "Comprendre exactement";

  }

  updateAnalyzeButton();

}


/* =========================================================
   AFFICHAGE DU RÉSULTAT
   ========================================================= */

function displayResult(answer) {

  /*
    Le backend renvoie une réponse complète.
    On l'affiche dans la partie principale.
  */

  const meaning =
    document.getElementById("meaning");

  const exact =
    document.getElementById("exact");

  const action =
    document.getElementById("action");

  const attention =
    document.getElementById("attention");

  const missing =
    document.getElementById("missing");

  const reply =
    document.getElementById("reply");


  /*
    On met la réponse complète dans
    "Réponse Life Pilot".
  */

  if (reply) {

    reply.textContent =
      answer;

  }


  /*
    Les autres sections donnent un
    contexte général à la réponse.
  */

  if (meaning) {

    meaning.textContent =
      "Life Pilot a analysé ta situation et a préparé une réponse adaptée.";

  }

  if (exact) {

    exact.textContent =
      "L'analyse tient compte de la situation et de l'objectif que tu as indiqués.";

  }

  if (action) {

    action.textContent =
      "Lis la réponse complète ci-dessous et suis les étapes proposées lorsque cela est pertinent.";

  }

  if (attention) {

    attention.textContent =
      "Pour les décisions importantes, vérifie toujours les informations et les éléments essentiels avant d'agir.";

  }

  if (missing) {

    missing.textContent =
      "Si des informations importantes manquent, précise-les dans une nouvelle analyse pour obtenir une réponse plus précise.";

  }


  resultContainer?.classList.add("on");

}


/* =========================================================
   COPIER LA RÉPONSE
   ========================================================= */

async function copyReply() {

  const reply =
    document.getElementById("reply");

  if (!reply) {
    return;
  }

  const text =
    reply.textContent.trim();

  if (!text) {

    showToast(
      "Il n'y a aucune réponse à copier."
    );

    return;
  }


  try {

    await navigator.clipboard.writeText(
      text
    );

    showToast(
      "Réponse copiée ✓"
    );

  } catch {

    /*
      Méthode de secours pour les
      navigateurs qui bloquent Clipboard API.
    */

    const textarea =
      document.createElement("textarea");

    textarea.value = text;

    textarea.style.position =
      "fixed";

    textarea.style.left =
      "-9999px";

    document.body.appendChild(
      textarea
    );

    textarea.select();

    try {

      document.execCommand("copy");

      showToast(
        "Réponse copiée ✓"
      );

    } catch {

      showToast(
        "Impossible de copier la réponse."
      );

    }

    textarea.remove();

  }

}


/* =========================================================
   BOUTON PREMIUM
   ========================================================= */

function showPremium() {

  showToast(
    "Les fonctionnalités Premium seront disponibles prochainement."
  );

}


/* =========================================================
   FOCUS SUR LE PROBLÈME
   ========================================================= */

function focusProblem() {

  if (!problemInput) {
    return;
  }

  problemInput.focus();

  problemInput.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });

}


/* =========================================================
   NOTIFICATIONS
   ========================================================= */

function showToast(message) {

  if (!toastContainer) {
    return;
  }

  toastContainer.textContent =
    message;

  toastContainer.classList.add("on");

  clearTimeout(
    window.lifePilotToastTimer
  );

  window.lifePilotToastTimer =
    setTimeout(() => {

      toastContainer.classList.remove(
        "on"
      );

    }, 3000);

}


/* =========================================================
   FONCTIONS UTILITAIRES
   ========================================================= */

function clearForm() {

  if (problemInput) {
    problemInput.value = "";
  }

  if (goalInput) {
    goalInput.value = "";
  }

  if (fileInput) {
    fileInput.value = "";
  }

  selectedFiles = [];

  displayFiles();

  resultContainer?.classList.remove("on");

  hideError();

  updateAnalyzeButton();

}


function hideError() {

  if (!errorContainer) {
    return;
  }

  errorContainer.textContent = "";

  errorContainer.classList.remove("on");

}


function showError(message) {

  if (!errorContainer) {
    return;
  }

  errorContainer.textContent =
    message;

  errorContainer.classList.add("on");

  errorContainer.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });

}


/* =========================================================
   EXPOSER LES FONCTIONS AUX BOUTONS HTML
   ========================================================= */

window.analyze =
  analyze;

window.copyReply =
  copyReply;

window.showPremium =
  showPremium;

window.focusProblem =
  focusProblem;

window.clearForm =
  clearForm;
