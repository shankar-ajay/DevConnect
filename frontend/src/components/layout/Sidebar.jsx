import React from 'react';
import { NavLink } from 'react-router-dom';
import useAuthStore from '../../context/authStore';

const navItems = [
  {
    label: 'Home',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
      </svg>
    ),
    to: '/',
    end: true,
  },
  {
    section: 'PUBLIC',
    items: [
      {
        label: 'Questions',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        ),
        to: '/questions',
      },
      {
        label: 'Tags',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
            <line x1="7" y1="7" x2="7.01" y2="7" />
          </svg>
        ),
        to: '/tags',
      },
      {
        label: 'Users',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 00-3-3.87" />
            <path d="M16 3.13a4 4 0 010 7.75" />
          </svg>
        ),
        to: '/users',
      },
    ],
  },
];

const authItems = {
  section: 'MY ACCOUNT',
  items: [
    {
      label: 'Bookmarks',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
          <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
        </svg>
      ),
      to: '/bookmarks',
    },
  ],
};

export default function Sidebar() {
  const { isAuthenticated } = useAuthStore();

  const linkClass = ({ isActive }) =>
    `flex items-center gap-2.5 px-4 py-1.5 text-sm rounded-r-full transition-all duration-150 ${
      isActive
        ? 'font-semibold border-l-2'
        : 'hover:bg-gray-100 dark:hover:bg-gray-800'
    }`;

  const activeStyle = { borderColor: 'var(--brand)', color: 'var(--text-primary)', background: 'var(--bg-tertiary)' };
  const inactiveStyle = { color: 'var(--text-secondary)' };

  return (
    <nav className="w-52 flex-shrink-0 pt-6 hidden md:block">
      {/* Home link */}
      <NavLink
        to="/"
        end
        className={linkClass}
        style={({ isActive }) => (isActive ? activeStyle : inactiveStyle)}
      >
        {navItems[0].icon}
        {navItems[0].label}
      </NavLink>

      {/* Public section */}
      <div className="mt-4">
        <p className="px-4 py-1 text-xs font-bold tracking-widest" style={{ color: 'var(--text-muted)' }}>
          PUBLIC
        </p>
        {navItems[1].items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={linkClass}
            style={({ isActive }) => (isActive ? activeStyle : inactiveStyle)}
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </div>

      {/* Auth section */}
      {isAuthenticated && (
        <div className="mt-4">
          <p className="px-4 py-1 text-xs font-bold tracking-widest" style={{ color: 'var(--text-muted)' }}>
            {authItems.section}
          </p>
          {authItems.items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={linkClass}
              style={({ isActive }) => (isActive ? activeStyle : inactiveStyle)}
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </div>
      )}
    </nav>
  );
}
