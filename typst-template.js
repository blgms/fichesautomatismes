/**
 * typst-template.js
 * -----------------
 * Assemble le code Typst final (en-tête de page, police, import du package
 * "zero", puis grille d'exercices et éventuellement corrigé).
 */

const ZERO_PACKAGE = "@preview/zero:0.7.0";

/**
 * @param {object} theme - un objet du registre THEMES (voir themes.js)
 * @param {object} generated - résultat de theme.generate(params)
 * @param {object} options - { includeCorrection: bool, paperSize: string }
 */
function buildTypstDocument(theme, generated, options) {
  const includeCorrection = !!options.includeCorrection;
  const paperSize = options.paperSize || "a5";

  const exercisesGrid = generated.exerciseBlocks.join(",\n  ");

  let correctionSection = "";
  if (includeCorrection) {
    const correctionGrid = generated.correctionBlocks.join(",\n  ");
    correctionSection = `
#pagebreak()
=== Corrigé -- ${theme.title}
#v(0.4cm)

#grid(
  columns: (1fr,)*${generated.columns},
  column-gutter: 1cm,
  row-gutter: 2em,
  ${correctionGrid}
)
`;
  }

  return `// Fiche générée automatiquement -- ${theme.title}
// Compilez avec "typst compile fiche.typ" ou via le bouton "Générer le PDF".

#set page(
  paper: "${paperSize}",
  margin: 1cm,
)
#set text(font: "DejaVu Sans", size: 10pt, lang: "fr")
#set par(leading: 1em, spacing: 1.25em)

// Le package "zero" permet de formater les nombres selon les conventions
// françaises (virgule décimale, espace pour les milliers) via #num(...).
#import "${ZERO_PACKAGE}": num, set-num
#set-num(decimal-separator: ",")

#grid(
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
${correctionSection}`;
}
