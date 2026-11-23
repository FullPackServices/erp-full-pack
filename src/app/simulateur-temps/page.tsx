// Simulateur de temps : la règle de calcul rendue visible.
//
// On choisit une gamme et une quantité commandée, et l'écran montre le détail
// du calcul opération par opération. Sert à vérifier une commande avant de la
// lancer, et à contrôler le portage des formules du classeur.
//
// La gamme est saisie, jamais déduite : rien ici ne devine l'enchaînement des
// opérations. Au lot 2, elle viendra du modèle produit.

import Decimal from "decimal.js";
import { dureeFr, eurosFr, minutesFr, nombreFr, pourcentageFr } from "@/lot1/format";
import {
  CLE_MAJORATION_LANCEMENT,
  CLE_TAUX_HORAIRE_ATELIER_EUR,
  decimalDuParametre,
} from "@/lot1/parametres";
import {
  MAJORATION_LANCEMENT_DEFAUT,
  quantiteLancee,
  tempsPrevuOperationMin,
} from "@/lot1/temps";
import { db } from "@/prisma/db";
import { Carte, EntetePage, EtiquetteStatut, Tableau } from "@/app/_ui/composants";

const QUANTITE_PAR_DEFAUT = 150;

interface Recherche {
  readonly qte?: string;
  readonly op?: string | readonly string[];
}

export default async function PageSimulateur({
  searchParams,
}: {
  readonly searchParams: Promise<Recherche>;
}) {
  const { qte, op } = await searchParams;

  const quantiteCommandee = (() => {
    const lu = Number(qte);
    return Number.isInteger(lu) && lu >= 0 && lu <= 100000 ? lu : QUANTITE_PAR_DEFAUT;
  })();

  const choisies = new Set(typeof op === "string" ? [op] : Array.isArray(op) ? op : []);

  const [operations, parametres] = await Promise.all([
    db.orm.public.Operation.orderBy((operation) => operation.nom.asc()).all(),
    db.orm.public.Parametre.select("cle", "valeur").all(),
  ]);

  const valeurParametre = (cle: string): string =>
    parametres.find((parametre) => parametre.cle === cle)?.valeur.trim() ?? "";

  const majorationSaisie = decimalDuParametre(valeurParametre(CLE_MAJORATION_LANCEMENT));
  const majoration = majorationSaisie ?? new Decimal(MAJORATION_LANCEMENT_DEFAUT);
  const tauxHoraire = decimalDuParametre(valeurParametre(CLE_TAUX_HORAIRE_ATELIER_EUR));

  const lancee = quantiteLancee(quantiteCommandee, majoration);
  const gamme = operations.filter((operation) => choisies.has(operation.id));

  const lignes = gamme.map((operation) => {
    const prevu = tempsPrevuOperationMin(
      {
        nom: operation.nom,
        tempsUnitaireMin: operation.tempsUnitaireMin,
        tempsReglageMin: operation.tempsReglageMin,
      },
      lancee,
    );
    return {
      operation,
      prevu,
      mainOeuvre: prevu.mul(operation.nbOperateurs),
    };
  });

  const totalPoste = lignes.reduce((somme, ligne) => somme.plus(ligne.prevu), new Decimal(0));
  const totalMainOeuvre = lignes.reduce(
    (somme, ligne) => somme.plus(ligne.mainOeuvre),
    new Decimal(0),
  );
  const totalReglage = lignes.reduce(
    (somme, ligne) => somme.plus(new Decimal(ligne.operation.tempsReglageMin)),
    new Decimal(0),
  );

  const coutMainOeuvre =
    tauxHoraire === null ? null : totalMainOeuvre.div(60).mul(tauxHoraire);

  const exemple = operations
    .filter((operation) => operation.nom === "Délignage" || operation.nom === "Collage Chêne")
    .map((operation) => `op=${encodeURIComponent(operation.id)}`)
    .join("&");

  return (
    <>
      <EntetePage fil="Outils" titre="Simulateur de temps">
        Le détail du calcul, opération par opération. La gamme se choisit à la main : rien
        ici ne la déduit.
      </EntetePage>

      <Carte titre="Hypothèses">
        <form method="get">
          <div className="grille-champs">
            <div>
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
            <div>
              <label>Majoration de lancement</label>
              <p style={{ margin: "6px 0 0", fontWeight: 600 }}>
                {pourcentageFr(majoration.toString())}
              </p>
              <p className="aide">
                Paramètre <code>{CLE_MAJORATION_LANCEMENT}</code>
                {majorationSaisie === null && " (non renseigné : valeur par défaut)"}
              </p>
            </div>
            <div>
              <label>Quantité lancée</label>
              <p style={{ margin: "6px 0 0", fontWeight: 600, fontSize: "19px" }}>
                {nombreFr(String(lancee))} pièces
              </p>
              <p className="aide">
                ceil({nombreFr(String(quantiteCommandee))} × {nombreFr(
                  majoration.plus(1).toString(),
                )})
              </p>
            </div>
          </div>

          <div
            className="tableau-enveloppe"
            style={{ marginTop: "18px", borderTop: "1px solid var(--bord)", paddingTop: "14px" }}
          >
            <label>Gamme — cochez les opérations de l&apos;ordre de fabrication</label>
            <p className="aide" style={{ margin: "2px 0 0" }}>
              L&apos;ordre d&apos;enchaînement n&apos;est pas saisi ici : il viendra du modèle
              produit (lot 2). Il ne change pas le temps total.
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(258px, 1fr))",
                gap: "2px 16px",
                marginTop: "7px",
              }}
            >
              {operations.map((operation) => (
                <label
                  key={operation.id}
                  style={{
                    display: "flex",
                    gap: "7px",
                    alignItems: "center",
                    fontWeight: 400,
                    fontSize: "13.5px",
                    marginBottom: 0,
                    color: operation.actif ? "var(--texte)" : "var(--texte-doux)",
                  }}
                >
                  <input
                    type="checkbox"
                    name="op"
                    value={operation.id}
                    defaultChecked={choisies.has(operation.id)}
                    style={{ width: "auto" }}
                  />
                  <span>
                    {operation.nom}{" "}
                    <span className="discret-texte">
                      ({nombreFr(operation.tempsUnitaireMin, 0, 2)} min)
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="barre-actions" style={{ marginTop: "16px" }}>
            <button type="submit" className="principal">
              Calculer
            </button>
            <a href={`/simulateur-temps?qte=150&${exemple}`}>
              <button type="button">Charger l&apos;exemple : 150 coffrets, délignage + collage chêne</button>
            </a>
          </div>
        </form>
      </Carte>

      {lignes.length === 0 ? (
        <Carte titre="Résultat">
          <p className="discret-texte" style={{ margin: 0 }}>
            Choisissez au moins une opération pour voir le calcul.
          </p>
        </Carte>
      ) : (
        <Carte
          titre="Détail du calcul"
          description="Le temps de réglage est compté une fois par opération, jamais par pièce."
          sansPadding
        >
          <Tableau>
            <table>
              <thead>
                <tr>
                  <th>Opération</th>
                  <th className="nombre">Réglage</th>
                  <th className="nombre">Unitaire</th>
                  <th className="nombre">× {nombreFr(String(lancee))} pièces</th>
                  <th className="nombre">Temps prévu</th>
                  <th className="nombre">Opér.</th>
                  <th className="nombre">Heures main-d&apos;œuvre</th>
                </tr>
              </thead>
              <tbody>
                {lignes.map(({ operation, prevu, mainOeuvre }) => (
                  <tr key={operation.id}>
                    <td className="principal">{operation.nom}</td>
                    <td className="nombre">{nombreFr(operation.tempsReglageMin, 0, 2)}</td>
                    <td className="nombre">{nombreFr(operation.tempsUnitaireMin, 0, 2)}</td>
                    <td className="nombre discret-texte">
                      {nombreFr(new Decimal(operation.tempsUnitaireMin).mul(lancee).toString(), 0, 2)}
                    </td>
                    <td className="nombre">
                      <strong>{minutesFr(prevu.toString())}</strong>
                    </td>
                    <td className="nombre">{operation.nbOperateurs}</td>
                    <td className="nombre">{dureeFr(mainOeuvre.toString())}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td>
                    Total — {lignes.length} opération{lignes.length > 1 ? "s" : ""}
                  </td>
                  <td className="nombre">{nombreFr(totalReglage.toString(), 0, 2)}</td>
                  <td colSpan={2} />
                  <td className="nombre">{minutesFr(totalPoste.toString())}</td>
                  <td />
                  <td className="nombre">{dureeFr(totalMainOeuvre.toString())}</td>
                </tr>
              </tfoot>
            </table>
          </Tableau>

          <div className="corps" style={{ borderTop: "1px solid var(--bord)" }}>
            <div className="compteurs" style={{ marginBottom: 0 }}>
              <div className="compteur">
                <div className="valeur">{dureeFr(totalPoste.toString())}</div>
                <div className="etiquette">Temps prévu au poste</div>
              </div>
              <div className="compteur">
                <div className="valeur">{nombreFr(totalReglage.toString(), 0, 2)}</div>
                <div className="etiquette">Minutes de réglage, comptées une fois</div>
              </div>
              <div className={coutMainOeuvre === null ? "compteur vide" : "compteur"}>
                <div className="valeur">
                  {coutMainOeuvre === null ? "—" : eurosFr(coutMainOeuvre.toFixed(2))}
                </div>
                <div className="etiquette">
                  {tauxHoraire === null ? (
                    <EtiquetteStatut statut="bloquant">taux horaire à renseigner</EtiquetteStatut>
                  ) : (
                    `Coût main-d'œuvre à ${eurosFr(tauxHoraire.toString())}/h`
                  )}
                </div>
              </div>
            </div>
            {coutMainOeuvre === null && (
              <p className="aide" style={{ marginTop: "12px" }}>
                Le coût de main-d&apos;œuvre a besoin du paramètre{" "}
                <code>{CLE_TAUX_HORAIRE_ATELIER_EUR}</code>. Tant qu&apos;il est vide, aucun
                chiffre n&apos;est affiché plutôt qu&apos;un chiffre faux.
              </p>
            )}
          </div>
        </Carte>
      )}
    </>
  );
}
