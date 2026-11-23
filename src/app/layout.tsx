import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Navigation } from "./_ui/navigation";
import "./globals.css";

// Tous les écrans lisent la base à chaque affichage : un référentiel figé au
// build afficherait un état périmé. Le rendu statique n'a pas de sens ici.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Full Pack Services",
  description: "Référentiels, production et chiffrage des coffrets bois sur mesure.",
};

export default function RacineLayout({ children }: { readonly children: ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <div className="application">
          <Navigation />
          <main className="contenu">{children}</main>
        </div>
      </body>
    </html>
  );
}
