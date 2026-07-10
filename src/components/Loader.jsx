import "./Loader.css";

// Full-screen loading overlay shown while the 3D detective model (and its
// animation clips) are still being fetched/parsed. Rendered as a fixed
// overlay so it sits above everything else in Hero, including the name
// plate and canvas — this is what the visitor actually sees instead of
// the bare wireframe fallback cube during that load window.
//
// `visible` is driven by Hero's existing `modelReady` state: pass
// `visible={!modelReady}`. The overlay stays mounted after it's hidden
// (opacity/visibility handled purely in CSS) so there's no unmount/
// remount flicker if the component re-renders.
export default function Loader({ visible }) {
  return (
    <div
      className={`loader${visible ? "" : " loader--hidden"}`}
      role="status"
      aria-live="polite"
      aria-hidden={!visible}
    >
      <div className="loader__content">
        <div className="loader__mark">
          <img className="loader__glass" src="/cursors/magnifier.png" alt="" />
            
           
            <circle cx="50" cy="50" r="34" className="loader__glass-ring" />
            <line x1="74" y1="74" x2="106" y2="106" className="loader__glass-handle" />
            <line x1="28" y1="50" x2="72" y2="50" className="loader__glass-scan" />
          
        </div>

        <h2 className="loader__title">SHARP DETECTIVES</h2>
        <p className="loader__tagline">The Brains &amp; Brawns Combination</p>

        <div className="loader__status">
          <span className="loader__status-text">Gathering evidence</span>
          <span className="loader__dots">
            <span>.</span>
            <span>.</span>
            <span>.</span>
          </span>
        </div>

        <div className="loader__bar">
          <div className="loader__bar-fill" />
        </div>
      </div>
    </div>
  );
}