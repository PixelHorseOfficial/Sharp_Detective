import { Suspense, useRef, useEffect, useState, useMemo, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { useGLTF, Environment } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./Hero.css";
import Navbar from "./Navbar";
import Footer from "./Footer";
import Loader from "./Loader";
import About from "./About";
import Achievement from "./Achievement";
import Reviews from "./Reviews";

import Partners from "./Partners";

gsap.registerPlugin(ScrollTrigger);

const SCREEN_CONFIG = [
  { nodeName: "Plane", src: "/video_5.mp4" },
  { nodeName: "Plane1", src: "/video_4.mp4" },
  { nodeName: "Plane2", src: "/video_3.mp4" },
  { nodeName: "Plane3", src: "/video_1.mp4" },
  { nodeName: "Plane4", src: "/video_2.mp4" },
];

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
    end: 4.4,
    eyebrow: "The record speaks",
    title: "Offering Private Investigation Services",
    subtitle: "We specialize in confidential private investigations, asset verifications, corporate investigations, criminal inquiries, and legal consultancy.",
  },

  {
    id: "personal",
    start: 5.0,
    end: 5.0,
    eyebrow: "Services",
    title: "PERSONAL INVESTIGATIONS",
    subtitle: "Pre-marital, post-marital, and shadowing investigation services.",
  },
  {
    id: "corporate",
    start: 5.4,
    end: 5.4,
    eyebrow: "Services",
    title: "CORPORATE INVESTIGATIONS",
    subtitle: "Employee verification, fraud detection, and background checks.",
  },
  {
    id: "matrimonial",
    start: 5.7,
    end: 5.7,
    eyebrow: "Services",
    title: "Matrimonial Investigation",
    subtitle: "Thorough background verification for matrimonial alliances.",
  },
  
{
  id: "missing",
  start: 6.0,
  end: 6.0,
  eyebrow: "Services",
  title: "Missing Services",
  subtitle: "Helping locate missing persons with discretion.",
},
{
  id: "paranormal",
  start: 6.4,
  end: 6.4,
  eyebrow: "Services",
  title: "Para Normal Investigation Services",
  subtitle: "Investigating unexplained incidents professionally.",
},
{
  id: "debugging",
  start: 6.7,
  end: 6.7,
  eyebrow: "Services",
  title: "Debugging Services",
  subtitle: "Finding and fixing critical technical issues.",
},
{
  id: "security",
  start: 7.2,
  end: 7.2,
  eyebrow: "Services",
  title: "Security Guarding Services",
  subtitle: "Trusted security for people and properties.",
},

];

function getBeatOpacity(t, start, end, fade = 0.35) {
  if (t <= start - fade || t >= end + fade) return 0;
  if (t < start) return (t - (start - fade)) / fade;
  if (t > end) return 1 - (t - end) / fade;
  return 1;
}

const CLIP = {
  ARMATURE: "Armature|Take 001|BaseLayer.001",
  TABLET: "Tablet_lowpoly1:MeshAction",
  SCREEN_0: "PlaneAction",
  SCREEN_1: "Plane.001Action",
  SCREEN_2: "Plane.002Action",
  SCREEN_3: "Plane.003Action",
  SCREEN_4: "Plane.004Action",
  BOOK_FRONT: "pCube15Action",
  BOOK_BACK: "pCube15Action.002",
  PAGE_1: "pCube15Action.001",
  PAGE_2: "pCube15Action.003",
  PAGE_3: "pCube15Action.004",
  PAGE_4: "pCube15Action.009",
  PAGE_5: "pCube15Action.006",
  PAGE_6: "pCube15Action.003",
  PAGE_7: "pCube15Action.004",
  PAGE_8: "pCube15Action.005",
};

const CLIP_END_OVERRIDE = {
  [CLIP.PAGE_2]: 8.125,
};

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

const FLAT_PAGE_RENDER_SIDE = THREE.FrontSide;

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

function fitVideoTextureCover(video, videoTexture, screenMesh, fallbackAspect = 1) {
  if (!video || !videoTexture || !screenMesh) return;
  
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

function DetectiveModel({ groupRef, onReady, screenVideoRefs, fitUpdateRef }) {
  const { scene, animations } = useGLTF("/detective8_1.glb");
  const mixer = useMemo(() => new THREE.AnimationMixer(scene), [scene]);
  const screenFitRef = useRef([]);

  useEffect(() => {
    if (!animations?.length) {
      console.warn("[DetectiveModel] no animations found in GLB");
      return;
    }

    console.log(
      `[DetectiveModel] loaded ${animations.length} clip(s):`,
      animations.map((c) => c.name)
    );

    disableMipStretchOnFlatPages(scene);
    forceHideNodes(scene);

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

      if (CLIP_END_OVERRIDE[clip.name] != null) {
        clipEnd = Math.min(clipEnd, CLIP_END_OVERRIDE[clip.name]);
      }

      const targetObjects = getClipTargetObjects(scene, clip);
      clipNodeLog[clip.name] = targetObjects.map((o) => o.name);

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

    console.log("[DetectiveModel] clip -> node map:", clipNodeLog);

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
  }, [animations, mixer, scene, onReady]);

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
      videoTexture.flipY = false;
      videoTexture.wrapS = THREE.ClampToEdgeWrapping;
      videoTexture.wrapT = THREE.ClampToEdgeWrapping;
      videoTexture.minFilter = THREE.LinearFilter;
      videoTexture.magFilter = THREE.LinearFilter;

      const screenMaterial = new THREE.MeshBasicMaterial({
        map: videoTexture,
        toneMapped: false,
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

      const onVideoError = () => {
        console.error(
          `[DetectiveModel] video failed to load for "${nodeName}": ${src}`,
          video.error
        );
      };
      video.addEventListener("error", onVideoError);

      video.loop = true;
      video.muted = true;
      video
        .play()
        .catch(() => {
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
  const screenVideoRefs = useRef([]);
  const fitUpdateRef = useRef(null);
  const captionRefs = useRef([]);
  const timelineRef = useRef(null);
  const canvasWrapRef = useRef(null);
  const [modelReady, setModelReady] = useState(false);

  // Handle window resize for scroll trigger refresh
  useEffect(() => {
    if (!modelReady) return;

    let resizeTimeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        ScrollTrigger.refresh();
      }, 300);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(resizeTimeout);
    };
  }, [modelReady]);

  // Main scroll animation setup
  useEffect(() => {
    if (!modelReady || !heroRef.current || !groupRef.current || !clipMapRef.current) return;

    const group = groupRef.current;
    const dirLight = dirLightRef.current;
    const pointLight = pointLightRef.current;
    const clipMap = clipMapRef.current;
    const totalDuration = totalDurationRef.current || 1;
    const mixer = mixerRef.current;

    if (!mixer) {
      console.warn("[Hero] mixer not initialized");
      return;
    }

    group.scale.set(1, 1, 1);
    group.position.set(0, 0, 0);
    group.updateWorldMatrix(true, true);

    const character = group.getObjectByName("Armature") || group;
    const bounds = new THREE.Box3().setFromObject(character);
    const TARGET_CENTER_Y = -0.5;
    const DEPTH_Z = -2;

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
        scrub: 1,
        pin: true,
        pinSpacing: true,
        anticipatePin: 1,
        onEnter: () => {
          if (videoRef.current) videoRef.current.play().catch(() => {});
        },
        onEnterBack: () => {
          if (videoRef.current) videoRef.current.play().catch(() => {});
        },
      },
      defaults: { ease: "none" },
    });

    timelineRef.current = tl;

    const scrub = { t: 0 };
    tl.to(
      scrub,
      {
        t: 1,
        duration: 1,
        onUpdate: () => {
          const masterTime = scrub.t * totalDuration;

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

          if (mixer) mixer.update(0);
          if (fitUpdateRef.current) fitUpdateRef.current();

          // Update captions with safety checks
          TEXT_BEATS.forEach((beat, i) => {
            const el = captionRefs.current?.[i];
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
      timelineRef.current = null;
    };
  }, [modelReady]);

  return (
    <>
      <Loader visible={!modelReady} />

      {/* Single shared background video for entire page */}
      <div className="site-bg" aria-hidden="true">
        <video
          ref={videoRef}
          className="site-bg-video"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        >
          <source src="/images/bg.mp4" type="video/mp4" />
        </video>
        <div className="site-bg-scrim" />
      </div>

      <section className="hero" ref={heroRef}>
        <Navbar />

        <div className={`hero__name${modelReady ? " hero__name--visible" : ""}`}>
          <h1 className="hero__name-text">CAPT. D.K Giri</h1>
        </div>

        <div className="hero__canvas-wrap" ref={canvasWrapRef}>
          <Canvas
            camera={{ position: [0, -0.05, 4.6], fov: 50 }}
            dpr={[1, 1]}
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
            <pointLight
              ref={pointLightRef}
              position={[-3, 1, -2]}
              intensity={0.4}
              color="#b21f2d"
            />

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
              ref={(el) => {
                if (el) captionRefs.current[i] = el;
              }}
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
            ref={(el) => {
              if (el) screenVideoRefs.current[i] = el;
            }}
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
      <About />
      <Achievement />
      <Reviews />
      <Partners />

      <Footer />
    </>
  );
}