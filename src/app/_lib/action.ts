// Socle des actions serveur.
//
// Une saisie refusée revient sur l'écran avec un message en français. Une
// contrainte PostgreSQL violée est traduite plutôt que remontée telle quelle :
// « duplicate key value violates unique constraint » n'aide personne en atelier.

import { redirect } from "next/navigation";
import type { Resultat } from "@/lot1/saisie";

export class ErreurSaisie extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ErreurSaisie";
  }
}

/** Déballe un résultat de validation, ou interrompt l'action. */
export function valeur<T>(resultat: Resultat<T>): T {
  if (!resultat.ok) {
    throw new ErreurSaisie(resultat.message);
  }
  return resultat.valeur;
}

function messageBase(erreur: unknown): string | null {
  if (typeof erreur !== "object" || erreur === null || !("sqlState" in erreur)) {
    return null;
  }
  switch ((erreur as { readonly sqlState?: unknown }).sqlState) {
    case "23505":
      return "Cette valeur est déjà utilisée ailleurs : elle doit rester unique.";
    case "23503":
      return "La référence choisie n'existe plus. Rafraîchissez l'écran.";
    case "23514":
      return "La valeur saisie sort des limites acceptées par la base.";
    case "22003":
      return "La valeur saisie est trop grande pour la colonne.";
    default:
      return null;
  }
}

/**
 * Exécute le corps d'une action et rend le message d'erreur à afficher, ou
 * null si tout s'est bien passé.
 *
 * Le `redirect` de Next lève une exception de contrôle : il doit rester en
 * dehors de ce try, d'où le message rendu plutôt que redirigé ici.
 */
export async function executer(corps: () => Promise<void>): Promise<string | null> {
  try {
    await corps();
    return null;
  } catch (erreur) {
    if (erreur instanceof ErreurSaisie) {
      return erreur.message;
    }
    const traduit = messageBase(erreur);
    if (traduit !== null) {
      return traduit;
    }
    throw erreur;
  }
}

/** Revient sur l'écran en portant le message d'erreur. */
export function retourAvecErreur(chemin: string, message: string, suffixe = ""): never {
  const separateur = chemin.includes("?") ? "&" : "?";
  redirect(`${chemin}${separateur}erreur=${encodeURIComponent(message)}${suffixe}`);
}
