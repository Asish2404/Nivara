import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const AnimatedContent = ({
    children,
    container,
    distance = 55,
    direction = "vertical",
    reverse = false,
    duration = 0.75,
    ease = "power3.out",
    initialOpacity = 0,
    animateOpacity = true,
    scale = 0.97,
    threshold = 0.15,
    delay = 0,
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

        const axis = direction === "horizontal" ? "x" : "y";
        const offset = reverse ? -distance : distance;
        const startPct = (1 - threshold) * 100;

        gsap.set(el, {
            [axis]: offset,
            scale,
            opacity: animateOpacity ? initialOpacity : 1,
            visibility: "visible",
            willChange: "transform, opacity",
        });

        const tl = gsap.timeline({
            paused: true,
            delay,
        });

        tl.to(el, {
            [axis]: 0,
            scale: 1,
            opacity: 1,
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
        distance,
        direction,
        reverse,
        duration,
        ease,
        initialOpacity,
        animateOpacity,
        scale,
        threshold,
        delay,
    ]);

    return (
        <div ref={ref} className={className} {...props}>
            {children}
        </div>
    );
};

export default AnimatedContent;