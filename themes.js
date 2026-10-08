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
 *      [*1.* $2 times 3 = $ #box(width: 1.6cm)[#repeat[.]]]
 * 5. Ajoutez l'objet à THEMES tout en bas de ce fichier.
 *
 * Astuce nombres : pour respecter les conventions françaises (virgule décimale,
 * espace comme séparateur de milliers), utilisez la fonction Typst
 * #num("3.45", decimal-separator: ",") fournie par le package "zero", plutôt
 * que d'écrire les nombres en clair. Elle est importée automatiquement dans
 * le document généré (voir typst-template.js).
 *
 * RÈGLES À RESPECTER (sinon la compilation échoue) :
 * - La fonction #num("...") attend un nombre avec un POINT décimal
 *   ("3.45", jamais "3,45") : c'est elle qui affiche la virgule française
 *   (via #set-num dans typst-template.js).
 * - box() n'accepte pas de paramètre stroke : pour une case réponse, utilisez
 *   #box(width: 1cm)[#repeat[.]].
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

// true si une case à cocher est cochée (gère true / "true" / 1 / "1").
function isChecked(v) {
  return v === true || v === "true" || v === 1 || v === "1";
}

// Heure "propre" pour #num() : 0.5 -> "0.5", 1 -> "1", 1.5 -> "1.5".
function hourString(h) {
  return h.toFixed(2).replace(/\.?0+$/, "");
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

// ---------- Thème 5 : Additions à trous ----------

const additionsTheme = {
  title: "Additions",
  description: "Additions directes et à trous (a + ? = c).",
  paramsForm: [
    { key: "maxTerm", label: "Terme maximal", type: "number", min: 5, max: 100, default: 20 },
    { key: "count", label: "Nombre d'exercices", type: "number", min: 4, max: 40, default: 24 },
  ],
  generate(params) {
    const { maxTerm, count } = params;
    const exerciseBlocks = [];
    const correctionBlocks = [];

    for (let i = 1; i <= count; i++) {
      const a = randInt(2, maxTerm);
      const b = randInt(2, maxTerm);
      if (i % 2 === 1) {
        // Addition directe
        exerciseBlocks.push(
          `[*${i})* $${a} + ${b} =$ #box(width: 1fr)[#repeat[.]]]`
        );
        correctionBlocks.push(`[*${i})* $${a} + ${b} = ${a + b}$]`);
      } else {
        // Addition à trou : a + ? = c
        exerciseBlocks.push(
          `[*${i})* $${a} +$ #box(width: 0.8cm)[#repeat[.]] $= ${a + b}$]`
        );
        correctionBlocks.push(`[*${i})* $${a} + ${b} = ${a + b}$]`);
      }
    }
    const columns = 2 ;
    return {
      instructions: "*Complète* les additions suivantes.",
      columns,
      exerciseBlocks,
      correctionBlocks,
    };
  },
};

// ---------- Thème 6 : Soustractions à trous ----------

const soustractionsTheme = {
  title: "Soustractions",
  description: "Soustractions et compléments (a − ? = c).",
  paramsForm: [
    { key: "maxTerm", label: "Terme maximal", type: "number", min: 5, max: 100, default: 20 },
    { key: "count", label: "Nombre d'exercices", type: "number", min: 4, max: 40, default: 24 },
  ],
  generate(params) {
    const { maxTerm, count } = params;
    const exerciseBlocks = [];
    const correctionBlocks = [];

    for (let i = 1; i <= count; i++) {
      const a = randInt(5, maxTerm);
      const b = randInt(2, a - 1);
      if (i % 2 === 1) {
        exerciseBlocks.push(
          `[*${i})* $${a} - ${b} =$ #box(width: 1fr)[#repeat[.]]]`
        );
        correctionBlocks.push(`[*${i})* $${a} - ${b} = ${a - b}$]`);
      } else {
        // Complément : a − ? = c
        exerciseBlocks.push(
          `[*${i})* $${a} -$ #box(width: 0.8cm)[#repeat[.]] $= ${a - b}$]`
        );
        correctionBlocks.push(`[*${i})* $${a} - ${b} = ${a - b}$]`);
      }
    }
    const columns = 2 ;
    return {
      instructions: "*Complète* les soustractions suivantes.",
      columns,
      exerciseBlocks,
      correctionBlocks,
    };
  },
};

// ---------- Thème 7 : Conversions d'unités ----------

const conversionsTheme = {
  title: "Conversions d'unités",
  description: "Convertir des longueurs, masses et capacités.",
  paramsForm: [
    { key: "count", label: "Nombre d'exercices", type: "number", min: 4, max: 40, default: 24 },
    { key: "lengths", label: "Longueurs (km, m, cm, mm)", type: "checkbox", default: true },
    { key: "masses", label: "Masses (t, kg, g, mg)", type: "checkbox", default: true },
    { key: "capacities", label: "Capacités (hL, L, cL, mL)", type: "checkbox", default: true },
  ],
  generate(params) {
    const { count, lengths, masses, capacities } = params;
    const families = [];
    if (isChecked(lengths)) families.push("longueur");
    if (isChecked(masses)) families.push("masse");
    if (isChecked(capacities)) families.push("capacite");
    if (families.length === 0) families.push("longueur");

    // unité -> exposant relatif à l'unité de base de la famille
    const UNITS = {
      longueur: [["km", 3], ["m", 0], ["cm", -2], ["mm", -3]],
      masse: [["t", 3], ["kg", 0], ["g", -3], ["mg", -6]],
      capacite: [["hL", 2], ["L", 0], ["cL", -2], ["mL", -3]],
    };

    const exerciseBlocks = [];
    const correctionBlocks = [];

    for (let i = 1; i <= count; i++) {
      const fam = pick(families);
      const units = UNITS[fam];
      const [uFrom, pFrom] = pick(units);
      // cible : au maximum 3 rangs d'écart, jamais la même unité
      const candidates = units.filter(
        (u) => u[0] !== uFrom && Math.abs(u[1] - pFrom) <= 3
      );
      const [uTo, pTo] = pick(candidates);

      // valeur de 1 à 999,9 (au plus 1 décimale)
      const value = randInt(10, 9999) / 10;
      const sValue = toDecimalString(value, 1);
      const exponent = pFrom - pTo;
      const result = value * Math.pow(10, exponent);
      const sResult = toDecimalString(result, Math.max(0, 4 + Math.min(0, exponent)));

      exerciseBlocks.push(
        `[*${i})* #num("${sValue}") $"${uFrom}"$ = ` +
          `#box(width: 1.3cm)[#repeat[.]] $"${uTo}"$]`
      );
      correctionBlocks.push(
        `[*${i})* #num("${sValue}") $"${uFrom}"$ = #num("${sResult}") $"${uTo}"$]`
      );
    }
    const columns = 2 ;
    return {
      instructions: "*Convertis* les mesures suivantes (utilise le tableau de conversion si besoin).",
      columns,
      exerciseBlocks,
      correctionBlocks,
    };
  },
};

// ---------- Thème 8 : Pourcentages ----------

const pourcentagesTheme = {
  title: "Pourcentages",
  description: "Calculer mentalement un pourcentage d'une quantité.",
  paramsForm: [
    { key: "maxBase", label: "Quantité maximale", type: "number", min: 20, max: 1000, default: 200 },
    { key: "count", label: "Nombre d'exercices", type: "number", min: 4, max: 40, default: 20 },
  ],
  generate(params) {
    const { maxBase, count } = params;
    const exerciseBlocks = [];
    const correctionBlocks = [];
    const percents = [5, 10, 20, 25, 50, 75, 100];

    for (let i = 1; i <= count; i++) {
      const p = pick(percents);
      // base multiple de 20 pour garantir un résultat entier
      const base = randInt(1, Math.max(1, Math.floor(maxBase / 20))) * 20;
      const result = (base * p) / 100;

      exerciseBlocks.push(
        `[*${i})* $${p} %$ de #num("${base}") $=$ #box(width: 1fr)[#repeat[.]]]`
      );
      correctionBlocks.push(
        `[*${i})* $${p} %$ de #num("${base}") $= #num("${result}")$]`
      );
    }
    const columns = 2 ;
    return {
      instructions: "*Calcule* les pourcentages suivants.",
      columns,
      exerciseBlocks,
      correctionBlocks,
    };
  },
};

// ---------- Thème 9 : Aires et périmètres ----------

const airesTheme = {
  title: "Aires et périmètres",
  description: "Calculer l'aire et le périmètre de figures usuelles.",
  paramsForm: [
    { key: "count", label: "Nombre d'exercices", type: "number", min: 4, max: 40, default: 12 },
    { key: "allowCircle", label: "Inclure le disque (pi ≈ 3,14)", type: "checkbox", default: false },
  ],
  generate(params) {
    const { count, allowCircle } = params;
    const exerciseBlocks = [];
    const correctionBlocks = [];

    for (let i = 1; i <= count; i++) {
      const kind = isChecked(allowCircle) && i % 3 === 0 ? "disque" : pick(["rectangle", "carre"]);
      if (kind === "rectangle") {
        const L = randInt(3, 15);
        const l = randInt(2, L - 1);
        exerciseBlocks.push(
          `[*${i})* Rectangle : longueur ${L} "cm", largeur ${l} "cm".` +
            ` Aire $=$ #box(width: 1.3cm)[#repeat[.]] "cm"^2` +
            ` ; périmètre $=$ #box(width: 1.3cm)[#repeat[.]] "cm"]`
        );
        correctionBlocks.push(
          `[*${i})* Rectangle ${L} "cm" × ${l} "cm" : aire $= ${L * l} "cm"^2$, périmètre $= ${2 * (L + l)} "cm"$]`
        );
      } else if (kind === "carre") {
        const c = randInt(2, 15);
        exerciseBlocks.push(
          `[*${i})* Carré : côté ${c} "cm".` +
            ` Aire $=$ #box(width: 1.3cm)[#repeat[.]] "cm"^2` +
            ` ; périmètre $=$ #box(width: 1.3cm)[#repeat[.]] "cm"]`
        );
        correctionBlocks.push(
          `[*${i})* Carré de côté ${c} "cm" : aire $= ${c * c} "cm"^2$, périmètre $= ${4 * c} "cm"$]`
        );
      } else {
        const r = randInt(1, 9);
        const aire = 3.14 * r * r;
        const perim = 2 * 3.14 * r;
        exerciseBlocks.push(
          `[*${i})* Disque : rayon ${r} "cm" (pi $approx 3,14$).` +
            ` Aire $=$ #box(width: 1.3cm)[#repeat[.]] "cm"^2` +
            ` ; périmètre $=$ #box(width: 1.3cm)[#repeat[.]] "cm"]`
        );
        correctionBlocks.push(
          `[*${i})* Disque de rayon ${r} "cm" : aire $approx #num("${aire.toFixed(2)}") "cm"^2$, périmètre $approx #num("${perim.toFixed(2)}") "cm"$]`
        );
      }
    }
    const columns = 1 ;
    return {
      instructions: "*Calcule* l'aire et le périmètre de chaque figure (unité : le centimètre).",
      columns,
      exerciseBlocks,
      correctionBlocks,
    };
  },
};

// ---------- Thème 10 : Puissances de 10 et notation scientifique ----------

const puissancesTheme = {
  title: "Puissances de 10",
  description: "Notation scientifique et calculs de puissances de 10.",
  paramsForm: [
    { key: "maxExponent", label: "Exposant maximal", type: "number", min: 2, max: 9, default: 6 },
    { key: "count", label: "Nombre d'exercices", type: "number", min: 4, max: 40, default: 20 },
  ],
  generate(params) {
    const { maxExponent, count } = params;
    const exerciseBlocks = [];
    const correctionBlocks = [];

    for (let i = 1; i <= count; i++) {
      if (i % 2 === 1) {
        // Notation scientifique
        const n = randInt(11, 99) / 10; // 1,1 à 9,9
        const e = randInt(1, maxExponent);
        const digits = Math.round(n * Math.pow(10, e)).toString();
        exerciseBlocks.push(
          `[*${i})* #num("${digits}") $=$ #box(width: 2cm)[#repeat[.]]]`
        );
        correctionBlocks.push(
          `[*${i})* #num("${digits}") $= #num("${n.toFixed(1)}") times 10^${e}$]`
        );
      } else {
        // Produit de puissances de 10
        const e1 = randInt(1, maxExponent);
        const e2 = randInt(1, maxExponent);
        exerciseBlocks.push(
          `[*${i})* $10^${e1} times 10^${e2} =$ #box(width: 1fr)[#repeat[.]]]`
        );
        correctionBlocks.push(
          `[*${i})* $10^${e1} times 10^${e2} = 10^${e1 + e2}$]`
        );
      }
    }
    const columns = 2 ;
    return {
      instructions: "*Écris* en notation scientifique et *calcule* les produits de puissances de 10.",
      columns,
      exerciseBlocks,
      correctionBlocks,
    };
  },
};

// ---------- Thème 11 : Vitesse moyenne (v = d / t) ----------

const vitesseTheme = {
  title: "Vitesse moyenne",
  description: "Calculer une vitesse, une distance ou une durée (v = d / t).",
  paramsForm: [
    { key: "count", label: "Nombre d'exercices", type: "number", min: 4, max: 40, default: 12 },
    { key: "askDistance", label: "Inclure des questions « distance »", type: "checkbox", default: true },
    { key: "askTime", label: "Inclure des questions « durée »", type: "checkbox", default: true },
  ],
  generate(params) {
    const { count, askDistance, askTime } = params;
    const contexts = [
      "un scooter",
      "une camionnette de livraison",
      "un TGV",
      "un tracteur",
      "un engin de chantier",
      "un car de transport scolaire",
      "un chariot élévateur",
    ];
    // Durées propres (valeur en heures + étiquette affichée)
    const durations = [
      { h: 0.5, label: "30 min" },
      { h: 0.75, label: "45 min" },
      { h: 1, label: "1 h" },
      { h: 1.5, label: "1,5 h" },
      { h: 2, label: "2 h" },
      { h: 3, label: "3 h" },
    ];
    const exerciseBlocks = [];
    const correctionBlocks = [];

    for (let i = 1; i <= count; i++) {
      const vehicule = pick(contexts);
      const v = randInt(10, 110); // vitesse entière en km/h
      const d = pick(durations);
      const distance = v * d.h; // km, au plus 1 décimale
      const sDist = toDecimalString(distance, 1);
      const sH = hourString(d.h);

      const modes = ["vitesse"];
      if (isChecked(askDistance)) modes.push("distance");
      if (isChecked(askTime)) modes.push("duree");
      const mode = pick(modes);

      if (mode === "vitesse") {
        exerciseBlocks.push(
          `[*${i})* ${vehicule} parcourt #num("${sDist}") "km" en ${d.label}. ` +
            `Vitesse moyenne $=$ #box(width: 1.4cm)[#repeat[.]] "km/h"]`
        );
        correctionBlocks.push(
          `[*${i})* $v = d\/t = #num("${sDist}") \/ #num("${sH}") = ${v}$ "km/h"]`
        );
      } else if (mode === "distance") {
        exerciseBlocks.push(
          `[*${i})* ${vehicule} roule à la vitesse moyenne de ${v} "km/h" pendant ${d.label}. ` +
            `Distance parcourue $=$ #box(width: 1.4cm)[#repeat[.]] "km"]`
        );
        correctionBlocks.push(
          `[*${i})* $d = v times t = ${v} times #num("${sH}") = #num("${sDist}")$ "km"]`
        );
      } else {
        exerciseBlocks.push(
          `[*${i})* ${vehicule} parcourt #num("${sDist}") "km" à la vitesse moyenne de ${v} "km/h". ` +
            `Durée du trajet $=$ #box(width: 1.4cm)[#repeat[.]]]`
        );
        correctionBlocks.push(
          `[*${i})* $t = d\/v = #num("${sDist}") \/ ${v} = #num("${sH}")$ h, soit ${d.label}]`
        );
      }
    }
    const columns = 1 ;
    return {
      instructions: "*Calcule* en utilisant la relation $v = d\/t$ (conversions utiles : 0,5 h $=$ 30 min ; 0,75 h $=$ 45 min).",
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
  additions: additionsTheme,
  soustractions: soustractionsTheme,
  conversions: conversionsTheme,
  pourcentages: pourcentagesTheme,
  aires: airesTheme,
  puissances: puissancesTheme,
  vitesse: vitesseTheme,
};
