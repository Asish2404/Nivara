import { useEffect } from "react";
import { useKWIStore } from "../../store/useKWIStore";
import { useDeviceType } from "../../utils/deviceDetector";
import { CitizenReportingPortal } from "../reporting/CitizenReportingPortal";
import { MySubmittedReports } from "./MySubmittedReports";

export function ReportsView() {
  const { currentRoute, navigate } = useKWIStore();
  const { isMobileOrTablet } = useDeviceType();

  // =========================================================================
  // DEVICE-SPECIFIC ACCESS CONTROL:
  // Laptop and desktop users cannot access the real-world reporting page.
  // When accessed on a laptop or desktop, redirect seamlessly to the homepage ('/'),
  // where the existing simulated mobile phone is available for judge demonstration.
  // NO QR code, NO desktop restriction screen.
  // =========================================================================
  useEffect(() => {
    if (!isMobileOrTablet && (currentRoute === "/reports" || currentRoute === "/report")) {
      navigate("/");
      // Smoothly scroll to the citizen reporting simulation on the homepage
      setTimeout(() => {
        const el = document.getElementById("citizen-reporting");
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
        }
      }, 150);
    }
  }, [isMobileOrTablet, currentRoute, navigate]);

  // "My Submitted Reports" (/my-reports) is accessible on all devices to track past report history
  if (currentRoute === "/my-reports") {
    return <MySubmittedReports />;
  }

  // While redirecting desktop/laptop users, do not render the real-world form
  if (!isMobileOrTablet) {
    return null;
  }

  // Mobile and Tablet users receive the real-world reporting portal directly
  return <CitizenReportingPortal />;
}

export default ReportsView;