import { useLayoutEffect, useRef, useState } from "react";
import ProjectDisplay from "./ProjectDisplay.jsx";
import ProjectTabs from "./ProjectTabs.jsx";
import { projectData } from "./ProjectData.js";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import Binding from "./Binding.jsx";

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

const GRID_BG = {
  backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.2) 1px, transparent 1px),
                    linear-gradient(to right,  rgba(0,0,0,0.2) 1px, transparent 1px)`,
  backgroundSize: "20px 20px",
};

const Project = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  const assemblyRef = useRef(null);
  const topPaperRef = useRef(null);
  const bottomPaperRef = useRef(null);

  const topPageRefs = useRef([]);
  const bottomPageRefs = useRef([]);

  const currentTopIdxRef = useRef(0);
  const currentBottomIdxRef = useRef(1);

  const triggerRef = useRef(null);
  const liftMaxRef = useRef(24);

  const pages = projectData.length;
  const flips = Math.max(pages - 1, 1);

  useLayoutEffect(() => {
    if (!assemblyRef.current || !topPaperRef.current || !bottomPaperRef.current) return;

    const computeLiftMax = () => {
      const h = topPaperRef.current?.offsetHeight || 600;
      return Math.max(8, Math.min(48, Math.round(h * 0.04)));
    };
    liftMaxRef.current = computeLiftMax();

    const totalDistance = flips * window.innerHeight;

    topPageRefs.current.forEach((el, i) => gsap.set(el, { autoAlpha: i === 0 ? 1 : 0 }));
    bottomPageRefs.current.forEach((el, i) => gsap.set(el, { autoAlpha: i === 1 ? 1 : 0 }));
    currentTopIdxRef.current = 0;
    currentBottomIdxRef.current = Math.min(1, pages - 1);

    triggerRef.current = ScrollTrigger.create({
      trigger: assemblyRef.current,
      start: "top top",
      end: `+=${totalDistance}`,
      pin: true,
      scrub: 3,
      markers: true,
      onUpdate: (self) => {
        
        const pos = self.progress * flips;
        const seg = Math.min(Math.floor(pos), flips - 1);
        const local = pos - seg;

        const liftY = -liftMaxRef.current * Math.sin(local * Math.PI);

        gsap.set(topPaperRef.current, {
          rotateX: local * 105,
          y: liftY,
          transformOrigin: "top top",
          transformPerspective: 90000,
          willChange: "transform",
        });

        const desiredTopIdx = seg;
        const desiredBottomIdx = Math.min(seg + 1, pages - 1);

        if (desiredTopIdx !== currentTopIdxRef.current) {
          gsap.set(topPageRefs.current[currentTopIdxRef.current], { autoAlpha: 0 });
          gsap.set(topPageRefs.current[desiredTopIdx], { autoAlpha: 1 });
          currentTopIdxRef.current = desiredTopIdx;
        }

        if (desiredBottomIdx !== currentBottomIdxRef.current) {
          gsap.set(bottomPageRefs.current[currentBottomIdxRef.current], { autoAlpha: 0 });
          gsap.set(bottomPageRefs.current[desiredBottomIdx], { autoAlpha: 1 });
          currentBottomIdxRef.current = desiredBottomIdx;
        }

      },
    });

    const onResize = () => {
      liftMaxRef.current = computeLiftMax();
      const newTotal = flips * window.innerHeight;
      if (triggerRef.current) {
        triggerRef.current.vars.end = `+=${newTotal}`;
        triggerRef.current.refresh();
      }
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      triggerRef.current?.kill();
      triggerRef.current = null;
    };
  }, [flips, pages, activeIndex]);

  const scrollContainerRef = useRef(null);
  const handleTabClick = (idx) => {
    const st = triggerRef.current;
    if (!st) return;

    setActiveIndex(idx);

    const sectionStartY = st.start;
    const segmentSize = window.innerHeight;
    const targetY = sectionStartY + idx * segmentSize;
    const currentY = window.scrollY;
    if (Math.abs(currentY - targetY) > 10) {
      const distanceSegments = Math.abs(targetY - currentY) / segmentSize;
      const duration = Math.min(1.2, Math.max(0.45, distanceSegments * 0.6));
      gsap.to(window, {
        duration,
        ease: "power2.out",
        scrollTo: { y: targetY, autoKill: true },
      });
    }
  };

  return (
    <div ref={assemblyRef} className="bg-black relative w-full min-h-screen overflow-x-hidden">
      <section className="relative w-full min-h-[100vh]">
        <div ref={scrollContainerRef} />
        <div className="mx-auto bg-[#fdfaf3] w-[95vw] max-w-7xl h-[7vh] rounded-b-3xl relative" style={GRID_BG} />

        <div className="relative ">
          <Binding />
        </div>

        <div className="mt-8 flex flex-col items-center  justify-center relative">
          <div
            className="relative w-[90vw] max-w-7xl rounded-3xl"
            style={{ perspective: "8000px", transformStyle: "preserve-3d" }}
          >
            <div className="absolute w-full h-[80vh] bg-[#1B231A] rounded-3xl z-0 border border-amber-100" />
            <div className="absolute w-full h-[77vh] bg-[#fdfaf4be] rounded-3xl z-0" />
            <div className="absolute w-full h-[76vh] bg-[#fdfaf4eb] rounded-3xl z-0" />

            <div
              ref={bottomPaperRef}
              className="absolute inset-0 h-[75vh] bg-[#fdfaf3] rounded-3xl shadow-2xl overflow-hidden z-10"
              style={{
                transformOrigin: "top center",
                transformStyle: "preserve-3d",
                backfaceVisibility: "hidden",
                ...GRID_BG,
              }}
            >
              {projectData.map((p, i) => (
                <div
                  key={`bottom-${p.id}`}
                  ref={(el) => (bottomPageRefs.current[i] = el)}
                  className="absolute inset-0"
                  style={{ pointerEvents: "none" }}
                >
                  <ProjectDisplay data={p} />
                </div>
              ))}
            </div>

            <div
              ref={topPaperRef}
              className="relative z-30 h-[75vh] bg-[#fdfaf3] rounded-3xl shadow-2xl overflow-hidden"
              style={{
                transformStyle: "preserve-3d",
                backfaceVisibility: "hidden",
                ...GRID_BG,
              }}
            >
              {projectData.map((p, i) => (
                <div
                  key={`top-${p.id}`}
                  ref={(el) => (topPageRefs.current[i] = el)}
                  className="absolute inset-0"
                >
                  <ProjectDisplay data={p} />
                </div>
              ))}
            </div>
          </div>

          <div className="w-[90vw] px-20 max-w-7xl z-20">
            <ProjectTabs
              activeIndex={activeIndex}
              setActiveIndex={handleTabClick}
              onSelect={handleTabClick}
              titles={projectData.map((p) => p.title)}
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export default Project;
