// Paramètres de calcul.
//
// Le seed crée les clés manquantes et tient leur description à jour, mais ne
// réécrit jamais une valeur saisie ici.

import { PARAMETRES_ATTENDUS } from "@/lot1/parametres";
import { db } from "@/prisma/db";
import { Carte, EntetePage, EtiquetteStatut, MessageVide, Tableau } from "@/app/_ui/composants";
import { enregistrerParametre } from "./actions";

export default async function PageParametres({
  searchParams,
}: {
  readonly searchParams: Promise<{ readonly erreur?: string }>;
}) {
  const { erreur } = await searchParams;
  const parametres = await db.orm.public.Parametre.orderBy((p) => p.cle.asc()).all();

  const metadonnees = new Map(
    PARAMETRES_ATTENDUS.map((definition) => [definition.cle, definition]),
  );
  const manquants = PARAMETRES_ATTENDUS.filter(
    (definition) => !parametres.some((parametre) => parametre.cle === definition.cle),
  );

  return (
    <>
      <EntetePage fil="Référentiels · lot 1" titre="Paramètres">
        Les constantes de calcul. Une valeur laissée vide bloque le calcul qui en dépend,
        plutôt que de produire un chiffre faux.
      </EntetePage>

      {erreur !== undefined && <p className="erreur">{erreur}</p>}

      {manquants.length > 0 && (
        <div className="encart">
          <h2>Clés attendues absentes de la base</h2>
          <ul>
            {manquants.map((definition) => (
              <li key={definition.cle}>
                <code>{definition.cle}</code> — lancez <code>npm run seed</code> pour la
                créer.
              </li>
            ))}
          </ul>
        </div>
      )}

      <Carte titre={`${parametres.length} paramètre${parametres.length > 1 ? "s" : ""}`} sansPadding>
        {parametres.length === 0 ? (
          <MessageVide>
            Aucun paramètre. Lancez <code>npm run seed</code> pour créer les clés attendues.
          </MessageVide>
        ) : (
          <Tableau>
            <table>
              <thead>
                <tr>
                  <th>Clé</th>
                  <th style={{ width: "180px" }}>Valeur</th>
                  <th>Rôle</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {parametres.map((parametre) => {
                  const definition = metadonnees.get(parametre.cle);
                  const vide = parametre.valeur.trim() === "";
                  const bloquant = vide && definition?.bloquant === true;

                  return (
                    <tr key={parametre.cle}>
                      <td className="principal">
                        <code>{parametre.cle}</code>
                        {bloquant && (
                          <>
                            {" "}
                            <EtiquetteStatut statut="bloquant">bloquant</EtiquetteStatut>
                          </>
                        )}
                        {vide && !bloquant && (
                          <>
                            {" "}
                            <EtiquetteStatut statut="a-renseigner">à renseigner</EtiquetteStatut>
                          </>
                        )}
                      </td>
                      <td>
                        <form action={enregistrerParametre} id={`param-${parametre.cle}`}>
                          <input type="hidden" name="cle" value={parametre.cle} />
                          <input
                            name="valeur"
                            type="text"
                            className="compact nombre"
                            defaultValue={parametre.valeur}
                            aria-label={`Valeur de ${parametre.cle}`}
                            placeholder="à renseigner"
                          />
                        </form>
                      </td>
                      <td className="discret-texte">
                        {parametre.description ?? definition?.description ?? "—"}
                      </td>
                      <td>
                        <button
                          type="submit"
                          className="compact"
                          form={`param-${parametre.cle}`}
                        >
                          Enregistrer
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Tableau>
        )}
      </Carte>
    </>
  );
}
