import { NavLink, Outlet } from "react-router-dom";
import { LayoutDashboard, Printer, PlusCircle, History, Settings, Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/printers", icon: Printer, label: "Impressoras" },
  { to: "/new", icon: PlusCircle, label: "Nova Precificação" },
  { to: "/history", icon: History, label: "Histórico" },
  { to: "/settings", icon: Settings, label: "Configurações" },
];

export default function Layout() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed z-50 md:static flex flex-col w-64 h-full bg-card border-r border-border transition-transform duration-200",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex items-center gap-2 px-5 py-5 border-b border-border">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">PP</span>
          </div>
          <span className="font-bold text-lg tracking-tight text-foreground">
            Print<span className="text-primary">Price</span>
          </span>
          <button className="ml-auto md:hidden text-muted-foreground" onClick={() => setOpen(false)}>
            <X size={20} />
          </button>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary neon-text"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="px-5 py-4 border-t border-border">
          <p className="text-[11px] text-muted-foreground">Print Price v1.0</p>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center h-14 px-4 border-b border-border md:hidden">
          <button onClick={() => setOpen(true)} className="text-foreground">
            <Menu size={22} />
          </button>
          <span className="ml-3 font-bold text-foreground">
            Print<span className="text-primary">Price</span>
          </span>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
