// Clients. Le code EBP est un champ de correspondance, jamais une clé : le
// jour où EBP part, seul le module de pont est à remplacer.

import { db } from "@/prisma/db";
import { Carte, EntetePage, EtiquetteStatut, MessageVide, Tableau } from "@/app/_ui/composants";
import { creerClient, modifierClient } from "./actions";

export default async function PageClients({
  searchParams,
}: {
  readonly searchParams: Promise<{ readonly erreur?: string }>;
}) {
  const { erreur } = await searchParams;
  const clients = await db.orm.public.Client.orderBy((client) => client.nom.asc()).all();
  const sansCodeEbp = clients.filter((client) => client.codeEbp === null).length;

  return (
    <>
      <EntetePage fil="Référentiels · lot 1" titre="Clients">
        Le code EBP sert à rapprocher un client de sa fiche EBP. Ce n&apos;est jamais une clé
        primaire : il peut rester vide et changer sans conséquence sur le reste.
      </EntetePage>

      {erreur !== undefined && <p className="erreur">{erreur}</p>}

      <Carte titre="Ajouter un client">
        <form action={creerClient}>
          <div className="grille-champs">
            <div style={{ gridColumn: "span 2" }}>
              <label htmlFor="nom">Nom</label>
              <input id="nom" name="nom" type="text" required placeholder="Champagne ..." />
            </div>
            <div>
              <label htmlFor="codeEbp">Code EBP</label>
              <input id="codeEbp" name="codeEbp" type="text" placeholder="CL00123" />
              <p className="aide">Facultatif.</p>
            </div>
            <div>
              <button type="submit" className="principal">
                Ajouter
              </button>
            </div>
          </div>
        </form>
      </Carte>

      <Carte
        titre={`${clients.length} client${clients.length > 1 ? "s" : ""}`}
        description={
          sansCodeEbp > 0
            ? `${sansCodeEbp} sans code EBP : le rapprochement se fera au lot 5.`
            : undefined
        }
        sansPadding
      >
        {clients.length === 0 ? (
          <MessageVide>Aucun client enregistré.</MessageVide>
        ) : (
          <Tableau>
            <table>
              <thead>
                <tr>
                  <th>Nom</th>
                  <th style={{ width: "160px" }}>Code EBP</th>
                  <th>État</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.id}>
                    <td className="principal">
                      <form action={modifierClient} id={`client-${client.id}`}>
                        <input type="hidden" name="id" value={client.id} />
                        <input
                          name="nom"
                          type="text"
                          className="compact"
                          defaultValue={client.nom}
                          aria-label={`Nom de ${client.nom}`}
                        />
                      </form>
                    </td>
                    <td>
                      <input
                        name="codeEbp"
                        type="text"
                        className="compact"
                        form={`client-${client.id}`}
                        defaultValue={client.codeEbp ?? ""}
                        aria-label={`Code EBP de ${client.nom}`}
                      />
                    </td>
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
                          form={`client-${client.id}`}
                          defaultChecked={client.actif}
                          style={{ width: "auto" }}
                        />
                        {client.actif ? (
                          <EtiquetteStatut statut="ok">actif</EtiquetteStatut>
                        ) : (
                          <EtiquetteStatut statut="inactif">inactif</EtiquetteStatut>
                        )}
                      </label>
                    </td>
                    <td>
                      <button type="submit" className="compact" form={`client-${client.id}`}>
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
