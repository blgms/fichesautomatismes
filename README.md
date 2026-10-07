# Générateur de fiches d'exercices (Typst)

Site 100 % local (HTML/CSS/JS, aucune installation, aucun build) qui génère
des fiches d'exercices de mathématiques avec des données aléatoires, dans la
syntaxe **Typst**.

## Utilisation

1. Ouvrez `index.html` dans un navigateur (double-clic suffit).
2. Choisissez un thème dans le menu de gauche, ajustez les paramètres.
3. Cliquez sur **🎲 Générer une nouvelle fiche** pour tirer de nouvelles
   valeurs aléatoires (le code Typst s'affiche à droite).
4. Téléchargez :
   - **⬇️ Télécharger le .typ** : le fichier source Typst, toujours
     disponible, sans connexion internet.
   - **📄 Générer le PDF** : compile le document directement dans le
     navigateur et télécharge le PDF (voir ci-dessous).

## À propos de la génération de PDF dans le navigateur

Le bouton « Générer le PDF » utilise
[typst.ts](https://github.com/Myriad-Dreamin/typst.ts), une distribution de
Typst compilée en WebAssembly, chargée depuis le CDN jsDelivr au premier
clic. Cela permet de compiler le `.typ` en PDF **sans rien installer**, mais
nécessite une connexion internet la première fois pour télécharger :

- le moteur de compilation Typst (WASM),
- les 4 variantes de la police **DejaVu Sans** (regular/gras/italique),
- le package Typst **`@preview/zero`** utilisé pour l'écriture des nombres
  à la française (virgule décimale).

Une fois ces ressources en cache dans le navigateur, la génération suivante
est plus rapide et fonctionne hors-ligne.

### Solution de repli (sans navigateur / sans internet)

Si vous avez [Typst](https://typst.app) installé localement, téléchargez le
`.typ` puis compilez-le vous-même :

```bash
typst compile fiche-....typ fiche.pdf
```

## Structure du projet

```
index.html          Page et mise en page générale
style.css            Styles
themes.js            Registre des thèmes + génération aléatoire des exercices
typst-template.js    Assemblage du document Typst final (page A5, police, etc.)
pdf-export.js        Intégration typst.ts pour compiler en PDF dans le navigateur
app.js               Câblage de l'interface (formulaire, boutons, téléchargements)
```

## Ajouter un nouveau thème

Tout se passe dans `themes.js`. Un thème est un objet avec :

```js
const monTheme = {
  title: "Titre affiché",
  description: "Phrase courte affichée sous le titre",
  paramsForm: [
    { key: "count", label: "Nombre d'exercices", type: "number", min: 4, max: 40, default: 16 },
    // type: "number" ou "checkbox"
  ],
  generate(params) {
    // ... construire les tableaux exerciseBlocks / correctionBlocks ...
    return {
      instructions: "Texte affiché au-dessus des exercices.",
      columns: 2,
      exerciseBlocks,   // tableau de contenus Typst, ex: "[*1.* $2+3=$ ...]"
      correctionBlocks, // même longueur, avec les réponses
    };
  },
};
```

Puis ajoutez-le au registre en bas du fichier :

```js
const THEMES = {
  multiplication: multiplicationTheme,
  fractions: fractionsTheme,
  decimaux: decimauxTheme,
  monTheme: monTheme, // <-- nouveau thème
};
```

Il apparaîtra automatiquement dans le menu latéral, avec son formulaire de
paramètres généré dynamiquement.

### Écrire les nombres à la française

Pour tout nombre décimal (ou grand nombre nécessitant un séparateur de
milliers), utilisez la fonction `#num(...)` du package `zero`, déjà importée
dans le gabarit (`typst-template.js`) :

```typst
#num("1234.5", decimal-separator: ",")   // -> 1234,5
```

Pour de simples entiers courts (tables de multiplication, numérateurs de
fractions...), l'écriture directe (`$2 times 3$`) suffit : la convention
française ne s'applique qu'à la virgule décimale et aux séparateurs de
milliers.

## Thèmes fournis

- **Tables de multiplication** : multiplications à trous sur une plage de
  tables et de facteurs choisie.
- **Comparaison de fractions** : comparaison de deux fractions avec `<`, `>`
  ou `=`.
- **Comparaison de nombres décimaux** : comparaison de deux nombres
  décimaux, écrits avec la virgule française.
