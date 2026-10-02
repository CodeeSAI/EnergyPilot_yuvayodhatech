
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SimulatorProvider } from './sim';
import { AppLayout } from './components/layout/AppLayout';
import { OverviewPage } from './pages/OverviewPage';
import { MachinesPage } from './pages/MachinesPage';
import { MachineDetailPage } from './pages/MachineDetailPage';
import { SavingsReportPage } from './pages/SavingsReportPage';
import { SettingsPage } from './pages/SettingsPage';

export const App: React.FC = () => {
  return (
    <SimulatorProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<OverviewPage />} />
            <Route path="machines" element={<MachinesPage />} />
            <Route path="machines/:id" element={<MachineDetailPage />} />
            <Route path="savings" element={<SavingsReportPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </SimulatorProvider>
  );
};

export default App;
