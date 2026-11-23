// Lecture du référentiel des 36 opérations : data/operations.csv.
//
// Le CSV est la source de vérité des temps. Les colonnes `centre_travail` et
// `categorie` sont volontairement vides pour l'instant : le gérant les
// renseignera. Une cellule vide vaut « non renseigné », jamais « à effacer » —
// c'est ce qui permet au seed de tourner sans écraser une saisie faite à la
// main (voir prisma/seed.ts).
//
// Les temps restent du texte décimal de bout en bout : les parser en Number
// introduirait la dérive flottante que le contrat écarte en passant par
// `Decimal`.

import Decimal from "decimal.js";

/** Les 6 catégories de l'enum CategorieOperation du contrat. */
export const CATEGORIES_OPERATION = [
  "PREPARATION_DEBIT",
  "USINAGE",
  "PONCAGE",
  "ASSEMBLAGE",
  "FINITION",
  "CONDITIONNEMENT",
] as const;

export type CategorieOperation = (typeof CATEGORIES_OPERATION)[number];

/** En-tête attendu, dans cet ordre. */
export const ENTETE_OPERATIONS_CSV = [
  "nom",
  "temps_unitaire_min",
  "temps_reglage_min",
  "nb_operateurs",
  "centre_travail",
  "categorie",
] as const;

/** Une ligne du référentiel, prête pour la table Operation. */
export interface LigneOperationCsv {
  readonly nom: string;
  /** Texte décimal, colonne numeric. */
  readonly tempsUnitaireMin: string;
  /** Texte décimal, colonne numeric. */
  readonly tempsReglageMin: string;
  readonly nbOperateurs: number;
  /** Nom du centre de travail, ou null si la cellule est vide. */
  readonly centreTravail: string | null;
  /** Catégorie, ou null si la cellule est vide. */
  readonly categorie: CategorieOperation | null;
}

class ErreurCsv extends Error {
  constructor(ligne: number, message: string) {
    super(`data/operations.csv ligne ${ligne} : ${message}`);
    this.name = "ErreurCsv";
  }
}

/**
 * Découpe une ligne CSV. Gère les champs entre guillemets doubles, le
 * guillemet échappé par doublement, et la virgule à l'intérieur d'un champ
 * cité — le référentiel actuel n'en a pas, mais un nom d'opération ajouté plus
 * tard peut en contenir.
 */
function decouperLigne(ligne: string, numero: number): string[] {
  const champs: string[] = [];
  let courant = "";
  let dansGuillemets = false;

  for (let i = 0; i < ligne.length; i += 1) {
    const caractere = ligne[i];
    if (dansGuillemets) {
      if (caractere === '"') {
        if (ligne[i + 1] === '"') {
          courant += '"';
          i += 1;
        } else {
          dansGuillemets = false;
        }
      } else {
        courant += caractere;
      }
    } else if (caractere === '"') {
      if (courant.trim() !== "") {
        throw new ErreurCsv(numero, "guillemet ouvert au milieu d'un champ.");
      }
      courant = "";
      dansGuillemets = true;
    } else if (caractere === ",") {
      champs.push(courant);
      courant = "";
    } else {
      courant += caractere;
    }
  }

  if (dansGuillemets) {
    throw new ErreurCsv(numero, "guillemet non fermé.");
  }
  champs.push(courant);
  return champs;
}

function cellule(champs: readonly string[], index: number): string {
  return (champs[index] ?? "").trim();
}

function lireDecimal(valeur: string, champ: string, numero: number): string {
  if (valeur === "") {
    throw new ErreurCsv(numero, `${champ} est vide.`);
  }
  let decimale: Decimal;
  try {
    decimale = new Decimal(valeur);
  } catch {
    throw new ErreurCsv(numero, `${champ} n'est pas un décimal : « ${valeur} ».`);
  }
  if (!decimale.isFinite() || decimale.isNegative()) {
    throw new ErreurCsv(numero, `${champ} doit être un décimal positif : « ${valeur} ».`);
  }
  if (decimale.decimalPlaces() > 2) {
    throw new ErreurCsv(
      numero,
      `${champ} dépasse 2 décimales, la colonne est en Decimal(precision: 6, scale: 2) : « ${valeur} ».`,
    );
  }
  // Le texte d'origine est conservé : c'est lui qui part en base.
  return valeur;
}

function lireCategorie(valeur: string, numero: number): CategorieOperation | null {
  if (valeur === "") {
    return null;
  }
  const connue = CATEGORIES_OPERATION.find((candidate) => candidate === valeur);
  if (connue === undefined) {
    throw new ErreurCsv(
      numero,
      `categorie inconnue « ${valeur} ». Attendu : ${CATEGORIES_OPERATION.join(", ")}.`,
    );
  }
  return connue;
}

/**
 * Analyse le contenu de data/operations.csv.
 *
 * Fonction pure : elle ne touche ni au disque ni à la base, pour que la règle
 * de lecture du référentiel soit testable seule.
 */
export function analyserOperationsCsv(contenu: string): LigneOperationCsv[] {
  const lignes = contenu.replace(/^﻿/, "").split(/\r?\n/);
  const premiere = lignes[0];
  if (premiere === undefined || premiere.trim() === "") {
    throw new Error("data/operations.csv : fichier vide.");
  }

  const entete = decouperLigne(premiere, 1).map((champ) => champ.trim());
  if (entete.join(",") !== ENTETE_OPERATIONS_CSV.join(",")) {
    throw new Error(
      `data/operations.csv : en-tête inattendu « ${entete.join(",")} ».\n` +
        `Attendu : « ${ENTETE_OPERATIONS_CSV.join(",")} ».`,
    );
  }

  const operations: LigneOperationCsv[] = [];
  const nomsVus = new Map<string, number>();

  for (let index = 1; index < lignes.length; index += 1) {
    const brute = lignes[index] ?? "";
    const numero = index + 1;
    if (brute.trim() === "") {
      continue;
    }

    const champs = decouperLigne(brute, numero);
    if (champs.length !== ENTETE_OPERATIONS_CSV.length) {
      throw new ErreurCsv(
        numero,
        `${ENTETE_OPERATIONS_CSV.length} colonnes attendues, ${champs.length} trouvées.`,
      );
    }

    const nom = cellule(champs, 0);
    if (nom === "") {
      throw new ErreurCsv(numero, "nom est vide.");
    }
    const dejaVu = nomsVus.get(nom);
    if (dejaVu !== undefined) {
      throw new ErreurCsv(
        numero,
        `nom « ${nom} » déjà présent ligne ${dejaVu}. Operation.nom est unique.`,
      );
    }
    nomsVus.set(nom, numero);

    const nbOperateursBrut = cellule(champs, 3);
    const nbOperateurs = Number(nbOperateursBrut);
    if (!Number.isInteger(nbOperateurs) || nbOperateurs < 1) {
      throw new ErreurCsv(
        numero,
        `nb_operateurs doit être un entier supérieur ou égal à 1 : « ${nbOperateursBrut} ».`,
      );
    }

    const centreTravail = cellule(champs, 4);

    operations.push({
      nom,
      tempsUnitaireMin: lireDecimal(cellule(champs, 1), "temps_unitaire_min", numero),
      tempsReglageMin: lireDecimal(cellule(champs, 2), "temps_reglage_min", numero),
      nbOperateurs,
      centreTravail: centreTravail === "" ? null : centreTravail,
      categorie: lireCategorie(cellule(champs, 5), numero),
    });
  }

  if (operations.length === 0) {
    throw new Error("data/operations.csv : aucune opération lue.");
  }

  return operations;
}
