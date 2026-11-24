import { useRef, useState } from "react";
import { Play } from "lucide-react";
import { NETFLIX_MOVIES, type NetflixMovie } from "../../data/netflix";

const PREVIEW_CLIP_SECONDS = 10;

function MoviePreview({ movie, featured = false }: { movie: NetflixMovie; featured?: boolean }) {
  const [hovered, setHovered] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const handleMouseEnter = () => {
    if (movie.previewVideoUrl) {
      setHovered(true);
    }
  };

  const handleMouseLeave = () => {
    setHovered(false);
    setVideoReady(false);
  };

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const v = e.currentTarget;
    if (v.currentTime >= PREVIEW_CLIP_SECONDS) {
      v.currentTime = 0;
    }
  };

  return (
    <a
      className={`dw-nf-preview${featured ? " dw-nf-preview--featured" : ""}`}
      href={movie.netflixUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Watch ${movie.title} on Netflix`}
      title={`Watch ${movie.title} on Netflix`}
      style={{ backgroundColor: movie.accentColor }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <img src={movie.backdropSrc ?? movie.posterSrc} alt="" draggable={false} />
      {hovered && movie.previewVideoUrl && (
        <video
          ref={videoRef}
          src={movie.previewVideoUrl}
          autoPlay
          muted
          playsInline
          preload="auto"
          onCanPlay={() => setVideoReady(true)}
          onTimeUpdate={handleTimeUpdate}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: videoReady ? 1 : 0,
            transition: "opacity 220ms ease",
            pointerEvents: "none",
          }}
        />
      )}
      {!videoReady && (
        <span className="dw-nf-play"><Play fill="currentColor" strokeWidth={1} /></span>
      )}
    </a>
  );
}

export function NetflixDesktopWidget({ onOpen }: { onOpen: () => void }) {
  const [selectedId, setSelectedId] = useState(NETFLIX_MOVIES[0].id);
  const selected = NETFLIX_MOVIES.find(movie => movie.id === selectedId) ?? NETFLIX_MOVIES[0];
  const remaining = NETFLIX_MOVIES.filter(movie => movie.id !== selected.id);
  const previews = remaining.slice(0, 2);
  const posters = remaining.slice(2);

  return (
    <div className="dw-card dw-netflix-library">
      <div className="dw-nf-main">
        <header className="dw-nf-header">
          <button className="dw-nf-logo" onClick={onOpen} aria-label="Open Netflix library">NETFLIX</button>
        </header>
        <MoviePreview movie={selected} featured />
        <div className="dw-nf-previews">{previews.map(movie => <MoviePreview key={movie.id} movie={movie} />)}</div>
      </div>
      <div className="dw-nf-posters" data-widget-scroll aria-label="Choose a featured movie" tabIndex={0}>
        {[0, 1].map(column => (
          <div className="dw-nf-poster-column" key={column}>
            {posters.filter((_, index) => index % 2 === column).map(movie => (
              <button key={movie.id} className="dw-nf-poster" onClick={() => setSelectedId(movie.id)} aria-label={`Feature ${movie.title}`} title={movie.title} style={{ backgroundColor: movie.accentColor }}>
                <img src={movie.posterSrc ?? movie.backdropSrc} alt={movie.title} draggable={false} loading="lazy" />
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
