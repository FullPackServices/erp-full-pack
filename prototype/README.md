# Prototype : le parcours d'une commande en 10 étapes

Aperçu en ligne : https://claude.ai/artifact/EiMprqCxV6v7acasA7AvHt (privé)

Maquette interactive qui suit les 10 étapes du document « Notre processus de
fabrication », de la demande client au bilan de marge. Elle sert à valider
l'ergonomie avec l'atelier avant de construire ces écrans dans l'application
Next.js (lots 2, 4 et 6).

Écrans : tableau de bord, commandes, planning, atelier, réglages, dans un
volet de navigation à gauche. L'atelier a deux onglets : le plan interactif
des machines et la liste des ordres de fabrication. Une commande suit les 10 étapes ; à l'étape 2,
le coffret est dessiné en 3D à ses dimensions, on y ajoute les pièces
(dessus, dessous, côtés, fonds, berceaux, tasseaux, cales, charnières…),
puis on choisit pièce par pièce les opérations et leur nombre de passages.
Le lancement (étape 4) génère un ordre de fabrication par pièce, pointé à
l'atelier.

Règles de calcul reprises, à porter avec leurs tests dans l'application :

- quantité lancée = quantité commandée majorée de 5 %, arrondie au-dessus ;
- pièces à produire = quantité lancée × nombre de pièces par coffret ;
- temps prévu d'une opération = réglage (une fois par OF) + temps unitaire
  × pièces à produire × passages ;
- main-d'œuvre = temps prévu × nombre d'opérateurs du poste × taux horaire.

Ce qui reste une proposition, à valider :

- les dimensions des pièces standard sont calculées en assemblage bout à
  bout (dessus et dessous pleine taille, côtés et fonds logés entre eux) ;
  les vraies formules viennent du classeur (lot 2) ;
- le coût matière se saisit à la main : le calcul sur panneaux achetés,
  gâche incluse, arrive avec le portage de CALCUL BOIS (lot 3) ;
- la capacité du planning prend 4 opérateurs à 35 h par semaine tant que
  les opérateurs et les heures ne sont pas saisis.

Le plan de l'atelier est une vue de dessus en SVG, à l'échelle, en
centimètres : zoom, déplacement, clic sur une machine, déplacement des
machines en mode administration, flux déduits des gammes. Il n'ajoute aux
données que l'implantation ; tout le reste se déduit des ordres de
fabrication et des pointages. Voir `docs/plan-atelier.md`.

La 3D utilise three.js r128, chargé depuis cdn.jsdelivr.net. Le plan, lui,
ne dépend d'aucune bibliothèque. Sans réseau, la nomenclature reste
utilisable sans le dessin 3D.

Elle a son propre stockage, séparé de la base PostgreSQL. Seules les
affectations des opérations (centre de travail, catégorie) en ressortent,
par l'export CSV vers `data/operations.csv`.

- `apercu-processus.html` : la source de la page publiée.
- `classement-operations.json` : le rangement des 36 opérations dans les
  6 catégories du document. `document` = l'opération ou son type y est cité ;
  `proposition` = déduit, à confirmer par le gérant ; `gerant` = saisi par lui.
  Les propositions non confirmées ne sont jamais exportées vers le CSV.
