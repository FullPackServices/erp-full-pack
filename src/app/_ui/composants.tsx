import type { ReactNode } from "react";

export function EntetePage({
  fil,
  titre,
  children,
}: {
  readonly fil?: string;
  readonly titre: string;
  readonly children?: ReactNode;
}) {
  return (
    <div className="entete-page">
      {fil !== undefined && <div className="fil">{fil}</div>}
      <h1>{titre}</h1>
      {children !== undefined && <p>{children}</p>}
    </div>
  );
}

export function Carte({
  titre,
  description,
  actions,
  children,
  sansPadding = false,
}: {
  readonly titre?: string;
  readonly description?: ReactNode;
  readonly actions?: ReactNode;
  readonly children: ReactNode;
  readonly sansPadding?: boolean;
}) {
  return (
    <section className="carte">
      {titre !== undefined && (
        <header>
          <div>
            <h2>{titre}</h2>
            {description !== undefined && <p>{description}</p>}
          </div>
          {actions}
        </header>
      )}
      {sansPadding ? children : <div className="corps">{children}</div>}
    </section>
  );
}

export function Tableau({ children }: { readonly children: ReactNode }) {
  return <div className="tableau-enveloppe">{children}</div>;
}

export function MessageVide({ children }: { readonly children: ReactNode }) {
  return <p className="vide">{children}</p>;
}

type Statut = "ok" | "a-renseigner" | "bloquant" | "inactif";

export function EtiquetteStatut({
  statut,
  children,
}: {
  readonly statut: Statut;
  readonly children: ReactNode;
}) {
  return <span className={`etiquette-statut ${statut}`}>{children}</span>;
}
