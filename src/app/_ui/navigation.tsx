"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface Entree {
  readonly href: string;
  readonly libelle: string;
}

const REFERENTIELS: readonly Entree[] = [
  { href: "/referentiels/operations", libelle: "Opérations" },
  { href: "/referentiels/centres-travail", libelle: "Centres de travail" },
  { href: "/referentiels/pieces", libelle: "Pièces" },
  { href: "/referentiels/types-coupe", libelle: "Types de coupe" },
  { href: "/referentiels/matieres", libelle: "Matières" },
  { href: "/referentiels/clients", libelle: "Clients" },
  { href: "/referentiels/parametres", libelle: "Paramètres" },
];

const OUTILS: readonly Entree[] = [
  { href: "/simulateur-temps", libelle: "Simulateur de temps" },
];

// Les lots 2 à 6 sont affichés en grisé : la navigation montre la cible, sans
// laisser croire que l'écran existe.
const A_VENIR: readonly string[] = [
  "Modèles produit (lot 2)",
  "Commandes (lot 2)",
  "Débit et coût matière (lot 3)",
  "Atelier (lot 4)",
  "Pont EBP (lot 5)",
  "Coûts et KPI (lot 6)",
];

export function Navigation() {
  const chemin = usePathname();

  const lien = (entree: Entree) => (
    <Link
      key={entree.href}
      href={entree.href}
      aria-current={chemin === entree.href ? "page" : undefined}
    >
      {entree.libelle}
    </Link>
  );

  return (
    <nav className="navigation" aria-label="Navigation principale">
      <div className="marque">
        <strong>Full Pack Services</strong>
        <span>Coffrets et caisses bois</span>
      </div>

      <section>
        <Link href="/" aria-current={chemin === "/" ? "page" : undefined}>
          Tableau de bord
        </Link>
      </section>

      <section>
        <h2>Référentiels · lot 1</h2>
        {REFERENTIELS.map(lien)}
      </section>

      <section>
        <h2>Outils</h2>
        {OUTILS.map(lien)}
      </section>

      <section>
        <h2>À venir</h2>
        {A_VENIR.map((libelle) => (
          <span className="a-venir" key={libelle}>
            {libelle}
          </span>
        ))}
      </section>
    </nav>
  );
}
