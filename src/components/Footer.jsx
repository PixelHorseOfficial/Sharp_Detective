import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Phone, Mail, MapPin, ArrowRight, MessageCircle } from "lucide-react";
import "./Footer.css";

gsap.registerPlugin(ScrollTrigger);

const FOOTER_NAV = [
  {
    heading: "Explore",
    links: [
      "About Us",
      "Personal Investigations",
      "Corporate Investigations",
      "Missing Investigations",
      "Matrimonial Investigations",
      "Para Normal Investigations",
      "Security Guarding Services",
      "Our Charges",
      "Privacy Policy",
      "Terms & Conditions",
      "Disclaimer",
      "Blog",
      "Join Our Team",
      "Contact Us",
    ],
  },
  {
    heading: "Personal Services",
    links: [
      "Pre Marital Investigations",
      "Post Marital Investigation",
      "Missing Person Investigation",
      "Shadowing / Investigation",
    ],
  },
  {
    heading: "Corporate Services",
    links: [
      "Business Information",
      "Asset Verification Services",
      "Debugging Services",
      "Sting Operations",
      "Litigation Support",
      "Patent & Trademark Investigations",
      "Financial Credibility",
      "Due Diligence Services",
    ],
  },
];

const CONTACT_DETAILS = [
  { icon: Phone, value: "+91 94 99999 007" },
  { icon: Mail, value: "weneedhelp007@gmail.com" },
  {
    icon: MapPin,
    value: "Gunrock Enclave, Karkhana, Secunderabad, Telangana, 500009",
  },
];

const VISITOR_COUNT = "260404402";
const DIGIT_HEIGHT = 34; // px — must match .visitor-digit / .visitor-digit-strip cell height
const SPIN_LOOPS = 2; // how many full 0-9 cycles the odometer spins before landing

// Builds the vertical digit strip (0-9 repeated so the odometer can spin
// through a couple of loops before settling on the real digit).
function buildStrip() {
  const cells = [];
  for (let loop = 0; loop <= SPIN_LOOPS; loop++) {
    for (let d = 0; d <= 9; d++) cells.push(d);
  }
  return cells;
}

export default function Footer() {
  const footerRef = useRef(null);
  const fogRef = useRef(null);
  const brandRef = useRef(null);
  const contactRowRefs = useRef([]);
  const colRefs = useRef([]);
  const visitorHeadingRef = useRef(null);
  const digitStripRefs = useRef([]);
  const bottomRef = useRef(null);
  const dividerRef = useRef(null);
  const callBtnRef = useRef(null);
  const whatsappBtnRef = useRef(null);
  const linkRefs = useRef([]);
  const cleanupFns = useRef([]);

  const strip = buildStrip();

  useEffect(() => {
    const ctx = gsap.context(() => {
      // ---- Ambient fog drift, always running ----
      gsap.to(fogRef.current, {
        backgroundPosition: "60px 30px, -40px -20px",
        duration: 18,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      // ---- Initial states ----
      gsap.set(brandRef.current, { opacity: 0, y: 20 });
      gsap.set(contactRowRefs.current, { opacity: 0, x: -16 });
      gsap.set(colRefs.current.map((c) => c?.heading), {
        opacity: 0,
        y: 14,
      });
      gsap.set(colRefs.current.map((c) => c?.underline), {
        scaleX: 0,
        transformOrigin: "left center",
      });
      const allLinkItems = footerRef.current.querySelectorAll(
        ".site-footer__links li"
      );
      gsap.set(allLinkItems, { opacity: 0, x: -18 });
      gsap.set(visitorHeadingRef.current, { opacity: 0, y: 12 });
      gsap.set(dividerRef.current, { scaleX: 0, transformOrigin: "center" });
      gsap.set(bottomRef.current, { opacity: 0, y: 12 });
      gsap.set([callBtnRef.current, whatsappBtnRef.current], {
        opacity: 0,
        scale: 0.3,
        y: 40,
      });
      digitStripRefs.current.forEach((el) => {
        if (el) gsap.set(el, { y: 0 });
      });

      // ---- Master reveal timeline, fires when the footer scrolls in ----
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: footerRef.current,
          start: "top 88%",
          toggleActions: "play none none reverse",
        },
      });

      tl.to(brandRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power3.out",
      })
        .to(
          contactRowRefs.current,
          {
            opacity: 1,
            x: 0,
            duration: 0.5,
            stagger: 0.1,
            ease: "power2.out",
          },
          "-=0.3"
        )
        .to(
          colRefs.current.map((c) => c?.heading),
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
            stagger: 0.1,
            ease: "power2.out",
          },
          "-=0.35"
        )
        .to(
          colRefs.current.map((c) => c?.underline),
          {
            scaleX: 1,
            duration: 0.5,
            stagger: 0.1,
            ease: "power3.out",
          },
          "-=0.4"
        )
        .to(
          allLinkItems,
          {
            opacity: 1,
            x: 0,
            duration: 0.45,
            stagger: 0.025,
            ease: "power2.out",
          },
          "-=0.35"
        )
        .to(
          visitorHeadingRef.current,
          { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" },
          "-=0.15"
        )
        .add(() => spinOdometer(), "-=0.1")
        .to(
          dividerRef.current,
          { scaleX: 1, duration: 0.6, ease: "power3.inOut" },
          "-=0.4"
        )
        .to(
          bottomRef.current,
          { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" },
          "-=0.3"
        )
        .to(
          [callBtnRef.current, whatsappBtnRef.current],
          {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.7,
            stagger: 0.15,
            ease: "back.out(2.4)",
            onComplete: startFabPulse,
          },
          "-=0.5"
        );

      // ---- Odometer spin for the visitor counter ----
      function spinOdometer() {
        digitStripRefs.current.forEach((el, i) => {
          if (!el) return;
          const digit = Number(VISITOR_COUNT[i]);
          const targetIndex = SPIN_LOOPS * 10 + digit;
          gsap.fromTo(
            el,
            { y: 0 },
            {
              y: -(targetIndex * DIGIT_HEIGHT),
              duration: 1.6 + i * 0.06,
              ease: "power2.inOut",
              delay: i * 0.045,
            }
          );
        });
      }

      // ---- Idle pulse rings on the floating action buttons ----
      function startFabPulse() {
        [callBtnRef.current, whatsappBtnRef.current].forEach((btn, i) => {
          if (!btn) return;
          const ring = btn.querySelector(".fab-ring");
          if (!ring) return;
          gsap.fromTo(
            ring,
            { scale: 1, opacity: 0.55 },
            {
              scale: 1.8,
              opacity: 0,
              duration: 1.8,
              repeat: -1,
              delay: i * 0.6,
              ease: "power1.out",
            }
          );
        });
      }

      // ---- Magnetic hover on nav links ----
      linkRefs.current.forEach((el) => {
        if (!el) return;
        const xTo = gsap.quickTo(el, "x", { duration: 0.3, ease: "power3" });
        const yTo = gsap.quickTo(el, "y", { duration: 0.3, ease: "power3" });

        const handleMove = (e) => {
          const rect = el.getBoundingClientRect();
          xTo((e.clientX - (rect.left + rect.width / 2)) * 0.18);
          yTo((e.clientY - (rect.top + rect.height / 2)) * 0.3);
        };
        const handleLeave = () => {
          xTo(0);
          yTo(0);
        };

        el.addEventListener("mousemove", handleMove);
        el.addEventListener("mouseleave", handleLeave);
        cleanupFns.current.push(() => {
          el.removeEventListener("mousemove", handleMove);
          el.removeEventListener("mouseleave", handleLeave);
        });
      });

      // ---- Magnetic hover on floating action buttons ----
      [callBtnRef.current, whatsappBtnRef.current].forEach((el) => {
        if (!el) return;
        const xTo = gsap.quickTo(el, "x", { duration: 0.25, ease: "power3" });
        const yTo = gsap.quickTo(el, "y", { duration: 0.25, ease: "power3" });
        const handleMove = (e) => {
          const rect = el.getBoundingClientRect();
          xTo((e.clientX - (rect.left + rect.width / 2)) * 0.3);
          yTo((e.clientY - (rect.top + rect.height / 2)) * 0.3);
        };
        const handleLeave = () => {
          xTo(0);
          yTo(0);
        };
        el.addEventListener("mousemove", handleMove);
        el.addEventListener("mouseleave", handleLeave);
        cleanupFns.current.push(() => {
          el.removeEventListener("mousemove", handleMove);
          el.removeEventListener("mouseleave", handleLeave);
        });
      });
    }, footerRef);

    return () => {
      cleanupFns.current.forEach((fn) => fn());
      cleanupFns.current = [];
      ctx.revert();
    };
  }, []);

  return (
    <>
      <footer className="site-footer" ref={footerRef}>
        <div className="site-footer__fog" ref={fogRef} aria-hidden="true" />

        <div className="site-footer__inner">
          <div className="site-footer__brand" ref={brandRef}>
            <p className="site-footer__blurb">
              Sharp Detectives is a trusted private detective agency
              delivering confidential and professional investigation
              services worldwide.
            </p>

            <ul className="site-footer__contact">
              {CONTACT_DETAILS.map((item, i) => {
                const Icon = item.icon;
                return (
                  <li
                    key={item.value}
                    ref={(el) => (contactRowRefs.current[i] = el)}
                  >
                    <span className="site-footer__contact-icon">
                      <Icon size={14} strokeWidth={2.2} />
                    </span>
                    <span className="site-footer__contact-value">
                      {item.value}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          {FOOTER_NAV.map((group, i) => (
            <div
              className="site-footer__col"
              key={group.heading}
              ref={(el) => {
                if (!colRefs.current[i]) colRefs.current[i] = {};
                colRefs.current[i].root = el;
              }}
            >
              <span
                className="site-footer__col-heading"
                ref={(el) => {
                  if (!colRefs.current[i]) colRefs.current[i] = {};
                  colRefs.current[i].heading = el;
                }}
              >
                {group.heading}
                <span
                  className="site-footer__col-underline"
                  ref={(el) => {
                    if (!colRefs.current[i]) colRefs.current[i] = {};
                    colRefs.current[i].underline = el;
                  }}
                />
              </span>
              <ul className="site-footer__links">
                {group.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="site-footer__link"
                      ref={(el) => linkRefs.current.push(el)}
                    >
                      <ArrowRight size={13} className="site-footer__link-arrow" />
                      <span>{link}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="site-footer__visitor">
          <span className="site-footer__visitor-heading" ref={visitorHeadingRef}>
            Visitor Count
          </span>
          <div className="site-footer__odometer" aria-label={`${VISITOR_COUNT} visitors`}>
            {VISITOR_COUNT.split("").map((digit, i) => (
              <span className="visitor-digit" key={i}>
                <span
                  className="visitor-digit-strip"
                  ref={(el) => (digitStripRefs.current[i] = el)}
                >
                  {strip.map((d, j) => (
                    <span className="visitor-digit-cell" key={j}>
                      {d}
                    </span>
                  ))}
                </span>
              </span>
            ))}
          </div>
        </div>

        <div className="site-footer__divider" ref={dividerRef} />

        <div className="site-footer__bottom" ref={bottomRef}>
          <span className="site-footer__copyright">
            &copy; Copyright {new Date().getFullYear()} by Pixel Horse
           . All Rights reserved.
          </span>
        </div>
      </footer>

      {/* Floating action buttons */}
      <a
        href="tel:+919499999007"
        className="fab fab--call"
        ref={callBtnRef}
        aria-label="Call Sharp Detectives"
      >
        <span className="fab-ring" aria-hidden="true" />
        <Phone size={20} strokeWidth={2.4} />
      </a>
      <a
        href="https://wa.me/919499999007"
        className="fab fab--whatsapp"
        ref={whatsappBtnRef}
        target="_blank"
        rel="noreferrer"
        aria-label="Message Sharp Detectives on WhatsApp"
      >
        <span className="fab-ring" aria-hidden="true" />
        <MessageCircle size={20} strokeWidth={2.4} />
      </a>
    </>
  );
}