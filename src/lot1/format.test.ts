import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { dureeFr, eurosFr, minutesFr, nombreFr, pourcentageFr } from "./format";

const FINE = " ";

describe("formatage français", () => {
  it("met une virgule décimale et groupe les milliers", () => {
    assert.equal(nombreFr("1471.5"), `1${FINE}471,5`);
    assert.equal(nombreFr("1269"), `1${FINE}269`);
    assert.equal(nombreFr("202.50"), "202,5");
  });

  it("respecte un nombre minimum de décimales", () => {
    assert.equal(nombreFr("8", 2), "8,00");
    assert.equal(nombreFr("12.3", 2), "12,30");
  });

  it("rend un tiret sur une valeur vide, comme un paramètre non renseigné", () => {
    assert.equal(nombreFr(""), "—");
    assert.equal(pourcentageFr(""), "—");
  });

  it("formate les minutes et les montants", () => {
    assert.equal(minutesFr("202.5"), `202,5${FINE}min`);
    assert.equal(eurosFr("12.3456"), `12,3456${FINE}€ HT`);
    assert.equal(pourcentageFr("0.05"), `5${FINE}%`);
  });

  it("convertit une charge en heures et minutes", () => {
    // 1471,5 min = 24 h 31,5 → 24 h 32
    assert.equal(dureeFr("1471.5"), `24${FINE}h${FINE}32`);
    assert.equal(dureeFr("1269"), `21${FINE}h${FINE}09`);
    assert.equal(dureeFr("45"), `45${FINE}min`);
  });

  it("ne passe jamais par un flottant", () => {
    // 0.1 + 0.2 en Float donne 0.30000000000000004.
    assert.equal(nombreFr("76.1"), "76,1");
    assert.equal(nombreFr("0.30000000000000004", 0, 2), "0,3");
  });
});
