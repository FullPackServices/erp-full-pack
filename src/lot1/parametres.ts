// Paramètres attendus par le contrat (voir le commentaire du modèle Parametre
// dans prisma/contract.prisma).
//
// Le seed crée les clés manquantes et tient leur description à jour, mais ne
// touche jamais à une valeur déjà saisie : un paramètre appartient au gérant,
// pas au dépôt. C'est aussi pourquoi `taux_horaire_atelier_eur` part vide
// plutôt qu'avec un chiffre inventé — il est encore à trancher, et une marge
// calculée sur un taux faux serait pire qu'une marge non calculée.

import Decimal from "decimal.js";

export const CLE_MAJORATION_LANCEMENT = "majoration_lancement";
export const CLE_TEMPS_REGLAGE_DEFAUT_MIN = "temps_reglage_defaut_min";
export const CLE_TAUX_HORAIRE_ATELIER_EUR = "taux_horaire_atelier_eur";

export interface DefinitionParametre {
  readonly cle: string;
  /**
   * Format attendu de la valeur. Un paramètre `decimal` est validé à la saisie
   * et normalisé (« 42,50 » devient « 42.50 ») : sans ça, une virgule de
   * clavier français stockée telle quelle casserait le calcul qui le lit.
   */
  readonly format: "decimal" | "texte";
  /** Valeur posée à la création. Vide = à renseigner par le gérant. */
  readonly valeurInitiale: string;
  readonly description: string;
  /** Vrai si une valeur vide bloque un calcul. */
  readonly bloquant: boolean;
}

export const PARAMETRES_ATTENDUS: readonly DefinitionParametre[] = [
  {
    cle: CLE_MAJORATION_LANCEMENT,
    format: "decimal",
    valeurInitiale: "0.05",
    description:
      "Majoration des quantités lancées : 0.05 pour +5 %. " +
      "quantite_lancee = ceil(quantite_commandee * (1 + majoration)).",
    bloquant: false,
  },
  {
    cle: CLE_TEMPS_REGLAGE_DEFAUT_MIN,
    format: "decimal",
    valeurInitiale: "5",
    description:
      "Temps de réglage par défaut d'une opération, en minutes. " +
      "Compté une seule fois par opération et par ordre de fabrication.",
    bloquant: false,
  },
  {
    cle: CLE_TAUX_HORAIRE_ATELIER_EUR,
    format: "decimal",
    valeurInitiale: "",
    description:
      "Taux horaire atelier en euros HT. À renseigner : " +
      "sans lui le coût de main-d'œuvre et la marge par commande (lot 6) " +
      "ne peuvent pas être calculés.",
    bloquant: true,
  },
];

/** Nombre de décimales accepté pour un paramètre décimal. */
export const DECIMALES_PARAMETRE = 4;

export function definitionParametre(cle: string): DefinitionParametre | undefined {
  return PARAMETRES_ATTENDUS.find((definition) => definition.cle === cle);
}

/**
 * Lit une valeur de paramètre en décimal, ou null si elle est vide ou
 * illisible. Un paramètre mal rempli ne doit jamais faire tomber un écran :
 * le calcul qui en dépend s'affiche comme non calculable.
 */
export function decimalDuParametre(valeur: string | undefined): Decimal | null {
  const texte = (valeur ?? "").trim();
  if (texte === "") {
    return null;
  }
  try {
    const decimale = new Decimal(texte);
    return decimale.isFinite() && !decimale.isNegative() ? decimale : null;
  } catch {
    return null;
  }
}
