import { Phone, StatusBar } from "./phone";

export function PodcastPlayer({ large = false }: { large?: boolean }) {
  return (
    <Phone large={large} label="Podcast player">
      <StatusBar dark />
      <div className="app-content" style={{ background: "#161412" }}>
        <div className="player">
          <div className="player__top">
            <span>↓ Lecture en cours</span>
            <span>•••</span>
          </div>
          <div className="player__art">
            <div className="ep">La fin de l'économie d'attention.</div>
          </div>
          <div className="player__ep-label">SAISON 04 · ÉPISODE 11</div>
          <h3 className="player__title">La fin de l'économie d'attention.</h3>
          <p className="player__show">Mediumship · Le grand entretien</p>
          <div className="player__bar" />
          <div className="player__time">
            <span>16:04</span>
            <span>−25:38</span>
          </div>
          <div className="player__ctrls">
            <span className="b">15</span>
            <span className="b">⏮</span>
            <span className="play">▶</span>
            <span className="b">⏭</span>
            <span className="b">30</span>
          </div>
          <div className="player__extras">
            <span>♡ Aimer</span>
            <span>↗ Partager</span>
            <span>✎ Notes</span>
          </div>
        </div>
      </div>
    </Phone>
  );
}
