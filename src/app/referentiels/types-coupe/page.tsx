// Types de coupe : feuille « Type de Coupe » du classeur.
//
// Les surcotes s'ajoutent à la pièce finie pour obtenir la dimension de débit,
// les retraits se déduisent de la plaque. Ces quatre valeurs entrent
// directement dans le calcul des bandes et du nombre de panneaux (lot 3), donc
// une erreur ici se voit sur le coût matière.

import { millimetresFr } from "@/lot1/format";
import { db } from "@/prisma/db";
import { Carte, EntetePage, MessageVide, Tableau } from "@/app/_ui/composants";
import { creerTypeCoupe, modifierTypeCoupe } from "./actions";

const CHAMPS_DIMENSIONS = [
  { nom: "surcoteDelignageMm", libelle: "Surcote délignage", aide: "Ajoutée à la largeur" },
  { nom: "surcoteLongueurMm", libelle: "Surcote longueur", aide: "Ajoutée à la longueur" },
  {
    nom: "retraitPlaqueLongueurMm",
    libelle: "Retrait plaque longueur",
    aide: "Retiré de la plaque",
  },
  {
    nom: "retraitPlaqueLargeurMm",
    libelle: "Retrait plaque largeur",
    aide: "Retiré de la plaque",
  },
] as const;

export default async function PageTypesCoupe({
  searchParams,
}: {
  readonly searchParams: Promise<{ readonly erreur?: string }>;
}) {
  const { erreur } = await searchParams;
  const types = await db.orm.public.TypeCoupe.orderBy((type) => type.nom.asc()).all();

  return (
    <>
      <EntetePage fil="Référentiels · lot 1" titre="Types de coupe">
        Surcotes de débit et retraits de plaque, en millimètres. Repris de la feuille
        « Type de Coupe » du classeur de référence.
      </EntetePage>

      {erreur !== undefined && <p className="erreur">{erreur}</p>}

      <Carte titre="Ajouter un type de coupe">
        <form action={creerTypeCoupe}>
          <div className="grille-champs">
            <div style={{ gridColumn: "span 2" }}>
              <label htmlFor="nom">Nom</label>
              <input
                id="nom"
                name="nom"
                type="text"
                required
                placeholder="Coupe droite + rainurage"
              />
            </div>
            {CHAMPS_DIMENSIONS.map((champ) => (
              <div key={champ.nom}>
                <label htmlFor={champ.nom}>{champ.libelle} (mm)</label>
                <input
                  id={champ.nom}
                  name={champ.nom}
                  type="text"
                  inputMode="decimal"
                  required
                  className="nombre"
                  defaultValue="0"
                />
                <p className="aide">{champ.aide}</p>
              </div>
            ))}
            <div style={{ gridColumn: "span 2" }}>
              <label htmlFor="explication">Explication</label>
              <input id="explication" name="explication" type="text" />
            </div>
            <div>
              <button type="submit" className="principal">
                Ajouter
              </button>
            </div>
          </div>
        </form>
      </Carte>

      <Carte titre={`${types.length} type${types.length > 1 ? "s" : ""} de coupe`} sansPadding>
        {types.length === 0 ? (
          <MessageVide>
            Aucun type de coupe. Les valeurs de la feuille « Type de Coupe » du classeur sont
            à reprendre ici avant le portage des formules de débit (lot 3).
          </MessageVide>
        ) : (
          <Tableau>
            <table>
              <thead>
                <tr>
                  <th>Nom</th>
                  <th className="nombre">Surcote délignage</th>
                  <th className="nombre">Surcote longueur</th>
                  <th className="nombre">Retrait pl. long.</th>
                  <th className="nombre">Retrait pl. larg.</th>
                  <th>Explication</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {types.map((type) => (
                  <tr key={type.id}>
                    <td className="principal">
                      <form action={modifierTypeCoupe} id={`coupe-${type.id}`}>
                        <input type="hidden" name="id" value={type.id} />
                        <input
                          name="nom"
                          type="text"
                          className="compact"
                          defaultValue={type.nom}
                          aria-label={`Nom de ${type.nom}`}
                        />
                      </form>
                    </td>
                    {CHAMPS_DIMENSIONS.map((champ) => (
                      <td className="nombre" key={champ.nom}>
                        <input
                          name={champ.nom}
                          type="text"
                          inputMode="decimal"
                          className="compact nombre"
                          form={`coupe-${type.id}`}
                          defaultValue={type[champ.nom]}
                          aria-label={`${champ.libelle} de ${type.nom}`}
                          style={{ width: "76px" }}
                        />
                        <span className="aide"> {millimetresFr(type[champ.nom])}</span>
                      </td>
                    ))}
                    <td>
                      <input
                        name="explication"
                        type="text"
                        className="compact"
                        form={`coupe-${type.id}`}
                        defaultValue={type.explication ?? ""}
                        aria-label={`Explication de ${type.nom}`}
                      />
                    </td>
                    <td>
                      <button type="submit" className="compact" form={`coupe-${type.id}`}>
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
