const API_URL = "https://life-pilot-ai-5fkm.onrender.com";

let selectedTone = "Réponse naturelle";

const tones = [
  "Réponse naturelle",
  "Très simple",
  "Professionnelle",
  "Courte et directe",
  "Rassurante"
];

const toneContainer = document.getElementById("tones");
const problemInput = document.getElementById("problem");
const goalInput = document.getElementById("goal");
const fileInput = document.getElementById("file");
const analyzeButton = document.getElementById("go");
const filesContainer = document.getElementById("files");
const resultContainer = document.getElementById("result");
const loadingContainer = document.getElementById("loading");
const errorContainer = document.getElementById("error");
const toastContainer = document.getElementById("toast");


/* ================================
   INITIALISATION DES TONS
================================ */

function initializeTones() {
  if (!toneContainer) return;

  toneContainer.innerHTML = "";

  tones.forEach((tone, index) => {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "tone";

    if (index === 0) {
      button.classList.add("active");
    }

    button.textContent = tone;

    button.addEventListener("click", () => {
      selectedTone = tone;

      document.querySelectorAll(".tone").forEach((item) => {
        item.classList.remove("active");
      });

      button.classList.add("active");
    });

    toneContainer.appendChild(button);
  });
}


/* ================================
   GESTION DU BOUTON D'ANALYSE
================================ */

function updateAnalyzeButton() {
  if (!analyzeButton) return;

  const situation =
    problemInput?.value.trim() || "";

  const hasFiles =
    fileInput?.files?.length > 0;

  analyzeButton.disabled =
    situation.length === 0 && !hasFiles;
}


/* ================================
   GESTION DES FICHIERS
================================ */

function displayFiles() {
  if (!filesContainer || !fileInput) return;

  filesContainer.innerHTML = "";

  const files = Array.from(fileInput.files);

  files.forEach((file) => {
    const element = document.createElement("div");

    element.className = "file-pill";

    element.textContent =
      `📄 ${file.name} · ${formatFileSize(file.size)}`;

    filesContainer.appendChild(element);
  });

  updateAnalyzeButton();
}


function formatFileSize(size) {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${Math.round(size / 1024)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}


/* ================================
   AFFICHAGE DES ERREURS
================================ */

function showError(message) {
  if (!errorContainer) return;

  errorContainer.textContent = message;
  errorContainer.classList.add("on");
}


function hideError() {
  if (!errorContainer) return;

  errorContainer.textContent = "";
  errorContainer.classList.remove("on");
}


/* ================================
   CHARGEMENT
================================ */

function startLoading() {
  loadingContainer?.classList.add("on");

  resultContainer?.classList.remove("on");

  analyzeButton?.classList.add("loading");

  if (analyzeButton) {
    analyzeButton.disabled = true;
    analyzeButton.textContent = "Analyse en cours...";
  }
}


function stopLoading() {
  loadingContainer?.classList.remove("on");

  analyzeButton?.classList.remove("loading");

  if (analyzeButton) {
    analyzeButton.textContent = "Comprendre exactement";
  }

  updateAnalyzeButton();
}


/* ================================
   AFFICHAGE DU RÉSULTAT
================================ */

function putText(id, value) {
  const element = document.getElementById(id);

  if (!element) return;

  if (value === undefined || value === null) {
    element.textContent = "";
    return;
  }

  if (typeof value === "object") {
    element.textContent =
      JSON.stringify(value, null, 2);
  } else {
    element.textContent = String(value);
  }
}


function displayResult(data) {

  /*
   * Le backend peut renvoyer une réponse
   * complète dans "answer".
   */

  if (data.answer) {

    const answer =
      typeof data.answer === "string"
        ? data.answer
        : JSON.stringify(data.answer, null, 2);

    putText("meaning", answer);

    putText(
      "exact",
      "Life Pilot a analysé ta situation à partir des informations fournies."
    );

    putText(
      "action",
      "Consulte les recommandations fournies par Life Pilot et vérifie les informations importantes avant d'agir."
    );

    putText(
      "attention",
      "Vérifie toujours les dates, montants, documents et destinataires avant de prendre une décision importante."
    );

    putText(
      "missing",
      "Si des informations supplémentaires sont nécessaires, Life Pilot pourra te demander de préciser ta situation."
    );

    putText("reply", answer);

  } else {

    /*
     * Si le backend renvoie des champs séparés,
     * on les utilise directement.
     */

    putText(
      "meaning",
      data.meaning ||
      data.explanation ||
      data.summary ||
      "Analyse reçue."
    );

    putText(
      "exact",
      data.exact ||
      data.request ||
      data.objective ||
      "Aucune information supplémentaire."
    );

    putText(
      "action",
      data.action ||
      data.nextStep ||
      data.steps ||
      "Consulte les recommandations de Life Pilot."
    );

    putText(
      "attention",
      data.attention ||
      data.warning ||
      "Vérifie les informations importantes avant d'agir."
    );

    putText(
      "missing",
      data.missing ||
      data.questions ||
      "Aucune information supplémentaire indiquée."
    );

    putText(
      "reply",
      data.reply ||
      data.response ||
      "Analyse reçue."
    );
  }

  resultContainer?.classList.add("on");
}


/* ================================
   ANALYSE RÉELLE
================================ */

async function analyze() {

  const situation =
    problemInput?.value.trim() || "";

  const objective =
    goalInput?.value.trim() || "";

  if (!situation) {
    showError(
      "Écris d'abord ce que tu veux comprendre."
    );

    return;
  }

  hideError();

  startLoading();

  try {

    const response = await fetch(
      `${API_URL}/api/analyze`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          situation: situation,
          objective: objective,
          tone: selectedTone
        })
      }
    );


    let data;

    try {
      data = await response.json();
    } catch {
      throw new Error(
        "Le serveur a renvoyé une réponse invalide."
      );
    }


    if (!response.ok) {

      /*
       * Gestion spécifique du manque
       * de crédits OpenAI.
       */

      if (
        response.status === 429 ||
        data.error?.includes("credits") ||
        data.message?.includes("credits")
      ) {

        throw new Error(
          "L'IA est temporairement indisponible : le compte API OpenAI utilisé par Life Pilot n'a plus de crédits."
        );
      }


      throw new Error(
        data.error ||
        data.message ||
        `Erreur serveur (${response.status}).`
      );
    }


    displayResult(data);


    resultContainer?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });


  } catch (error) {

    console.error(
      "Erreur Life Pilot :",
      error
    );

    showError(
      error.message ||
      "Impossible de contacter Life Pilot."
    );

  } finally {

    stopLoading();
  }
}


/* ================================
   COPIER LA RÉPONSE
================================ */

async function copyReply() {

  const reply =
    document.getElementById("reply");

  if (!reply) return;

  const text =
    reply.textContent.trim();

  if (!text) {
    showToast("Aucune réponse à copier.");
    return;
  }


  try {

    await navigator.clipboard.writeText(text);

    showToast("Réponse copiée ✓");

  } catch {

    showToast(
      "Impossible de copier automatiquement."
    );
  }
}


/* ================================
   PREMIUM
================================ */

function showPremium() {

  showToast(
    "Premium sera disponible lorsque le paiement sera connecté."
  );
}


/* ================================
   NOTIFICATION
================================ */

function showToast(message) {

  if (!toastContainer) return;

  toastContainer.textContent = message;

  toastContainer.classList.add("on");

  clearTimeout(window.lifePilotToastTimer);

  window.lifePilotToastTimer =
    setTimeout(() => {

      toastContainer.classList.remove("on");

    }, 3000);
}


/* ================================
   FOCUS SUR LE CHAMP
================================ */

function focusProblem() {

  problemInput?.focus();

  problemInput?.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });
}


/* ================================
   ÉVÉNEMENTS
================================ */

if (problemInput) {
  problemInput.addEventListener(
    "input",
    updateAnalyzeButton
  );
}


if (fileInput) {
  fileInput.addEventListener(
    "change",
    displayFiles
  );
}


if (analyzeButton) {
  analyzeButton.addEventListener(
    "click",
    analyze
  );
}


/* ================================
   INITIALISATION
================================ */

initializeTones();

updateAnalyzeButton();
