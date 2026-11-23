"use server";

import { revalidatePath } from "next/cache";
import { decimalPositif, texteFacultatif, texteObligatoire } from "@/lot1/saisie";
import { db } from "@/prisma/db";
import { executer, retourAvecErreur, valeur } from "@/app/_lib/action";

const CHEMIN = "/referentiels/types-coupe";

function lireChamps(donnees: FormData) {
  return {
    nom: valeur(texteObligatoire(donnees.get("nom"), "Nom", 120)),
    explication: valeur(texteFacultatif(donnees.get("explication"), "Explication", 500)),
    surcoteDelignageMm: valeur(
      decimalPositif(donnees.get("surcoteDelignageMm"), "Surcote délignage"),
    ),
    surcoteLongueurMm: valeur(
      decimalPositif(donnees.get("surcoteLongueurMm"), "Surcote longueur"),
    ),
    retraitPlaqueLongueurMm: valeur(
      decimalPositif(donnees.get("retraitPlaqueLongueurMm"), "Retrait plaque longueur"),
    ),
    retraitPlaqueLargeurMm: valeur(
      decimalPositif(donnees.get("retraitPlaqueLargeurMm"), "Retrait plaque largeur"),
    ),
  };
}

export async function creerTypeCoupe(donnees: FormData): Promise<void> {
  const message = await executer(async () => {
    await db.orm.public.TypeCoupe.create(lireChamps(donnees));
  });

  if (message !== null) {
    retourAvecErreur(CHEMIN, message);
  }
  revalidatePath(CHEMIN);
}

export async function modifierTypeCoupe(donnees: FormData): Promise<void> {
  const message = await executer(async () => {
    const id = valeur(texteObligatoire(donnees.get("id"), "Identifiant", 40));
    await db.orm.public.TypeCoupe.where({ id }).update(lireChamps(donnees));
  });

  if (message !== null) {
    retourAvecErreur(CHEMIN, message);
  }
  revalidatePath(CHEMIN);
}
