import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

/* Brand mark reused in sidebar + mobile topbar */
const Logo = ({ className = '' }) => (
  <div className={`flex items-center gap-2.5 text-[1.2rem] font-bold tracking-tight text-[var(--text-primary)] ${className}`}>
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
      <rect x="3" y="3" width="18" height="18" rx="6" fill="var(--primary)" />
      <path d="M9 8v8M15 8v8M9 12h6" stroke="var(--primary-foreground)" strokeWidth="2" strokeLinecap="round" />
    </svg>
    <span>HireMe</span>
  </div>
);

const ICONS = {
  dashboard: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px] flex-shrink-0"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>,
  jobs: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px] flex-shrink-0"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>,
  profile: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px] flex-shrink-0"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
};

const initialsOf = (user) => {
  const a = (user?.name || user?.firstName || '').trim();
  const b = (user?.lastName || '').trim();
  if (a && b) return (a[0] + b[0]).toUpperCase();
  if (a) return a.slice(0, 2).toUpperCase();
  return (user?.email || '?').slice(0, 2).toUpperCase();
};

const roleLabel = (role) =>
  role === 'RECRUITER' ? 'Recruteur' : role === 'ADMIN' ? 'Administrateur' : 'Candidat';

const navItemClass = (active) =>
  `flex items-center gap-[11px] px-2.5 py-[9px] rounded-[8px] text-[0.9rem] font-medium cursor-pointer transition-colors duration-100 w-full text-left ${
    active
      ? 'bg-[var(--primary-glow)] text-[var(--primary)] font-semibold'
      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'
  }`;

/**
 * Sidebar application shell (cream + terracotta template).
 * Replaces the former top navbar for every authenticated page.
 */
export default function AppLayout({ user, isRecruiter, isAdmin, isLightTheme, toggleTheme, logout, children }) {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  // Auto-close the mobile drawer whenever the route changes.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMenuOpen(false);
  }, [location.pathname]);

  const navItems = [
    { to: '/dashboard', label: 'Tableau de bord', icon: ICONS.dashboard, extraActive: (p) => p.startsWith('/builder') },
    ...(!isRecruiter && !isAdmin ? [{ to: '/jobs', label: 'Offres recommandées', icon: ICONS.jobs }] : []),
    { to: '/profile', label: 'Mon profil', icon: ICONS.profile }
  ];

  return (
    <div className="flex min-h-screen max-[760px]:flex-col">

      {/* Mobile topbar */}
      <header className="hidden max-[760px]:flex items-center justify-between px-[18px] py-3 bg-[var(--bg-secondary)] border-b border-[var(--card-border)] sticky top-0 z-40">
        <Logo className="!text-[1.1rem] !p-0" />
        <button onClick={() => setMenuOpen(true)} aria-label="Ouvrir le menu"
          className="inline-flex border border-[var(--card-border)] rounded-[8px] p-[7px] text-[var(--text-primary)]">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
        </button>
      </header>

      {/* Drawer overlay (mobile) */}
      <div
        onClick={() => setMenuOpen(false)}
        className={`fixed inset-0 z-[45] bg-[hsla(30,20%,15%,0.4)] ${menuOpen ? 'block' : 'hidden'} min-[761px]:!hidden`}
      ></div>

      {/* Sidebar */}
      <aside
        className={`w-[248px] flex-shrink-0 bg-[var(--bg-secondary)] border-r border-[var(--card-border)] px-4 py-[22px] flex flex-col sticky top-0 h-screen
          max-[760px]:fixed max-[760px]:top-0 max-[760px]:left-0 max-[760px]:z-50 max-[760px]:shadow-[var(--shadow-lg)] max-[760px]:transition-transform max-[760px]:duration-[250ms]
          ${menuOpen ? 'max-[760px]:translate-x-0' : 'max-[760px]:-translate-x-full'}`}
      >
        <button onClick={() => setMenuOpen(false)} aria-label="Fermer le menu"
          className="hidden max-[760px]:inline-flex absolute top-4 right-3.5 text-[var(--text-muted)] p-1">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>

        <Logo className="px-2 pt-1 pb-5" />

        <nav className="flex flex-col gap-[3px] flex-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                navItemClass(isActive || (item.extraActive && item.extraActive(location.pathname)))
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}

          <div className="text-[0.68rem] font-bold tracking-[0.06em] uppercase text-[var(--text-muted)] px-2.5 pt-3.5 pb-1.5">Paramètres</div>
          <button className={navItemClass(false)} onClick={toggleTheme}>
            {isLightTheme ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px] flex-shrink-0"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px] flex-shrink-0"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>
            )}
            {isLightTheme ? 'Thème sombre' : 'Thème clair'}
          </button>
          <button className={navItemClass(false)} onClick={logout}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px] flex-shrink-0"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
            Se déconnecter
          </button>
        </nav>

        <div className="flex items-center gap-2.5 px-2.5 pt-3 pb-1 mt-2 border-t border-[var(--card-border)]">
          <div className="w-9 h-9 rounded-full bg-[var(--primary-glow)] text-[var(--primary)] flex items-center justify-center font-bold text-[0.85rem] flex-shrink-0">
            {initialsOf(user)}
          </div>
          <div>
            <strong className="block text-[0.85rem] text-[var(--text-primary)]">{user?.fullName || user?.name || 'Utilisateur'}</strong>
            <span className="text-[0.74rem] text-[var(--text-muted)]">{roleLabel(user?.role)}</span>
          </div>
        </div>
      </aside>

      {/* Routed page content. Container-based views get vertical padding;
          the candidate Dashboard manages its own via .dash. */}
      <main className="flex-1 min-w-0 [&>.container]:py-[30px]">
        {children}
      </main>
    </div>
  );
}
