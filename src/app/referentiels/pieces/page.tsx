// Pièces élémentaires d'un coffret. Les codes viennent de la feuille
// « Composant » du classeur : GCD, GCG, DES, DSS, FON, TIR, et les composants
// optionnels (guillotines, berceaux, tasseaux, cales).

import { db } from "@/prisma/db";
import { Carte, EntetePage, EtiquetteStatut, MessageVide, Tableau } from "@/app/_ui/composants";
import { creerPiece, modifierPiece } from "./actions";

export default async function PagePieces({
  searchParams,
}: {
  readonly searchParams: Promise<{ readonly erreur?: string }>;
}) {
  const { erreur } = await searchParams;
  const pieces = await db.orm.public.Piece.orderBy((piece) => piece.code.asc()).all();

  return (
    <>
      <EntetePage fil="Référentiels · lot 1" titre="Pièces">
        Les pièces élémentaires qui composent un coffret. La nomenclature d&apos;une
        commande les reprend en calculant leurs dimensions ; elle n&apos;est jamais figée
        dans un catalogue.
      </EntetePage>

      {erreur !== undefined && <p className="erreur">{erreur}</p>}

      <Carte
        titre="Ajouter une pièce"
        description="Codes de la feuille « Composant » du classeur de référence."
      >
        <form action={creerPiece}>
          <div className="grille-champs">
            <div>
              <label htmlFor="code">Code</label>
              <input id="code" name="code" type="text" required placeholder="GCD" />
              <p className="aide">Unique. Mis en majuscules.</p>
            </div>
            <div style={{ gridColumn: "span 2" }}>
              <label htmlFor="libelle">Libellé</label>
              <input
                id="libelle"
                name="libelle"
                type="text"
                required
                placeholder="Grand côté droit"
              />
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
        titre={`${pieces.length} pièce${pieces.length > 1 ? "s" : ""}`}
        sansPadding
      >
        {pieces.length === 0 ? (
          <MessageVide>
            Aucune pièce. Les codes de la feuille « Composant » du classeur sont à reprendre
            ici.
          </MessageVide>
        ) : (
          <Tableau>
            <table>
              <thead>
                <tr>
                  <th style={{ width: "140px" }}>Code</th>
                  <th>Libellé</th>
                  <th>État</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {pieces.map((piece) => (
                  <tr key={piece.id}>
                    <td className="principal">
                      <form action={modifierPiece} id={`piece-${piece.id}`}>
                        <input type="hidden" name="id" value={piece.id} />
                        <input
                          name="code"
                          type="text"
                          className="compact"
                          defaultValue={piece.code}
                          aria-label={`Code de ${piece.code}`}
                        />
                      </form>
                    </td>
                    <td>
                      <input
                        name="libelle"
                        type="text"
                        className="compact"
                        form={`piece-${piece.id}`}
                        defaultValue={piece.libelle}
                        aria-label={`Libellé de ${piece.code}`}
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
                          form={`piece-${piece.id}`}
                          defaultChecked={piece.actif}
                          style={{ width: "auto" }}
                        />
                        {piece.actif ? (
                          <EtiquetteStatut statut="ok">active</EtiquetteStatut>
                        ) : (
                          <EtiquetteStatut statut="inactif">inactive</EtiquetteStatut>
                        )}
                      </label>
                    </td>
                    <td>
                      <button type="submit" className="compact" form={`piece-${piece.id}`}>
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
