import { KWINavbar } from "../navigation/KWINavbar";
import { AskKolkataDrawer } from "../navigation/AskKolkataDrawer";
import Footer from "../Footer";

export function SubpageLayout({ children }) {
  return (
    <div className="relative w-full min-h-screen bg-white text-slate-900 flex flex-col justify-between font-sans selection:bg-blue-100 selection:text-blue-900">
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
