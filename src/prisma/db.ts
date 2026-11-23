// Point d'entrée runtime Prisma 8.
// Référence : skill prisma-8, references/runtime.md § Workflow — Basic db.ts
//
// Le client est un singleton de module : construit une fois pour la durée du
// process, jamais fermé dans une boucle de requêtes. Seuls les scripts courts
// (seed, tâches CI) appellent db.close().

import postgres from "@prisma/orm-postgres/runtime";
import { contractFromJson } from "@prisma/orm-postgres/static";
import type { Contract } from "./contract.d";
import contractJson from "./contract.json" with { type: "json" };

export const contract = contractFromJson<Contract>(contractJson);

export const db = postgres({
  contract,
  url: process.env["DATABASE_URL"],
});
