import { Link, useLocation } from "wouter";
import { LayoutDashboard, BarChart3, Headset, BellRing, Phone, PhoneCall, BookOpen, LogOut, Menu, X, Sparkles, Users, Wand2, Shield } from "lucide-react";
import { useState } from "react";
import type { User } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const navItems = [
  { href: "/", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/agents", label: "Mon réceptionniste", icon: Headset },
  { href: "/calls", label: "Historique appels", icon: PhoneCall },
  { href: "/phone-numbers", label: "Numéros", icon: Phone },
  { href: "/knowledge-bases", label: "Base de connaissances", icon: BookOpen },
  { href: "/alerts", label: "Alertes", icon: BellRing },
];

const adminItems = [
  { href: "/admin/users", label: "Utilisateurs", icon: Users },
  { href: "/admin/agent-builder", label: "Créer un agent", icon: Wand2 },
];

interface Props {
  user: User;
  onLogout: () => void;
  children: React.ReactNode;
}

export function AppLayout({ user, onLogout, children }: Props) {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isAdmin = user.role === "ADMIN";

  const NavLink = ({ item, mobile = false }: { item: typeof navItems[0]; mobile?: boolean }) => {
    const active = location === item.href || (item.href !== "/" && location.startsWith(item.href));
    return (
      <Link key={item.href} href={item.href}>
        <div
          onClick={mobile ? () => setSidebarOpen(false) : undefined}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
            active ? "bg-gold/15 text-gold border-l-2 border-gold ml-0" : "text-white/70 hover:text-white hover:bg-white/5"
          }`}
        >
          <item.icon className={`w-5 h-5 transition-colors ${active ? "text-gold" : ""}`} />
          {item.label}
        </div>
      </Link>
    );
  };

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      <div className={`${mobile ? "p-4" : "p-6"} ${mobile ? "" : "pb-2"}`}>
        {mobile && (
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gold tracking-wide font-heading">W&I</h1>
              <Sparkles className="w-4 h-4 text-gold/60" />
            </div>
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)} className="text-white/70 hover:text-white hover:bg-white/10">
              <X className="w-5 h-5" />
            </Button>
          </div>
        )}
        {!mobile && (
          <>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold text-gold tracking-wide font-heading">W&I</h1>
              <Sparkles className="w-5 h-5 text-gold/60" />
            </div>
            <div className="mt-2 mb-4">
              <div className="w-12 h-0.5 bg-gradient-to-r from-gold/60 to-transparent rounded-full" />
            </div>
            <p className="text-sm text-white/60 truncate">{user.tenant_name || "Mon salon"}</p>
          </>
        )}
      </div>

      <nav className="flex-1 px-3 space-y-1 mt-2">
        {navItems.map((item) => (
          <NavLink key={item.href} item={item} mobile={mobile} />
        ))}

        {/* Admin Section */}
        {isAdmin && (
          <>
            <div className="pt-4 pb-2">
              <Separator className="bg-white/10" />
              <div className="flex items-center gap-2 px-3 py-2 mt-2">
                <Shield className="w-4 h-4 text-gold/60" />
                <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">Administration</span>
              </div>
            </div>
            {adminItems.map((item) => (
              <NavLink key={item.href} item={item} mobile={mobile} />
            ))}
          </>
        )}
      </nav>

      <div className="p-4 border-t border-white/10">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-white/90 truncate">{user.email}</p>
            <p className="text-xs text-white/50 flex items-center gap-1">
              {isAdmin ? (
                <>
                  <Shield className="w-3 h-3 text-gold" />
                  <span className="text-gold">Administrateur</span>
                </>
              ) : (
                "Utilisateur"
              )}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onLogout} title="Déconnexion" className="text-white/50 hover:text-gold hover:bg-white/5 transition-colors">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="hidden md:flex md:w-64 flex-col bg-navy shadow-xl">
        <SidebarContent />
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" style={{ animation: "fade-in 0.2s ease-out forwards" }} onClick={() => setSidebarOpen(false)} />
          <aside className="fixed left-0 top-0 h-full w-64 bg-navy shadow-2xl z-50 flex flex-col" style={{ animation: "slide-in-left 0.3s ease-out forwards" }}>
            <SidebarContent mobile />
          </aside>
        </div>
      )}

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="md:hidden flex items-center justify-between p-4 border-b border-border bg-navy shadow-md">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} className="text-white/80 hover:text-white hover:bg-white/10">
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-1">
            <h1 className="text-xl font-bold text-gold font-heading">W&I</h1>
            <Sparkles className="w-3 h-3 text-gold/60" />
          </div>
          <Button variant="ghost" size="icon" onClick={onLogout} className="text-white/80 hover:text-gold hover:bg-white/10">
            <LogOut className="w-4 h-4" />
          </Button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">{children}</div>

        <nav className="md:hidden flex justify-around border-t border-border bg-white py-2 shadow-[0_-2px_8px_rgba(0,0,0,0.06)]">
          {navItems.slice(0, 4).map((item) => {
            const active = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}>
                <div className={`flex flex-col items-center gap-0.5 text-xs cursor-pointer transition-all ${active ? "text-gold scale-105" : "text-text-muted hover:text-navy"}`}>
                  <item.icon className="w-5 h-5" />
                  <span className="truncate max-w-[4.5rem]">{item.label}</span>
                </div>
              </Link>
            );
          })}
          {isAdmin && (
            <Link href="/admin/users">
              <div className={`flex flex-col items-center gap-0.5 text-xs cursor-pointer transition-all ${location.startsWith("/admin") ? "text-gold scale-105" : "text-text-muted hover:text-navy"}`}>
                <Shield className="w-5 h-5" />
                <span>Admin</span>
              </div>
            </Link>
          )}
        </nav>
      </main>
    </div>
  );
}
