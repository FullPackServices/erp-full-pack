// Tests de la règle de temps. Un test par règle de calcul avant de passer au
// lot suivant (CLAUDE.md § Conventions).
//
// Les chiffres viennent d'une commande réelle : 150 coffrets, donc 158 lancés.

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import Decimal from "decimal.js";
import {
  formaterMinutes,
  quantiteLancee,
  tempsPrevuOperationMin,
  tempsPrevuOrdreFabricationMin,
  tempsPrevuPourQuantiteCommandee,
  type TempsOperation,
} from "./temps";

// Trois opérations du référentiel data/operations.csv.
const DELIGNAGE: TempsOperation = {
  nom: "Délignage",
  tempsUnitaireMin: "1.25",
  tempsReglageMin: "5",
};
const COLLAGE_CHENE: TempsOperation = {
  nom: "Collage Chêne",
  tempsUnitaireMin: "8",
  tempsReglageMin: "5",
};
const EGRAINAGE: TempsOperation = {
  nom: "Egrainage",
  tempsUnitaireMin: "0.45",
  tempsReglageMin: "5",
};

const QUANTITE_COMMANDEE = 150;
const QUANTITE_LANCEE = 158;

describe("quantité lancée", () => {
  it("majore la commande de 5 % et arrondit au nombre entier supérieur", () => {
    // 150 × 1,05 = 157,5 → 158. On ne lance pas un demi-coffret.
    assert.equal(quantiteLancee(QUANTITE_COMMANDEE), QUANTITE_LANCEE);
  });

  it("n'arrondit pas quand la majoration tombe juste", () => {
    assert.equal(quantiteLancee(20), 21);
    assert.equal(quantiteLancee(100), 105);
  });

  it("arrondit au-dessus même pour une pièce", () => {
    assert.equal(quantiteLancee(1), 2);
  });

  it("laisse zéro à zéro", () => {
    assert.equal(quantiteLancee(0), 0);
  });

  it("accepte une majoration explicite", () => {
    assert.equal(quantiteLancee(150, "0"), 150);
    assert.equal(quantiteLancee(150, "0.10"), 165);
  });

  it("refuse une quantité qui n'est pas un entier positif", () => {
    assert.throws(() => quantiteLancee(1.5), RangeError);
    assert.throws(() => quantiteLancee(-1), RangeError);
  });
});

describe("temps prévu d'une opération", () => {
  it("délignage : 5 + 1,25 × 158 = 202,5 minutes", () => {
    assert.equal(tempsPrevuOperationMin(DELIGNAGE, QUANTITE_LANCEE).toString(), "202.5");
  });

  it("collage chêne : 5 + 8 × 158 = 1269 minutes", () => {
    assert.equal(tempsPrevuOperationMin(COLLAGE_CHENE, QUANTITE_LANCEE).toString(), "1269");
  });

  it("reste en décimal exact là où le flottant dérive", () => {
    // 5 + 0.45 * 158 vaut 76.10000000000001 en Float.
    const minutes = tempsPrevuOperationMin(EGRAINAGE, QUANTITE_LANCEE);
    assert.equal(minutes.toString(), "76.1");
    assert.notEqual(minutes.toString(), String(5 + 0.45 * QUANTITE_LANCEE));
  });

  it("accepte des Decimal autant que du texte décimal", () => {
    const enDecimal: TempsOperation = {
      tempsUnitaireMin: new Decimal("1.25"),
      tempsReglageMin: new Decimal(5),
    };
    assert.equal(
      tempsPrevuOperationMin(enDecimal, QUANTITE_LANCEE).toString(),
      tempsPrevuOperationMin(DELIGNAGE, QUANTITE_LANCEE).toString(),
    );
  });

  it("se formate au format de la colonne Decimal(6, 2)", () => {
    assert.equal(formaterMinutes(tempsPrevuOperationMin(DELIGNAGE, QUANTITE_LANCEE)), "202.50");
  });

  it("part de la quantité commandée sans qu'on lui passe la quantité lancée", () => {
    assert.equal(
      tempsPrevuPourQuantiteCommandee(DELIGNAGE, QUANTITE_COMMANDEE).toString(),
      "202.5",
    );
  });

  it("refuse un temps négatif ou illisible", () => {
    assert.throws(
      () => tempsPrevuOperationMin({ tempsUnitaireMin: "-1", tempsReglageMin: "5" }, 10),
      RangeError,
    );
    assert.throws(
      () => tempsPrevuOperationMin({ tempsUnitaireMin: "abc", tempsReglageMin: "5" }, 10),
      RangeError,
    );
  });
});

describe("le réglage est compté une seule fois, jamais par pièce", () => {
  it("n'ajoute qu'un seul réglage au produit unitaire × quantité", () => {
    const minutes = tempsPrevuOperationMin(COLLAGE_CHENE, QUANTITE_LANCEE);
    const produit = new Decimal("8").mul(QUANTITE_LANCEE); // 1264
    assert.equal(minutes.minus(produit).toString(), "5");
  });

  it("ne multiplie pas le réglage par la quantité", () => {
    // L'erreur facile : (5 + 8) × 158 = 2054 au lieu de 5 + 8 × 158 = 1269.
    const minutes = tempsPrevuOperationMin(COLLAGE_CHENE, QUANTITE_LANCEE);
    const reglageParPiece = new Decimal("5").plus("8").mul(QUANTITE_LANCEE);
    assert.equal(reglageParPiece.toString(), "2054");
    assert.notEqual(minutes.toString(), reglageParPiece.toString());
    assert.equal(minutes.toString(), "1269");
  });

  it("une pièce de plus coûte un temps unitaire, pas un réglage de plus", () => {
    const pour158 = tempsPrevuOperationMin(DELIGNAGE, 158);
    const pour159 = tempsPrevuOperationMin(DELIGNAGE, 159);
    assert.equal(pour159.minus(pour158).toString(), "1.25");
  });

  it("compte le réglage même sans pièce lancée", () => {
    assert.equal(tempsPrevuOperationMin(DELIGNAGE, 0).toString(), "5");
  });
});

describe("temps prévu d'un ordre de fabrication", () => {
  const gamme = [DELIGNAGE, COLLAGE_CHENE];

  it("somme les temps de ses opérations", () => {
    // 202,5 + 1269 = 1471,5
    assert.equal(tempsPrevuOrdreFabricationMin(gamme, QUANTITE_LANCEE).toString(), "1471.5");
  });

  it("compte un réglage par opération de la gamme, et un seul", () => {
    const total = tempsPrevuOrdreFabricationMin(gamme, QUANTITE_LANCEE);
    const produits = new Decimal("1.25").mul(QUANTITE_LANCEE).plus(new Decimal("8").mul(QUANTITE_LANCEE));
    assert.equal(total.minus(produits).toString(), "10"); // 2 opérations × 5 min
  });

  it("rend zéro sur une gamme vide", () => {
    assert.equal(tempsPrevuOrdreFabricationMin([], QUANTITE_LANCEE).toString(), "0");
  });
});
