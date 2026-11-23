// Tableau de bord. État des référentiels du lot 1 et points encore ouverts.
//
// Les points « à trancher » du CLAUDE.md sont affichés avec leur état réel
// plutôt qu'en liste figée : un point se referme quand la donnée est là.

import { eurosFr, nombreFr } from "@/lot1/format";
import { CLE_TAUX_HORAIRE_ATELIER_EUR, decimalDuParametre } from "@/lot1/parametres";
import { db } from "@/prisma/db";
import { Carte, EntetePage, EtiquetteStatut } from "@/app/_ui/composants";

interface Compteur {
  readonly href: string;
  readonly etiquette: string;
  readonly valeur: number;
}

export default async function TableauDeBord() {
  const [operations, centres, pieces, typesCoupe, matieres, clients, parametres] =
    await Promise.all([
      db.orm.public.Operation.select("id", "centreTravailId", "categorie", "actif").all(),
      db.orm.public.CentreTravail.select("id").all(),
      db.orm.public.Piece.select("id").all(),
      db.orm.public.TypeCoupe.select("id").all(),
      db.orm.public.Matiere.select("id").all(),
      db.orm.public.Client.select("id").all(),
      db.orm.public.Parametre.select("cle", "valeur").all(),
    ]);

  const compteurs: readonly Compteur[] = [
    { href: "/referentiels/operations", etiquette: "Opérations", valeur: operations.length },
    {
      href: "/referentiels/centres-travail",
      etiquette: "Centres de travail",
      valeur: centres.length,
    },
    { href: "/referentiels/pieces", etiquette: "Pièces", valeur: pieces.length },
    { href: "/referentiels/types-coupe", etiquette: "Types de coupe", valeur: typesCoupe.length },
    { href: "/referentiels/matieres", etiquette: "Matières", valeur: matieres.length },
    { href: "/referentiels/clients", etiquette: "Clients", valeur: clients.length },
  ];

  const actives = operations.filter((operation) => operation.actif);
  const avecCentre = actives.filter((operation) => operation.centreTravailId !== null).length;
  const avecCategorie = actives.filter((operation) => operation.categorie !== null).length;

  const tauxHoraire = decimalDuParametre(
    parametres.find((parametre) => parametre.cle === CLE_TAUX_HORAIRE_ATELIER_EUR)?.valeur,
  );

  return (
    <>
      <EntetePage titre="Tableau de bord">
        Lot 1 en cours : les référentiels. Les écrans de commandes, de production et de
        chiffrage arrivent aux lots suivants.
      </EntetePage>

      <div className="compteurs">
        {compteurs.map((compteur) => (
          <a
            key={compteur.href}
            href={compteur.href}
            className={compteur.valeur === 0 ? "compteur vide" : "compteur"}
          >
            <div className="valeur">{nombreFr(String(compteur.valeur))}</div>
            <div className="etiquette">{compteur.etiquette}</div>
          </a>
        ))}
      </div>

      <Carte
        titre="Points à trancher"
        description="Repris du cadrage. Chacun bloque un calcul ou un écran d'un lot à venir."
        sansPadding
      >
        <div className="tableau-enveloppe">
          <table>
            <thead>
              <tr>
                <th>Point</th>
                <th>État</th>
                <th>Bloque</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="principal">
                  Taux horaire atelier
                  <p className="aide">
                    Paramètre <code>{CLE_TAUX_HORAIRE_ATELIER_EUR}</code>, en euros HT par heure.
                  </p>
                </td>
                <td>
                  {tauxHoraire === null ? (
                    <EtiquetteStatut statut="bloquant">à renseigner</EtiquetteStatut>
                  ) : (
                    <EtiquetteStatut statut="ok">
                      {eurosFr(tauxHoraire.toString())} / h
                    </EtiquetteStatut>
                  )}
                </td>
                <td className="discret-texte">
                  Coût de main-d&apos;œuvre et marge par commande (lot 6), et le coût affiché
                  par le simulateur.
                </td>
              </tr>
              <tr>
                <td className="principal">
                  Centre de travail de chaque opération
                  <p className="aide">
                    À renseigner dans <code>data/operations.csv</code> ou directement sur
                    l&apos;écran Opérations.
                  </p>
                </td>
                <td>
                  {avecCentre === actives.length && actives.length > 0 ? (
                    <EtiquetteStatut statut="ok">
                      {avecCentre} / {actives.length}
                    </EtiquetteStatut>
                  ) : (
                    <EtiquetteStatut statut="a-renseigner">
                      {avecCentre} / {actives.length} renseignés
                    </EtiquetteStatut>
                  )}
                </td>
                <td className="discret-texte">
                  Charge par centre de travail et ordonnancement (lot 4).
                </td>
              </tr>
              <tr>
                <td className="principal">
                  Catégorie de chaque opération
                  <p className="aide">
                    Les 6 étapes du processus : préparation, usinage, ponçage, assemblage,
                    finition, conditionnement.
                  </p>
                </td>
                <td>
                  {avecCategorie === actives.length && actives.length > 0 ? (
                    <EtiquetteStatut statut="ok">
                      {avecCategorie} / {actives.length}
                    </EtiquetteStatut>
                  ) : (
                    <EtiquetteStatut statut="a-renseigner">
                      {avecCategorie} / {actives.length} renseignées
                    </EtiquetteStatut>
                  )}
                </td>
                <td className="discret-texte">
                  Regroupement de la gamme par étape, confort de lecture surtout.
                </td>
              </tr>
              <tr>
                <td className="principal">
                  Formules de dimensions du coffret à charnière
                  <p className="aide">
                    À reprendre du classeur, feuille Prototype, avec la cellule d&apos;origine.
                  </p>
                </td>
                <td>
                  <EtiquetteStatut statut="a-renseigner">à fournir</EtiquetteStatut>
                </td>
                <td className="discret-texte">Modèle produit et nomenclature (lot 2).</td>
              </tr>
              <tr>
                <td className="principal">
                  Contrôle d&apos;accès par rôle
                  <p className="aide">
                    « Toute table touchant les prix est inaccessible au rôle opérateur. »
                    Aucune authentification n&apos;est encore en place : tous les écrans sont
                    ouverts.
                  </p>
                </td>
                <td>
                  <EtiquetteStatut statut="bloquant">non implémenté</EtiquetteStatut>
                </td>
                <td className="discret-texte">
                  Mise en service en atelier, et l&apos;écran Matières qui porte les coûts.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Carte>

      <Carte titre="Où en est le lot 1">
        <ul style={{ margin: 0, paddingLeft: "20px" }}>
          <li>
            Contrat de données des dix tables du lot 1, en Prisma 8, appliqué par migration.
          </li>
          <li>
            Référentiel des {nombreFr(String(operations.length))} opérations chargé depuis{" "}
            <code>data/operations.csv</code> par un seed relançable.
          </li>
          <li>
            Règle de temps portée et testée : quantité lancée majorée de 5 % et arrondie
            au-dessus, réglage compté une fois par opération.
          </li>
          <li>
            Écrans de consultation et de saisie des référentiels — ceux de la navigation de
            gauche.
          </li>
          <li className="discret-texte">
            Restent à faire : les matières et les types de coupe à charger, puis le modèle
            produit du lot 2.
          </li>
        </ul>
      </Carte>
    </>
  );
}
