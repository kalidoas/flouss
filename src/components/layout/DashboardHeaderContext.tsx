import React, { createContext, useContext, useMemo, useState } from 'react';
import { getCurrentMonthStr } from '../../utils/formatters';

interface DashboardHeaderContextValue {
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
}

const DashboardHeaderContext = createContext<DashboardHeaderContextValue | null>(null);

export const DashboardHeaderProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthStr());
  const value = useMemo(() => ({ selectedMonth, setSelectedMonth }), [selectedMonth]);
  return <DashboardHeaderContext.Provider value={value}>{children}</DashboardHeaderContext.Provider>;
};

export const useDashboardHeader = () => {
  const context = useContext(DashboardHeaderContext);
  if (!context) throw new Error('useDashboardHeader must be used within DashboardHeaderProvider');
  return context;
};
