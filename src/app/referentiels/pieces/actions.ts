"use server";

import { revalidatePath } from "next/cache";
import { caseCochee, texteObligatoire } from "@/lot1/saisie";
import { db } from "@/prisma/db";
import { executer, retourAvecErreur, valeur } from "@/app/_lib/action";

const CHEMIN = "/referentiels/pieces";

export async function creerPiece(donnees: FormData): Promise<void> {
  const message = await executer(async () => {
    const code = valeur(texteObligatoire(donnees.get("code"), "Code", 20));
    const libelle = valeur(texteObligatoire(donnees.get("libelle"), "Libellé", 120));
    await db.orm.public.Piece.create({ code: code.toUpperCase(), libelle });
  });

  if (message !== null) {
    retourAvecErreur(CHEMIN, message);
  }
  revalidatePath(CHEMIN);
}

export async function modifierPiece(donnees: FormData): Promise<void> {
  const message = await executer(async () => {
    const id = valeur(texteObligatoire(donnees.get("id"), "Identifiant", 40));
    const code = valeur(texteObligatoire(donnees.get("code"), "Code", 20));
    const libelle = valeur(texteObligatoire(donnees.get("libelle"), "Libellé", 120));
    const actif = caseCochee(donnees.get("actif"));
    await db.orm.public.Piece.where({ id }).update({
      code: code.toUpperCase(),
      libelle,
      actif,
    });
  });

  if (message !== null) {
    retourAvecErreur(CHEMIN, message);
  }
  revalidatePath(CHEMIN);
}
