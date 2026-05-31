import { useState } from 'react';
import { formatDisplayDate, today } from './utils/date';
import { useTheme } from './hooks/useTheme';
import { useAuth } from './context/AuthContext';
import AuthScreen from './components/AuthScreen';
import DataSync from './components/DataSync';
import Dashboard from './components/Dashboard';
import Steps from './components/Steps';
import Sleep from './components/Sleep';
import Food from './components/Food';
import Water from './components/Water';
import Weight from './components/Weight';
import Calories from './components/Calories';
import {
  LayoutDashboard, Activity, Moon, Utensils, Droplets, Scale, Flame,
  ChevronLeft, Sun, Moon as MoonIcon, LogOut,
} from 'lucide-react';

const TABS = [
  { id: 'home',     label: 'Dashboard',  Icon: LayoutDashboard },
  { id: 'steps',    label: 'Activity',   Icon: Activity },
  { id: 'sleep',    label: 'Sleep',      Icon: Moon },
  { id: 'food',     label: 'Nutrition',  Icon: Utensils },
  { id: 'water',    label: 'Hydration',  Icon: Droplets },
  { id: 'weight',   label: 'Weight',     Icon: Scale },
  { id: 'calories', label: 'Calories',   Icon: Flame },
];

const SECTION_MAP = {
  steps:    Steps,
  sleep:    Sleep,
  food:     Food,
  water:    Water,
  weight:   Weight,
  calories: Calories,
};


export default function App() {
  const { user, loading, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [selectedDate, setSelectedDate] = useState(today());
  const { theme, toggleTheme } = useTheme();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Loading…</div>
      </div>
    );
  }

  if (!user) return <AuthScreen />;

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    // Reset to today when switching tabs, so you always start on today
    setSelectedDate(today());
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-slate-950">
      <DataSync userId={user.id} />
      {/* ── Top Nav ── */}
      <header className="bg-white dark:bg-slate-900 sticky top-0 z-50 shadow-sm dark:shadow-none dark:border-b dark:border-slate-800">
        <div className="w-full px-4 sm:px-6 lg:px-10">
          {/* Brand row */}
          <div className="flex items-center justify-between h-14 border-b border-gray-100 dark:border-slate-800">
            <button onClick={() => handleTabChange('home')} className="flex items-center gap-2">
              <div className="w-7 h-7 bg-brand rounded flex items-center justify-center flex-shrink-0">
                <Activity size={14} className="text-white" strokeWidth={2.5} />
              </div>
              <span className="font-black text-gray-900 dark:text-white text-lg tracking-tight uppercase">FitTrack</span>
            </button>

            <div className="flex items-center gap-3">
              <p className="text-xs font-medium text-gray-400 dark:text-slate-500 hidden sm:block">
                {formatDisplayDate(today())}
              </p>
              <button
                onClick={toggleTheme}
                className="w-8 h-8 rounded-lg border border-gray-200 dark:border-slate-700 flex items-center justify-center text-gray-400 dark:text-slate-400 hover:border-brand hover:text-brand transition-colors"
                aria-label="Toggle theme"
              >
                {theme === 'dark'
                  ? <Sun size={14} strokeWidth={2.5} />
                  : <MoonIcon size={14} strokeWidth={2.5} />}
              </button>
              <button
                onClick={signOut}
                className="w-8 h-8 rounded-lg border border-gray-200 dark:border-slate-700 flex items-center justify-center text-gray-400 dark:text-slate-400 hover:border-red-400 hover:text-red-400 transition-colors"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut size={14} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* Tab bar */}
          <div className="flex overflow-x-auto scrollbar-hide -mb-px">
            {TABS.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => handleTabChange(id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors flex-shrink-0 uppercase tracking-wide ${
                  activeTab === id
                    ? 'border-brand text-brand'
                    : 'border-transparent text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 hover:border-gray-200 dark:hover:border-slate-700'
                }`}
              >
                <Icon size={14} strokeWidth={activeTab === id ? 2.5 : 2} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="w-full px-4 sm:px-6 lg:px-10 py-6 pb-16">
        {activeTab === 'home' ? (
          <Dashboard onNavigate={handleTabChange} />
        ) : (
          <div className="space-y-5">
            <button
              onClick={() => handleTabChange('home')}
              className="flex items-center gap-1 text-sm font-medium text-gray-400 dark:text-slate-500 hover:text-brand dark:hover:text-brand transition-colors"
            >
              <ChevronLeft size={16} />
              Dashboard
            </button>

            {SECTION_MAP[activeTab] && (() => {
              const ActiveSection = SECTION_MAP[activeTab];
              return <ActiveSection key={selectedDate} date={selectedDate} onDateChange={setSelectedDate} />;
            })()}
          </div>
        )}
      </main>
    </div>
  );
}
