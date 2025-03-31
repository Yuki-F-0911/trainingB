import { ReactNode } from 'react';

interface DashboardLayoutProps {
  children: ReactNode;
  dashboard: ReactNode;
}

export default function DashboardLayout({
  children,
  dashboard,
}: DashboardLayoutProps) {
  return (
    <div className="dashboard-layout">
      <div className="dashboard-content">
        {children}
      </div>
      <div className="dashboard-sidebar">
        {dashboard}
      </div>
    </div>
  );
} 