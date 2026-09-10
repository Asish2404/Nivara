import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const FadeContent = ({
    children,
    container,
    blur = true,
    duration = 0.55,
    ease = "power2.out",
    delay = 0,
    threshold = 0.15,
    className = "",
    ...props
}) => {
    const ref = useRef(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        let scrollerTarget =
            container ||
            document.getElementById("snap-main-container") ||
            null;

        if (typeof scrollerTarget === "string") {
            scrollerTarget = document.querySelector(scrollerTarget);
        }

        const startPct = (1 - threshold) * 100;

        gsap.set(el, {
            filter: blur ? "blur(10px)" : "blur(0px)",
            willChange: "filter",
        });

        const tl = gsap.timeline({
            paused: true,
            delay,
        });

        tl.to(el, {
            filter: "blur(0px)",
            duration,
            ease,
        });

        const st = ScrollTrigger.create({
            trigger: el,
            scroller: scrollerTarget || window,
            start: `top ${startPct}%`,
            once: true,
            onEnter: () => tl.play(),
        });

        return () => {
            st.kill();
            tl.kill();
            gsap.killTweensOf(el);
        };
    }, [
        container,
        blur,
        duration,
        ease,
        delay,
        threshold,
    ]);

    return (
        <div ref={ref} className={className} {...props}>
            {children}
        </div>
    );
};

export default FadeContent;