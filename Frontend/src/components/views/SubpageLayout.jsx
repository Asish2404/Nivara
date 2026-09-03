import { KWINavbar } from "../navigation/KWINavbar";
import { AskKolkataDrawer } from "../navigation/AskKolkataDrawer";
import Footer from "../Footer";

export function SubpageLayout({ children }) {
  return (
    <div className="relative w-full min-h-screen bg-white text-slate-900 flex flex-col justify-between font-sans selection:bg-cyan-100 selection:text-cyan-900 overflow-hidden">
      {/* Ambient Top Radiant Glow & Micro-Grid for Subpages */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[450px] bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.12),rgba(59,130,246,0.06),transparent_70%)] pointer-events-none -z-10" />
      <div className="absolute top-0 inset-x-0 h-[380px] bg-[linear-gradient(to_right,#0f172a06_1px,transparent_1px),linear-gradient(to_bottom,#0f172a06_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,#000_65%,transparent_100%)] pointer-events-none -z-10" />

      <KWINavbar />
      <AskKolkataDrawer />

      <main className="flex-1 w-full max-w-[1280px] mx-auto pt-8 pb-16 px-4 sm:px-6 lg:px-8">
        {children}
      </main>

      <Footer />
    </div>
  );
}

export default SubpageLayout;
