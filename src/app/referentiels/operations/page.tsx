// Référentiel des 36 opérations.
//
// C'est l'écran de saisie le plus utile du lot 1 : le centre de travail de
// chaque opération est encore à renseigner, et il bloque le planning (lot 4)
// et la charge par centre.

import { CATEGORIES_OPERATION, type CategorieOperation } from "@/lot1/operations-csv";
import { minutesFr, nombreFr } from "@/lot1/format";
import { quantiteLancee, tempsPrevuOperationMin } from "@/lot1/temps";
import { db } from "@/prisma/db";
import { Carte, EntetePage, EtiquetteStatut, Tableau } from "@/app/_ui/composants";
import { affecterOperation, basculerActivationOperation } from "./actions";

const LIBELLE_CATEGORIE: Record<CategorieOperation, string> = {
  PREPARATION_DEBIT: "Préparation / débit",
  USINAGE: "Usinage",
  PONCAGE: "Ponçage",
  ASSEMBLAGE: "Assemblage",
  FINITION: "Finition",
  CONDITIONNEMENT: "Conditionnement",
};

const FILTRES = [
  { cle: "", libelle: "Toutes" },
  { cle: "sans-centre", libelle: "Sans centre de travail" },
  { cle: "sans-categorie", libelle: "Sans catégorie" },
  { cle: "inactives", libelle: "Désactivées" },
] as const;

const QUANTITE_PAR_DEFAUT = 150;

interface Recherche {
  readonly qte?: string;
  readonly filtre?: string;
  readonly erreur?: string;
}

export default async function PageOperations({
  searchParams,
}: {
  readonly searchParams: Promise<Recherche>;
}) {
  const { qte, filtre = "", erreur } = await searchParams;

  const quantiteCommandee = (() => {
    const lu = Number(qte);
    return Number.isInteger(lu) && lu >= 0 && lu <= 100000 ? lu : QUANTITE_PAR_DEFAUT;
  })();
  const lancee = quantiteLancee(quantiteCommandee);

  const [operations, centres] = await Promise.all([
    db.orm.public.Operation.orderBy((operation) => operation.nom.asc()).all(),
    db.orm.public.CentreTravail.orderBy((centre) => centre.nom.asc()).all(),
  ]);

  const nomCentre = new Map(centres.map((centre) => [centre.id, centre.nom]));

  const visibles = operations.filter((operation) => {
    switch (filtre) {
      case "sans-centre":
        return operation.centreTravailId === null && operation.actif;
      case "sans-categorie":
        return operation.categorie === null && operation.actif;
      case "inactives":
        return !operation.actif;
      default:
        return true;
    }
  });

  const sansCentre = operations.filter((o) => o.centreTravailId === null && o.actif).length;
  const sansCategorie = operations.filter((o) => o.categorie === null && o.actif).length;

  return (
    <>
      <EntetePage fil="Référentiels · lot 1" titre="Opérations">
        Les {operations.length} opérations de l&apos;atelier et leurs temps. Le temps prévu
        affiché s&apos;appuie sur la quantité de référence saisie ci-dessous.
      </EntetePage>

      {erreur !== undefined && <p className="erreur">{erreur}</p>}

      {(sansCentre > 0 || sansCategorie > 0) && (
        <div className="encart">
          <h2>À renseigner</h2>
          <ul>
            {sansCentre > 0 && (
              <li>
                {sansCentre} opération{sansCentre > 1 ? "s" : ""} sans centre de travail. Le
                planning et la charge par centre (lot 4) en dépendent.
              </li>
            )}
            {sansCategorie > 0 && (
              <li>
                {sansCategorie} opération{sansCategorie > 1 ? "s" : ""} sans catégorie. Utile
                pour regrouper la gamme par étape de fabrication.
              </li>
            )}
          </ul>
        </div>
      )}

      <Carte
        titre="Quantité de référence"
        description="Sert uniquement à l'affichage de la colonne « temps prévu ». Ne modifie rien en base."
      >
        <form method="get" className="barre-actions">
          <input type="hidden" name="filtre" value={filtre} />
          <div style={{ maxWidth: "190px" }}>
            <label htmlFor="qte">Quantité commandée</label>
            <input
              id="qte"
              name="qte"
              type="number"
              min={0}
              max={100000}
              step={1}
              className="nombre"
              defaultValue={quantiteCommandee}
            />
          </div>
          <button type="submit">Recalculer</button>
          <p className="aide">
            Quantité lancée : <strong>{nombreFr(String(lancee))}</strong> pièces
            {" "}(majoration de 5 %, arrondie au-dessus).
          </p>
        </form>
        <p className="formule">
          temps prévu = temps de réglage + temps unitaire × {nombreFr(String(lancee))}
        </p>
      </Carte>

      <Carte
        titre={`${visibles.length} opération${visibles.length > 1 ? "s" : ""} affichée${
          visibles.length > 1 ? "s" : ""
        }`}
        description="Les temps viennent de data/operations.csv et se modifient là-bas, puis « npm run seed ». La catégorie et le centre de travail se saisissent ici : le seed ne les écrase pas."
        actions={
          <div className="barre-actions">
            {FILTRES.map((option) => (
              <a
                key={option.cle}
                href={`/referentiels/operations?qte=${quantiteCommandee}${
                  option.cle === "" ? "" : `&filtre=${option.cle}`
                }`}
              >
                <button type="button" className={filtre === option.cle ? "principal compact" : "compact"}>
                  {option.libelle}
                </button>
              </a>
            ))}
          </div>
        }
        sansPadding
      >
        <Tableau>
          <table>
            <thead>
              <tr>
                <th>Opération</th>
                <th>Catégorie</th>
                <th>Centre de travail</th>
                <th className="nombre">Unitaire</th>
                <th className="nombre">Réglage</th>
                <th className="nombre">Opér.</th>
                <th className="nombre">Temps prévu</th>
                <th>État</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {visibles.map((operation) => {
                const prevu = tempsPrevuOperationMin(
                  {
                    nom: operation.nom,
                    tempsUnitaireMin: operation.tempsUnitaireMin,
                    tempsReglageMin: operation.tempsReglageMin,
                  },
                  lancee,
                );

                return (
                  <tr key={operation.id}>
                    <td className="principal">{operation.nom}</td>
                    <td>
                      <form action={affecterOperation} id={`affecter-${operation.id}`}>
                        <input type="hidden" name="id" value={operation.id} />
                        <select
                          name="categorie"
                          className="compact"
                          defaultValue={operation.categorie ?? ""}
                          aria-label={`Catégorie de ${operation.nom}`}
                        >
                          <option value="">— à renseigner —</option>
                          {CATEGORIES_OPERATION.map((categorie) => (
                            <option key={categorie} value={categorie}>
                              {LIBELLE_CATEGORIE[categorie]}
                            </option>
                          ))}
                        </select>
                      </form>
                    </td>
                    <td>
                      <select
                        name="centreTravailId"
                        className="compact"
                        form={`affecter-${operation.id}`}
                        defaultValue={operation.centreTravailId ?? ""}
                        aria-label={`Centre de travail de ${operation.nom}`}
                      >
                        <option value="">— à renseigner —</option>
                        {centres.map((centre) => (
                          <option key={centre.id} value={centre.id}>
                            {centre.nom}
                            {centre.actif ? "" : " (inactif)"}
                          </option>
                        ))}
                      </select>
                      {operation.centreTravailId !== null &&
                        !nomCentre.has(operation.centreTravailId) && (
                          <p className="aide">Centre introuvable.</p>
                        )}
                    </td>
                    <td className="nombre">{minutesFr(operation.tempsUnitaireMin)}</td>
                    <td className="nombre">{minutesFr(operation.tempsReglageMin)}</td>
                    <td className="nombre">{operation.nbOperateurs}</td>
                    <td className="nombre">
                      <strong>{minutesFr(prevu.toString())}</strong>
                    </td>
                    <td>
                      {operation.actif ? (
                        <EtiquetteStatut statut="ok">active</EtiquetteStatut>
                      ) : (
                        <EtiquetteStatut statut="inactif">désactivée</EtiquetteStatut>
                      )}
                    </td>
                    <td>
                      <div className="barre-actions">
                        <button
                          type="submit"
                          className="principal compact"
                          form={`affecter-${operation.id}`}
                        >
                          Enregistrer
                        </button>
                        <form action={basculerActivationOperation}>
                          <input type="hidden" name="id" value={operation.id} />
                          <input type="hidden" name="actif" value={operation.actif ? "false" : "true"} />
                          <button type="submit" className="discret">
                            {operation.actif ? "Désactiver" : "Réactiver"}
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Tableau>
      </Carte>
    </>
  );
}
