import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const DashboardLayout = () => {
  return (
    <div className="min-h-screen bg-brand-bg flex">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-64 min-h-screen overflow-x-hidden">
        <Header />
        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
