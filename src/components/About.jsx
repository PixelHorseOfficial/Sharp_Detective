import "./About.css";
import { useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function About() {
  const browserRef = useRef(null);
  const sectionRef = useRef(null);
  const badgeRef = useRef(null);
  const eyebrowRef = useRef(null);
  const titleRef = useRef(null);
  const copyRef = useRef(null);
  const quoteRef = useRef(null);
  const videoRef = useRef(null);
  const imgRef = useRef(null);

  const [videoFailed, setVideoFailed] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  useLayoutEffect(() => {
    const browser = browserRef.current;
    if (!browser) return;

    // Scope everything to this component so gsap.context() can clean it up
    // reliably (this also auto-reverts inline styles on unmount).
    const ctx = gsap.context(() => {
      // Initial fade-in and scale animation on mount (not scroll-linked,
      // so this always plays regardless of ScrollTrigger measurements).
      gsap.from(browser, {
        opacity: 0,
        scale: 0.88,
        duration: 1.4,
        ease: "power2.out",
      });

      // Staggered reveal for the text column as it scrolls into view.
      // Using fromTo + autoAlpha instead of "from" so the start state is
      // explicit and always resolves correctly even if layout shifts.
      gsap.fromTo(
        [eyebrowRef.current, titleRef.current, copyRef.current, quoteRef.current],
        { autoAlpha: 0, y: 24 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.9,
          ease: "power2.out",
          stagger: 0.15,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        }
      );

      // Animated count-up on the media badge (0 -> 78)
      const counter = { val: 0 };
      gsap.to(counter, {
        val: 78,
        duration: 1.8,
        ease: "power1.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 85%",
        },
        onUpdate: () => {
          if (badgeRef.current) {
            badgeRef.current.textContent = Math.floor(counter.val);
          }
        },
      });

      // Scroll-linked parallax + settle
      gsap.to(browser, {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top center",
          end: "bottom center",
          scrub: 1.2,
        },
        scale: 0.92,
        y: 80,
        opacity: 0.75,
      });

      // Mouse movement 3D tilt — desktop only
      const handleMouseMove = (e) => {
        const rect = browser.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const mouseX = (e.clientX - centerX) / rect.width;
        const mouseY = (e.clientY - centerY) / rect.height;

        const rotateX = mouseY * 6;
        const rotateY = mouseX * -6;
        const scale = 1 + Math.abs(mouseX) * 0.01 + Math.abs(mouseY) * 0.01;

        gsap.to(browser, {
          rotateX,
          rotateY,
          scale,
          duration: 1,
          ease: "power2.out",
        });
      };

      const handleMouseLeave = () => {
        gsap.to(browser, {
          rotateX: 0,
          rotateY: 0,
          scale: 1,
          duration: 1.2,
          ease: "power2.out",
        });
      };

      const isDesktop = window.innerWidth > 768;
      if (isDesktop) {
        window.addEventListener("mousemove", handleMouseMove);
        browser.addEventListener("mouseleave", handleMouseLeave);
      }

      // Cleanup for the manual listeners (gsap.context only cleans up
      // gsap/ScrollTrigger instances, not raw DOM listeners).
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        browser.removeEventListener("mouseleave", handleMouseLeave);
      };
    }, sectionRef);

    // --- The actual fix for the "text never appears" bug ---
    // The video and image load asynchronously and change the section's
    // height. If ScrollTrigger measures trigger positions before that
    // layout settles, it can miscalculate and leave the fromTo() tween
    // permanently stuck at its start state (autoAlpha: 0). Forcing a
    // refresh once media has actually loaded (and once more after full
    // window load) guarantees ScrollTrigger recalculates against the
    // final layout.
    const refresh = () => ScrollTrigger.refresh();

    const videoEl = videoRef.current;
    const imgEl = imgRef.current;

    videoEl?.addEventListener("loadeddata", refresh);
    imgEl?.addEventListener("load", refresh);
    window.addEventListener("load", refresh);

    // Also refresh shortly after mount as a safety net (covers fonts,
    // fallback states, etc. that don't fire the events above).
    const t = setTimeout(refresh, 300);

    return () => {
      videoEl?.removeEventListener("loadeddata", refresh);
      imgEl?.removeEventListener("load", refresh);
      window.removeEventListener("load", refresh);
      clearTimeout(t);
      ctx.revert();
    };
  }, []);

  return (
    <section className="abt" ref={sectionRef}>
      <div className="abt__bg-gradient" aria-hidden="true" />
      <div className="abt__bg-accent" aria-hidden="true" />

      <div className="abt__browser" ref={browserRef}>
        <div className="abt__browser-content">
          {/* Video background, with graceful fallback if it fails to load */}
          {!videoFailed && (
            <video
              ref={videoRef}
              src="/videos/about-intro.mp4"
              poster="/images/about-poster.jpg"
              autoPlay
              muted
              loop
              playsInline
              onError={() => setVideoFailed(true)}
              className="abt__video-bg"
            />
          )}
          {videoFailed && (
            <div
              className="abt__video-fallback"
              style={{ backgroundImage: "url(/images/about-poster.jpg)" }}
              aria-hidden="true"
            />
          )}

          <div className="abt__overlay" aria-hidden="true" />
          <div className="abt__grain" aria-hidden="true" />

          {/* ===== TWO-COLUMN LAYOUT: image left, text right ===== */}
          <div className="abt__grid">
            {/* ---- Media column ---- */}
            <div className="abt__media">
              {!imageFailed ? (
                <img
                  ref={imgRef}
                  src="/images/about.webp"
                  alt="Capt. D K Giri, CEO & Founder of Sharp Detectives"
                  onError={() => setImageFailed(true)}
                />
              ) : (
                <div className="abt__media-fallback" aria-hidden="true">
                  <span>S</span>
                </div>
              )}

              {/* Interactive animated stat badge */}
              <div className="abt__media-badge">
                <strong>
                  <span ref={badgeRef}>0</span>
                </strong>
                <span>Years of Legacy</span>
              </div>
            </div>

            {/* ---- Text column ---- */}
            <div className="abt__content">
              <span className="abt__eyebrow" ref={eyebrowRef}>
                Sharp Detectives Private Limited
              </span>
              <h2 className="abt__title" ref={titleRef}>
                The Most Trusted Detective Agency
              </h2>

              <p className="abt__copy" ref={copyRef}>
                Sharp Detectives Private Limited is a highly trusted and reputed
                private detective agency operating across India and internationally.
                Our &ldquo;Lineage of Succession&rdquo; of having 78 years of
                Experience as a Private Detective and Investigator has passed on
                &ldquo;Over the Four Generations&rdquo; and now lead by Our Global
                Chairman, Capt. D K Giri, who is presently also, The National
                President of The Association of Private Detectives in India (APDI)
                &amp; is also Honored for being The Best Private Detective and
                Private Investigator of India by, The President of India &amp; also
                the only one to be Honored with Life Time Achievement Award and
                many other National &amp; International Awards for Excellence in
                Detective Services as Private Investigators.
              </p>

              <div className="abt__quote" ref={quoteRef}>
                <span className="abt__quote-mark" aria-hidden="true">
                  &ldquo;
                </span>
                <p>
                  No matter what problem you face, you have found an
                  investigation agency that can help you.
                </p>
                <footer className="abt__quote-cite">
                  <span className="abt__quote-role">CEO &amp; Founder</span>
                  <span className="abt__quote-name">CAPT. D. K GIRI</span>
                </footer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}