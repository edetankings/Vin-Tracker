import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, Settings } from "lucide-react";
import { useRef, type ReactNode } from "react";

import { BottomNav } from "@/components/BottomNav";
import { useInterfaceMotion } from "@/hooks/use-interface-motion";
import { navigationItems } from "@/lib/navigation";
import { useAuth } from "@/lib/auth";

export function AppShell({
  title,
  subtitle,
  action,
  children,
}: {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  const container = useRef<HTMLDivElement>(null);
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { name } = useAuth();
  useInterfaceMotion(container, pathname);
  return (
    <div ref={container} className="interface-shell" data-page={pathname.slice(1) || "home"}>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <aside className="desktop-sidebar">
        <Link to="/" className="sidebar-brand" aria-label="Vin Tracker home">
          <img src="/images/vin-icon.png" alt="" width={36} height={36} />
          <span>Vin Tracker</span>
        </Link>
        <p className="sidebar-caption">YOUR WORKSPACE</p>
        <nav aria-label="Desktop navigation" className="sidebar-navigation">
          {navigationItems.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === "/" }}
              activeProps={{ className: "is-active" }}
            >
              <Icon size={18} /> <span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-motivation">
            <span className="text-lg">✦</span>
            <p>
              A little progress,
              <br />
              every single day.
            </p>
          </div>
          <Link
            to="/settings"
            className="sidebar-settings"
            activeProps={{ className: "is-active" }}
          >
            <Settings size={18} /> Settings
          </Link>
          <div className="sidebar-profile">
            <span className="profile-avatar">{name?.slice(0, 1).toUpperCase() || "V"}</span>
            <div>
              <strong>{name || "Your workspace"}</strong>
              <small>Personal account</small>
            </div>
          </div>
        </div>
      </aside>
      <main id="main-content" className="workspace" tabIndex={-1}>
        <header data-enter className="workspace-header">
          <div className="min-w-0">
            {title ? <h1>{title}</h1> : null}
            {subtitle ? <p className="page-subtitle">{subtitle}</p> : null}
          </div>
          <div className="header-controls">
            <div className="header-action">{action}</div>
            <Link
              to="/settings"
              hash="notifications"
              className="header-icon"
              aria-label="Notification settings"
            >
              <Bell size={18} />
            </Link>
            <Link to="/settings" className="header-icon settings-shortcut" aria-label="Settings">
              <Settings size={18} />
            </Link>
            <Link to="/settings" className="profile-avatar" aria-label="Your profile">
              {name?.slice(0, 1).toUpperCase() || "V"}
            </Link>
          </div>
        </header>
        <div data-enter className="page-content">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
