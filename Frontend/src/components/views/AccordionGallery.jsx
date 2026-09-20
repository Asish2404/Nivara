import { useRef, useEffect, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import { MapPin, ArrowRight } from 'lucide-react';

const DEFAULT_ITEMS = [
  { image: 'https://picsum.photos/id/1015/900/1200', label: 'Canyon', link: '#' },
  { image: 'https://picsum.photos/id/1018/900/1200', label: 'Ridgeline', link: '#' },
  { image: 'https://picsum.photos/id/1039/900/1200', label: 'Falls', link: '#' },
  { image: 'https://picsum.photos/id/1043/900/1200', label: 'Harbour', link: '#' },
  { image: 'https://picsum.photos/id/1044/900/1200', label: 'Skyline', link: '#' }
];

const AccordionGallery = ({
  items = DEFAULT_ITEMS,
  defaultIndex = 2,
  accentColor = '#ffffff',
  overlayColor = '#060010',
  textColor = '#ffffff',
  height = 460,
  gap = 10,
  radius = 15,
  expandRatio = 0.52,
  orientation = 'horizontal',
  duration = 0.6,
  ease = 'power3.out',
  parallax = 0.5,
  tilt = 8,
  stagger = 0.06,
  trigger = 'hover',
  showLabels = true,
  grayscale = true,
  className = ''
}) => {
  const rootRef = useRef(null);
  const panelRefs = useRef([]);
  const mediaRefs = useRef([]);
  const barRefs = useRef([]);
  const textRefs = useRef([]);
  const detailsRefs = useRef([]);
  const tlRef = useRef(null);
  const firstRunRef = useRef(true);
  const mediaSizeRef = useRef(320);

  const vertical = orientation === 'vertical';
  const [isMobileScreen, setIsMobileScreen] = useState(
    () => typeof window !== 'undefined' && window.innerWidth <= 640
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => setIsMobileScreen(window.innerWidth <= 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isEffectiveVertical = vertical || isMobileScreen;
  const count = items.length;
  const [active, setActive] = useState(Math.min(Math.max(defaultIndex, 0), count - 1));

  const prefersReduced =
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

  const overlayBg = `linear-gradient(180deg, rgba(6,0,16,0.25) 0%, rgba(6,0,16,0.15) 30%, rgba(6,0,16,0.7) 65%, rgba(6,0,16,0.92) 100%)`;

  const applyLayout = useCallback(
    animate => {
      const panels = panelRefs.current;
      if (!panels.length) return;

      const r = Math.min(Math.max(expandRatio, 0.2), 0.9);
      const grow = isMobileScreen ? (count > 1 ? 4.5 : 1) : (count > 1 ? (r * (count - 1)) / (1 - r) : 1);
      const mediaSize = mediaSizeRef.current;

      tlRef.current?.kill();
      const dur = animate && !prefersReduced ? duration : 0;
      const tl = gsap.timeline();

      panels.forEach((panel, i) => {
        if (!panel) return;
        const isActive = i === active;
        const media = mediaRefs.current[i];
        const bar = barRefs.current[i];
        const text = textRefs.current[i];
        const details = detailsRefs.current[i];

        const rot = isActive ? 0 : i < active ? tilt : -tilt;
        const rotProp = isMobileScreen
          ? { rotateX: 0, rotateY: 0 }
          : isEffectiveVertical
            ? { rotateX: -rot }
            : { rotateY: rot };

        tl.to(panel, { flexGrow: isActive ? grow : 1, ...rotProp, duration: dur, ease }, 0);

        if (media) {
          const drift = Math.max(-1.5, Math.min(1.5, active - i));
          const shift = drift * parallax * mediaSize * 0.06;
          const gray = grayscale ? (isActive ? 0 : 1) : 0;
          tl.to(
            media,
            {
              xPercent: -50,
              yPercent: -50,
              x: isEffectiveVertical ? 0 : isActive ? 0 : shift,
              y: isEffectiveVertical ? (isActive ? 0 : shift) : 0,
              '--ag-gray': gray,
              '--ag-dim': isActive ? 0 : 0.35,
              duration: dur,
              ease
            },
            0
          );
        }

        if (showLabels && bar && text) {
          if (isActive) {
            tl.to([bar, text], { opacity: 1, x: 0, duration: dur, ease, stagger: prefersReduced ? 0 : stagger }, 0);
          } else {
            tl.to([bar, text], { opacity: 0.85, x: 0, duration: dur * 0.6, ease }, 0);
          }
        }

        if (details) {
          if (isActive) {
            details.style.pointerEvents = 'auto';
            tl.to(details, { opacity: 1, y: 0, duration: dur, ease }, 0.05);
          } else {
            details.style.pointerEvents = 'none';
            tl.to(details, { opacity: 0, y: 15, duration: dur * 0.4, ease }, 0);
          }
        }
      });

      tlRef.current = tl;
    },
    [
      active,
      count,
      expandRatio,
      duration,
      ease,
      isEffectiveVertical,
      isMobileScreen,
      tilt,
      parallax,
      grayscale,
      showLabels,
      stagger,
      prefersReduced
    ]
  );

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const measure = () => {
      const rect = el.getBoundingClientRect();
      const total = isEffectiveVertical ? rect.height : rect.width;
      const usable = Math.max(total - gap * (count - 1), 120);
      const size = Math.max(140, usable * Math.min(Math.max(expandRatio, 0.2), 0.9) * 1.22);
      mediaSizeRef.current = size;
      el.style.setProperty('--ag-media-size', `${size}px`);
      applyLayout(!firstRunRef.current);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [applyLayout, gap, count, expandRatio, isEffectiveVertical]);

  useEffect(() => {
    applyLayout(!firstRunRef.current);
    firstRunRef.current = false;
  }, [applyLayout]);

  useEffect(
    () => () => {
      tlRef.current?.kill();
    },
    []
  );

  const handleEnter = i => {
    if (trigger === 'hover' || isMobileScreen) setActive(i);
  };

  const handleActivate = i => {
    setActive(i);
  };

  const handleClick = (item, i, e) => {
    if (i !== active) {
      e.preventDefault();
      e.stopPropagation();
      setActive(i);
    }
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i + 1) % count);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i - 1 + count) % count);
    } else if (e.key === 'Enter') {
      if (items[i]?.onViewOnMap) {
        items[i].onViewOnMap(items[i]);
      }
    }
  };

  const mobileHeight = Math.max(300, 245 + (count - 1) * 56 + (count - 1) * 8);

  return (
    <div
      ref={rootRef}
      className={`flex ${isEffectiveVertical ? 'flex-col' : 'flex-row'} w-full max-w-full ${isMobileScreen ? '[perspective:none]' : '[perspective:1400px]'} ${className}`}
      style={{
        gap: isMobileScreen ? '8px' : `${gap}px`,
        height: isMobileScreen ? `${mobileHeight}px` : isEffectiveVertical ? `${Math.max(540, count * 106)}px` : `${height}px`,
        minHeight: isMobileScreen ? `${mobileHeight}px` : isEffectiveVertical ? `${Math.max(540, count * 106)}px` : `${height}px`
      }}
      role="list"
      aria-label="Image accordion gallery"
    >
      {items.map((item, i) => {
        const isActive = i === active;
        const hasRichHotspotData = Boolean(item.severity || item.waterDepth || item.incident);
        const isCrit = item.severity === 'CRITICAL' || item.severity === 'HIGH';
        const depthNumber = parseFloat(item.waterDepth) || 15;
        const depthPercent = Math.min(Math.round((depthNumber / 35) * 100), 100);

        return (
          <div
            key={item.id || i}
            ref={el => (panelRefs.current[i] = el)}
            className={`group relative block min-w-0 min-h-0 flex-[1_1_0] cursor-pointer overflow-hidden bg-[#0a0713] no-underline outline-none ${isMobileScreen ? '!transform-none min-h-[54px]' : '[transform-style:preserve-3d] [transform-origin:center]'} shadow-[0_12px_36px_rgba(15,23,42,0.12)] focus-visible:ring-2 focus-visible:ring-cyan-400 transition-shadow select-none`}
            style={{
              borderRadius: `${radius}px`,
              '--ag-accent': accentColor,
              willChange: 'flex-grow, transform'
            }}
            onClick={e => handleClick(item, i, e)}
            onPointerEnter={() => handleEnter(i)}
            onMouseEnter={() => handleEnter(i)}
            onPointerDown={() => handleActivate(i)}
            onTouchStart={() => handleActivate(i)}
            onFocus={() => setActive(i)}
            onKeyDown={e => handleKeyDown(i, e)}
            role="listitem"
            tabIndex={0}
            aria-current={isActive ? 'true' : undefined}
            aria-label={item.label || item.name}
          >
            {/* Image Layer with GSAP Controlled Grayscale & Parallax */}
            <span className="absolute inset-0 overflow-hidden [border-radius:inherit] pointer-events-none">
              <span
                ref={el => (mediaRefs.current[i] = el)}
                className="absolute top-1/2 left-1/2 [filter:grayscale(var(--ag-gray,1))]"
                style={{
                  width: isEffectiveVertical ? '100%' : 'var(--ag-media-size, 320px)',
                  height: isEffectiveVertical ? 'var(--ag-media-size, 320px)' : '100%',
                  willChange: 'transform, filter'
                }}
              >
                <img
                  src={item.image}
                  alt={item.alt || item.label || ''}
                  draggable="false"
                  className="block h-full w-full select-none object-cover [-webkit-user-drag:none] transition-transform duration-700 ease-out"
                />
              </span>
              <span
                className="pointer-events-none absolute inset-0"
                style={{ background: overlayBg }}
                aria-hidden="true"
              />
            </span>

            {/* Top Bar Badges (Always visible for clarity & context) */}
            <div className="absolute top-3 sm:top-4 left-3 sm:left-4 right-3 sm:right-4 z-10 flex items-center justify-between gap-2 pointer-events-none">
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                {item.id && (
                  <span className="text-[10px] sm:text-[11px] font-mono font-bold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md bg-black/60 backdrop-blur-md text-white border border-white/20 shadow-sm shrink-0">
                    {item.id}
                  </span>
                )}
                {item.severity && (
                  <span
                    className={`text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-md backdrop-blur-md uppercase tracking-wide border shadow-sm shrink-0 ${
                      isCrit
                        ? 'bg-rose-500/30 text-rose-200 border-rose-400/50'
                        : 'bg-amber-500/30 text-amber-200 border-amber-400/50'
                    }`}
                  >
                    {item.severity}
                  </span>
                )}
                {/* On mobile collapsed card, show location next to badge so user immediately sees what card it is without scrolling */}
                {!isActive && isMobileScreen && (
                  <span className="text-xs font-bold text-white tracking-wide truncate ml-1 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
                    {item.location || item.label}
                  </span>
                )}
              </div>

              {item.timestamp && (
                <div className="hidden min-[420px]:flex items-center gap-1 text-[9.5px] sm:text-[10px] font-mono text-white/95 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/20 shrink-0 shadow-xs">
                  <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-cyan-300" />
                  <span className="font-semibold truncate max-w-[100px] sm:max-w-none">{item.timestamp}</span>
                </div>
              )}
            </div>

            {/* Standard Accordion Label (Shows when not expanded on desktop) */}
            {showLabels && !isActive && !isMobileScreen && (
              <span
                className="pointer-events-none absolute bottom-5 left-5 right-5 z-[2] flex items-center gap-3 transition-opacity duration-300"
                aria-hidden="true"
              >
                <span
                  ref={el => (barRefs.current[i] = el)}
                  className="h-[24px] w-[3px] flex-none rounded-[3px]"
                  style={{
                    background: accentColor,
                    boxShadow: `0 0 10px rgba(255,255,255,0.7)`
                  }}
                />
                <span
                  ref={el => (textRefs.current[i] = el)}
                  className="overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold tracking-wide text-white drop-shadow-md"
                  style={{ color: textColor }}
                >
                  {item.label}
                </span>
              </span>
            )}

            {/* Rich Hotspot Information Deck (Animated into View when Active) */}
            {hasRichHotspotData ? (
              <div
                ref={el => (detailsRefs.current[i] = el)}
                className={`absolute inset-x-0 bottom-0 p-3.5 sm:p-6 z-20 flex flex-col justify-end bg-gradient-to-t from-black/95 via-black/75 to-transparent ${
                  isActive ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                }`}
                style={{ willChange: 'opacity, transform' }}
              >
                {/* Location & Subdivision */}
                <div className="mb-2 sm:mb-3">
                  <h3 className="text-sm sm:text-lg font-bold text-white tracking-tight drop-shadow-md line-clamp-1">
                    {item.location || item.label}
                  </h3>
                  {item.subdivision && (
                    <div className="text-[10.5px] sm:text-[11.5px] text-cyan-300 font-mono font-semibold tracking-wider mt-0.5 drop-shadow-sm">
                      {item.subdivision}
                    </div>
                  )}
                </div>

                {/* Water Depth Progress Indicator */}
                {item.waterDepth && (
                  <div className="mb-2.5 sm:mb-4 space-y-1 sm:space-y-1.5 p-2 sm:p-2.5 rounded-xl bg-white/12 backdrop-blur-md border border-white/20">
                    <div className="flex justify-between text-[11px] sm:text-xs items-center">
                      <span className="text-white font-medium">Water Depth:</span>
                      <span className="font-bold text-rose-300 font-mono text-[11px] sm:text-xs">{item.waterDepth}</span>
                    </div>
                    <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-400 via-sky-400 to-rose-400 rounded-full transition-all duration-700"
                        style={{ width: `${depthPercent}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Bottom Metadata & View on Map CTA */}
                <div className="flex items-center justify-between pt-1.5 sm:pt-2 border-t border-white/20 text-[11px] sm:text-xs">
                  {item.verifiedReports !== undefined ? (
                    <span className="text-white/90 font-mono text-[10.5px] sm:text-[11px] font-medium truncate max-w-[170px] sm:max-w-none">
                      {item.verifiedReports}
                    </span>
                  ) : (
                    <span />
                  )}

                  <button
                    type="button"
                    onPointerDown={e => e.stopPropagation()}
                    onTouchStart={e => e.stopPropagation()}
                    onClick={e => {
                      e.stopPropagation();
                      if (item.onViewOnMap) {
                        item.onViewOnMap(item);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/30 hover:bg-cyan-500/50 text-cyan-100 hover:text-white border border-cyan-400/50 text-xs font-semibold backdrop-blur-md transition-all duration-200 cursor-pointer shadow-sm group/btn"
                  >
                    <span>View on Map</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            ) : (
              /* Fallback for standard demo items with label & link */
              isActive && (
                <div className="absolute bottom-5 left-5 right-5 z-[2] flex items-center justify-between pointer-events-auto">
                  <span className="text-lg font-bold text-white drop-shadow-md">
                    {item.label}
                  </span>
                  {item.link && item.link !== '#' && (
                    <a
                      href={item.link}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-white/20 text-white text-xs backdrop-blur-md"
                    >
                      Visit <ArrowRight className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )
            )}
          </div>
        );
      })}
    </div>
  );
};

export default AccordionGallery;
