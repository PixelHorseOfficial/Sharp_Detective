import { useRef, useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import "./Achievement.css";

// ----------------------------------------------------------------------
// Achievement photos + captions — copy matches what's actually published
// on sharpdetectives.com's own achievements section, so this stays
// consistent with the rest of the site instead of reading as filler.
// ----------------------------------------------------------------------
const ACHIEVEMENTS = [
  {
    id: "wad-training",
    src: "/images/achievement1.png",
    caption: "Our CMD Training Members of the World Association of Detectives (USA)",
  },
  {
    id: "president-award",
    src: "/images/achievement2.png",
    caption:
      "President of India Award for being the Best Detective Agency given to Our CMD, Capt. D.K. Giri",
  },
  {
    id: "rotary-club",
    src: "/images/achievement3.png",
    caption: "Social Responsibility, Our Moto. Our CMD Capt. D.K. Giri, Past President of Rotary Club",
  },
  {
    id: "lifetime-achievement",
    src: "/images/achievement4.png",
    caption: "Life Time Achievement Award, as a Private Investigator Conferred to our CMD Capt. D.K. Giri",
    wide: true,
  },
];

const count = ACHIEVEMENTS.length;

export default function Achievement() {
  // `progress` is a continuous float in [0, count] tracking exactly how
  // far scroll has moved through the pinned range — not a stepped index.
  // Each card's "focus" (how enlarged/lifted/visible it is) is derived
  // from how close `progress` sits to that card's own slot, so the
  // transition eases smoothly with the scroll instead of jumping in one
  // step whenever a floor()'d index flips. `active` (the nearest whole
  // card) is kept only for discrete concerns — which dot is highlighted,
  // which card opens the lightbox on click.
  const [progress, setProgress] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const scrollpinRef = useRef(null);
  const rafRef = useRef(null);
  const isLightboxOpen = lightboxIndex !== null;

  const active = Math.min(count - 1, Math.max(0, Math.round(progress - 0.5)));

  // Below 900px only the active card is rendered at its natural size
  // (see the CSS media query) — the enlarge/lift transform is a desktop
  // concept for distinguishing the focused card among several visible
  // ones, so we skip applying it inline in compact mode rather than
  // have JS and CSS fight over the same transform property.
  const [isCompact, setIsCompact] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 900px)");
    const update = () => setIsCompact(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // ---- Scroll-driven activation ----
  // The wrapper is `count * 100vh` tall. Its inner content is `position:
  // sticky`, so it stays pinned on screen while the user scrolls through
  // that height. We read how far we've scrolled into that range on every
  // animation frame (not just on the raw scroll event) so the eased
  // focus value stays continuous and buttery even during fast/inertial
  // scrolling — this is what makes the effect feel smooth rather than
  // stepping between fixed states.
  useEffect(() => {
    const update = () => {
      rafRef.current = null;
      const el = scrollpinRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      if (total <= 0) return;
      const scrolled = -rect.top;
      const linear = Math.min(1, Math.max(0, scrolled / total));
      setProgress(linear * count);
    };

    const onScroll = () => {
      if (rafRef.current != null) return;
      rafRef.current = requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    update();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Clicking a card or a dot smooth-scrolls the page to the point where
  // that card becomes active, instead of moving the card itself.
  const goTo = useCallback((index) => {
    const el = scrollpinRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const total = rect.height - window.innerHeight;
    const wrapperDocTop = window.scrollY + rect.top;
    const targetProgress = (index + 0.5) / count;
    window.scrollTo({
      top: wrapperDocTop + targetProgress * total,
      behavior: "smooth",
    });
  }, []);

  const openLightbox = useCallback((index) => setLightboxIndex(index), []);
  const closeLightbox = useCallback(() => setLightboxIndex(null), []);

  // Clicking a card: if it isn't the focused one yet, scroll to focus it
  // first (matches the existing pinned-scroll behaviour). If it's already
  // the focused/enlarged card, a click zooms it into the full lightbox.
  const handleCardClick = useCallback(
    (index) => {
      if (index === active) {
        openLightbox(index);
      } else {
        goTo(index);
      }
    },
    [active, goTo, openLightbox]
  );

  // Escape closes the lightbox; lock page scroll while it's open so the
  // enlarged photo doesn't fight with the pinned-scroll section behind it.
  useEffect(() => {
    if (!isLightboxOpen) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") closeLightbox();
    };
    window.addEventListener("keydown", onKeyDown);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isLightboxOpen, closeLightbox]);

  return (
    <section className="achv">
      <div className="achv__bg" aria-hidden="true">
        <video
          className="achv__bg-video"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        >
          <source src="" type="video/mp4" />
        </video>
      </div>

      <div className="achv__grain" aria-hidden="true" />

      {/* Tall scroll range that drives which card is active while pinned */}
      <div
        className="achv__scrollpin"
        ref={scrollpinRef}
        style={{ height: `${count * 100}vh` }}
      >
        <div className="achv__sticky">
          <div className="achv__intro">
            <span className="achv__intro-eyebrow">Case File — Recognition</span>
            <h2 className="achv__intro-title">Decades of Trust, Documented</h2>
            <p className="achv__intro-copy">
              Four generations of investigators have built this agency's record —
              recognized by national bodies and honored with India's highest
              distinctions for private investigation.
            </p>

            {/* <div className="achv__stats">
              <div className="achv__stat">
                <strong>78</strong>
                <span>Years of Experience</span>
              </div>
              <div className="achv__stat">
                <strong>10,350+</strong>
                <span>Cases Closed</span>
              </div>
              <div className="achv__stat">
                <strong>99%</strong>
                <span>Success Rate</span>
              </div>
            </div> */}
          </div>

          <div className="achv__track">
            {ACHIEVEMENTS.map((item, i) => {
              const isActive = i === active;
              // Distance from this card's slot (centered at i + 0.5) to the
              // live scroll progress, converted into a 0→1 focus amount.
              // 1 = fully focused/enlarged, 0 = fully at rest. Everything in
              // between eases continuously as the user scrolls.
              const distance = Math.abs(progress - (i + 0.5));
              const focus = Math.max(0, 1 - Math.min(1, distance));
              const baseRotation = i % 2 === 0 ? 1.4 : -1.6;
              const rotation = baseRotation * (1 - focus);

              return (
                <figure
                  key={item.id}
                  className={`achv__card${item.wide ? " achv__card--wide" : ""}${
                    isActive ? " achv__card--active" : ""
                  }`}
                  style={{
                    "--focus": focus,
                    ...(isCompact
                      ? null
                      : { transform: `translateY(${(-28 * focus).toFixed(2)}px)` }),
                  }}
                  onClick={() => handleCardClick(i)}
                  aria-current={isActive ? "true" : undefined}
                >
                  <div
                    className="achv__frame"
                    style={
                      isCompact
                        ? undefined
                        : {
                            transform: `scale(${(1 + 0.22 * focus).toFixed(3)}) rotate(${rotation.toFixed(2)}deg)`,
                          }
                    }
                  >
                    <img src={item.src} alt={item.caption} loading="lazy" />
                    <span
                      className="achv__zoom-hint"
                      aria-hidden="true"
                      style={{ opacity: focus, transform: `scale(${(0.8 + 0.2 * focus).toFixed(2)})` }}
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
                        <path
                          d="M9 3H3v6M15 3h6v6M9 21H3v-6M15 21h6v-6"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  </div>

                  {/* Focused reveal: caption fades in/out continuously with focus */}
                  <figcaption className="achv__caption" style={{ opacity: focus }}>
                    {item.caption}
                  </figcaption>
                </figure>
              );
            })}
          </div>

          <div className="achv__dots" role="tablist" aria-label="Select exhibit">
            {ACHIEVEMENTS.map((item, i) => (
              <button
                key={item.id}
                className={`achv__dot${i === active ? " achv__dot--active" : ""}`}
                onClick={() => goTo(i)}
                role="tab"
                aria-selected={i === active}
                aria-label={`Show exhibit ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {isLightboxOpen &&
        createPortal(
          <div
            className="achv__lightbox"
            role="dialog"
            aria-modal="true"
            aria-label={ACHIEVEMENTS[lightboxIndex].caption}
            onClick={closeLightbox}
          >
            <button
              type="button"
              className="achv__lightbox-close"
              onClick={closeLightbox}
              aria-label="Close"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
                <path
                  d="M5 5l14 14M19 5L5 19"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>

            <figure
              className="achv__lightbox-figure"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={ACHIEVEMENTS[lightboxIndex].src}
                alt={ACHIEVEMENTS[lightboxIndex].caption}
                className="achv__lightbox-img"
              />
              <figcaption className="achv__lightbox-caption">
                {ACHIEVEMENTS[lightboxIndex].caption}
              </figcaption>
            </figure>

            {count > 1 && (
              <>
                <button
                  type="button"
                  className="achv__lightbox-nav achv__lightbox-nav--prev"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIndex((i) => (i - 1 + count) % count);
                  }}
                  aria-label="Previous exhibit"
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
                    <path
                      d="M15 5l-7 7 7 7"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  className="achv__lightbox-nav achv__lightbox-nav--next"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIndex((i) => (i + 1) % count);
                  }}
                  aria-label="Next exhibit"
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
                    <path
                      d="M9 5l7 7-7 7"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </>
            )}
          </div>,
          document.body
        )}
    </section>
  );
}