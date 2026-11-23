// Matières premières : feuille « Mat Premiere » du classeur, alimentée par EBP.
//
// Écran de consultation seulement, et c'est volontaire : « EBP reste la source
// des articles et des prix. Le SaaS ne les saisit jamais à la main. » La
// descente des articles et des prix est le lot 5. Ouvrir ici un formulaire de
// saisie créerait une deuxième vérité sur les prix.

import { eurosFr, millimetresFr, nombreFr } from "@/lot1/format";
import { db } from "@/prisma/db";
import { Carte, EntetePage, EtiquetteStatut, MessageVide, Tableau } from "@/app/_ui/composants";

const JOURS_AVANT_PEREMPTION = 90;

const dateFr = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "long",
  timeZone: "Europe/Paris",
});

function ageEnJours(releve: Date): number {
  return Math.floor((Date.now() - releve.getTime()) / 86_400_000);
}

export default async function PageMatieres() {
  const [matieres, essences] = await Promise.all([
    db.orm.public.Matiere.orderBy((matiere) => matiere.designation.asc()).all(),
    db.orm.public.Essence.orderBy((essence) => essence.nom.asc()).all(),
  ]);

  const nomEssence = new Map(essences.map((essence) => [essence.id, essence.nom]));

  return (
    <>
      <EntetePage fil="Référentiels · lot 1" titre="Matières">
        Panneaux et planches achetés, avec leur coût et leur code EBP. Le coût matière se
        calcule sur les panneaux achetés, nombre entier et gâche incluse, jamais sur la
        consommation théorique.
      </EntetePage>

      <div className="encart">
        <h2>Consultation seulement</h2>
        <p>
          EBP reste la source des articles et des prix : ils descendent par le pont EBP
          (lot 5) et ne se saisissent pas ici. Un écran de saisie créerait une seconde
          vérité sur les prix, et le chiffrage ne saurait plus laquelle croire.
        </p>
      </div>

      <Carte
        titre={`${matieres.length} matière${matieres.length > 1 ? "s" : ""}`}
        description={`Un prix relevé il y a plus de ${JOURS_AVANT_PEREMPTION} jours est signalé comme périmé : un chiffrage doit savoir sur quoi il travaille.`}
        sansPadding
      >
        {matieres.length === 0 ? (
          <MessageVide>
            Aucune matière. Elles arriveront d&apos;EBP au lot 5. En attendant, la feuille
            « Mat Premiere » du classeur de référence en tient la liste.
          </MessageVide>
        ) : (
          <Tableau>
            <table>
              <thead>
                <tr>
                  <th>Désignation</th>
                  <th>Essence</th>
                  <th>Unité</th>
                  <th className="nombre">Longueur</th>
                  <th className="nombre">Largeur</th>
                  <th className="nombre">Épaisseur</th>
                  <th className="nombre">Coût</th>
                  <th>Code EBP</th>
                  <th>Prix relevé le</th>
                </tr>
              </thead>
              <tbody>
                {matieres.map((matiere) => {
                  const releve = matiere.prixReleveLe;
                  const perime = releve !== null && ageEnJours(releve) > JOURS_AVANT_PEREMPTION;

                  return (
                    <tr key={matiere.id}>
                      <td className="principal">
                        {matiere.designation}
                        {!matiere.actif && (
                          <>
                            {" "}
                            <EtiquetteStatut statut="inactif">inactive</EtiquetteStatut>
                          </>
                        )}
                      </td>
                      <td>{nomEssence.get(matiere.essenceId) ?? "—"}</td>
                      <td>{matiere.unite === "PLAQUE" ? "Plaque" : "Planche"}</td>
                      <td className="nombre">{millimetresFr(matiere.longueurMm)}</td>
                      <td className="nombre">{millimetresFr(matiere.largeurMm)}</td>
                      <td className="nombre">{millimetresFr(matiere.epaisseurMm)}</td>
                      <td className="nombre">{eurosFr(matiere.coutHT)}</td>
                      <td>{matiere.codeEbp ?? "—"}</td>
                      <td>
                        {releve === null ? (
                          <EtiquetteStatut statut="a-renseigner">jamais relevé</EtiquetteStatut>
                        ) : perime ? (
                          <EtiquetteStatut statut="bloquant">
                            {dateFr.format(releve)}
                          </EtiquetteStatut>
                        ) : (
                          dateFr.format(releve)
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Tableau>
        )}
      </Carte>

      <Carte
        titre={`${essences.length} essence${essences.length > 1 ? "s" : ""}`}
        description="Chêne, peuplier massif, CP peuplier, pin radiata, frêne, MDF, paulownia, céplin."
        sansPadding
      >
        {essences.length === 0 ? (
          <MessageVide>Aucune essence enregistrée.</MessageVide>
        ) : (
          <Tableau>
            <table>
              <thead>
                <tr>
                  <th>Essence</th>
                  <th className="nombre">Matières rattachées</th>
                </tr>
              </thead>
              <tbody>
                {essences.map((essence) => (
                  <tr key={essence.id}>
                    <td className="principal">{essence.nom}</td>
                    <td className="nombre">
                      {nombreFr(
                        String(
                          matieres.filter((matiere) => matiere.essenceId === essence.id).length,
                        ),
                      )}
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
