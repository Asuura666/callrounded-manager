import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Headset,
  Phone,
  PhoneCall,
  BookOpen,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import type { User } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/agents", label: "Mon réceptionniste", icon: Headset },
  { href: "/calls", label: "Historique appels", icon: PhoneCall },
  { href: "/phone-numbers", label: "Numéros", icon: Phone },
  { href: "/knowledge-bases", label: "Base de connaissances", icon: BookOpen },
];

interface Props {
  user: User;
  onLogout: () => void;
  children: React.ReactNode;
}

export function AppLayout({ user, onLogout, children }: Props) {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      {/* W&I Logo */}
      <div className={`${mobile ? "p-4" : "p-6"} ${mobile ? "" : "pb-2"}`}>
        {mobile && (
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gold tracking-wide" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                W&I
              </h1>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)} className="text-white/70 hover:text-white hover:bg-white/10">
              <X className="w-5 h-5" />
            </Button>
          </div>
        )}
        {!mobile && (
          <>
            <h1 className="text-3xl font-bold text-gold tracking-wide" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              W&I
            </h1>
            <div className="mt-2 mb-4">
              <div className="w-12 h-0.5 bg-gold/60 rounded-full" />
            </div>
            <p className="text-sm text-white/60 truncate">{user.tenant_name || "Mon salon"}</p>
          </>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1 mt-2">
        {navItems.map((item) => {
          const active = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}>
              <div
                onClick={mobile ? () => setSidebarOpen(false) : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  active
                    ? "bg-gold/15 text-gold border-l-2 border-gold ml-0"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                }`}
              >
                <item.icon className={`w-5 h-5 ${active ? "text-gold" : ""}`} />
                {item.label}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-white/90 truncate">{user.email}</p>
            <p className="text-xs text-white/50">Administrateur</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onLogout}
            title="Déconnexion"
            className="text-white/50 hover:text-gold hover:bg-white/5"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 flex-col bg-navy shadow-xl">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="fixed left-0 top-0 h-full w-64 bg-navy shadow-2xl z-50 flex flex-col">
            <SidebarContent mobile />
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-border bg-navy shadow-md">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} className="text-white/80 hover:text-white hover:bg-white/10">
            <Menu className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-gold" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            W&I
          </h1>
          <Button variant="ghost" size="icon" onClick={onLogout} className="text-white/80 hover:text-gold hover:bg-white/10">
            <LogOut className="w-4 h-4" />
          </Button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">{children}</div>

        {/* Mobile bottom nav */}
        <nav className="md:hidden flex justify-around border-t border-border bg-white py-2 shadow-[0_-2px_8px_rgba(0,0,0,0.06)]">
          {navItems.map((item) => {
            const active = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}>
                <div className={`flex flex-col items-center gap-0.5 text-xs cursor-pointer transition-colors ${active ? "text-gold" : "text-text-muted hover:text-navy"}`}>
                  <item.icon className="w-5 h-5" />
                  <span className="truncate max-w-[4.5rem]">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>
      </main>
    </div>
  );
}
