/**
 * pdf-export.js
 * -------------
 * Compile du code Typst en PDF directement dans le navigateur, grâce à la
 * bibliothèque "typst.ts" (compilateur Typst en WebAssembly), chargée depuis
 * un CDN (jsDelivr) au premier clic sur "Générer le PDF".
 *
 * IMPORTANT : cette étape nécessite une connexion internet la première fois
 * (téléchargement du moteur WASM ~10 Mo, des polices DejaVu Sans, et du
 * package Typst "zero"). Le site lui-même reste 100% local ; seule la
 * compilation PDF va chercher ces ressources externes.
 *
 * Si vous préférez ne pas dépendre du réseau, téléchargez le fichier .typ
 * (bouton dédié) et compilez-le localement avec la CLI Typst :
 *     typst compile fiche.typ fiche.pdf
 */

const TYPST_JS_BASE = "https://cdn.jsdelivr.net/npm/@myriaddreamin/typst.ts";
const WEB_COMPILER_WASM =
  "https://cdn.jsdelivr.net/npm/@myriaddreamin/typst-ts-web-compiler/pkg/typst_ts_web_compiler_bg.wasm";
const RENDERER_WASM =
  "https://cdn.jsdelivr.net/npm/@myriaddreamin/typst-ts-renderer/pkg/typst_ts_renderer_bg.wasm";

// DejaVu Sans (régulier / gras / italique / gras-italique), servi depuis npm via jsDelivr.
const DEJAVU_BASE = "https://cdn.jsdelivr.net/npm/dejavu-fonts-ttf@2.37/ttf";
const DEJAVU_FONTS = [
  `${DEJAVU_BASE}/DejaVuSans.ttf`,
  `${DEJAVU_BASE}/DejaVuSans-Bold.ttf`,
  `${DEJAVU_BASE}/DejaVuSans-Oblique.ttf`,
  `${DEJAVU_BASE}/DejaVuSans-BoldOblique.ttf`,
];

let typstReadyPromise = null;

function injectModuleScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.type = "module";
    script.src = src;
    script.addEventListener("load", () => resolve());
    script.addEventListener("error", () =>
      reject(new Error(`Impossible de charger ${src} (vérifiez votre connexion internet).`))
    );
    document.head.appendChild(script);
  });
}

async function loadTypstRuntime() {
  if (typstReadyPromise) return typstReadyPromise;

  typstReadyPromise = (async () => {
    await injectModuleScript(`${TYPST_JS_BASE}/dist/esm/contrib/all-in-one-lite.bundle.js`);

    const $typst = window.$typst;
    if (!$typst) {
      throw new Error("Le moteur Typst ne s'est pas initialisé correctement.");
    }

    $typst.setCompilerInitOptions({ getModule: () => WEB_COMPILER_WASM });
    $typst.setRendererInitOptions({ getModule: () => RENDERER_WASM });

    const TypstSnippet = $typst.constructor;
    $typst.use(...DEJAVU_FONTS.map((url) => TypstSnippet.preloadFontFromUrl(url)));

    return $typst;
  })().catch((err) => {
    // En cas d'échec, on autorise un nouvel essai au prochain appel.
    typstReadyPromise = null;
    throw err;
  });

  return typstReadyPromise;
}

/**
 * Compile le code Typst fourni et renvoie les octets du PDF (Uint8Array).
 */
async function compileTypstToPdf(source) {
  const $typst = await loadTypstRuntime();
  return await $typst.pdf({ mainContent: source });
}
