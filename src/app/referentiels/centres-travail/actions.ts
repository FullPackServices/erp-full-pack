"use server";

import { revalidatePath } from "next/cache";
import { caseCochee, texteObligatoire } from "@/lot1/saisie";
import { db } from "@/prisma/db";
import { executer, retourAvecErreur, valeur } from "@/app/_lib/action";

const CHEMIN = "/referentiels/centres-travail";

export async function creerCentreTravail(donnees: FormData): Promise<void> {
  const message = await executer(async () => {
    const nom = valeur(texteObligatoire(donnees.get("nom"), "Nom du centre de travail", 80));
    await db.orm.public.CentreTravail.create({ nom });
  });

  if (message !== null) {
    retourAvecErreur(CHEMIN, message);
  }
  revalidatePath(CHEMIN);
  revalidatePath("/referentiels/operations");
}

export async function modifierCentreTravail(donnees: FormData): Promise<void> {
  const message = await executer(async () => {
    const id = valeur(texteObligatoire(donnees.get("id"), "Identifiant", 40));
    const nom = valeur(texteObligatoire(donnees.get("nom"), "Nom du centre de travail", 80));
    const actif = caseCochee(donnees.get("actif"));
    await db.orm.public.CentreTravail.where({ id }).update({ nom, actif });
  });

  if (message !== null) {
    retourAvecErreur(CHEMIN, message);
  }
  revalidatePath(CHEMIN);
  revalidatePath("/referentiels/operations");
}
