import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  caseCochee,
  choixFacultatif,
  decimalFacultatif,
  decimalPositif,
  entierPositif,
  premiereErreur,
  texteFacultatif,
  texteObligatoire,
} from "./saisie";

describe("validation des saisies", () => {
  it("accepte la virgule décimale du clavier français", () => {
    assert.deepEqual(decimalPositif("1,25", "Temps unitaire"), { ok: true, valeur: "1.25" });
  });

  it("refuse un décimal négatif, illisible ou trop précis", () => {
    for (const saisie of ["-1", "abc", "1.255"]) {
      const resultat = decimalPositif(saisie, "Temps unitaire");
      assert.equal(resultat.ok, false, `« ${saisie} » aurait dû être refusé`);
    }
  });

  it("traite un décimal facultatif vide comme null", () => {
    assert.deepEqual(decimalFacultatif("  ", "Épaisseur"), { ok: true, valeur: null });
    assert.deepEqual(decimalFacultatif("10", "Épaisseur"), { ok: true, valeur: "10" });
  });

  it("exige un texte obligatoire et tolère un facultatif vide", () => {
    assert.equal(texteObligatoire("", "Nom").ok, false);
    assert.deepEqual(texteObligatoire(" Scie ", "Nom"), { ok: true, valeur: "Scie" });
    assert.deepEqual(texteFacultatif("", "Code EBP"), { ok: true, valeur: null });
  });

  it("valide les entiers avec un minimum", () => {
    assert.deepEqual(entierPositif("1", "Opérateurs", 1), { ok: true, valeur: 1 });
    assert.equal(entierPositif("0", "Opérateurs", 1).ok, false);
    assert.equal(entierPositif("1.5", "Opérateurs", 1).ok, false);
  });

  it("n'accepte qu'une valeur de la liste, ou rien", () => {
    const categories = ["USINAGE", "FINITION"] as const;
    assert.deepEqual(choixFacultatif("USINAGE", "Catégorie", categories), {
      ok: true,
      valeur: "USINAGE",
    });
    assert.deepEqual(choixFacultatif("", "Catégorie", categories), { ok: true, valeur: null });
    assert.equal(choixFacultatif("DECOUPE", "Catégorie", categories).ok, false);
  });

  it("lit une case à cocher", () => {
    assert.equal(caseCochee("on"), true);
    assert.equal(caseCochee(null), false);
  });

  it("rend le premier message d'erreur de la série", () => {
    assert.equal(premiereErreur(texteObligatoire("Scie", "Nom")), null);
    assert.equal(
      premiereErreur(texteObligatoire("Scie", "Nom"), decimalPositif("abc", "Temps")),
      "Temps n'est pas un nombre : « abc ».",
    );
  });
});
