// Formatage français de l'interface : séparateur décimal virgule, espace fine
// insécable comme séparateur de milliers.
//
// Les valeurs décimales arrivent de Prisma 8 en texte (« 1471.50 »). Elles sont
// formatées sans jamais passer par un Number : le formatage est le dernier
// endroit où une dérive flottante pourrait s'introduire, et la règle du projet
// ne fait pas d'exception pour l'affichage.

import Decimal from "decimal.js";

const ESPACE_FINE = " ";

/**
 * Formate un texte décimal à la française, exactement.
 *
 * @param decimalesMin nombre minimum de décimales affichées
 * @param decimalesMax tronque au-delà (sans arrondir : utilisé pour l'affichage
 *                     de valeurs déjà arrondies par la base)
 */
export function nombreFr(
  valeurDecimale: string,
  decimalesMin = 0,
  decimalesMax = 4,
): string {
  const texte = valeurDecimale.trim();
  if (texte === "") {
    return "—";
  }

  const negatif = texte.startsWith("-");
  const absolu = negatif ? texte.slice(1) : texte;
  const [partieEntiere = "0", partieFraction = ""] = absolu.split(".");

  const entierGroupe = partieEntiere.replace(/\B(?=(\d{3})+(?!\d))/g, ESPACE_FINE);

  let fraction = partieFraction.slice(0, decimalesMax).replace(/0+$/, "");
  while (fraction.length < decimalesMin) {
    fraction += "0";
  }

  const signe = negatif ? "-" : "";
  return fraction === "" ? `${signe}${entierGroupe}` : `${signe}${entierGroupe},${fraction}`;
}

/** « 202,5 min ». */
export function minutesFr(minutes: string): string {
  return `${nombreFr(minutes, 0, 2)}${ESPACE_FINE}min`;
}

/** « 24 h 32 » — lisible pour une charge d'atelier. */
export function dureeFr(minutes: string): string {
  const total = new Decimal(minutes);
  const heures = total.divToInt(60);
  const reste = total.minus(heures.mul(60));
  if (heures.isZero()) {
    return minutesFr(minutes);
  }
  const minutesEntieres = reste.toDecimalPlaces(0, Decimal.ROUND_HALF_UP);
  return `${nombreFr(heures.toString())}${ESPACE_FINE}h${ESPACE_FINE}${minutesEntieres
    .toString()
    .padStart(2, "0")}`;
}

/** « 12,3456 € HT ». */
export function eurosFr(montant: string): string {
  return `${nombreFr(montant, 2, 4)}${ESPACE_FINE}€ HT`;
}

/** « 2 500 mm ». */
export function millimetresFr(valeur: string | number): string {
  return `${nombreFr(String(valeur), 0, 2)}${ESPACE_FINE}mm`;
}

/** « +5 % » depuis un taux « 0.05 ». */
export function pourcentageFr(taux: string): string {
  if (taux.trim() === "") {
    return "—";
  }
  return `${nombreFr(new Decimal(taux).mul(100).toString(), 0, 2)}${ESPACE_FINE}%`;
}
