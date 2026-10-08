/**
 * typst-template.js
 * -----------------
 * Assemble le code Typst final (en-tête de page, police, import du package
 * "zero", puis grille d'exercices et éventuellement corrigé).
 *
 * Le paramètre `generated` accepte :
 *   - le résultat d'un seul theme.generate(params) -> document à une page ;
 *   - un tableau de résultats                  -> document multi-pages :
 *     chaque page comporte le même en-tête et les mêmes consignes que la
 *     première, seules les données d'exercices (et de corrigé) diffèrent.
 *     Si le corrigé est inclus, la page de corrigé est placée directement
 *     après la page d'exercices correspondante (Fiche 1, Corrigé 1, Fiche 2,
 *     Corrigé 2...) et numérotée à partir de 2 pages.
 * Avec un seul résultat (ou un tableau à 1 élément), la sortie est identique
 * à celle des versions précédentes du gabarit.
 */

const ZERO_PACKAGE = "@preview/zero:0.7.0";

/**
 * Préambule du document : page, police, package "zero".
 * @param {string} paperSize - "a5" ou "a4"
 */
function buildPreamble(paperSize) {
  return `#set page(
  paper: "${paperSize}",
  margin: 1cm,
)
#set text(font: "DejaVu Sans", size: 10pt, lang: "fr")
#set par(leading: 1em, spacing: 1.25em)

// Le package "zero" permet de formater les nombres selon les conventions
// françaises (virgule décimale, espace pour les milliers) via #num(...).
#import "${ZERO_PACKAGE}": num, set-num
#set-num(decimal-separator: ",")

`;
}

/**
 * Une page d'exercices : en-tête (icône, titre, cadre Nom/Prénom/Classe),
 * consignes, puis grille d'exercices. Le même en-tête est répété sur chaque
 * page ; seules les données d'exercices changent.
 * @param {object} theme - un objet du registre THEMES (voir themes.js)
 * @param {object} generated - un résultat de theme.generate(params)
 */
function buildExercisePage(theme, generated) {
  const exercisesGrid = generated.exerciseBlocks.join(",\n  ");

  return `#grid(
  columns: (1.4cm, 1fr, 4cm),
  gutter: 2mm,
  align: horizon,
  image("fast-track.png"),
  grid(
    row-gutter: 3mm,
    [=== Automatismes],
    [
      #set par(leading: .5em)
      == ${theme.title}
    ]
  ),
  rect(
    width: auto,
    radius: 2mm,
    stroke: (left: rgb("#666")),
    text(9pt)[
      Nom : #box(width: 1fr)[#repeat[.]] #linebreak()
      Prénom : #box(width: 1fr)[#repeat[.]] #linebreak()
      Classe : #box(width: 1fr)[#repeat[.]] #linebreak()
    ]
  )
  
)


#rect(
  width: 100%,
  radius: 2mm,
  stroke: rgb("#666"),
  [${generated.instructions}]
)

#v(0.5cm)

#grid(
  columns: (1fr,)*${generated.columns},
  column-gutter: 1cm,
  row-gutter: 2em,
  ${exercisesGrid}
)
`;
}

/**
 * La page de corrigé correspondant à une page d'exercices.
 * @param {object} theme - un objet du registre THEMES (voir themes.js)
 * @param {object} generated - le résultat de theme.generate(params) de la page
 * @param {number} index - index de la page (0 pour la première)
 * @param {number} total - nombre total de pages d'exercices
 */
function buildCorrectionPage(theme, generated, index, total) {
  const correctionGrid = generated.correctionBlocks.join(",\n  ");
  // À partir de 2 pages, les corrigés sont numérotés pour être appariables
  // aux fiches ; avec une seule page, l'en-tête reste inchangé.
  const heading = `Corrigé -- ${theme.title}`;
  // Le saut de page est précédé d'une ligne vide, comme dans le gabarit
  // d'origine (la page précédente se termine déjà par un retour à la ligne).
  const pageBreak = "\n#pagebreak()\n";

  return `${pageBreak}=== ${heading}
#v(0.4cm)

#grid(
  columns: (1fr,)*${generated.columns},
  column-gutter: 1cm,
  row-gutter: 2em,
  ${correctionGrid}
)
`;
}

/**
 * Assemble le document Typst complet : chaque page d'exercices, suivie de
 * son corrigé si l'option est activée.
 * @param {object} theme - un objet du registre THEMES (voir themes.js)
 * @param {object|object[]} generated - résultat(s) de theme.generate(params)
 * @param {object} options - { includeCorrection: bool, paperSize: string }
 */
function buildTypstDocument(theme, generated, options) {
  const includeCorrection = !!options.includeCorrection;
  const paperSize = options.paperSize || "a5";
  const pages = Array.isArray(generated) ? generated : [generated];

  // Chaque page d'exercices est suivie de sa page de corrigé (si demandée) ;
  // les pages sont séparées par un saut de page.
  const exercisePages = pages
    .map((page, index) => {
      const exercisePage = buildExercisePage(theme, page);
      return includeCorrection
        ? exercisePage + buildCorrectionPage(theme, page, index, pages.length)
        : exercisePage;
    })
    .join("#pagebreak()\n");

  return `// Fiche générée automatiquement -- ${theme.title}
// Compilez avec "typst compile fiche.typ" ou via le bouton "Générer le PDF".

${buildPreamble(paperSize)}${exercisePages}`;
}
