"use client";

import Link from "next/link";
import { LayoutDashboard } from "lucide-react";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  // Page patient (queue/[id]) n'a pas de navbar
  if (pathname?.startsWith("/queue/")) {
    return null;
  }

  return (
    <>
      {/* Navbar fixed en haut */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: SmartQueue Title */}
            <div className="flex items-center">
              <Link href="/" className="font-bold text-xl tracking-tight text-slate-900">
                SmartQueue
              </Link>
            </div>

            {/* Right: Dashboard Link with Icon */}
            <Link
              href="/dashboard-secretaire"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
              title="Espace Médecin"
            >
              <LayoutDashboard className="w-5 h-5 text-slate-600" />
              <span className="text-sm font-medium text-slate-600">Espace Médecin</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Spacer pour éviter que le contenu soit caché sous la navbar fixe */}
      <div className="h-16" />
    </>
  );
}
