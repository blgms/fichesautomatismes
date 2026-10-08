/**
 * app.js
 * ------
 * Relie l'interface (sidebar, formulaire, zone de code) au registre de
 * thèmes (themes.js), au constructeur de document (typst-template.js) et à
 * l'export PDF (pdf-export.js).
 */

const els = {
  themeList: document.getElementById("theme-list"),
  paramsForm: document.getElementById("params-form"),
  paperSize: document.getElementById("paper-size"),
  pageCount: document.getElementById("page-count"),
  includeCorrection: document.getElementById("include-correction"),
  generateBtn: document.getElementById("generate-btn"),
  themeTitle: document.getElementById("theme-title"),
  themeDescription: document.getElementById("theme-description"),
  downloadTypBtn: document.getElementById("download-typ-btn"),
  downloadPdfBtn: document.getElementById("download-pdf-btn"),
  copyBtn: document.getElementById("copy-btn"),
  codeContent: document.getElementById("code-content"),
  statusBar: document.getElementById("status-bar"),
  previewFrame: document.getElementById("preview-frame"),
  previewHint: document.getElementById("preview-hint"),
  previewHintText: document.getElementById("preview-hint-text"),
  refreshPreviewBtn: document.getElementById("refresh-preview-btn"),
};

let currentThemeKey = null;
let currentSource = "";
// Mémorise les valeurs de formulaire déjà saisies pour chaque thème.
const paramsMemory = {};

function initParamsMemory() {
  for (const key of Object.keys(THEMES)) {
    const theme = THEMES[key];
    const values = {};
    for (const field of theme.paramsForm) {
      values[field.key] = field.default;
    }
    paramsMemory[key] = values;
  }
}

function renderThemeList() {
  els.themeList.innerHTML = "";

  // Regroupe les thèmes par thématique globale (theme.category), dans
  // l'ordre de première apparition dans le registre THEMES. Chaque groupe
  // est repliable ; les thèmes sans catégorie vont dans "Autres thèmes".
  const groups = new Map();
  for (const [key, theme] of Object.entries(THEMES)) {
    const category = theme.category || "Autres thèmes";
    if (!groups.has(category)) groups.set(category, []);
    groups.get(category).push([key, theme]);
  }

  for (const [category, themes] of groups) {
    const group = document.createElement("details");
    group.className = "theme-group";
    group.open = false;

    const summary = document.createElement("summary");
    summary.textContent = category;
    group.appendChild(summary);

    const list = document.createElement("div");
    list.className = "theme-list";

    for (const [key, theme] of themes) {
      const btn = document.createElement("button");
      btn.className = "theme-btn";
      btn.type = "button";
      btn.dataset.themeKey = key;
      btn.innerHTML = `
        <span class="theme-btn-title">${theme.title}</span>
        <span class="theme-btn-desc">${theme.description}</span>
      `;
      btn.addEventListener("click", () => selectTheme(key));
      list.appendChild(btn);
    }

    group.appendChild(list);
    els.themeList.appendChild(group);
  }
}

function renderParamsForm(themeKey) {
  const theme = THEMES[themeKey];
  const values = paramsMemory[themeKey];
  els.paramsForm.innerHTML = "";


  for (const field of theme.paramsForm) {
    const label = document.createElement("label");

    if (field.type === "checkbox") {
      label.className = "field field-checkbox";
      label.innerHTML = `
        <input type="checkbox" data-key="${field.key}" ${values[field.key] ? "checked" : ""} />
        <span>${field.label}</span>
      `;
    } else {
      label.className = "field";
      label.innerHTML = `
        <span>${field.label}</span>
        <input type="number" data-key="${field.key}" min="${field.min}" max="${field.max}"
               value="${values[field.key]}" />
      `;
    }
    els.paramsForm.appendChild(label);
  }

  // Sauvegarde les valeurs au fil de la saisie.
  els.paramsForm.querySelectorAll("input").forEach((input) => {
    input.addEventListener("change", () => {
      const key = input.dataset.key;
      values[key] =
        input.type === "checkbox" ? input.checked : clampNumberInput(input);
    });
  });
}

function clampNumberInput(input) {
  const min = Number(input.min);
  const max = Number(input.max);
  let value = Number(input.value);
  if (Number.isNaN(value)) value = min;
  value = Math.min(max, Math.max(min, value));
  input.value = value;
  return value;
}

function selectTheme(themeKey) {
  currentThemeKey = themeKey;
  const theme = THEMES[themeKey];

  els.themeList.querySelectorAll(".theme-btn").forEach((btn) => {
    const isActive = btn.dataset.themeKey === themeKey;
    btn.classList.toggle("active", isActive);
    // Rouvre le groupe replié contenant le thème sélectionné.
    if (isActive) btn.closest("details")?.setAttribute("open", "");
  });

  els.themeTitle.textContent = theme.title;
  els.themeDescription.textContent = theme.description;

  renderParamsForm(themeKey);
  generateSheet();
}

function generateSheet() {
  if (!currentThemeKey) return;
  const theme = THEMES[currentThemeKey];
  const params = paramsMemory[currentThemeKey];

  // Une page = un tirage complet des exercices du thème. En multi-pages,
  // chaque page garde le même en-tête et les mêmes consignes ; seules les
  // données d'exercices (et de corrigé) changent.
  const pageCount = clampNumberInput(els.pageCount);
  const generatedPages = [];
  for (let i = 0; i < pageCount; i++) {
    generatedPages.push(theme.generate(params));
  }

  currentSource = buildTypstDocument(theme, generatedPages, {
    includeCorrection: els.includeCorrection.checked,
    paperSize: els.paperSize.value,
  });


  els.codeContent.textContent = currentSource;
  els.downloadTypBtn.disabled = false;
  els.downloadPdfBtn.disabled = false;
  els.copyBtn.disabled = false;
  clearStatus();
  schedulePreviewUpdate();
}

function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function currentFileBaseName() {
  const theme = THEMES[currentThemeKey];
  const date = new Date().toISOString().slice(0, 10);
  return `fiche-${slugify(theme.title)}-${date}`;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function setStatus(message, kind) {
  els.statusBar.textContent = message;
  els.statusBar.className = `status-bar ${kind}`;
  els.statusBar.hidden = false;
}

function clearStatus() {
  els.statusBar.hidden = true;
}

// ---------- Aperçu du document ----------

// Jeton d'annulation : seule la dernière compilation demandée est affichée.
let previewToken = 0;
let previewTimeoutId = null;
let previewObjectUrl = null;

function setPreviewHint(message, isError) {
  els.previewHintText.textContent = message;
  els.previewHint.classList.toggle("error", !!isError);
  els.previewHint.hidden = false;
}

function showPreview(pdfBytes) {
  if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
  previewObjectUrl = URL.createObjectURL(
    new Blob([pdfBytes], { type: "application/pdf" })
  );
  els.previewFrame.src = previewObjectUrl;
  els.previewHint.hidden = true;
}

function updatePreview() {
  if (!currentSource) return;
  const token = ++previewToken;
  setPreviewHint(
    "Compilation de l'aperçu en cours… (premier lancement : téléchargement du moteur Typst, des polices et du package « zero », connexion internet requise)",
    false
  );
  compileTypstToPdf(currentSource)
    .then((pdfBytes) => {
      // Une génération plus récente a eu lieu entre-temps : on ignore.
      if (token !== previewToken) return;
      showPreview(pdfBytes);
    })
    .catch((err) => {
      if (token !== previewToken) return;
      console.error(err);
      setPreviewHint(
        `Aperçu indisponible : ${err.message || err}. ` +
          `Vous pouvez toujours télécharger le fichier .typ, ou cliquer sur « Actualiser l'aperçu » une fois la connexion rétablie.`,
        true
      );
    });
}

function schedulePreviewUpdate() {
  // Regroupe les regénérations rapprochées (changement de thème puis clic sur
  // « Générer », etc.) pour ne compiler qu'une fois la version finale.
  clearTimeout(previewTimeoutId);
  previewTimeoutId = setTimeout(updatePreview, 400);
}

// ---------- Actions ----------

els.generateBtn.addEventListener("click", generateSheet);

els.includeCorrection.addEventListener("change", () => {
  if (currentThemeKey) generateSheet();
});

els.paperSize.addEventListener("change", () => {
  if (currentThemeKey) generateSheet();
});

els.pageCount.addEventListener("change", () => {
  if (currentThemeKey) generateSheet();
});

els.downloadTypBtn.addEventListener("click", () => {
  const blob = new Blob([currentSource], { type: "text/plain;charset=utf-8" });
  downloadBlob(blob, `${currentFileBaseName()}.typ`);
});

els.copyBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(currentSource);
    setStatus("Code Typst copié dans le presse-papiers.", "success");
  } catch {
    setStatus("Impossible de copier automatiquement : sélectionnez le code manuellement.", "error");
  }
});

els.refreshPreviewBtn.addEventListener("click", () => {
  if (currentSource) updatePreview();
});


els.downloadPdfBtn.addEventListener("click", async () => {
  els.downloadPdfBtn.disabled = true;
  setStatus(
    "Compilation du PDF en cours… (premier lancement : téléchargement du moteur Typst, des polices et du package « zero », connexion internet requise)",
    "info"
  );
  try {
    const pdfBytes = await compileTypstToPdf(currentSource);
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    downloadBlob(blob, `${currentFileBaseName()}.pdf`);
    setStatus("PDF généré avec succès.", "success");
  } catch (err) {
    console.error(err);
    setStatus(
      `Échec de la génération du PDF : ${err.message || err}. ` +
        `Vous pouvez toujours télécharger le fichier .typ et le compiler avec « typst compile ».`,
      "error"
    );
  } finally {
    els.downloadPdfBtn.disabled = false;
  }
});

// ---------- Démarrage ----------

initParamsMemory();
renderThemeList();
selectTheme(Object.keys(THEMES)[0]);
