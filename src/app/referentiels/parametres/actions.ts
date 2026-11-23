"use server";

import { revalidatePath } from "next/cache";
import {
  DECIMALES_PARAMETRE,
  definitionParametre,
} from "@/lot1/parametres";
import { decimalFacultatif, texteFacultatif, texteObligatoire } from "@/lot1/saisie";
import { db } from "@/prisma/db";
import { executer, retourAvecErreur, valeur } from "@/app/_lib/action";

const CHEMIN = "/referentiels/parametres";

/**
 * Enregistre la valeur d'un paramètre. La clé et la description ne se
 * modifient pas ici : elles viennent du code (src/lot1/parametres.ts), la
 * valeur appartient au gérant.
 */
export async function enregistrerParametre(donnees: FormData): Promise<void> {
  const message = await executer(async () => {
    const cle = valeur(texteObligatoire(donnees.get("cle"), "Clé du paramètre", 80));
    const definition = definitionParametre(cle);

    // Un paramètre décimal est validé et normalisé ici : « 42,50 » est stocké
    // « 42.5 », pour que le calcul qui le relit n'ait pas à s'en soucier.
    const saisie =
      definition?.format === "decimal"
        ? valeur(decimalFacultatif(donnees.get("valeur"), cle, DECIMALES_PARAMETRE))
        : valeur(texteFacultatif(donnees.get("valeur"), "Valeur", 200));

    await db.orm.public.Parametre.where({ cle }).update({ valeur: saisie ?? "" });
  });

  if (message !== null) {
    retourAvecErreur(CHEMIN, message);
  }
  revalidatePath(CHEMIN);
  revalidatePath("/");
  revalidatePath("/simulateur-temps");
}
