import React, { useEffect, useMemo, useRef, useState } from 'react';
import { characters } from './characters.js';

const SWIPE_THRESHOLD = 120;
const VISIBLE_COUNT = 3;

const HeroPortrait = ({ hero }) => (
  <div className={`hero-canvas ${hero.heroClass}`}>
    <div className="glow" />
    <div className="backdrop" />
    <div className="cape" />
    <div className="prop primary" />
    <div className="prop secondary" />
    <div className="body" />
    <div className="body-overlay" />
    <div className="emblem" />
    <div className="belt" />
    <div className="shoulder left" />
    <div className="shoulder right" />
    <div className="accessory primary" />
    <div className="accessory secondary" />
    <div className="head">
      <div className="hair" />
      <div className="face" />
      <div className="mask" />
      <div className="tiara" />
      <div className="eye left" />
      <div className="eye right" />
    </div>
    <div className="foreground" />
  </div>
);

const App = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matches, setMatches] = useState([]);
  const [swipeDirection, setSwipeDirection] = useState(null);
  const [justMatched, setJustMatched] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const pointerRef = useRef({ startX: 0, pointerId: null });
  const offsetRef = useRef(0);
  const swipeTimerRef = useRef(null);

  useEffect(() => () => {
    if (swipeTimerRef.current) {
      clearTimeout(swipeTimerRef.current);
    }
  }, []);

  useEffect(() => {
    if (!justMatched) return undefined;
    const timeout = setTimeout(() => setJustMatched(null), 2200);
    return () => clearTimeout(timeout);
  }, [justMatched]);

  const activeCharacter = characters[currentIndex];

  const visibleProfiles = useMemo(
    () =>
      Array.from({ length: Math.min(VISIBLE_COUNT, characters.length) }, (_, idx) => ({
        character: characters[(currentIndex + idx) % characters.length],
        offset: idx,
      })),
    [currentIndex]
  );

  const registerMatch = (character) => {
    const timestamp = Date.now();
    const entry = { ...character, matchId: `${character.id}-${timestamp}` };
    setMatches((prev) => {
      const next = [entry, ...prev];
      return next.slice(0, 8);
    });
    setJustMatched(character);
  };

  const advanceDeck = () => {
    setCurrentIndex((prev) => (prev + 1) % characters.length);
  };

  const triggerSwipe = (direction, character) => {
    if (swipeDirection) return;
    setSwipeDirection(direction);
    if (direction === 'right') {
      registerMatch(character);
    }
    swipeTimerRef.current = setTimeout(() => {
      setSwipeDirection(null);
      setDragOffset(0);
      offsetRef.current = 0;
      setIsDragging(false);
      advanceDeck();
    }, 320);
  };

  const handlePointerDown = (event) => {
    if (swipeDirection || event.button === 2 || event.button === 1) return;
    event.preventDefault();
    pointerRef.current = {
      startX: event.clientX,
      pointerId: event.pointerId,
    };
    event.target.setPointerCapture?.(event.pointerId);
    setIsDragging(true);
    offsetRef.current = 0;
    setDragOffset(0);
  };

  const handlePointerMove = (event) => {
    if (!isDragging || pointerRef.current.pointerId !== event.pointerId) return;
    const offset = event.clientX - pointerRef.current.startX;
    offsetRef.current = offset;
    setDragOffset(offset);
    event.preventDefault();
  };

  const endDrag = (event) => {
    if (!isDragging) return;
    event.preventDefault?.();
    const offset = offsetRef.current;
    if (pointerRef.current.pointerId != null) {
      event?.target?.releasePointerCapture?.(pointerRef.current.pointerId);
    }
    setIsDragging(false);
    pointerRef.current = { startX: 0, pointerId: null };
    if (Math.abs(offset) > SWIPE_THRESHOLD) {
      triggerSwipe(offset > 0 ? 'right' : 'left', activeCharacter);
    } else {
      setDragOffset(0);
      offsetRef.current = 0;
    }
  };

  const handleAction = (direction) => {
    if (swipeDirection) return;
    triggerSwipe(direction, activeCharacter);
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="branding">
          <span className="logo-mark">⚡</span>
          <h1>SuperSwipe</h1>
        </div>
        <div className="match-counter" aria-live="polite">
          <span className="match-label">Matches</span>
          <span className="match-count">{matches.length}</span>
          <div className="match-avatar-strip">
            {matches.map((match) => (
              <div
                key={match.matchId}
                className={`match-avatar avatar-${match.id}`}
                style={{ background: match.avatarGradient }}
                title={match.name}
              >
                <span>{match.name.charAt(0)}</span>
              </div>
            ))}
          </div>
        </div>
      </header>

      <main className="content">
        <div className="card-stack">
          {visibleProfiles.map(({ character, offset }) => {
            const isActive = offset === 0;
            const cardClasses = [
              'profile-card',
              `layer-${offset}`,
              isActive ? 'active' : 'inactive',
              isActive && isDragging ? 'dragging' : '',
              isActive && swipeDirection ? `swipe-${swipeDirection}` : '',
            ]
              .filter(Boolean)
              .join(' ');

            const style =
              isActive && !swipeDirection
                ? {
                    transform: `translateX(${dragOffset}px) rotate(${dragOffset / 18}deg)`,
                  }
                : undefined;

            return (
              <div key={`${character.id}-${currentIndex}-${offset}`} className={cardClasses} style={style}
                onPointerDown={isActive ? handlePointerDown : undefined}
                onPointerMove={isActive ? handlePointerMove : undefined}
                onPointerUp={isActive ? endDrag : undefined}
                onPointerLeave={isActive ? endDrag : undefined}
                onPointerCancel={isActive ? endDrag : undefined}
              >
                <div className="photo-area">
                  <HeroPortrait hero={character} />
                  <div className="age-bubble">{character.age}</div>
                  <div className="overlay-info">
                    <div className="name-row">
                      <h2>{character.name}</h2>
                      <div className="badge-row">
                        {character.badges.map((badge) => (
                          <span key={badge} className="verify-badge">
                            <span className="verify-dot" />
                            {badge}
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="tagline">{character.tagline}</p>
                    <div className="location-row">
                      <span className="pin-icon" aria-hidden="true" />
                      <span>{character.location}</span>
                    </div>
                  </div>
                </div>
                <div className="details-area">
                  <p className="job">{character.job}</p>
                  <p className="bio">{character.bio}</p>
                  <div className="red-flags">
                    <h3>Red Flags</h3>
                    <ul>
                      {character.redFlags.map((flag) => (
                        <li key={flag}>{flag}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="action-bar">
          <button type="button" className="swipe-button nope" onClick={() => handleAction('left')}>
            <span aria-hidden="true">✖</span>
            <span className="sr-only">Pass</span>
          </button>
          <button type="button" className="swipe-button super-like" onClick={() => handleAction('right')}>
            <span aria-hidden="true">💥</span>
            <span className="sr-only">Super Like</span>
          </button>
        </div>
      </main>

      {justMatched && (
        <div className="match-toast" role="alert">
          <div className="toast-inner">
            <div className="toast-hero">
              <HeroPortrait hero={justMatched} />
            </div>
            <div className="toast-copy">
              <h2>It&apos;s a Match!</h2>
              <p>You and {justMatched.name} both swiped right. Prepare for heroic banter.</p>
            </div>
          </div>
          <div className="confetti">
            {Array.from({ length: 14 }).map((_, idx) => (
              <span key={idx} className={`confetti-piece piece-${idx + 1}`} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
