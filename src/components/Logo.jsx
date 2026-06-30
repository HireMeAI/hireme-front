import React from 'react';
import { Link } from 'react-router-dom';

const Logo = ({ className = '' }) => (
  <Link to="/" className={`flex items-center gap-2.5 text-[1.2rem] font-bold tracking-tight text-[var(--text-primary)] hover:opacity-90 transition-opacity ${className}`}>
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
      <rect x="3" y="3" width="18" height="18" rx="6" fill="var(--primary)" />
      <path d="M9 8v8M15 8v8M9 12h6" stroke="var(--primary-foreground)" strokeWidth="2" strokeLinecap="round" />
    </svg>
    <span>HireMe</span>
  </Link>
);

export default Logo;
