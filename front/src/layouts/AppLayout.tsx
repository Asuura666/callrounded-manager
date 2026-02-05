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

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 flex-col bg-surface border-r border-border">
        <div className="p-6">
          <h1 className="text-xl font-bold text-accent">CallRounded</h1>
          <p className="text-sm text-text-secondary mt-1 truncate">{user.tenant_name || "Mon salon"}</p>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => {
            const active = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    active
                      ? "bg-accent/10 text-accent"
                      : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{user.email}</p>
              <p className="text-xs text-text-muted">Administrateur</p>
            </div>
            <Button variant="ghost" size="icon" onClick={onLogout} title="Déconnexion">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <aside className="fixed left-0 top-0 h-full w-64 bg-surface border-r border-border z-50">
            <div className="flex items-center justify-between p-4">
              <h1 className="text-lg font-bold text-accent">CallRounded</h1>
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <nav className="px-3 space-y-1">
              {navItems.map((item) => {
                const active = location === item.href || (item.href !== "/" && location.startsWith(item.href));
                return (
                  <Link key={item.href} href={item.href}>
                    <div
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer ${
                        active ? "bg-accent/10 text-accent" : "text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.label}
                    </div>
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-border bg-surface">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold text-accent">CallRounded</h1>
          <Button variant="ghost" size="icon" onClick={onLogout}>
            <LogOut className="w-4 h-4" />
          </Button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">{children}</div>

        {/* Mobile bottom nav */}
        <nav className="md:hidden flex justify-around border-t border-border bg-surface py-2">
          {navItems.map((item) => {
            const active = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}>
                <div className={`flex flex-col items-center gap-0.5 text-xs cursor-pointer ${active ? "text-accent" : "text-text-muted"}`}>
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
