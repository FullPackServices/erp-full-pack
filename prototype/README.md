# Prototype : le parcours d'une commande en 10 étapes

Aperçu en ligne : https://claude.ai/artifact/EiMprqCxV6v7acasA7AvHt (privé)

Maquette interactive qui suit les 10 étapes du document « Notre processus de
fabrication », de la demande client au bilan de marge. Elle sert à valider
l'ergonomie avec l'atelier avant de construire ces écrans dans l'application
Next.js (lots 2, 4 et 6).

Elle a son propre stockage, séparé de la base PostgreSQL. Seules les
affectations des opérations (centre de travail, catégorie) en ressortent,
par l'export CSV vers `data/operations.csv`.

- `apercu-processus.html` : la source de la page publiée.
- `classement-operations.json` : le rangement des 36 opérations dans les
  6 catégories du document. `document` = l'opération ou son type y est cité ;
  `proposition` = déduit, à confirmer par le gérant ; `gerant` = saisi par lui.
  Les propositions non confirmées ne sont jamais exportées vers le CSV.
