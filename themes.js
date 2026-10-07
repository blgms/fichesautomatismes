/**
 * themes.js
 * ---------
 * Registre des thèmes d'exercices disponibles dans le générateur.
 *
 * POUR AJOUTER UN NOUVEAU THÈME :
 * 1. Copiez un objet existant (ex. THEMES.multiplication) comme point de départ.
 * 2. Donnez-lui une clé unique (ex. "additions") et un "title".
 * 3. Décrivez ses paramètres dans "paramsForm" (voir les types disponibles ci-dessous).
 * 4. Écrivez la fonction "generate(params)" qui renvoie :
 *      {
 *        instructions: "texte affiché au-dessus des exercices",
 *        columns: nombre de colonnes de la grille,
 *        exerciseBlocks: ["contenu Typst d'un exercice", ...],
 *        correctionBlocks: ["contenu Typst de la correction correspondante", ...],
 *      }
 *    Chaque bloc doit être un morceau de code Typst valide, encadré par des
 *    crochets [...] (un "contenu" Typst), typiquement de la forme :
 *      [*1.* $2 times 3 = $ #box(width: 1.6cm, stroke: (bottom: 0.6pt))]
 * 5. Ajoutez l'objet à THEMES tout en bas de ce fichier.
 *
 * Astuce nombres : pour respecter les conventions françaises (virgule décimale,
 * espace comme séparateur de milliers), utilisez la fonction Typst
 * #num("3.45", decimal-separator: ",") fournie par le package "zero", plutôt
 * que d'écrire les nombres en clair. Elle est importée automatiquement dans
 * le document généré (voir typst-template.js).
 */

// ---------- Utilitaires aléatoires ----------

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(array) {
  return array[randInt(0, array.length - 1)];
}

function pgcd(a, b) {
  return b === 0 ? a : pgcd(b, a % b);
}

// Formate un nombre JS en chaîne décimale "propre" (pour être passée à #num()).
function toDecimalString(value, decimals) {
  return value.toFixed(decimals);
}

// ---------- Thème 1 : Tables de multiplication ----------

const multiplicationTheme = {
  title: "Calcul mental",
  description: "Multiplications à trous sur les tables choisies.",
  paramsForm: [
    { key: "tableMin", label: "Table minimale", type: "number", min: 1, max: 12, default: 2 },
    { key: "tableMax", label: "Table maximale", type: "number", min: 1, max: 12, default: 9 },
    { key: "factorMax", label: "Facteur maximal (× jusqu'à)", type: "number", min: 1, max: 12, default: 10 },
  ],
  generate(params) {
    const { tableMin, tableMax, factorMax } = params;
    const exerciseBlocks = [];
    const correctionBlocks = [];
    const seen = new Set();

    for (let i = 1; i <= 32; i++) {
      let a, b, key;
      let attempts = 0;
      do {
        a = randInt(Math.min(tableMin, tableMax), Math.max(tableMin, tableMax));
        b = randInt(1, Math.max(1, factorMax));
        key = `${a}x${b}`;
        attempts++;
      } while (seen.has(key) && attempts < 30);
      seen.add(key);

      exerciseBlocks.push(
        `[*${i})* $${a} times ${b} =$ #box(width: 1fr)[#repeat[.]]]`
      );
      correctionBlocks.push(`[*${i})* $${a} times ${b} = ${a * b}$]`);
    }
    const columns = 2 ;
    return {
      instructions: "*Complète* les multiplications suivantes.",
      columns,
      exerciseBlocks,
      correctionBlocks,
    };
  },
};

// ---------- Thème 2 : Comparaison de fractions ----------

const fractionsTheme = {
  title: "Fractions",
  description: "Comparer deux fractions à l'aide des symboles <, > ou =.",
  paramsForm: [
    { key: "maxDenominator", label: "Dénominateur maximal", type: "number", min: 2, max: 20, default: 10 },
    { key: "allowEqual", label: "Autoriser des fractions égales", type: "checkbox", default: true },
  ],
  generate(params) {
    const { maxDenominator, allowEqual } = params;
    const exerciseBlocks = [];
    const correctionBlocks = [];

    for (let i = 1; i <= 22; i++) {
      let d1 = randInt(2, maxDenominator);
      let d2 = randInt(2, maxDenominator);
      let n1 = randInt(1, d1 - 1 < 1 ? 1 : d1 - 1);
      let n2 = randInt(1, d2 - 1 < 1 ? 1 : d2 - 1);

      // Force parfois la même fraction si autorisé, pour varier les réponses "="
      if (allowEqual && Math.random() < 0.15) {
        const g = pgcd(n1, d1) || 1;
        const scale = randInt(1, 3);
        n2 = (n1 / g) * scale;
        d2 = (d1 / g) * scale;
      }

      const cross1 = n1 * d2;
      const cross2 = n2 * d1;
      const symbol = cross1 === cross2 ? "=" : cross1 > cross2 ? ">" : "<";

      exerciseBlocks.push(
        `[*${i})* #box[$ ${n1}/${d1} $] #box(width: 1cm)[#repeat[.]] #box[$ ${n2}/${d2} $]]`
      );
      correctionBlocks.push(`[*${i})* #box[$ ${n1}/${d1} ${symbol} ${n2}/${d2} $]]`);
    }
    const columns = 2 ;

    return {
      instructions: "*Compare* les fractions suivantes avec les symboles <, > ou =.",
      columns,
      exerciseBlocks,
      correctionBlocks,
    };
  },
};

// ---------- Thème 3 : Comparaison de nombres décimaux ----------

const decimauxTheme = {
  title: "Nombres",
  description: "Comparer deux nombres décimaux.",
  paramsForm: [
    { key: "maxInteger", label: "Partie entière maximale", type: "number", min: 0, max: 999, default: 20 },
    { key: "decimals", label: "Chiffres après la virgule", type: "number", min: 1, max: 2, default: 2 },
  ],
  generate(params) {
    const { maxInteger, decimals } = params;
    const exerciseBlocks = [];
    const correctionBlocks = [];

    for (let i = 1; i <= 30; i++) {
      const v1 = randInt(0, maxInteger) + randInt(0, Math.pow(10, decimals) - 1) / Math.pow(10, decimals);
      let v2 = randInt(0, maxInteger) + randInt(0, Math.pow(10, decimals) - 1) / Math.pow(10, decimals);

      // Évite deux nombres strictement identiques la plupart du temps
      if (Math.abs(v1 - v2) < 1e-9 && Math.random() < 0.8) {
        v2 = Math.max(0, v2 + (Math.random() < 0.5 ? 1 : -1) / Math.pow(10, decimals));
      }

      const s1 = toDecimalString(v1, decimals);
      const s2 = toDecimalString(v2, decimals);
      const symbol = v1 === v2 ? "=" : v1 > v2 ? ">" : "<";

      exerciseBlocks.push(
        `[*${i})* #num("${s1}") ` +
          `#box(width: 1cm)[#repeat[.]] ` +
          `#num("${s2}")]`
      );
      correctionBlocks.push(
        `[*${i})* #num("${s1}") $${symbol}$ #num("${s2}")]`
      );
    }
    const columns = 2 ;

    return {
      instructions: "*Comparer* les nombres décimaux suivants avec les symboles <, > ou =.",
      columns,
      exerciseBlocks,
      correctionBlocks,
    };
  },
};

// ---------- Thème 3 : Arrondis de nombres décimaux ----------

const arrondisTheme = {
  title: "Arrondis de nombres décimaux",
  description: "Arrondir des nombres décimaux (écriture à la française : virgule).",
  paramsForm: [
    { key: "negatives", label: "Autoriser nombres négatifs", type: "checkbox", default: true },
  ],
  generate(params) {
    const { negatives } = params;
    const exerciseBlocks = [];
    const correctionBlocks = [];
    const chiffresArray = ["au millième", "au centième", "au dixième", "à l'unité"];
    const nChiffre = randInt(0,3);
    const chiffre = chiffresArray[nChiffre];

    for (let i = 1; i <= 32; i++) {
      const sign = negatives == true ? randInt(0,1)*2-1 : 1 ;
      const v1root = sign * randInt(1, Math.pow(10, randInt(3,7))-1) ;
      const v1 = v1root / Math.pow(10, 4);

      const s1 = (Math.round(v1root / Math.pow(10,nChiffre+1)) / Math.pow(10, 3-nChiffre)).toFixed(3-nChiffre);

      exerciseBlocks.push(
        `[*${i})* $#num("${v1}") approx$ #box(width: 1fr)[#repeat[.]]] `
      );
      correctionBlocks.push(
        `[*${i})* $#num("${v1}") approx #num("${s1}", decimal-separator: ",")$]`
      );
    }
    const columns = 2 ;
    return {
      instructions: "*Arrondir* les nombres décimaux suivants "+chiffre+".",
      columns,
      exerciseBlocks,
      correctionBlocks,
    };
  },
};

// ---------- Registre exporté ----------

const THEMES = {
  multiplication: multiplicationTheme,
  fractions: fractionsTheme,
  decimaux: decimauxTheme,
  arrondis: arrondisTheme,
};
