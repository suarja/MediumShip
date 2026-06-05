/* global React, ReactDOM, DesignCanvas, DCSection, DCArtboard,
   HomeFeed, ArticleDetail, Library,
   BHome, BDossiers, BDossierDetail, BThematiques, BThematiqueDetail, BInsight,
   BEntity, BProgramme, BCompare, BArticle, BVideo, BPodcast, BLibrary, BSources, BProfile,
   SwitchPlate, PrimitivesPlate, ChangeStaysPlate, VerticalsPlate */

// boussole-app.jsx — planche "Boussole citoyenne 2027" (documentary vertical variant)

const PH_W = 320, PH_H = 680;

function App() {
  return (
    <DesignCanvas>
      {/* 01 · Base générique */}
      <DCSection id="base"
        title="01 · Base générique"
        subtitle="Le prototype média white-label existant — point de départ, inchangé.">
        <DCArtboard id="g-home" label="Home média" width={PH_W} height={PH_H}><HomeFeed /></DCArtboard>
        <DCArtboard id="g-article" label="Article / contenu" width={PH_W} height={PH_H}><ArticleDetail /></DCArtboard>
        <DCArtboard id="g-library" label="Bibliothèque" width={PH_W} height={PH_H}><Library /></DCArtboard>
      </DCSection>

      {/* 02 · Switch vers la verticale */}
      <DCSection id="switch"
        title="02 · Switch vers la verticale"
        subtitle="Le même socle, le même CMS — un vocabulaire et une organisation documentaires.">
        <DCArtboard id="switch-plate" label="Primitives → Boussole 2027" width={1180} height={560}>
          <SwitchPlate />
        </DCArtboard>
      </DCSection>

      {/* 03 · Frames Boussole citoyenne 2027 */}
      <DCSection id="boussole"
        title="03 · Démo — Boussole citoyenne 2027"
        subtitle="App documentaire citoyenne : comprendre les programmes, propositions et enjeux avant de se faire une opinion. Sobre, sourcée, neutre.">
        <DCArtboard id="b-home" label="A · Home — Comprendre 2027" width={PH_W} height={PH_H}><BHome /></DCArtboard>
        <DCArtboard id="b-dossiers" label="B · Dossiers / Collections" width={PH_W} height={PH_H}><BDossiers /></DCArtboard>
        <DCArtboard id="b-dossier" label="C · Détail collection" width={PH_W} height={PH_H}><BDossierDetail /></DCArtboard>
        <DCArtboard id="b-thematiques" label="D · Thématiques" width={PH_W} height={PH_H}><BThematiques /></DCArtboard>
        <DCArtboard id="b-thematique" label="E · Détail thématique" width={PH_W} height={PH_H}><BThematiqueDetail /></DCArtboard>
        <DCArtboard id="b-insight" label="F · Proposition / Insight" width={PH_W} height={PH_H}><BInsight /></DCArtboard>
        <DCArtboard id="b-entity" label="G · Fiche candidat / Entity" width={PH_W} height={PH_H}><BEntity /></DCArtboard>
        <DCArtboard id="b-programme" label="H · Programme" width={PH_W} height={PH_H}><BProgramme /></DCArtboard>
        <DCArtboard id="b-compare" label="I · Comparaison (neutre)" width={PH_W} height={PH_H}><BCompare /></DCArtboard>
        <DCArtboard id="b-article" label="J · Article (lié)" width={PH_W} height={PH_H}><BArticle /></DCArtboard>
        <DCArtboard id="b-video" label="K · Vidéo explicative" width={PH_W} height={PH_H}><BVideo /></DCArtboard>
        <DCArtboard id="b-podcast" label="L · Podcast" width={PH_W} height={PH_H}><BPodcast /></DCArtboard>
        <DCArtboard id="b-library" label="M · Bibliothèque" width={PH_W} height={PH_H}><BLibrary /></DCArtboard>
        <DCArtboard id="b-sources" label="N · Sources" width={PH_W} height={PH_H}><BSources /></DCArtboard>
        <DCArtboard id="b-profile" label="O · Profil / préférences" width={PH_W} height={PH_H}><BProfile /></DCArtboard>
      </DCSection>

      {/* 04 · Primitives réutilisables */}
      <DCSection id="prims"
        title="04 · Primitives réutilisables"
        subtitle="Les composants partagés entre toutes les verticales.">
        <DCArtboard id="prims-plate" label="Composants" width={1200} height={680}>
          <PrimitivesPlate />
        </DCArtboard>
      </DCSection>

      {/* 05 · Ce qui change / ce qui reste */}
      <DCSection id="change"
        title="05 · Ce qui change / ce qui reste"
        subtitle="Le socle ne bouge pas ; seule la couche éditoriale est redéclinée.">
        <DCArtboard id="change-plate" label="Socle vs déclinaison" width={1100} height={560}>
          <ChangeStaysPlate />
        </DCArtboard>
      </DCSection>

      {/* 06 · Autres verticales possibles */}
      <DCSection id="verticals"
        title="06 · Autres verticales possibles"
        subtitle="Les mêmes primitives, d'autres marchés.">
        <DCArtboard id="verticals-plate" label="Média · Éducation · Sport · Business" width={1200} height={460}>
          <VerticalsPlate />
        </DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
