import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

export default function Layout({ children, rightSidebar }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-secondary)' }}>
      <Header />
      <div className="max-w-7xl mx-auto px-4 flex gap-0 pt-0">
        <Sidebar />
        <main className="flex-1 min-w-0 flex gap-4 py-6 md:pl-6">
          <div className="flex-1 min-w-0">{children}</div>
          {rightSidebar && (
            <aside className="w-72 flex-shrink-0 hidden lg:block">
              {rightSidebar}
            </aside>
          )}
        </main>
      </div>
    </div>
  );
}
