// Seed du lot 1 : charge le référentiel des opérations depuis
// data/operations.csv dans la table Operation.
//
//   npm run seed
//
// Idempotent et relançable : chaque opération est identifiée par son nom, qui
// est unique dans le contrat. Deux exécutions de suite ne créent pas de
// doublon et laissent la base dans le même état.
//
// Ce que le seed écrit, et ce qu'il laisse tranquille :
//   - les temps et le nombre d'opérateurs viennent du CSV, qui en est la
//     source : ils sont réécrits à chaque passage ;
//   - une cellule vide du CSV vaut « non renseigné », pas « à effacer ».
//     `centre_travail` et `categorie` sont encore vides partout, en attente du
//     gérant : tant qu'elles le sont, un seed relancé n'écrase pas une
//     affectation saisie dans l'application ;
//   - `actif` n'est jamais réécrit, pour qu'une opération désactivée le reste.

import "dotenv/config";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { analyserOperationsCsv, type LigneOperationCsv } from "../src/lot1/operations-csv";
import { PARAMETRES_ATTENDUS } from "../src/lot1/parametres";
import { db } from "../src/prisma/db";

const CHEMIN_CSV = path.join(import.meta.dirname, "..", "data", "operations.csv");

interface Bilan {
  readonly operationsCreees: number;
  readonly operationsMisesAJour: number;
  readonly centresCrees: number;
}

/**
 * Résout un nom de centre de travail en identifiant, en le créant au besoin.
 * Le CSV ne porte qu'un nom ; CentreTravail.nom est unique, ce qui en fait une
 * clé de rapprochement sûre sans jamais servir de clé primaire.
 */
async function identifiantCentreTravail(
  nom: string,
  cache: Map<string, string>,
  compteurCreations: { valeur: number },
): Promise<string> {
  const enCache = cache.get(nom);
  if (enCache !== undefined) {
    return enCache;
  }

  let centre = await db.orm.public.CentreTravail.where({ nom }).first();
  if (!centre) {
    centre = await db.orm.public.CentreTravail.create({ nom });
    compteurCreations.valeur += 1;
  }

  cache.set(nom, centre.id);
  return centre.id;
}

async function chargerOperations(lignes: readonly LigneOperationCsv[]): Promise<Bilan> {
  // Relevé avant écriture : l'upsert ne dit pas s'il a inséré ou mis à jour,
  // et le bilan affiché doit être exact.
  const nomsDejaEnBase = new Set(
    (await db.orm.public.Operation.select("nom").all()).map((operation) => operation.nom),
  );

  const cacheCentres = new Map<string, string>();
  const centresCrees = { valeur: 0 };
  let operationsCreees = 0;

  for (const ligne of lignes) {
    const centreTravailId =
      ligne.centreTravail === null
        ? null
        : await identifiantCentreTravail(ligne.centreTravail, cacheCentres, centresCrees);

    const champsDuCsv = {
      nom: ligne.nom,
      tempsUnitaireMin: ligne.tempsUnitaireMin,
      tempsReglageMin: ligne.tempsReglageMin,
      nbOperateurs: ligne.nbOperateurs,
      ...(ligne.categorie !== null ? { categorie: ligne.categorie } : {}),
      ...(centreTravailId !== null ? { centreTravailId } : {}),
    };

    // conflictOn cible la contrainte d'unicité sur `nom`. Sans lui, le conflit
    // se résoudrait sur la clé primaire, qui est un cuid neuf à chaque passage :
    // le seed insérerait un doublon au lieu de mettre à jour.
    await db.orm.public.Operation.upsert({
      create: champsDuCsv,
      update: champsDuCsv,
      conflictOn: { nom: ligne.nom },
    });

    if (!nomsDejaEnBase.has(ligne.nom)) {
      operationsCreees += 1;
    }
  }

  return {
    operationsCreees,
    operationsMisesAJour: lignes.length - operationsCreees,
    centresCrees: centresCrees.valeur,
  };
}

/**
 * Crée les clés de paramètres manquantes et tient leur description à jour.
 * Une valeur déjà saisie n'est jamais réécrite : `update` ne porte que la
 * description. `cle` étant la clé primaire, le conflit se résout dessus sans
 * qu'on ait à le nommer.
 */
async function chargerParametres(): Promise<{ crees: number; existants: number }> {
  const clesEnBase = new Set(
    (await db.orm.public.Parametre.select("cle").all()).map((parametre) => parametre.cle),
  );

  let crees = 0;
  for (const definition of PARAMETRES_ATTENDUS) {
    await db.orm.public.Parametre.upsert({
      create: {
        cle: definition.cle,
        valeur: definition.valeurInitiale,
        description: definition.description,
      },
      update: { description: definition.description },
    });
    if (!clesEnBase.has(definition.cle)) {
      crees += 1;
    }
  }

  return { crees, existants: PARAMETRES_ATTENDUS.length - crees };
}

async function main(): Promise<void> {
  const contenu = await readFile(CHEMIN_CSV, "utf8");
  const lignes = analyserOperationsCsv(contenu);
  console.log(`data/operations.csv : ${lignes.length} opérations lues.`);

  const bilan = await chargerOperations(lignes);

  console.log(
    `Operation : ${bilan.operationsCreees} créée(s), ` +
      `${bilan.operationsMisesAJour} mise(s) à jour.`,
  );
  if (bilan.centresCrees > 0) {
    console.log(`CentreTravail : ${bilan.centresCrees} créé(s) depuis la colonne centre_travail.`);
  }

  const parametres = await chargerParametres();
  console.log(
    `Parametre : ${parametres.crees} créé(s), ${parametres.existants} déjà présent(s).`,
  );

  const enBase = await db.orm.public.Operation.select("nom").all();
  console.log(`Total en base : ${enBase.length} opérations.`);

  const aRenseigner = await db.orm.public.Parametre.where({ valeur: "" }).select("cle").all();
  if (aRenseigner.length > 0) {
    console.log(
      `\nÀ renseigner avant les calculs qui en dépendent : ` +
        aRenseigner.map((parametre) => parametre.cle).join(", "),
    );
  }
}

try {
  await main();
} finally {
  // Script court : la pool pg garde la boucle d'événements en vie sans ça.
  await db.close();
}
