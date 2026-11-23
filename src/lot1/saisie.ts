// Validation des saisies de formulaire, côté serveur.
//
// Tout ce qui entre passe par ici : une valeur refusée doit l'être avec un
// message en français que le gérant peut comprendre et corriger, pas avec une
// erreur de contrainte PostgreSQL. Les décimaux restent du texte de bout en
// bout, pour les mêmes raisons que dans src/lot1/temps.ts.

import Decimal from "decimal.js";

export type Resultat<T> =
  | { readonly ok: true; readonly valeur: T }
  | { readonly ok: false; readonly message: string };

function texteBrut(valeur: FormDataEntryValue | null): string {
  return typeof valeur === "string" ? valeur.trim() : "";
}

export function texteObligatoire(
  valeur: FormDataEntryValue | null,
  champ: string,
  longueurMax = 200,
): Resultat<string> {
  const texte = texteBrut(valeur);
  if (texte === "") {
    return { ok: false, message: `${champ} est obligatoire.` };
  }
  if (texte.length > longueurMax) {
    return { ok: false, message: `${champ} dépasse ${longueurMax} caractères.` };
  }
  return { ok: true, valeur: texte };
}

export function texteFacultatif(
  valeur: FormDataEntryValue | null,
  champ: string,
  longueurMax = 500,
): Resultat<string | null> {
  const texte = texteBrut(valeur);
  if (texte === "") {
    return { ok: true, valeur: null };
  }
  if (texte.length > longueurMax) {
    return { ok: false, message: `${champ} dépasse ${longueurMax} caractères.` };
  }
  return { ok: true, valeur: texte };
}

/**
 * Décimal positif, rendu en texte pour une colonne numeric.
 * La virgule est acceptée à la saisie : on tape « 1,25 » sur un clavier
 * français.
 */
export function decimalPositif(
  valeur: FormDataEntryValue | null,
  champ: string,
  decimalesMax = 2,
): Resultat<string> {
  const texte = texteBrut(valeur).replace(",", ".");
  if (texte === "") {
    return { ok: false, message: `${champ} est obligatoire.` };
  }

  let decimale: Decimal;
  try {
    decimale = new Decimal(texte);
  } catch {
    return { ok: false, message: `${champ} n'est pas un nombre : « ${texte} ».` };
  }

  if (!decimale.isFinite() || decimale.isNegative()) {
    return { ok: false, message: `${champ} doit être un nombre positif.` };
  }
  if (decimale.decimalPlaces() > decimalesMax) {
    return {
      ok: false,
      message: `${champ} accepte au plus ${decimalesMax} décimale(s).`,
    };
  }

  return { ok: true, valeur: decimale.toString() };
}

/** Décimal positif facultatif : vide vaut null. */
export function decimalFacultatif(
  valeur: FormDataEntryValue | null,
  champ: string,
  decimalesMax = 2,
): Resultat<string | null> {
  if (texteBrut(valeur) === "") {
    return { ok: true, valeur: null };
  }
  const resultat = decimalPositif(valeur, champ, decimalesMax);
  return resultat.ok ? { ok: true, valeur: resultat.valeur } : resultat;
}

export function entierPositif(
  valeur: FormDataEntryValue | null,
  champ: string,
  minimum = 0,
): Resultat<number> {
  const texte = texteBrut(valeur);
  if (texte === "") {
    return { ok: false, message: `${champ} est obligatoire.` };
  }
  const nombre = Number(texte);
  if (!Number.isInteger(nombre)) {
    return { ok: false, message: `${champ} doit être un nombre entier.` };
  }
  if (nombre < minimum) {
    return { ok: false, message: `${champ} doit valoir au moins ${minimum}.` };
  }
  return { ok: true, valeur: nombre };
}

/** Une valeur d'enum, ou null si le champ est laissé vide. */
export function choixFacultatif<T extends string>(
  valeur: FormDataEntryValue | null,
  champ: string,
  autorisees: readonly T[],
): Resultat<T | null> {
  const texte = texteBrut(valeur);
  if (texte === "") {
    return { ok: true, valeur: null };
  }
  const trouvee = autorisees.find((candidate) => candidate === texte);
  if (trouvee === undefined) {
    return { ok: false, message: `${champ} : valeur inattendue « ${texte} ».` };
  }
  return { ok: true, valeur: trouvee };
}

export function caseCochee(valeur: FormDataEntryValue | null): boolean {
  const texte = texteBrut(valeur);
  return texte === "on" || texte === "true" || texte === "1";
}

/**
 * Rend le premier message d'erreur d'une série de validations, ou null si
 * toutes ont réussi. Évite une cascade de `if (!x.ok) return` dans chaque
 * action.
 */
export function premiereErreur(
  ...resultats: readonly Resultat<unknown>[]
): string | null {
  for (const resultat of resultats) {
    if (!resultat.ok) {
      return resultat.message;
    }
  }
  return null;
}
