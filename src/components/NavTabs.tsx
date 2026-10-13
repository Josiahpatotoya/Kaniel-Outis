import React from 'react';
import { TabKey, TaskItem } from '../types';
import { Timer, BookOpen, CheckSquare, Calendar, Hourglass, BarChart3, Settings } from 'lucide-react';
import { dayKey } from '../utils/storage';

interface NavTabsProps {
  currentTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  tasks: TaskItem[];
}

export const NavTabs: React.FC<NavTabsProps> = ({ currentTab, onSelectTab, tasks }) => {
  const todayStr = dayKey();
  const dueTodayCount = tasks.filter((t) => !t.done && t.due === todayStr).length;

  const tabs: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number }[] = [
    { key: 'timer', label: 'Timer', icon: Timer },
    { key: 'subjects', label: 'Subjects', icon: BookOpen },
    { key: 'tasks', label: 'Tasks', icon: CheckSquare, badge: dueTodayCount > 0 ? dueTodayCount : undefined },
    { key: 'routine', label: 'Routine', icon: Calendar },
    { key: 'exams', label: 'Exams', icon: Hourglass },
    { key: 'history', label: 'History', icon: BarChart3 },
    { key: 'quotes', label: 'Customize', icon: Settings },
  ];

  return (
    <>
      {/* Laptop / Desktop / Tablet Top Tabs Bar */}
      <nav
        role="tablist"
        aria-label="Navigation Sections"
        className="hidden md:flex gap-1.5 p-1.5 border border-[#244463] rounded-2xl bg-[#071522]/90 backdrop-blur-md overflow-x-auto shadow-md my-4 scrollbar-none"
      >
        {tabs.map(({ key, label, icon: Icon, badge }) => {
          const isActive = currentTab === key;
          return (
            <button
              key={key}
              role="tab"
              aria-selected={isActive}
              onClick={() => onSelectTab(key)}
              className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold tracking-wider transition-all select-none whitespace-nowrap ${
                isActive
                  ? 'bg-[#0f2d48] text-[#8acaff] shadow-inner ring-1 ring-[#2d5a86]'
                  : 'text-[#91a9c1] hover:text-[#eaf4ff] hover:bg-[#091a2b]'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#4aa8ff]' : 'text-[#91a9c1]'}`} />
              <span>{label}</span>
              {badge !== undefined && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-[#4aa8ff] text-[#05111d] font-bold">
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Mobile Top Secondary Indicator / Quick bar (optional subtle display) */}
      <div className="md:hidden flex overflow-x-auto gap-1 py-1 px-0.5 border-b border-[#1b3853]/60 mb-3 scrollbar-none">
        {tabs.map(({ key, label, icon: Icon }) => {
          const isActive = currentTab === key;
          return (
            <button
              key={key}
              onClick={() => onSelectTab(key)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition ${
                isActive
                  ? 'bg-[#0f2d48] text-[#8acaff] border border-[#2d5a86]'
                  : 'text-[#91a9c1] hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* Mobile Fixed Bottom Navigation Bar (Phone thumb-friendly) */}
      <nav
        aria-label="Mobile Navigation Bar"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#07172a]/95 backdrop-blur-lg border-t border-[#1b3853] px-2 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] shadow-2xl flex items-center justify-around"
      >
        {tabs.map(({ key, label, icon: Icon, badge }) => {
          const isActive = currentTab === key;
          return (
            <button
              key={key}
              onClick={() => onSelectTab(key)}
              aria-selected={isActive}
              className={`relative flex flex-col items-center justify-center py-1 px-2 min-w-[48px] rounded-xl transition ${
                isActive ? 'text-[#8acaff]' : 'text-[#91a9c1] hover:text-[#eaf4ff]'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 text-[#4aa8ff]' : ''}`} />
                {badge !== undefined && (
                  <span className="absolute -top-1 -right-2 px-1 py-0.2 min-w-[14px] text-center rounded-full text-[9px] bg-[#4aa8ff] text-[#05111d] font-bold">
                    {badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium tracking-tight mt-0.5">{label}</span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-[#4aa8ff] shadow-[0_0_6px_#4aa8ff] mt-0.5" />
              )}
            </button>
          );
        })}
      </nav>
    </>
  );
};
