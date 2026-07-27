import { useEffect, useRef, useState, useCallback } from "react";
import "./Reviews.css";

// ----------------------------------------------------------------------
// Client statements — names, cities, and star ratings match what's
// published in sharpdetectives.com's own testimonials section; the
// wording here is paraphrased rather than copied.
// ----------------------------------------------------------------------
const TESTIMONIALS = [
  {
    id: "pramod-hyderabad",
    name: "Pramod Sharma",
    city: "Hyderabad",
    rating: 5,
    quote:
      "They handled a confidential investigation for us with real professionalism, and the findings held up.",
  },
  {
    id: "thara-delhi",
    name: "Thara Kulkarni",
    city: "Delhi",
    rating: 4,
    quote: "Every update they gave us checked out. Discreet from start to finish.",
  },
  {
    id: "asha-hyderabad",
    name: "Asha Gupta",
    city: "Hyderabad",
    rating: 5,
    quote: "Ethical, on time, and the report was accurate down to the detail.",
  },
  {
    id: "rajesh-ahmedabad",
    name: "Rajesh P.",
    city: "Ahmedabad",
    rating: 5,
    quote:
      "Their agents in Ahmedabad kept us informed at every stage — clearly experienced investigators.",
  },
  {
    id: "anita-bangalore",
    name: "Anita R.",
    city: "Bangalore",
    rating: 5,
    quote: "Our case was resolved quietly and without any leaks. Exactly what we needed.",
  },
  {
    id: "mehul-mumbai",
    name: "Mehul D.",
    city: "Mumbai",
    rating: 4,
    quote: "Skilled team, kept everything confidential through the whole process.",
  },
  {
    id: "priya-chennai",
    name: "Priya N.",
    city: "Chennai",
    rating: 5,
    quote: "Sharp, verified reporting — one of the better agencies we've worked with in Chennai.",
  },
  {
    id: "subhajit-kolkata",
    name: "Subhajit D.",
    city: "Kolkata",
    rating: 5,
    quote: "Efficient and completely confidential handling of a sensitive case.",
  },
  {
    id: "jaspreet-punjab",
    name: "Jaspreet S.",
    city: "Punjab",
    rating: 5,
    quote: "Results-driven from day one — they stayed focused on getting us real answers.",
  },
  {
    id: "joseph-kerala",
    name: "Joseph K.",
    city: "Kerala",
    rating: 4,
    quote: "Professional and principled throughout — no shortcuts taken.",
  },
];

const AUTOPLAY_MS = 5000;
const VISIBLE = 3; // cards shown at once on desktop/tablet

// Deterministic "case number" per testimonial so it doesn't reshuffle
// on every re-render — derived from the item's own id rather than
// Math.random().
function caseNumberFor(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return String(1000 + (hash % 8999));
}

function Stars({ count }) {
  return (
    <div className="tst__stars" aria-label={`${count} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={`tst__star${i < count ? " tst__star--filled" : ""}`}>
          ★
        </span>
      ))}
    </div>
  );
}

// Card is wrapped in a "tilt" layer separate from the outer scale/opacity
// transform the carousel already applies — that way the 3D hover tilt
// (driven imperatively via CSS custom properties, not React state, so it
// stays at 60fps) never fights with the center-slide scale animation.
function Card({ item }) {
  const tiltRef = useRef(null);

  const handleMove = (e) => {
    const el = tiltRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    el.style.setProperty("--rx", `${(py - 0.5) * -9}deg`);
    el.style.setProperty("--ry", `${(px - 0.5) * 9}deg`);
    el.style.setProperty("--gx", `${px * 100}%`);
    el.style.setProperty("--gy", `${py * 100}%`);
  };

  const handleLeave = () => {
    const el = tiltRef.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  };

  return (
    <figure className="tst__card">
      <div
        className="tst__card-tilt"
        ref={tiltRef}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
      >
        <span className="tst__pin" aria-hidden="true" />
        <span className="tst__thread" aria-hidden="true" />

        <span className="tst__wit-tag">Witness Statement</span>
        <span className="tst__case-tag">Case No. {caseNumberFor(item.id)}</span>

        <span className="tst__quote-mark" aria-hidden="true">
          &ldquo;
        </span>
        <Stars count={item.rating} />
        <blockquote className="tst__quote">{item.quote}</blockquote>
        <figcaption className="tst__meta">
          <span className="tst__name">{item.name}</span>
          <span className="tst__city">{item.city}</span>
        </figcaption>

        <span className="tst__stamp-verified" aria-hidden="true">
          Verified
        </span>
      </div>
    </figure>
  );
}

export default function Testimonials() {
  const count = TESTIMONIALS.length;

  const [pos, setPos] = useState(VISIBLE);
  const [noTransition, setNoTransition] = useState(false);
  const [paused, setPaused] = useState(false);
  const [sliderEnabled, setSliderEnabled] = useState(true);

  const extended = [
    ...TESTIMONIALS.slice(count - VISIBLE),
    ...TESTIMONIALS,
    ...TESTIMONIALS.slice(0, VISIBLE),
  ];

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 860px)");
    const update = () => setSliderEnabled(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!sliderEnabled) return undefined;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (paused || prefersReducedMotion) return undefined;
    const id = setInterval(() => setPos((p) => p + 1), AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [paused, sliderEnabled]);

  const handleTransitionEnd = useCallback(() => {
    if (pos >= count + VISIBLE) {
      setNoTransition(true);
      setPos(pos - count);
    } else if (pos < VISIBLE) {
      setNoTransition(true);
      setPos(pos + count);
    }
  }, [pos, count]);

  useEffect(() => {
    if (!noTransition) return undefined;
    const id = requestAnimationFrame(() => setNoTransition(false));
    return () => cancelAnimationFrame(id);
  }, [noTransition]);

  const next = () => setPos((p) => p + 1);
  const prev = () => setPos((p) => p - 1);
  const goTo = (i) => setPos(i + VISIBLE);

  const activeDot = ((pos - VISIBLE) % count + count) % count;
  const centerSlide = pos + Math.floor(VISIBLE / 2);

  return (
    <section
      className="tst"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="tst__intro">
        <span className="tst__intro-eyebrow">Client Statements</span>
        <span className="tst__file-no">File No. SD-{count.toString().padStart(3, "0")}</span>
        <h2 className="tst__intro-title">
          Our Most Happy Clients
          <br />
          Testimonials
        </h2>
        <p className="tst__intro-copy">
          Clients across India and abroad share how their cases were handled —
          quietly, thoroughly, and to a close.
        </p>
      </div>

      <div className="tst__stage">
        <button
          type="button"
          className="tst__arrow tst__arrow--prev"
          onClick={prev}
          aria-label="Previous testimonial"
        >
          ‹
        </button>

        <div className="tst__viewport">
          <div
            className={`tst__track${noTransition ? " tst__track--no-transition" : ""}`}
            style={sliderEnabled ? { transform: `translateX(-${pos * (100 / VISIBLE)}%)` } : undefined}
            onTransitionEnd={handleTransitionEnd}
          >
            {(sliderEnabled ? extended : TESTIMONIALS).map((item, i) => (
              <div
                key={`${item.id}-${i}`}
                className={`tst__slide${
                  sliderEnabled && i === centerSlide ? " tst__slide--center" : ""
                }`}
              >
                <Card item={item} />
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          className="tst__arrow tst__arrow--next"
          onClick={next}
          aria-label="Next testimonial"
        >
          ›
        </button>
      </div>

      <div className="tst__reel">
        <span className="tst__reel-line" aria-hidden="true" />
        {TESTIMONIALS.map((item, i) => (
          <button
            key={item.id}
            type="button"
            className={`tst__dot${i === activeDot ? " tst__dot--active" : ""}`}
            onClick={() => goTo(i)}
            aria-label={`Go to testimonial ${i + 1}`}
            aria-current={i === activeDot}
          />
        ))}
      </div>
    </section>
  );
}