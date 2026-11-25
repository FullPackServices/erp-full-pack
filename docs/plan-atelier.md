# Plan interactif de l'atelier

Note d'architecture, rédigée avant développement et mise à jour après la
première version. Elle répond à la demande : ouvrir la Production, voir
l'atelier en vue de dessus, cliquer une machine et savoir immédiatement ce
qu'elle produit, pour quelle commande, et où elle en est.

## 1. Ce qui existe aujourd'hui

Trois endroits portent des données, et un seul est dans PostgreSQL.

| Où | Contenu | État |
| --- | --- | --- |
| PostgreSQL, `prisma/contract.prisma` | CentreTravail, Operation, Piece, Typologie, FamilleProduit, Essence, Matiere, TypeCoupe, Client, Parametre | Lot 1 appliqué |
| Stockage du prototype, `prototype/apercu-processus.html` | commandes, pièces, gammes, pointages, centres, opérateurs, types de coupe, paramètres | La vie réelle de la production est ici |
| EBP | articles, prix, stocks | Pas encore connecté, lot 5 |

Conséquences, à dire franchement :

- **Il n'existe pas de module Production dans la base.** Aucun modèle
  `Commande`, `OrdreFabrication` ni `Pointage` dans le contrat. Les ordres de
  fabrication vivent dans le prototype, où ils se déduisent des pièces et de
  leurs opérations ; ils ne sont stockés nulle part comme tels.
- **Il n'existe pas de module Stocks.** `Matiere` porte un prix et des
  dimensions, jamais une quantité. Rien, ni dans la base ni dans le
  prototype, ne sait ce qui est en stock.
- **La machine existe déjà** : c'est `CentreTravail`, que chaque `Operation`
  désigne par `centreTravailId`. Il ne faut donc surtout pas créer un second
  référentiel de machines.

Le plan a donc été construit dans le prototype, là où sont les ordres de
fabrication. Le jour où les commandes descendent dans PostgreSQL (lot 4), le
plan ne change pas : seule sa source de données change.

## 2. Architecture retenue

Trois couches. Une seule ajoute des données.

### Couche 1 — Implantation (nouvelle, minuscule)

La seule chose que le plan ajoute au système : **où se trouve chaque
machine**. Des coordonnées en centimètres, dans le repère de l'atelier, coin
haut-gauche en (0, 0). Le plan est donc à l'échelle et imprimable.

### Couche 2 — Projection (dérivée, rien de stocké)

Une fonction pure qui, à partir des commandes, des pièces, des opérations et
des pointages, répond pour chaque machine : statut, ordre de fabrication en
cours, client, produit, essence, quantités, avancement, opérateur, prochaine
étape, file d'attente, charge prévue.

Règle qui évite le système parallèle : **le statut se déduit d'abord.** Un
pointage ouvert sur une opération de cette machine vaut « en production », et
rien ne peut l'écraser. Le statut saisi à la main (à l'arrêt, en maintenance)
ne décrit qu'une machine sans pointage en cours. Personne ne « démarre une
machine » sur le plan : on démarre une opération, comme aujourd'hui.

La charge prévue affichée dans la fiche est celle du planning, calculée par
la même fonction : les deux écrans ne peuvent pas se contredire.

Les flux entre machines se déduisent des gammes : deux opérations qui se
suivent sur une pièce tracent un trajet entre leurs deux machines, pondéré
par le nombre de pièces. Aucune table de flux.

### Couche 3 — Vue SVG

Un seul `<svg>` dont le `viewBox` est exprimé en centimètres d'atelier. Le
zoom et le déplacement ne font que modifier ce `viewBox` : pas de
bibliothèque, pas de canevas, pas de 3D. Chaque machine est un groupe
focalisable au clavier, avec son nom accessible. Le dessin reste net à toute
échelle et s'imprime.

Les grandes surfaces (espace d'assemblage, cabine de peinture) sont dessinées
en premier : une petite machine posée dessus reste visible et cliquable.

## 3. Données nécessaires

### Sur le centre de travail, en plus de ce qu'il porte déjà

| Champ | Rôle |
| --- | --- |
| `zone` | Usinage et préparation du bois, ou Finition et assemblage |
| `xCm`, `yCm` | Coin haut-gauche dans le repère de l'atelier |
| `largeurCm`, `profondeurCm` | Encombrement au sol |
| `rotationDeg` | Orientation, multiple de 90° |
| `statut` | disponible, arret, maintenance — jamais « en production », qui se déduit |
| `noteStatut` | Panne, réglage, congés |

Une machine sans coordonnées n'est pas sur le plan : elle apparaît dans la
bande « machines hors du plan », à poser d'un geste.

### Nouveaux objets

- **Zone** : nom, rectangle, ordre d'affichage.
- **Emplacement de stockage** : nom, zone, rectangle, note. Il ne porte
  aucune quantité : celles-ci viendront du module Stocks.

### Paramètres

`atelier_largeur_cm` (3000) et `atelier_profondeur_cm` (1600), à corriger
avec les cotes réelles du bâtiment.

## 4. Modifications de la base PostgreSQL

À appliquer au contrat quand les écrans Next.js reprendront le plan. Rien
n'est encore modifié dans `prisma/contract.prisma`.

```prisma
enum StatutMachine {
  DISPONIBLE
  ARRET
  MAINTENANCE
}

/// Une zone de l'atelier : usinage et préparation, finition et assemblage.
model ZoneAtelier {
  id           String @id @onCreate(cuid(2))
  nom          String @unique
  ordre        Int    @default(0)
  xCm          Int
  yCm          Int
  largeurCm    Int
  profondeurCm Int
  centres      CentreTravail[]
  emplacements EmplacementStock[]
  creeLe       temporal.CreatedAt
  majLe        temporal.UpdatedAt

  @@map("zone_atelier")
}

model CentreTravail {
  // ... champs existants inchangés ...
  zoneId       String?
  zone         ZoneAtelier? @relation(fields: [zoneId], references: [id])
  /// Implantation sur le plan, en centimètres. Nul = machine hors du plan.
  xCm          Int?
  yCm          Int?
  largeurCm    Int @default(150)
  profondeurCm Int @default(100)
  rotationDeg  Int @default(0)
  /// « En production » ne se saisit pas : il se déduit des pointages ouverts.
  statut       StatutMachine @default(DISPONIBLE)
  noteStatut   String?
  statutMajLe  DateTime?

  @@index([zoneId])
}

/// Emplacement de stockage dessiné sur le plan. Les quantités viennent du
/// module Stocks (lot 5) : ce modèle ne porte que la place au sol.
model EmplacementStock {
  id           String @id @onCreate(cuid(2))
  code         String @unique
  libelle      String
  zoneId       String?
  zone         ZoneAtelier? @relation(fields: [zoneId], references: [id])
  xCm          Int
  yCm          Int
  largeurCm    Int
  profondeurCm Int
  note         String?
  creeLe       temporal.CreatedAt
  majLe        temporal.UpdatedAt

  @@index([zoneId])
  @@map("emplacement_stock")
}
```

Puis `npx prisma contract emit` et `npx prisma db update`.

`Operation` gagne un champ `centreSource` (`document`, `proposition`,
`gerant`), sur le modèle de `categorieSource` : une affectation déduite n'est
jamais exportée vers `data/operations.csv` tant qu'elle n'est pas confirmée.

Rien n'est supprimé, rien n'est renommé : les écrans existants continuent de
fonctionner sans modification.

## 5. Ce que le plan ne fait pas

- **Aucune quantité de stock.** Cliquer un emplacement affiche ce qui y
  figurera et dit que le module Stocks n'est pas connecté. Inventer des
  quantités créerait une seconde vérité, exactement ce que le cadrage
  interdit pour les prix.
- **Aucun pilotage de machine.** On ne lance ni n'arrête une production
  depuis le plan : les pointages restent la seule porte d'entrée.
- **Aucune duplication du planning.** La charge vient du planning.

## 6. Reste à trancher

1. Les cotes réelles de l'atelier et la vraie implantation : les positions
   livrées sont une proposition, à corriger en mode administration.
2. L'affectation des 36 opérations aux machines : 34 sont proposées par
   déduction et marquées « à confirmer ».
3. La **Dégauchisseuse** ne reçoit aucune des 36 opérations du classeur :
   le dégauchissage est-il compté dans le rabotage ?
4. **Marquage laser 1 Côté** n'a pas de machine : il n'y a pas de laser dans
   la liste des postes. Sous-traitance ?
5. **Cale carton** : sur quel poste ? Aucun poste de conditionnement n'est
   listé en dehors de la ceintureuse.
6. Les emplacements de stockage livrés (panneaux, débit en cours, produits
   finis) sont trois exemples à replacer, renommer ou supprimer.
