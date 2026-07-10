import { Suspense, useRef, useEffect, useState, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { useGLTF, Environment } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./Hero.css";
import Navbar from "./Navbar";
import Footer from "./Footer";
import Loader from "./Loader";

gsap.registerPlugin(ScrollTrigger);

// The GLB has 5 empty screen quads, each driven by its own baked clip.
// Node names come straight from the GLB; keep this order in sync with
// how the videos should map onto the physical screens on the model.
const SCREEN_CONFIG = [
  { nodeName: "Plane", src: "/video_5.mp4" },
  { nodeName: "Plane1", src: "/video_4.mp4" },
  { nodeName: "Plane2", src: "/video_3.mp4" },
  { nodeName: "Plane3", src: "/video_1.mp4" },
  { nodeName: "Plane4", src: "/video_2.mp4" },
];

// ----------------------------------------------------------------------
// Scroll-synced captions — pulled from the live site's own headline
// copy (sharpdetectives.com) so the on-scroll story matches the brand
// voice used everywhere else on the site, instead of generic filler.
//
// Each beat's [start, end] is expressed in the SAME master-clock
// seconds as the animation clips below, so a caption's on/off timing
// tracks whatever phase of the model animation is playing at that
// moment. Ranges intentionally don't overlap (small gaps double as
// crossfade room) so only one caption is ever fully visible at once:
//
//   walk-in       0.04s -> 4.04s   -> beat 1
//   tablet raise  4.17s -> 6.42s   -> beat 2
//   screens on    5.38s -> 6.42s   -> (covered by beat 2's window)
//   book opens    5.42s -> 7.13s   -> beat 3
//   pages 1-8     6.67s -> 10.42s  -> beat 4
// ----------------------------------------------------------------------
const TEXT_BEATS = [
  {
    id: "walk-in",
    start: 0.4,
    end: 0.9,
    eyebrow: "Sharp Detectives",
    title: "78 years of experience.",
    subtitle:
      "Four generations of investigators, trusted across India and internationally.",
  },
  {
    id: "tablet-screens",
    start: 1.3,
    end: 1.9,
    eyebrow: "On the record",
    title: "Whisper in my ear, what you want us to see.",
    subtitle: "A fully alert control room, active every hour of every day.",
  },
  {
    id: "book-opens",
    start: 2.3,
    end: 2.9,
    eyebrow: "The method",
    title: "The brains & brawns combination.",
    subtitle: "Sharp thinking, backed by ground-level action.",
  },
  {
    id: "pages",
    start: 3.3,
    end: 3.9,
    eyebrow: "The record speaks",
    title: "10,350+ cases closed. 99% success rate.",
    subtitle: "One name clients across the world keep coming back to.",
  },
  {
    id: "book",
    start: 4.3,
    end: 4.9,
    eyebrow: "The record speaks",
    title: "Offering Private Investigation Services",
    subtitle: "We specialize in confidential private investigations, asset verifications, corporate investigations, criminal inquiries, and legal consultancy.",
  },
    {
    id: "personal",
    start: 6.3,
    end: 6.9,
    eyebrow: "Services",
    title: "PERSONAL INVESTIGATIONS",
    subtitle: "",
  },
    {
    id: "corporate",
    start: 7.3,
    end: 7.9,
    eyebrow: "Services",
    title: "CORPORATE INVESTIGATIONS",
    subtitle: "",
  },
    {
    id: "matrimonial",
    start: 8.3,
    end: 8.8,
    eyebrow: "Services",
    title: "Matrimonial Investigation",
    subtitle: "",
  },
    {
    id: "missing",
    start: 9.3,
    end: 9.8,
    eyebrow: "Services",
    title: "Missing Investigation",
    subtitle: "",
  },
];

// Smooth 0 -> 1 -> 0 ramp for a caption: fades in over `fade` seconds
// before `start`, holds fully visible through [start, end], then fades
// out over `fade` seconds after `end`. Driven off the same masterTime
// the model's mixer already scrubs against, so it never drifts out of
// sync with what's on screen.
function getBeatOpacity(t, start, end, fade = 0.35) {
  if (t <= start - fade || t >= end + fade) return 0;
  if (t < start) return (t - (start - fade)) / fade;
  if (t > end) return 1 - (t - end) / fade;
  return 1;
}

// ----------------------------------------------------------------------
// Clip names, read directly out of detectivepage6.glb (17 clips total,
// not 5/8 like earlier comments assumed — verified against the file).
// If you re-export from Blender, re-check these against the console log
// in the effect below ("[DetectiveModel] loaded N clip(s)") and update
// this map, since re-exports can rename or reorder clips.
// ----------------------------------------------------------------------
const CLIP = {
  ARMATURE: "Armature|Take 001|BaseLayer.001", // character walk-in rig
  TABLET: "Tablet_lowpoly1:MeshAction", // tablet the character raises
  SCREEN_0: "PlaneAction", // -> node "Plane"
  SCREEN_1: "Plane.001Action", // -> node "Plane1"
  SCREEN_2: "Plane.002Action", // -> node "Plane2"
  SCREEN_3: "Plane.003Action", // -> node "Plane3"
  SCREEN_4: "Plane.004Action", // -> node "Plane4"
  BOOK_FRONT: "pCube15Action", // book front cover
  BOOK_BACK: "pCube15Action.002", // book back cover
  // VERIFIED against this exact GLB via a direct glTF JSON parse — the
  // previous values here ("pCube15Action.010" / ".007" / ".008") don't
  // exist as clip names in this file at all, so PAGE_1/2/3 silently
  // never matched anything that depended on this map (e.g.
  // HIDE_BEFORE_START below). Their real clip names are their own
  // distinct action names, not pCube15Action.NNN:
  PAGE_1: "page1Action", // -> node "page1"
  PAGE_2: "page2Action", // -> node "page2"
  PAGE_3: "page3Action", // -> node "page3"
  PAGE_4: "pCube15Action.009", // -> node "page4"
  PAGE_5: "pCube15Action.006", // -> node "page5"
  PAGE_6: "pCube15Action.003", // -> node "page6"
  PAGE_7: "pCube15Action.004", // -> node "page7"
  PAGE_8: "pCube15Action.005", // -> node "page8"
};

// ----------------------------------------------------------------------
// PAGE-OVERLAP TIMING FIX (root cause, confirmed by parsing the raw
// glTF JSON directly out of detectivepage6.glb — this is not a CSS,
// GSAP, or FrontSide/mipmap issue):
//
// node "page1" and node "page2" share an IDENTICAL starting transform
// (translation/rotation match to full float precision — no other page
// pair in the stack does this; every other page has its own unique
// stacking offset). Both start their flip at the same master-clock
// time (6.667s), but:
//
//   page1Action ends at 8.125s
//   page2Action ends at 9.167s
//
// Because they start coincident and finish at different times, between
// t=8.125s and t=9.167s page1 sits frozen at its final flipped pose
// while page2 is STILL rotating through that same physical volume —
// two double-sided, textured, near-coplanar quads grazing each other
// at shallow angles. That overlap window is what produces the giant
// stretched/mirrored "...IVE" artifact in the screenshot.
//
// This needs a real fix in the source .blend file (give page2 its own
// unique rest offset like the other 6 pages have, and retime its flip
// to finish alongside page1's). Until that's done, clamp page2's
// effective end time in code so it never outlives page1's — this
// removes the overlap window entirely without touching Blender.
// ----------------------------------------------------------------------
const CLIP_END_OVERRIDE = {
  [CLIP.PAGE_2]: 8.125, // was 9.167 in the raw GLB — synced to page1's finish time
};

// ----------------------------------------------------------------------
// PAGE-FLIP GLITCH FIX
// ----------------------------------------------------------------------
// The old code clamped a not-yet-started clip to `action.time = clipStart`
// (its own first keyframe) and left it at that. That's fine for the
// rig/tablet/covers, but several of the page clips don't have a fully
// "closed/flush" pose baked as their first keyframe — so rendering that
// pose *before* the page's own turn in the timeline shows a stray sliver
// or corner of that page's texture poking out from behind the currently
// open page (the floating giant letter in the screenshot).
//
// Fix: for the clips listed here, fully HIDE their driven mesh(es) via
// `.visible = false` until masterTime actually reaches that clip's
// clipStart, then reveal them. Add/remove keys here if a different
// object turns out to be the culprit after checking the console log
// this file prints (see "[DetectiveModel] clip -> node map" below).
// ----------------------------------------------------------------------
const HIDE_BEFORE_START = new Set([
  CLIP.PAGE_1,
  CLIP.PAGE_2,
  CLIP.PAGE_3,
  CLIP.PAGE_4,
  CLIP.PAGE_5,
  CLIP.PAGE_6,
  CLIP.PAGE_7,
  CLIP.PAGE_8,
]);

// ----------------------------------------------------------------------
// SECOND, SEPARATE glitch source (verified by parsing the .glb's raw
// glTF JSON): the book front/back covers and all 8 pages are flat,
// essentially zero-thickness planes, and EVERY one of their materials
// is marked double-sided in the file. As a page rotates through ~90°
// (edge-on to the camera) mid-flip, a double-sided paper-thin quad like
// this is a classic case for a WebGL mip-stretch artifact: texture
// derivatives blow up at the grazing angle, the GPU picks a wildly
// wrong mip level, and texels from the front AND back faces smear
// together into a stretched, streaky sliver. This is a real, separate
// contributor — but with the page1/page2 timing fix above in place,
// this mip fix mainly matters for the normal edge-on moment every page
// legitimately passes through mid-flip.
const FLAT_PAGE_NODE_NAMES = [
  "book front",
  "book back",
  "page1",
  "page2",
  "page3",
  "page4",
  "page5",
  "page6",
  "page7",
  "page8",
];

// Which side to actually render on the flat page/cover meshes. These
// meshes only have ONE baked texture (mapped to their outward-facing
// side), but their material is flagged double-sided in the .glb. As a
// cover/page rotates open, the camera starts seeing its INSIDE face —
// same flat geometry, flipped normal — and because there's no separate
// "inside" texture, the GPU just re-renders the SAME outward texture
// mirrored. Culling to a single side stops the wrong face from drawing
// at all. If this ever makes the CORRECT/expected face disappear
// instead of removing a glitch, flip this one line to THREE.BackSide.
const FLAT_PAGE_RENDER_SIDE = THREE.FrontSide;

// ----------------------------------------------------------------------
// BLUNT FIX: permanently hide the node(s) causing the mirrored
// "SHARP DETECTIVE" bleed on the front cover's untextured inside face,
// independent of the mixer/animation logic above.
//
// Best-evidence guess is "book front": both covers share the same
// aiStandardSurface1 branding material, and the front cover is the one
// that swings fully open (rotates ~180° around Z) past camera-facing,
// which is exactly when its untextured inside face would be exposed.
//
// If, after this, the GLITCH IS GONE but the WRONG thing disappears
// (e.g. you no longer see the front cover swing open at all when you'd
// expect to), swap the name below to "book back" instead.
const FORCE_HIDDEN_NODE_NAMES = ["book front"];

function forceHideNodes(scene) {
  FORCE_HIDDEN_NODE_NAMES.forEach((name) => {
    const obj = scene.getObjectByName(name);
    if (!obj) {
      console.warn(`[DetectiveModel] force-hide target "${name}" not found`);
      return;
    }
    obj.visible = false;
    obj.traverse((node) => {
      node.visible = false;
    });
  });
}

function disableMipStretchOnFlatPages(scene) {
  FLAT_PAGE_NODE_NAMES.forEach((name) => {
    const obj = scene.getObjectByName(name);
    if (!obj) {
      console.warn(`[DetectiveModel] flat-page node "${name}" not found for mip fix`);
      return;
    }
    obj.traverse((node) => {
      if (!node.isMesh || !node.material) return;
      const materials = Array.isArray(node.material) ? node.material : [node.material];
      materials.forEach((mat) => {
        // Stops the mirrored/reversed texture from the inside face —
        // see FLAT_PAGE_RENDER_SIDE comment above.
        mat.side = FLAT_PAGE_RENDER_SIDE;
        mat.needsUpdate = true;

        ["map", "emissiveMap", "normalMap", "roughnessMap", "metalnessMap"].forEach((key) => {
          const tex = mat[key];
          if (tex) {
            tex.generateMipmaps = false;
            tex.minFilter = THREE.LinearFilter;
            tex.magFilter = THREE.LinearFilter;
            tex.anisotropy = 1;
            tex.needsUpdate = true;
          }
        });
      });
    });
  });
}

// Crops a video texture to exactly fill a quad's own aspect ratio (like
// CSS `object-fit: cover`), instead of stretching or letterboxing it.
// IMPORTANT: these screen quads are driven by a baked animation whose
// rest scale is [0,0,0] — the quad only takes on its real (non-square)
// aspect ratio once the scroll-scrubbed clip has advanced. So this must
// be called on every scroll tick, not just once at video-load time,
// or every screen freezes at the aspect.z<=0 fallback (a forced square).
function fitVideoTextureCover(video, videoTexture, screenMesh, fallbackAspect = 1) {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (!vw || !vh) return;

  const planeScale = screenMesh.scale;
  const planeAspect =
    planeScale.z > 0.0001 ? planeScale.x / planeScale.z : fallbackAspect;
  const videoAspect = vw / vh;

  if (videoAspect > planeAspect) {
    const repeatX = planeAspect / videoAspect;
    videoTexture.repeat.set(repeatX, 1);
    videoTexture.offset.set((1 - repeatX) / 2, 0);
  } else {
    const repeatY = videoAspect / planeAspect;
    videoTexture.repeat.set(1, repeatY);
    videoTexture.offset.set(0, (1 - repeatY) / 2);
  }
  videoTexture.needsUpdate = true;
}

// Three.js keyframe track names are formatted "<nodeName>.<property>"
// (or "<nodeName>.<property>[x]" for indexed props like morph targets).
// This pulls the actual node(s) a clip drives out of its tracks, so we
// can toggle their `.visible` independently of the mixer — e.g. to hide
// a page's mesh entirely before its own clip has started.
function getClipTargetObjects(scene, clip) {
  const nodeNames = new Set();
  clip.tracks.forEach((track) => {
    let nodeName = null;
    try {
      nodeName = THREE.PropertyBinding.parseTrackName(track.name)?.nodeName;
    } catch (e) {
      const idx = track.name.lastIndexOf(".");
      if (idx > 0) nodeName = track.name.slice(0, idx);
    }
    if (nodeName) nodeNames.add(nodeName);
  });

  const objects = [];
  nodeNames.forEach((name) => {
    const obj = scene.getObjectByName(name);
    if (obj) objects.push(obj);
  });
  return objects;
}

// ----------------------------------------------------------------------
// NO ARTIFICIAL "BEATS". This GLB was baked as one continuous master
// timeline where several objects legitimately OVERLAP — verified against
// this exact file:
//
//   walk-in (Armature)      0.04s -> 4.04s
//   tablet raise            4.17s -> 6.42s
//   screens 1-5 turn on     5.38s -> 6.42s
//   book opens              5.42s -> 7.13s
//   pages 1-8               6.67s -> 10.42s  (cascade, overlapping book)
//
// Scroll progress maps directly onto the GLB's own real seconds (one
// shared "master clock"), and each clip clamps to its own
// [clipStart, clipEnd] within that — replaying every clip's original
// relative timing/overlap exactly as authored in Blender, except where
// CLIP_END_OVERRIDE intentionally trims a clip short (see page2 above).
// ----------------------------------------------------------------------

/* ----------------------------------------------------------------------
   3D Model — loads ALL of /public/detectivepage6.glb's baked animation
   clips (rig + tablet + screens + book covers + 8 pages = 17 clips) and
   hands them back up to Hero as a { name -> {action, clipStart, clipEnd} }
   map via onReady, so Hero can scrub every clip off one shared master
   clock.
   ---------------------------------------------------------------------- */
function DetectiveModel({ groupRef, onReady, screenVideoRefs, fitUpdateRef }) {
  const { scene, animations } = useGLTF("/book.glb");
  const mixer = useMemo(() => new THREE.AnimationMixer(scene), [scene]);
  const screenFitRef = useRef([]);

  useEffect(() => {
    if (!animations?.length) {
      console.warn("[DetectiveModel] no animations found in GLB");
      return;
    }

    // Log what we actually got so a future re-export with a different
    // clip count/order/naming is obvious in the console instead of
    // silently breaking the sequence above.
    console.log(
      `[DetectiveModel] loaded ${animations.length} clip(s):`,
      animations.map((c) => c.name)
    );

    // Kill the grazing-angle mip-stretch artifact on the book/pages —
    // see FLAT_PAGE_NODE_NAMES / disableMipStretchOnFlatPages above.
    disableMipStretchOnFlatPages(scene);

    // Blunt fix: permanently suppress the node(s) causing the mirrored
    // "SHARP DETECTIVE" bleed. See FORCE_HIDDEN_NODE_NAMES above.
    forceHideNodes(scene);

    // Load every clip and pause it — Hero drives .time manually off one
    // shared master clock (see the main scroll effect below), nothing
    // auto-plays off the internal clock.
    const clipMap = {};
    const clipNodeLog = {};
    animations.forEach((clip, clipIndex) => {
      const action = mixer.clipAction(clip);
      action.play();
      action.paused = true;

      let clipStart = Infinity;
      let clipEnd = -Infinity;
      clip.tracks.forEach((track) => {
        const times = track.times;
        if (!times.length) return;
        if (times[0] < clipStart) clipStart = times[0];
        if (times[times.length - 1] > clipEnd) clipEnd = times[times.length - 1];
      });
      if (!Number.isFinite(clipStart) || !Number.isFinite(clipEnd)) {
        clipStart = 0;
        clipEnd = clip.duration;
      }

      // Apply the page1/page2 overlap fix: if this clip has an override,
      // clamp its usable end time down to it. Keeps the raw GLB values
      // untouched everywhere else (totalDuration, other clips) and only
      // shortens the one clip that's actually causing the overlap.
      if (CLIP_END_OVERRIDE[clip.name] != null) {
        clipEnd = Math.min(clipEnd, CLIP_END_OVERRIDE[clip.name]);
      }

      const targetObjects = getClipTargetObjects(scene, clip);
      clipNodeLog[clip.name] = targetObjects.map((o) => o.name);

      // Defensive fix against z-fighting flicker between thin,
      // near-coplanar page/cover planes: give each clip's mesh(es) a
      // renderOrder + tiny polygon depth offset based on its position
      // in the clip list, so two pages resting almost exactly on top
      // of each other don't fight over which one wins the depth test.
      targetObjects.forEach((obj) => {
        obj.traverse((node) => {
          if (node.isMesh && node.material) {
            node.renderOrder = clipIndex;
            const materials = Array.isArray(node.material)
              ? node.material
              : [node.material];
            materials.forEach((mat) => {
              mat.polygonOffset = true;
              mat.polygonOffsetFactor = -clipIndex * 0.5;
              mat.polygonOffsetUnits = -clipIndex * 0.5;
            });
          }
        });
      });

      clipMap[clip.name] = {
        action,
        clipDuration: clip.duration,
        clipStart,
        clipEnd,
        span: Math.max(clipEnd - clipStart, 0.0001),
        targetObjects,
      };
    });

    // Handy while diagnosing which physical mesh belongs to which clip.
    console.log("[DetectiveModel] clip -> node map:", clipNodeLog);

    // Sanity check: warn (don't crash) if a clip name we rely on isn't
    // actually in this GLB — e.g. after a re-export.
    Object.entries(CLIP).forEach(([key, clipName]) => {
      if (!clipMap[clipName]) {
        console.warn(
          `[DetectiveModel] CLIP.${key} ("${clipName}") was not found in this GLB.`
        );
      }
    });

    onReady?.({ clipMap, mixer });

    return () => {
      Object.values(clipMap).forEach(({ action }) => action.stop());
    };
  }, [animations, mixer]); // eslint-disable-line react-hooks/exhaustive-deps

  // ------------------------------------------------------------------
  // Video screens — each of the 5 empty quads (Plane, Plane1 ... Plane4)
  // gets its own looping video texture, cropped to fill the quad's own
  // aspect ratio, and plays independently of scroll.
  // ------------------------------------------------------------------
  useEffect(() => {
    const cleanups = [];
    const fitEntries = [];

    SCREEN_CONFIG.forEach(({ nodeName, src }, i) => {
      const video = screenVideoRefs?.current?.[i];
      const screenMesh = scene.getObjectByName(nodeName);

      if (!video) {
        console.warn(`[DetectiveModel] no <video> ref at index ${i} for "${nodeName}" (${src})`);
        return;
      }
      if (!screenMesh || !screenMesh.isMesh) {
        console.warn(
          `[DetectiveModel] no mesh named "${nodeName}" found in the GLB — check the exact node name in your model.`
        );
        return;
      }

      const videoTexture = new THREE.VideoTexture(video);
      videoTexture.colorSpace = THREE.SRGBColorSpace;
      videoTexture.flipY = false; // matches the glTF UV convention baked into these meshes
      videoTexture.wrapS = THREE.ClampToEdgeWrapping;
      videoTexture.wrapT = THREE.ClampToEdgeWrapping;
      videoTexture.minFilter = THREE.LinearFilter;
      videoTexture.magFilter = THREE.LinearFilter;

      const screenMaterial = new THREE.MeshBasicMaterial({
        map: videoTexture,
        toneMapped: false, // keep true video color, unaffected by scene lighting
        side: THREE.DoubleSide,
      });
      screenMesh.material = screenMaterial;

      fitEntries.push({ video, videoTexture, screenMesh });

      const fitCover = () => fitVideoTextureCover(video, videoTexture, screenMesh);

      if (video.readyState >= 1) {
        fitCover();
      } else {
        video.addEventListener("loadedmetadata", fitCover);
      }

      // Surface real failures instead of swallowing them — a 404, a bad
      // codec, or a missing file will all show up here with the src.
      const onVideoError = () => {
        console.error(
          `[DetectiveModel] video failed to load for "${nodeName}": ${src}`,
          video.error
        );
      };
      video.addEventListener("error", onVideoError);

      video.loop = true;
      video.muted = true; // required for autoplay in every major browser
      video
        .play()
        .catch(() => {
          // Autoplay can be blocked before any user interaction on some
          // browsers even for muted video — retry on the first
          // interaction so it isn't stuck frozen for the whole session.
          const retry = () => {
            video.play().catch(() => {});
            window.removeEventListener("pointerdown", retry);
            window.removeEventListener("wheel", retry);
          };
          window.addEventListener("pointerdown", retry, { once: true });
          window.addEventListener("wheel", retry, { once: true });
        });

      cleanups.push(() => {
        video.removeEventListener("loadedmetadata", fitCover);
        video.removeEventListener("error", onVideoError);
        screenMaterial.dispose();
        videoTexture.dispose();
      });
    });

    screenFitRef.current = fitEntries;

    // Exposed to Hero's scroll onUpdate so the crop is recalculated every
    // tick — these quads start at scale 0 and only reach their real
    // (non-square) aspect ratio partway through the scrubbed animation,
    // so a one-time fit at video-load time is stale for the whole clip.
    if (fitUpdateRef) {
      fitUpdateRef.current = () => {
        screenFitRef.current.forEach(({ video, videoTexture, screenMesh }) => {
          fitVideoTextureCover(video, videoTexture, screenMesh);
        });
      };
    }

    return () => {
      if (fitUpdateRef) fitUpdateRef.current = null;
      cleanups.forEach((fn) => fn());
    };
  }, [scene, screenVideoRefs, fitUpdateRef]);

  return (
    <group ref={groupRef}>
      <primitive object={scene} />
    </group>
  );
}

function ModelLoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[0.6, 0.6, 0.6]} />
      <meshStandardMaterial color="#b21f2d" wireframe />
    </mesh>
  );
}

export default function Hero() {
  const heroRef = useRef(null);
  const groupRef = useRef(null);
  const dirLightRef = useRef(null);
  const pointLightRef = useRef(null);
  const clipMapRef = useRef(null);
  const totalDurationRef = useRef(0);
  const mixerRef = useRef(null);
  const videoRef = useRef(null);
  // One source <video> per screen quad, indexed to match SCREEN_CONFIG.
  const screenVideoRefs = useRef([]);
  // Set by DetectiveModel; called every scroll tick to keep each video's
  // crop in sync with that screen quad's (animated) aspect ratio.
  const fitUpdateRef = useRef(null);
  // One DOM node per entry in TEXT_BEATS, faded in/out every scroll
  // tick off the same masterTime the 3D model scrubs against.
  const captionRefs = useRef([]);
  const [modelReady, setModelReady] = useState(false);

  useEffect(() => {
    if (!modelReady || !heroRef.current || !groupRef.current || !clipMapRef.current) return;

    const group = groupRef.current;
    const dirLight = dirLightRef.current;
    const pointLight = pointLightRef.current;
    const clipMap = clipMapRef.current;
    const totalDuration = totalDurationRef.current || 1;
    const mixer = mixerRef.current;

    // Placement is computed live from whatever model is actually loaded.
    // Only the "Armature" subtree (the character) is measured here — NOT
    // the whole scene — since the book/pages/tablet/screens sit far
    // outside the character's own bounds.
    group.scale.set(1, 1, 1);
    group.position.set(0, 0, 0);
    group.updateWorldMatrix(true, true);

    const character = group.getObjectByName("Armature") || group;
    const bounds = new THREE.Box3().setFromObject(character);
    const TARGET_CENTER_Y = -0.5;
    const DEPTH_Z = -2; // how far back the whole rig sits from the camera

    if (bounds.isEmpty()) {
      group.position.set(0, -0.3, DEPTH_Z);
    } else {
      const center = bounds.getCenter(new THREE.Vector3());
      group.position.set(-center.x, TARGET_CENTER_Y - center.y, DEPTH_Z);
    }

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: heroRef.current,
        start: "top top",
        end: "+=900%",
        scrub: 1, // smooths scrub lag/inertia instead of snapping 1:1 to wheel delta
        pin: true,
        pinSpacing: true,
        anticipatePin: 1,
        // markers: true, // uncomment while debugging
        onEnter: () => videoRef.current?.play(),
        onEnterBack: () => videoRef.current?.play(),
        onLeave: () => videoRef.current?.pause(),
        onLeaveBack: () => videoRef.current?.pause(),
      },
      defaults: { ease: "none" },
    });

    const scrub = { t: 0 };
    tl.to(
      scrub,
      {
        t: 1,
        duration: 1,
        onUpdate: () => {
          // Map normalized scroll progress directly onto the GLB's own
          // real seconds — one shared master clock for every clip.
          const masterTime = scrub.t * totalDuration;

          // Every clip is clamped independently to its OWN [clipStart,
          // clipEnd] window (clipEnd already reflects CLIP_END_OVERRIDE
          // where applicable — see page2 fix above): frozen at its first
          // frame before its turn, scrubbing in step with every other
          // overlapping clip during its turn, then frozen at its last
          // frame once real time passes it.
          Object.entries(clipMap).forEach(
            ([clipName, { action, clipStart, clipEnd, targetObjects }]) => {
              const hasNotStarted = masterTime <= clipStart;

              if (hasNotStarted) {
                action.time = clipStart;
              } else if (masterTime >= clipEnd) {
                action.time = clipEnd;
              } else {
                action.time = masterTime;
              }

              if (HIDE_BEFORE_START.has(clipName) && targetObjects?.length) {
                const shouldBeVisible = !hasNotStarted;
                targetObjects.forEach((obj) => {
                  if (obj.visible !== shouldBeVisible) obj.visible = shouldBeVisible;
                });
              }
            }
          );
          // One mixer update recomputes bindings for every action whose
          // .time we just set above (delta 0 = "just re-evaluate now").
          mixer.update(0);
          // Screen quads animate from scale 0 up to their real aspect
          // ratio as part of that same mixer update — recrop every tick
          // so the video crop tracks the quad's current shape.
          fitUpdateRef.current?.();

          // Fade the scroll captions in/out off the same master clock —
          // each beat's [start, end] lines up with a phase of the model
          // animation above, so the copy always matches what's on screen.
          TEXT_BEATS.forEach((beat, i) => {
            const el = captionRefs.current[i];
            if (!el) return;
            const opacity = getBeatOpacity(masterTime, beat.start, beat.end);
            el.style.opacity = opacity;
            el.style.transform = `translateY(${(1 - opacity) * 18}px)`;
            el.style.pointerEvents = opacity > 0.05 ? "auto" : "none";
          });
        },
      },
      0
    );

    if (dirLight) {
      tl.to(dirLight, { intensity: 3.4, duration: 1 }, 0).to(
        dirLight.color,
        { r: 0.9, g: 0.2, b: 0.22, duration: 1 },
        0
      );
    }
    if (pointLight) {
      tl.to(pointLight, { intensity: 1.4, duration: 1 }, 0);
    }

    const refreshId = requestAnimationFrame(() => ScrollTrigger.refresh());

    return () => {
      cancelAnimationFrame(refreshId);
      tl.scrollTrigger?.kill();
      tl.kill();
    };
  }, [modelReady]);

  return (
    <>
      {/* Full-screen themed loading overlay — covers the wireframe
          fallback cube and the flash-prone name plate while the GLB is
          still fetching/parsing. Fades out once `modelReady` flips true
          (set in DetectiveModel's onReady callback below). */}
      <Loader visible={!modelReady} />

      <section className="hero" ref={heroRef}>
      <Navbar />

      <div className="hero__bg">
        <video
          ref={videoRef}
          className="hero__bg-video"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        >
          <source src="/images/bg.mp4" type="video/mp4" />
        </video>
      </div>

      {/* Name plate — sits BEHIND the 3D model. Same z-index tier as
          .hero__canvas-wrap; because the <Canvas> below renders later in
          the DOM (and uses gl alpha:true), it paints on top wherever the
          3D scene is transparent, and the model's opaque geometry (the
          detective's head/body) occludes the name naturally.

          FIX for the reload flash: the "hero__name--visible" class is
          only added once `modelReady` is true. Before that, Suspense is
          showing the tiny wireframe fallback cube instead of the real
          model, so there's no opaque geometry yet to hide the text
          behind — without this gate, the full name flashes unobstructed
          on every fresh page load until the GLB finishes fetching. This
          is now a secondary safety net on top of the Loader overlay
          above, which covers the whole hero during that same window. */}
      <div className={`hero__name${modelReady ? " hero__name--visible" : ""}`}>
        <h1 className="hero__name-text">
          CAPT. D.K Giri
        </h1>
      </div>

      <div className="hero__canvas-wrap">
        <Canvas
          camera={{ position: [0, -0.05, 4.6], fov: 42 }}
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: true }}
          style={{ touchAction: "pan-y" }}
        >
          <ambientLight intensity={0.25} color="#2a2420" />
          <directionalLight
            ref={dirLightRef}
            position={[2, 4, 3]}
            intensity={2.2}
            color="#d4a657"
            castShadow
          />
          <pointLight ref={pointLightRef} position={[-3, 1, -2]} intensity={0.4} color="#b21f2d" />

          <Suspense fallback={<ModelLoadingFallback />}>
            <DetectiveModel
              groupRef={groupRef}
              screenVideoRefs={screenVideoRefs}
              fitUpdateRef={fitUpdateRef}
              onReady={({ clipMap, mixer }) => {
                const totalDuration = Object.values(clipMap).reduce(
                  (max, { clipEnd }) => Math.max(max, clipEnd),
                  0.0001
                );

                clipMapRef.current = clipMap;
                totalDurationRef.current = totalDuration;
                mixerRef.current = mixer;
                setModelReady(true);
              }}
            />
            <Environment preset="city" />
          </Suspense>
        </Canvas>
      </div>

      <div className="hero__captions">
        {TEXT_BEATS.map((beat, i) => (
          <div
            className="hero__caption"
            key={beat.id}
            ref={(el) => (captionRefs.current[i] = el)}
          >
            <span className="hero__caption-eyebrow">{beat.eyebrow}</span>
            <h2 className="hero__caption-title">{beat.title}</h2>
            {beat.subtitle && (
              <p className="hero__caption-subtitle">{beat.subtitle}</p>
            )}
          </div>
        ))}
      </div>

      <div className="hero__scroll-hint">
        <span>Scroll</span>
        <span className="hero__scroll-hint-line" />
      </div>

      {SCREEN_CONFIG.map(({ nodeName, src }, i) => (
        <video
          key={nodeName}
          ref={(el) => (screenVideoRefs.current[i] = el)}
          className="hero__screen-video-source"
          src={src}
          muted
          loop
          playsInline
          autoPlay
          preload="auto"
        />
      ))}
      </section>

      <Footer />
    </>
  );
}