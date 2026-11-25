# SaaS Full Pack Services

PME de coffrets et caisses bois sur mesure à Épernay, 4 à 5 opérateurs en atelier.
Fabrication à la commande : chaque commande a sa propre nomenclature.
Volume : 20 à 30 commandes par mois.

Objectif : réunir dans un seul outil le classeur Excel (nomenclature, débit,
temps, coût matière) et la partie production que l'ERP EBP ne couvre pas.

Contexte métier complet : @docs/cadrage-erp.md
Référence de calcul : docs/classeur-reference.xlsm
(feuilles Prototype, CALCUL BOIS, Composant, Type de Coupe, Mat Premiere)

## Stack

Next.js (App Router) + TypeScript, PostgreSQL, Prisma ORM 8.
Une seule application web : bureau, TV d'atelier et tablette.
Connexion atelier fiable, donc pas de mode hors ligne.

### Prisma 8, et non 7

Prisma ORM 8 a changé en profondeur. Ne pas écrire du Prisma 7 de mémoire :

- Le fichier s'appelle `contract.prisma`, pas `schema.prisma`, et sa premiere
  ligne doit etre `// use prisma-8`.
- Il ne contient plus de bloc `generator` ni `datasource` : la connexion et
  les chemins vivent dans `prisma.config.ts`.
- `@default(cuid())` est refuse, ecrire `@onCreate(cuid(2))`.
- `@updatedAt` devient `temporal.UpdatedAt`, et la date de creation
  `temporal.CreatedAt`, tous deux sans parenthèses.
- `Decimal @db.Decimal(10, 2)` devient `Decimal(precision: 10, scale: 2)`.
- Apres modification du contrat : `npx prisma contract emit`.
- L'application importe `@prisma/orm-postgres`.

Prisma 8 installe ses propres agent skills. En cas de doute sur la syntaxe,
les consulter plutôt que se fier à la mémoire : `npx prisma skills sync`.

## Architecture cible

Interface web unique, trois publics : direction, administration, atelier.

Six modules sur une base de données centralisée :

| Module          | Contenu                                                        |
| --------------- | -------------------------------------------------------------- |
| CRM & Clients   | clients, contacts, historique des affaires, devis, relances      |
| Commandes       | affaires, dimensions saisies, nomenclature calculée, BAT         |
| Production      | ordres de fabrication, gamme, pointage, vue TV atelier           |
| Planning        | charge par centre de travail, ordonnancement, dates de livraison |
| Stocks & Achats | matières, seuils, commandes fournisseurs, refendage sous-traité  |
| Coûts & KPI     | coût matière, coût main-d'œuvre, marge par commande, rebut       |

## Règles métier

- Jamais de catalogue de produits finis figé : la nomenclature se calcule
  à partir des dimensions saisies et du modèle produit.
- Les formules viennent du classeur. Toute règle de débit, de temps ou de
  coût cite en commentaire la feuille et la cellule d'origine.
- Le coût matière se calcule sur les panneaux achetés, nombre entier et
  gâche incluse, jamais sur la consommation théorique.
- Les quantités lancées valent la quantité commandée majorée de 5 %.
- Temps prévu d'une opération = temps de réglage (5 min par défaut, compté
  une seule fois par ordre de fabrication) + temps unitaire × quantité lancée.
  Une personne par poste. Référentiel : les 36 opérations de data/operations.csv.
- La gamme est saisie, jamais déduite : l'enchaînement des opérations et le
  centre de travail sont renseignés à la main sur le modèle produit, puis
  corrigeables affaire par affaire.
- EBP reste la source des articles et des prix. Le SaaS ne les saisit jamais
  à la main.
- Le pont EBP tient dans un seul module isolé. Aucun identifiant EBP ne sert
  de clé primaire : EBP doit pouvoir partir plus tard sans réécrire le reste.
- Toute table touchant les prix est inaccessible au rôle opérateur.

## Conventions

- Français pour les noms de modèles, de champs et d'interface. Le métier est
  en français, le code le reste aussi.
- Montants et dimensions en Decimal, jamais en Float.
- Dimensions en millimètres, temps en minutes, montants en euros HT.
- Un test par règle de calcul (matière, temps, marge) avant de passer au
  lot suivant. Une erreur de calcul se voit à la facture.

## Lots

1. Référentiels : pièces, 36 opérations, centres de travail, types de coupe,
   matières avec leur code EBP, clients.
2. Modèle produit : modèles par typologie, formules de dimensions, gamme.
3. Débit et coût matière : portage des formules de CALCUL BOIS.
4. Atelier : ordres de fabrication, vue TV, pointage tablette.
5. Pont EBP : articles et prix descendent, le chiffrage remonte.
6. Pilotage : marge par commande, temps réels contre prévus, rebut.

## Lot en cours

Lot 1 : référentiels. Contrat dans `prisma/contract.prisma`, seed dans
`prisma/seed.ts` depuis `data/operations.csv`.

Fait : contrat appliqué par migration, seed relançable des 36 opérations et
des paramètres, règle de temps portée et testée, écrans de consultation et de
saisie des référentiels (Next.js App Router, `src/app`).

Prochaine étape : charger les types de coupe et les matières, puis le modèle
produit du lot 2.

Ergonomie : le gérant raisonne commande par commande, à travers les 10 étapes
de son document de processus, pas par référentiel. La maquette de
`prototype/` (en cours de validation) fixe ce parcours ; les écrans des lots
2, 4 et 6 doivent le reprendre.

Planning : chronologie façon Notion (une barre par commande, couleur par
étape, glisser pour fixer une date de début). Capacité : 4 opérateurs ×
35 h par semaine, paramètres `nb_operateurs_atelier` et
`heures_semaine_operateur`.

Indicateurs : volet dédié (commercial, délais, production, qualité,
rentabilité), chaque carte dit son calcul et son objectif.

Logo : `prototype/logo-full-pack.png`, à utiliser partout (volet, accès,
documents). Couleurs du planning : par essence de bois, définies dans
`COULEURS_ESSENCE` (prototype/apercu-processus.html). Familles de coffrets :
13 références, dans `FAMILLES`.

Tableau de bord : maquette validée à relire avant intégration, dans
`prototype/maquette-tableau-de-bord.html`. Ses chiffres sont des exemples ;
l'intégration doit les calculer depuis les commandes, les pointages et le
planning. Les alertes « stocks insuffisants » restent non connectées tant que
le module Stocks n'existe pas.

Demandes d'évolution : l'Assistant de la maquette range les idées du gérant
dans la collection `demandes` de l'artefact
(https://claude.ai/artifact/EiMprqCxV6v7acasA7AvHt). Pour « traiter les
demandes » : les lire avec ArtifactData, les réaliser, passer leur `statut`
à `encours` puis `livree` et écrire un mot dans `reponse`.

La 3D des pièces a été retirée à la demande du gérant : l'étape 2 garde la
nomenclature, les opérations par pièce et le croquis coté des OF.

Plan d'atelier : la maquette porte une vue de dessus interactive des 16
machines, en SVG, à l'échelle. Une machine est un centre de travail, jamais
un second référentiel ; son statut « en production » se déduit des pointages
ouverts et ne se saisit pas. Architecture et modifications de contrat à
appliquer : `docs/plan-atelier.md`.

### Commandes

```
npm run dev                 # application sur http://localhost:3000
npm run seed                # recharge data/operations.csv, sans doublon
npm test                    # tests des règles de calcul
npm run typecheck
npx prisma contract emit    # après toute modification du contrat
npx prisma db update        # aligne la base de dev sur le contrat
```

### Qui possède quelle donnée

Ce partage est ce qui permet de relancer le seed sans rien perdre :

- Les temps et le nombre d'opérateurs viennent de `data/operations.csv`. Le
  seed les réécrit à chaque passage, donc l'écran Opérations les affiche en
  lecture seule : les modifier se fait dans le CSV puis `npm run seed`.
- Le centre de travail et la catégorie se saisissent dans l'application. Une
  cellule vide du CSV vaut « non renseigné », jamais « à effacer » : le seed
  ne les écrase pas.
- Les valeurs de paramètres appartiennent au gérant. Le seed crée les clés
  manquantes, remplit celles restées vides depuis la définition, et ne
  réécrit jamais une valeur saisie.
- Taux horaire atelier tranché : 32,50 € HT de l'heure et par salarié. Il
  multiplie les heures de main-d'œuvre, c'est-à-dire le temps prévu fois le
  nombre d'opérateurs du poste, et non le seul temps au poste.
- Les matières et les prix viennent d'EBP (lot 5). L'écran Matières est donc
  en consultation seulement : une saisie manuelle créerait une seconde vérité
  sur les prix.

## À trancher (bloquant selon le lot)

- Centre de travail de chaque opération : 34 des 36 sont proposées par
  déduction dans la maquette et attendent confirmation. Une proposition n'est
  pas exportée vers data/operations.csv. Restent sans réponse : le marquage
  laser (aucun laser à l'atelier), la cale carton (aucun poste de
  conditionnement), et la dégauchisseuse, qui ne reçoit aucune opération.
- Cotes réelles de l'atelier et implantation des machines : les positions de
  la maquette sont une proposition.
- Formules de dimensions du coffret à charnière (lot 2).
- Contrôle d'accès par rôle : la maquette n'a qu'un mot de passe partagé
  (empreinte SHA-256 salée, vérifiée dans le navigateur : un verrou d'usage,
  pas une sécurité). Les tables de prix doivent être fermées au rôle
  opérateur. Bloquant pour une mise en service en atelier.
