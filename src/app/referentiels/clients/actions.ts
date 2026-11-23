"use server";

import { revalidatePath } from "next/cache";
import { caseCochee, texteFacultatif, texteObligatoire } from "@/lot1/saisie";
import { db } from "@/prisma/db";
import { executer, retourAvecErreur, valeur } from "@/app/_lib/action";

const CHEMIN = "/referentiels/clients";

export async function creerClient(donnees: FormData): Promise<void> {
  const message = await executer(async () => {
    const nom = valeur(texteObligatoire(donnees.get("nom"), "Nom du client", 160));
    const codeEbp = valeur(texteFacultatif(donnees.get("codeEbp"), "Code EBP", 40));
    await db.orm.public.Client.create({ nom, codeEbp });
  });

  if (message !== null) {
    retourAvecErreur(CHEMIN, message);
  }
  revalidatePath(CHEMIN);
}

export async function modifierClient(donnees: FormData): Promise<void> {
  const message = await executer(async () => {
    const id = valeur(texteObligatoire(donnees.get("id"), "Identifiant", 40));
    const nom = valeur(texteObligatoire(donnees.get("nom"), "Nom du client", 160));
    const codeEbp = valeur(texteFacultatif(donnees.get("codeEbp"), "Code EBP", 40));
    const actif = caseCochee(donnees.get("actif"));
    await db.orm.public.Client.where({ id }).update({ nom, codeEbp, actif });
  });

  if (message !== null) {
    retourAvecErreur(CHEMIN, message);
  }
  revalidatePath(CHEMIN);
}
