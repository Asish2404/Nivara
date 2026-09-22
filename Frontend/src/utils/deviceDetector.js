/**
 * deviceDetector.js
 * Multi-factor device detection module.
 * 
 * Accurately distinguishes Mobile & Tablet devices from Desktop & Laptop devices
 * by combining:
 * 1. Screen dimensions & responsive browser resizing (window.innerWidth <= 1024)
 * 2. User Agent heuristics (iPhone, iPad, iPadOS MacIntel, Android)
 * 3. Primary Pointer Type (pointer: coarse vs pointer: fine)
 * 4. Hover Capability (hover: none vs hover: hover)
 * 5. Max Touch Points & Multi-Touch Gestures
 */

import { useState, useEffect } from "react";

export function getDeviceInfo() {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return {
      isMobile: false,
      isTablet: false,
      isMobileOrTablet: false,
      isDesktopOrLaptop: true,
      deviceType: "desktop",
      hasCameraSupport: false,
    };
  }

  const ua = navigator.userAgent || "";
  const maxTouchPoints = navigator.maxTouchPoints || 0;

  // 1. Explicit Mobile / Tablet OS Regex checks
  const isAndroid = /Android/i.test(ua);
  const isIPhone = /iPhone|iPod/i.test(ua);
  // Modern iPadOS identifies as Macintosh in UA, but has maxTouchPoints >= 2
  const isIPad =
    /iPad/i.test(ua) ||
    (navigator.platform === "MacIntel" && maxTouchPoints > 1 && !/iPhone/i.test(ua));

  // 2. Viewport / Screen width (handles responsive browser resizing and DevTools!)
  const width = window.innerWidth || document.documentElement?.clientWidth || window.screen?.width || 0;

  // 3. Pointer & touch capabilities
  const hasCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const hasFinePointer = window.matchMedia("(pointer: fine)").matches;
  const canHover = window.matchMedia("(hover: hover)").matches;

  // Laptops with touchscreen: large desktop width (> 1024px) + fine pointer (mouse/trackpad) + can hover
  const isTouchLaptop =
    hasFinePointer && canHover && maxTouchPoints > 0 && width > 1024 && !isIPad && !isAndroid && !isIPhone;

  // Mobile / Tablet determination:
  // - True mobile OS (iPhone, Android, iPad)
  // - OR Viewport width <= 1024px (handles mobile/tablet screen sizes, DevTools emulation, and browser resizing!)
  // - OR Coarse pointer without laptop characteristics
  const isMobileOrTablet =
    (isIPhone || isAndroid || isIPad || width <= 1024 || hasCoarsePointer) && !isTouchLaptop;

  const isDesktopOrLaptop = !isMobileOrTablet;

  const isMobile =
    isIPhone || (isAndroid && /Mobile/i.test(ua)) || (width < 600 && isMobileOrTablet);
  const isTablet = isMobileOrTablet && !isMobile;

  const hasCameraSupport = !!(
    navigator.mediaDevices && navigator.mediaDevices.getUserMedia
  );

  return {
    isMobile,
    isTablet,
    isMobileOrTablet,
    isDesktopOrLaptop,
    deviceType: isMobile ? "mobile" : isTablet ? "tablet" : "desktop",
    hasCameraSupport,
    screenWidth: width,
  };
}

/**
 * React hook for responsive device type detection with resize & orientation listeners
 */
export function useDeviceType() {
  const [deviceInfo, setDeviceInfo] = useState(getDeviceInfo);

  useEffect(() => {
    const handleResize = () => {
      setDeviceInfo(getDeviceInfo());
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, []);

  return deviceInfo;
}
