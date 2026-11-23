// Centres de travail : scie, toupie, ponceuse, cabine de finition, laser,
// poste d'assemblage. Ils portent la charge du planning (lot 4), donc chaque
// opération doit finir par en désigner un.

import { db } from "@/prisma/db";
import { Carte, EntetePage, EtiquetteStatut, MessageVide, Tableau } from "@/app/_ui/composants";
import { creerCentreTravail, modifierCentreTravail } from "./actions";

export default async function PageCentresTravail({
  searchParams,
}: {
  readonly searchParams: Promise<{ readonly erreur?: string }>;
}) {
  const { erreur } = await searchParams;

  const [centres, operations] = await Promise.all([
    db.orm.public.CentreTravail.orderBy((centre) => centre.nom.asc()).all(),
    db.orm.public.Operation.select("centreTravailId", "actif").all(),
  ]);

  const parCentre = new Map<string, number>();
  for (const operation of operations) {
    if (operation.centreTravailId !== null && operation.actif) {
      parCentre.set(operation.centreTravailId, (parCentre.get(operation.centreTravailId) ?? 0) + 1);
    }
  }

  return (
    <>
      <EntetePage fil="Référentiels · lot 1" titre="Centres de travail">
        Un centre de travail est un poste de l&apos;atelier. Il reçoit les opérations et
        portera la charge du planning.
      </EntetePage>

      {erreur !== undefined && <p className="erreur">{erreur}</p>}

      <Carte titre="Ajouter un centre de travail">
        <form action={creerCentreTravail} className="barre-actions">
          <div style={{ minWidth: "260px", flex: "1 1 260px" }}>
            <label htmlFor="nom">Nom</label>
            <input id="nom" name="nom" type="text" required placeholder="Scie à format" />
          </div>
          <button type="submit" className="principal">
            Ajouter
          </button>
        </form>
      </Carte>

      <Carte
        titre={`${centres.length} centre${centres.length > 1 ? "s" : ""} de travail`}
        description="Un centre désactivé reste visible sur les opérations déjà affectées, mais n'est plus proposé pour de nouvelles affectations."
        sansPadding
      >
        {centres.length === 0 ? (
          <MessageVide>
            Aucun centre de travail. Ajoutez-les au-dessus, puis affectez-les depuis
            l&apos;écran Opérations.
          </MessageVide>
        ) : (
          <Tableau>
            <table>
              <thead>
                <tr>
                  <th>Nom</th>
                  <th className="nombre">Opérations affectées</th>
                  <th>État</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {centres.map((centre) => (
                  <tr key={centre.id}>
                    <td className="principal">
                      <form action={modifierCentreTravail} id={`centre-${centre.id}`}>
                        <input type="hidden" name="id" value={centre.id} />
                        <input
                          name="nom"
                          type="text"
                          className="compact"
                          defaultValue={centre.nom}
                          aria-label={`Nom du centre ${centre.nom}`}
                        />
                      </form>
                    </td>
                    <td className="nombre">{parCentre.get(centre.id) ?? 0}</td>
                    <td>
                      <label
                        style={{
                          display: "flex",
                          gap: "6px",
                          alignItems: "center",
                          fontWeight: 400,
                          marginBottom: 0,
                        }}
                      >
                        <input
                          type="checkbox"
                          name="actif"
                          form={`centre-${centre.id}`}
                          defaultChecked={centre.actif}
                          style={{ width: "auto" }}
                        />
                        {centre.actif ? (
                          <EtiquetteStatut statut="ok">actif</EtiquetteStatut>
                        ) : (
                          <EtiquetteStatut statut="inactif">inactif</EtiquetteStatut>
                        )}
                      </label>
                    </td>
                    <td>
                      <button type="submit" className="compact" form={`centre-${centre.id}`}>
                        Enregistrer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Tableau>
        )}
      </Carte>
    </>
  );
}
