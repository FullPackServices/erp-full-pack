"use server";

import { revalidatePath } from "next/cache";
import { CATEGORIES_OPERATION } from "@/lot1/operations-csv";
import { choixFacultatif, texteFacultatif, texteObligatoire } from "@/lot1/saisie";
import { db } from "@/prisma/db";
import { executer, retourAvecErreur, valeur } from "@/app/_lib/action";

const CHEMIN = "/referentiels/operations";

/**
 * Affecte une opération : catégorie et centre de travail.
 *
 * Ce sont les deux seuls champs que l'écran modifie. Les temps viennent de
 * data/operations.csv, qui en reste la source — les écrire ici serait les
 * perdre au prochain `npm run seed`.
 */
export async function affecterOperation(donnees: FormData): Promise<void> {
  const message = await executer(async () => {
    const id = valeur(texteObligatoire(donnees.get("id"), "Identifiant de l'opération"));
    const categorie = valeur(
      choixFacultatif(donnees.get("categorie"), "Catégorie", CATEGORIES_OPERATION),
    );
    const centreTravailId = valeur(
      texteFacultatif(donnees.get("centreTravailId"), "Centre de travail", 40),
    );

    await db.orm.public.Operation.where({ id }).update({ categorie, centreTravailId });
  });

  if (message !== null) {
    retourAvecErreur(CHEMIN, message);
  }
  revalidatePath(CHEMIN);
}

/** Active ou désactive une opération sans la supprimer : l'historique compte. */
export async function basculerActivationOperation(donnees: FormData): Promise<void> {
  const message = await executer(async () => {
    const id = valeur(texteObligatoire(donnees.get("id"), "Identifiant de l'opération"));
    const actif = donnees.get("actif") === "true";
    await db.orm.public.Operation.where({ id }).update({ actif });
  });

  if (message !== null) {
    retourAvecErreur(CHEMIN, message);
  }
  revalidatePath(CHEMIN);
}
