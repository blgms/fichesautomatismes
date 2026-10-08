# Générateur de fiches d'exercices (Typst)

Site 100 % local (HTML/CSS/JS, aucune installation, aucun build) qui génère
des fiches d'exercices de mathématiques avec des données aléatoires, dans la
syntaxe **Typst**.

## Utilisation

1. Ouvrez `index.html` dans un navigateur (double-clic suffit).
   Gardez `fast-track.png` dans le même dossier (icône d'en-tête du gabarit).
2. Choisissez un thème dans le menu de gauche, ajustez les paramètres.
3. Cliquez sur **🎲 Générer une nouvelle fiche** pour tirer de nouvelles
   valeurs aléatoires (le code Typst s'affiche à droite).
4. Téléchargez :
   - **⬇️ Télécharger le .typ** : le fichier source Typst, toujours
     disponible, sans connexion internet (le compiler avec la CLI Typst
     exige que `fast-track.png` soit à côté du fichier, ou qu'on retire
     l'appel `image(...)` de l'en-tête).
   - **📄 Générer le PDF** : compile le document directement dans le
     navigateur et télécharge le PDF (voir ci-dessous).

## Générer plusieurs pages d'un coup

Dans la section **Mise en forme** du menu latéral, le champ **Nombre de
pages** (1 par défaut, maximum 10) génère plusieurs fiches pour le même
thème en un seul document :

- chaque page comporte le **même en-tête** (icône, titre, cadre
  Nom/Prénom/Classe) et les **mêmes consignes** que la première ;
- seules les **données des exercices** (et de leur corrigé) changent d'une
  page à l'autre ;
- avec l'option « Inclure le corrigé », chaque page de corrigé est placée
  **directement après sa page d'exercices** (Fiche 1, Corrigé 1, Fiche 2,
  Corrigé 2…) ; les corrigés sont numérotés (`Corrigé 1/3`, `Corrigé 2/3`…)
  à partir de 2 pages pour rester appariables aux fiches.

À 1 page, la sortie reste strictement identique à celle des versions
précédentes.

## À propos de la génération de PDF dans le navigateur

Le bouton « Générer le PDF » utilise
[typst.ts](https://github.com/Myriad-Dreamin/typst.ts), une distribution de
Typst compilée en WebAssembly, chargée depuis le CDN jsDelivr au premier
clic. Cela permet de compiler le `.typ` en PDF **sans rien installer**, mais
nécessite une connexion internet la première fois pour télécharger :

- le moteur de compilation Typst (WASM),
- les 4 variantes de la police **DejaVu Sans** (regular/gras/italique),
- le package Typst **`@preview/zero`** utilisé pour l'écriture des nombres
  à la française (virgule décimale), depuis packages.typst.org.

Une fois ces ressources en cache dans le navigateur, la génération suivante
est plus rapide et fonctionne hors-ligne.

### Notes techniques (pdf-export.js)

Trois points, gérés par `pdf-export.js`, sont nécessaires au bon
fonctionnement de la compilation dans le navigateur :

1. **Registre de packages explicite.** Typst.ts n'installe le registre de
   packages automatiquement que si aucun provider « access-model » n'est
   enregistré ; or le préchargement des polices DejaVu utilise justement
   cette clé. Sans le correctif, l'import `@preview/zero` du gabarit
   échoue avec « Dummy Registry, please initialize compiler with
   withPackageRegistry() ». Le registre est donc enregistré explicitement
   avant la première compilation.
2. **Icône d'en-tête.** Le gabarit référence `image("fast-track.png")`, mais
   le compilateur WASM ne voit que le source qui lui est envoyé. L'icône
   est donc embarquée en base64 dans `pdf-export.js` et injectée dans le
   système de fichiers virtuel du compilateur avant chaque compilation.
3. **Versions CDN épinglées** (typst.ts 0.7.0) : jsDelivr sert sinon la
   dernière version publiée, dont l'API peut changer et casser la
   compilation. Pour mettre à jour : changer `TYPST_TS_VERSION`, puis
   re-tester la génération PDF.

### Solution de repli (sans navigateur / sans internet)

Si vous avez [Typst](https://typst.app) installé localement, téléchargez le
`.typ` puis compilez-le vous-même :

```bash
typst compile fiche-....typ fiche.pdf
```

## Structure du projet


```
index.html          Page et mise en page générale
style.css           Styles
themes.js           Registre des thèmes + génération aléatoire des exercices
typst-template.js   Assemblage du document Typst final (page A5, police, etc.)
pdf-export.js       Intégration typst.ts pour compiler en PDF dans le navigateur
app.js              Câblage de l'interface (formulaire, boutons, téléchargements)
fast-track.png      Icône d'en-tête du gabarit (référencée par le .typ généré)
```

## Ajouter un nouveau thème

Tout se passe dans `themes.js`. Un thème est un objet avec :

```js
const monTheme = {
  title: "Titre affiché",
  description: "Phrase courte affichée sous le titre",
  paramsForm: [
    { key: "count", label: "Nombre d'exercices", type: "number", min: 4, max: 40, default: 16 },
    { key: "flag", label: "Option oui/non", type: "checkbox", default: true },
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
  // ... thèmes existants ...
  monTheme: monTheme, // <-- nouveau thème
};
```

Il apparaîtra automatiquement dans le menu latéral, avec son formulaire de
paramètres généré dynamiquement.

### Règles Typst pour que la compilation réussisse

- La fonction `#num("...")` du package `zero` attend un nombre avec un
  **point** décimal (`"3.45"`, jamais `"3,45"`) : c'est elle qui affiche la
  virgule française (via `#set-num` dans le gabarit).
- `box()` n'accepte pas de paramètre `stroke` : pour une case réponse,
  utiliser `#box(width: 1cm)[#repeat[.]]`.

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

- **Calcul mental** : multiplications à trous sur une plage de tables et de
  facteurs choisie.
- **Fractions** : comparaison de deux fractions avec `<`, `>` ou `=`.
- **Nombres** : comparaison de deux nombres décimaux, écrits avec la
  virgule française.
- **Arrondis de nombres décimaux** : arrondir au millième, au centième, au
  dixième ou à l'unité.
- **Additions** : additions directes et à trous (a + ⬜ = c).
- **Soustractions** : soustractions et compléments (a − ⬜ = c).
- **Conversions d'unités** : longueurs, masses et capacités (familles
  activables par cases à cocher).
- **Pourcentages** : calculer x % d'une quantité (résultats entiers).
- **Aires et périmètres** : rectangle, carré, disque (pi ≈ 3,14, optionnel).
- **Puissances de 10** : notation scientifique et produits de puissances.
- **Vitesse moyenne** : calculer v, d ou t avec la relation v = d/t, dans
  des contextes professionnels (livraison, chantier, transport...).

Les nouveaux thèmes acceptent un paramètre « Nombre d'exercices » ; ceux à
énoncé long (aires, vitesse) s'affichent sur une colonne, les calculs
courts sur deux colonnes.
