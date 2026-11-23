// Tests de la lecture du référentiel des 36 opérations.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { analyserOperationsCsv, CATEGORIES_OPERATION } from "./operations-csv";
import { quantiteLancee, tempsPrevuOperationMin } from "./temps";

const CHEMIN_CSV = path.join(import.meta.dirname, "..", "..", "data", "operations.csv");
const CONTENU_REEL = readFileSync(CHEMIN_CSV, "utf8");

const ENTETE = "nom,temps_unitaire_min,temps_reglage_min,nb_operateurs,centre_travail,categorie";

describe("référentiel data/operations.csv", () => {
  const operations = analyserOperationsCsv(CONTENU_REEL);

  it("contient les 36 opérations", () => {
    assert.equal(operations.length, 36);
  });

  it("lit le délignage tel qu'il est écrit", () => {
    assert.deepEqual(operations[0], {
      nom: "Délignage",
      tempsUnitaireMin: "1.25",
      tempsReglageMin: "5",
      nbOperateurs: 1,
      centreTravail: null,
      categorie: null,
    });
  });

  it("lit le collage chêne à 8 minutes la pièce", () => {
    const collage = operations.find((operation) => operation.nom === "Collage Chêne");
    assert.ok(collage, "Collage Chêne absent du référentiel");
    assert.equal(collage.tempsUnitaireMin, "8");
    assert.equal(collage.tempsReglageMin, "5");
  });

  it("garde les temps en texte décimal, sans passer par un flottant", () => {
    const egrainage = operations.find((operation) => operation.nom === "Egrainage");
    assert.ok(egrainage, "Egrainage absent du référentiel");
    assert.equal(egrainage.tempsUnitaireMin, "0.45");
    assert.equal(typeof egrainage.tempsUnitaireMin, "string");
  });

  it("laisse centre de travail et catégorie à renseigner par le gérant", () => {
    for (const operation of operations) {
      assert.equal(operation.centreTravail, null, `${operation.nom} : centre_travail non vide`);
      assert.equal(operation.categorie, null, `${operation.nom} : categorie non vide`);
    }
  });

  it("donne un réglage de 5 minutes et un opérateur partout", () => {
    for (const operation of operations) {
      assert.equal(operation.tempsReglageMin, "5", `${operation.nom} : réglage inattendu`);
      assert.equal(operation.nbOperateurs, 1, `${operation.nom} : effectif inattendu`);
    }
  });

  it("alimente la règle de temps : délignage sur 150 coffrets = 202,5 minutes", () => {
    const delignage = operations[0];
    assert.ok(delignage);
    assert.equal(
      tempsPrevuOperationMin(delignage, quantiteLancee(150)).toString(),
      "202.5",
    );
  });
});

describe("lecture du CSV", () => {
  it("tolère CRLF, BOM et ligne finale vide", () => {
    const contenu = `﻿${ENTETE}\r\nDélignage,1.25,5,1,,\r\n\r\n`;
    const lues = analyserOperationsCsv(contenu);
    assert.equal(lues.length, 1);
    assert.equal(lues[0]?.nom, "Délignage");
  });

  it("lit un centre de travail et une catégorie quand ils sont renseignés", () => {
    const contenu = `${ENTETE}\nDélignage,1.25,5,1,Scie,PREPARATION_DEBIT\n`;
    const lues = analyserOperationsCsv(contenu);
    assert.equal(lues[0]?.centreTravail, "Scie");
    assert.equal(lues[0]?.categorie, "PREPARATION_DEBIT");
  });

  it("accepte les 6 catégories du contrat", () => {
    for (const categorie of CATEGORIES_OPERATION) {
      const contenu = `${ENTETE}\nTest,1,5,1,,${categorie}\n`;
      assert.equal(analyserOperationsCsv(contenu)[0]?.categorie, categorie);
    }
  });

  it("gère une virgule à l'intérieur d'un champ cité", () => {
    const contenu = `${ENTETE}\n"Rainurage, 2 passes",0.5,5,1,,\n`;
    assert.equal(analyserOperationsCsv(contenu)[0]?.nom, "Rainurage, 2 passes");
  });

  it("refuse un en-tête différent", () => {
    assert.throws(
      () => analyserOperationsCsv("nom,temps_unitaire_min\nDélignage,1.25\n"),
      /en-tête inattendu/,
    );
  });

  it("refuse un nom en doublon, Operation.nom étant unique", () => {
    const contenu = `${ENTETE}\nDélignage,1.25,5,1,,\nDélignage,1.5,5,1,,\n`;
    assert.throws(() => analyserOperationsCsv(contenu), /déjà présent ligne 2/);
  });

  it("refuse une catégorie hors de l'enum", () => {
    const contenu = `${ENTETE}\nDélignage,1.25,5,1,,DECOUPE\n`;
    assert.throws(() => analyserOperationsCsv(contenu), /categorie inconnue/);
  });

  it("refuse un temps illisible ou négatif", () => {
    assert.throws(
      () => analyserOperationsCsv(`${ENTETE}\nDélignage,abc,5,1,,\n`),
      /n'est pas un décimal/,
    );
    assert.throws(
      () => analyserOperationsCsv(`${ENTETE}\nDélignage,-1,5,1,,\n`),
      /décimal positif/,
    );
  });

  it("refuse plus de 2 décimales, que la colonne ne sait pas stocker", () => {
    assert.throws(
      () => analyserOperationsCsv(`${ENTETE}\nDélignage,1.255,5,1,,\n`),
      /dépasse 2 décimales/,
    );
  });

  it("refuse un nombre d'opérateurs invalide", () => {
    assert.throws(
      () => analyserOperationsCsv(`${ENTETE}\nDélignage,1.25,5,0,,\n`),
      /nb_operateurs/,
    );
  });

  it("refuse une ligne qui n'a pas le bon nombre de colonnes", () => {
    assert.throws(
      () => analyserOperationsCsv(`${ENTETE}\nDélignage,1.25,5,1\n`),
      /6 colonnes attendues, 4 trouvées/,
    );
  });
});
