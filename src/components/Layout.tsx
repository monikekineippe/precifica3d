import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, Printer, PlusCircle, History, Settings, Menu, X, Crown, BarChart3, LogOut } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import logo from "@/assets/logo-precifica3d.png";
import logoIcon from "@/assets/logo-icon.png";

const NAV = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/printers", icon: Printer, label: "Impressoras" },
  { to: "/new", icon: PlusCircle, label: "Nova Precificação" },
  { to: "/history", icon: History, label: "Histórico" },
  { to: "/reports", icon: BarChart3, label: "Relatórios" },
  { to: "/planos", icon: Crown, label: "Planos" },
  { to: "/settings", icon: Settings, label: "Configurações" },
];

export default function Layout() {
  const [open, setOpen] = useState(false);
  const { profile, isPro, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {open && (
        <div className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={() => setOpen(false)} />
      )}

      <aside
        className={cn(
          "fixed z-50 md:static flex flex-col w-64 h-full bg-card border-r border-border transition-transform duration-200",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
          <img src={logo} alt="Precifica3D" className="h-9 object-contain" />
          <button className="ml-auto md:hidden text-muted-foreground" onClick={() => setOpen(false)}>
            <X size={20} />
          </button>
        </div>

        {/* User info */}
        <div className="px-5 py-3 border-b border-border">
          <p className="text-sm font-medium text-foreground truncate">{profile?.nome || "Usuário"}</p>
          <Badge variant="outline" className={cn("text-[10px] mt-1", isPro ? "border-primary/50 text-primary" : "border-border text-muted-foreground")}>
            {isPro ? "Pro" : "Free"}
          </Badge>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
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

        <div className="px-5 py-4 border-t border-border space-y-2">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground w-full"
          >
            <LogOut size={16} /> Sair
          </button>
          <p className="text-[11px] text-muted-foreground">Precifica3D v2.0</p>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center h-14 px-4 border-b border-border md:hidden">
          <button onClick={() => setOpen(true)} className="text-foreground">
            <Menu size={22} />
          </button>
          <img src={logoIcon} alt="Precifica3D" className="ml-3 h-8 object-contain" />
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
