// Règle de temps du lot 1.
//
// Origine : CLAUDE.md § Règles métier, et classeur de référence
// (feuille Prototype, colonnes « temps de réglage » et « temps unitaire » ;
// référentiel des 36 opérations repris dans data/operations.csv).
//
//   quantite_lancee = ceil(quantite_commandee * (1 + majoration_lancement))
//   temps_prevu     = temps_reglage + temps_unitaire * quantite_lancee
//
// Le temps de réglage s'ajoute UNE SEULE FOIS par opération et par ordre de
// fabrication. Il n'est jamais multiplié par la quantité : c'est l'erreur que
// les tests de ce module verrouillent.
//
// Tout est en décimal exact (decimal.js). Le binaire flottant dérive :
// 5 + 0.45 * 158 vaut 76.10000000000001 en Float, 76.1 en décimal. Une erreur
// de ce genre finit sur une facture.

import Decimal from "decimal.js";

/**
 * Majoration des quantités lancées. Clé `majoration_lancement` de la table
 * Parametre ; cette constante n'est que le repli quand la base n'est pas lue.
 */
export const MAJORATION_LANCEMENT_DEFAUT = "0.05";

/**
 * Temps de réglage par défaut, en minutes. Clé `temps_reglage_defaut_min`
 * de la table Parametre, et `@default(5)` sur Operation.tempsReglageMin.
 */
export const TEMPS_REGLAGE_DEFAUT_MIN = "5";

/**
 * Une valeur décimale acceptée en entrée. Les colonnes `Decimal` de Prisma 8
 * sur PostgreSQL se lisent en texte décimal (`"1.25"`), jamais en nombre
 * flottant : c'est la forme qui arrive de la base, et celle qu'on y renvoie.
 */
export type Decimalisable = Decimal | string;

/** Minutes par pièce et minutes de réglage d'une opération. */
export interface TempsOperation {
  /** Pour les messages d'erreur. Optionnel. */
  readonly nom?: string;
  /** Minutes par pièce. Operation.tempsUnitaireMin. */
  readonly tempsUnitaireMin: Decimalisable;
  /** Minutes de réglage, comptées une fois. Operation.tempsReglageMin. */
  readonly tempsReglageMin: Decimalisable;
}

function versDecimal(valeur: Decimalisable, champ: string, contexte?: string): Decimal {
  const ou = contexte === undefined ? "" : ` (${contexte})`;
  let decimale: Decimal;
  try {
    decimale = valeur instanceof Decimal ? valeur : new Decimal(valeur);
  } catch {
    throw new RangeError(`${champ}${ou} : valeur décimale illisible « ${String(valeur)} ».`);
  }
  if (!decimale.isFinite()) {
    throw new RangeError(`${champ}${ou} : valeur décimale non finie « ${String(valeur)} ».`);
  }
  if (decimale.isNegative()) {
    throw new RangeError(`${champ}${ou} : valeur négative « ${String(valeur)} ».`);
  }
  return decimale;
}

function versQuantite(valeur: number, champ: string): number {
  if (!Number.isInteger(valeur) || valeur < 0) {
    throw new RangeError(`${champ} : entier positif attendu, reçu « ${String(valeur)} ».`);
  }
  return valeur;
}

/**
 * Quantité lancée en atelier : la quantité commandée majorée de 5 %, arrondie
 * au nombre entier supérieur. On ne lance pas un demi-coffret.
 *
 * 150 commandés donnent 158 lancés (150 × 1,05 = 157,5, arrondi au-dessus).
 */
export function quantiteLancee(
  quantiteCommandee: number,
  majoration: Decimalisable = MAJORATION_LANCEMENT_DEFAUT,
): number {
  versQuantite(quantiteCommandee, "quantiteCommandee");
  const taux = versDecimal(majoration, "majoration_lancement");
  return new Decimal(quantiteCommandee).mul(taux.plus(1)).ceil().toNumber();
}

/**
 * Temps prévu d'une opération sur un ordre de fabrication, en minutes.
 *
 *   temps_reglage + temps_unitaire * quantite_lancee
 *
 * Le réglage est ajouté hors du produit : une seule fois pour l'opération,
 * quelle que soit la quantité lancée.
 */
export function tempsPrevuOperationMin(
  operation: TempsOperation,
  quantiteLanceePieces: number,
): Decimal {
  versQuantite(quantiteLanceePieces, "quantiteLancee");
  const unitaire = versDecimal(operation.tempsUnitaireMin, "tempsUnitaireMin", operation.nom);
  const reglage = versDecimal(operation.tempsReglageMin, "tempsReglageMin", operation.nom);
  return reglage.plus(unitaire.mul(quantiteLanceePieces));
}

/**
 * Temps prévu d'une opération à partir de la quantité commandée : applique la
 * majoration de lancement puis la règle de temps.
 */
export function tempsPrevuPourQuantiteCommandee(
  operation: TempsOperation,
  quantiteCommandee: number,
  majoration: Decimalisable = MAJORATION_LANCEMENT_DEFAUT,
): Decimal {
  return tempsPrevuOperationMin(operation, quantiteLancee(quantiteCommandee, majoration));
}

/**
 * Temps prévu de l'ordre de fabrication entier : la somme des temps de ses
 * opérations. Chaque opération apporte son propre réglage, une fois.
 *
 * La gamme est saisie, jamais déduite : la liste des opérations arrive telle
 * qu'elle a été renseignée sur le modèle produit puis corrigée sur l'affaire.
 */
export function tempsPrevuOrdreFabricationMin(
  operations: readonly TempsOperation[],
  quantiteLanceePieces: number,
): Decimal {
  return operations.reduce(
    (total, operation) => total.plus(tempsPrevuOperationMin(operation, quantiteLanceePieces)),
    new Decimal(0),
  );
}

/**
 * Minutes au format de la colonne `Decimal(precision: 6, scale: 2)` : le texte
 * décimal que Prisma 8 attend en écriture et renvoie en lecture.
 */
export function formaterMinutes(minutes: Decimal): string {
  return minutes.toFixed(2);
}
