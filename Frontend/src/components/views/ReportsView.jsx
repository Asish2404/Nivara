import { CitizenReportingSection } from "../landing/CitizenReportingSection";
import { MySubmittedReports } from "./MySubmittedReports";
import { useKWIStore } from "../../store/useKWIStore";

export function ReportsView() {
  const { currentRoute } = useKWIStore();
  // "My Submitted Reports" (/my-reports) renders the premium tracking dashboard;
  // the other reports routes ("Citizen Field Report") keep the untouched
  // CitizenReportingSection (phone mockup) exactly as-is.
  if (currentRoute === "/my-reports") {
    return <MySubmittedReports />;
  }
  return <CitizenReportingSection />;
}

export default ReportsView;