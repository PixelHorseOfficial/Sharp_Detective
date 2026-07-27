import "./Partners.css";

const LOGOS = [
  { src: "/images/logo1.jpg", alt: "CAPSI" },
  { src: "/images/logo2.jpg", alt: "APPSA" },
  { src: "/images/logo3.jpg", alt: "KSSA" },
  { src: "/images/logo4.jpg", alt: "CII" },
  { src: "/images/logo5.jpg", alt: "World Association of Detectives" },
];

export default function Partners() {
  return (
    <section className="ptn">
      <div className="ptn__row">
        {LOGOS.map((logo, i) => (
          <div className="ptn__item" key={i}>
            <img src={logo.src} alt={logo.alt} loading="lazy" />
          </div>
        ))}
      </div>
    </section>
  );
}