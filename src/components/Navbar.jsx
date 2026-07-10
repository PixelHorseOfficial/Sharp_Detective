import React, { useState, useEffect, useRef } from "react";
import "./Navbar.css";

const NAV_LINKS = [
  { label: "About Us", href: "#" },
  { label: "Services", href: "#" },
  { label: "Charges", href: "#" },
  { label: "Terms & Conditions", href: "#" },
  { label: "Cases", href: "#" },
  { label: "Contact", href: "#" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(null);
  const navRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on outside click
  useEffect(() => {
    const onClick = (e) => {
      if (menuOpen && navRef.current && !navRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  // Lock body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  return (
    <header
      ref={navRef}
      className={`sd-nav ${scrolled ? "sd-nav--scrolled" : ""} ${menuOpen ? "sd-nav--open" : ""}`}
    >
      <div className="sd-nav__inner">
      
        {/* Logo */}
        <a >
        <img
            src="/images/logo.png"
            alt="Sharp Detectives"
            className="sd-nav__mark-img"
        />
        
        </a>

        {/* Desktop nav */}
        <nav className="sd-nav__links" aria-label="Primary">
          {NAV_LINKS.map((link, i) => (
            <a
              key={link.label}
              href={link.href}
              className="sd-nav__link"
              onMouseEnter={() => setActiveIndex(i)}
              onMouseLeave={() => setActiveIndex(null)}
              onFocus={() => setActiveIndex(i)}
              onBlur={() => setActiveIndex(null)}
            >
              <span className="sd-nav__link-beam" aria-hidden="true" />
              <span className="sd-nav__link-text">{link.label}</span>
            </a>
          ))}
        </nav>

        {/* CTA */}
        <a
          href="https://www.sharpdetectives.com/detective-agency-contact/"
          className="sd-nav__cta"
        >
          Hire&nbsp;an&nbsp;Investigator
        </a>

        {/* Mobile toggle */}
        <button
          className={`sd-nav__toggle ${menuOpen ? "is-active" : ""}`}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      {/* Mobile menu */}
      <div className={`sd-nav__mobile ${menuOpen ? "is-open" : ""}`}>
        <nav aria-label="Mobile Primary">
          {NAV_LINKS.map((link, i) => (
            <a
              key={link.label}
              href={link.href}
              className="sd-nav__mobile-link"
              style={{ transitionDelay: `${i * 35}ms` }}
              onClick={() => setMenuOpen(false)}
            >
              <span className="sd-nav__mobile-index">{String(i + 1).padStart(2, "0")}</span>
              {link.label}
            </a>
          ))}
        </nav>
        <a
          href="https://www.sharpdetectives.com/detective-agency-contact/"
          className="sd-nav__mobile-cta"
          onClick={() => setMenuOpen(false)}
        >
          Hire an Investigator
        </a>
      </div>
    </header>
  );
}