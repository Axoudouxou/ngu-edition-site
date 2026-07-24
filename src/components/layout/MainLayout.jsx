import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import AnnouncementBanner from './AnnouncementBanner';

export default function MainLayout() {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      {pathname !== '/' && <AnnouncementBanner />}
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
