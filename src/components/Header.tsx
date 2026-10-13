import React, { useState, useEffect } from 'react';
import { Exam } from '../types';
import { Download, Keyboard, VolumeX, WifiOff } from 'lucide-react';
import { pad } from '../utils/storage';

interface HeaderProps {
  title: string;
  tagline: string;
  exams: Exam[];
  onSelectTab: (tab: any) => void;
  onOpenShortcuts: () => void;
  onOpenInstall: () => void;
  canInstall: boolean;
  isStandalone: boolean;
  isOnline: boolean;
  isAlarmRinging: boolean;
  onStopAlarm: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  tagline,
  exams,
  onSelectTab,
  onOpenShortcuts,
  onOpenInstall,
  canInstall,
  isStandalone,
  isOnline,
  isAlarmRinging,
  onStopAlarm,
}) => {
  const [nearestExamText, setNearestExamText] = useState('ENGINEERING STUDY MODE');

  useEffect(() => {
    const updateChip = () => {
      const now = Date.now();
      const list = exams
        .map((e) => {
          const t = new Date(`${e.date}T${e.time || '08:00'}`).getTime();
          return { ...e, t };
        })
        .filter((e) => e.t > now)
        .sort((a, b) => a.t - b.t);

      if (!list.length) {
        setNearestExamText('ENGINEERING STUDY MODE');
        return;
      }

      const next = list[0];
      const diffSec = Math.max(0, Math.floor((next.t - now) / 1000));
      const days = Math.floor(diffSec / 86400);
      const hours = Math.floor((diffSec % 86400) / 3600);
      const minutes = Math.floor((diffSec % 3600) / 60);

      const label =
        days >= 1
          ? `${days} DAY${days === 1 ? '' : 'S'} · ${pad(hours)}H`
          : `${pad(hours)}H ${pad(minutes)}M`;

      setNearestExamText(`${next.name.toUpperCase().slice(0, 20)} · ${label}`);
    };

    updateChip();
    const timer = setInterval(updateChip, 1000);
    return () => clearInterval(timer);
  }, [exams]);

  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#18334c]/60">
      <div className="flex items-center gap-3.5">
        <div className="relative w-11 h-10 flex items-center justify-center border border-[#4aa8ff] text-[#4aa8ff] [clip-path:polygon(50%_0%,100%_100%,0%_100%)] bg-[#0a1a2b] shadow-[0_0_15px_rgba(74,168,255,0.15)] group transition-transform hover:scale-105 select-none">
          <span className="text-xl font-bold font-mono tracking-tighter mt-1">△</span>
        </div>
        <div>
          <h1 className="text-base sm:text-lg font-bold tracking-[0.24em] text-white uppercase m-0 leading-tight">
            {title}
          </h1>
          <p className="text-[10px] tracking-[0.18em] text-[#91a9c1] uppercase m-0 mt-0.5">
            {tagline}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap justify-between sm:justify-end">
        {!isOnline && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-amber-600/50 bg-amber-950/40 text-amber-300 text-[11px] tracking-wider font-medium">
            <WifiOff className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>OFFLINE</span>
          </div>
        )}

        {isAlarmRinging && (
          <button
            onClick={onStopAlarm}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#b8ff5c] text-[#071321] text-xs font-bold tracking-wider animate-bounce shadow-lg shadow-[#b8ff5c]/30"
          >
            <VolumeX className="w-4 h-4" />
            <span>STOP ALARM</span>
          </button>
        )}

        <button
          onClick={() => onSelectTab('exams')}
          title="Open exam countdowns"
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#244463] hover:border-[#4aa8ff] bg-[#071522]/80 text-[#91a9c1] hover:text-[#eaf4ff] text-[11px] font-medium tracking-wider transition group shrink-0"
        >
          <span className="w-2 h-2 rounded-full bg-[#b8ff5c] shadow-[0_0_8px_#b8ff5c]" />
          <span className="text-xs group-hover:text-[#8acaff] transition">{nearestExamText}</span>
        </button>

        <button
          onClick={onOpenShortcuts}
          title="Laptop Keyboard Shortcuts"
          aria-label="Keyboard Shortcuts"
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#244463] hover:border-[#4aa8ff] bg-[#071522]/80 text-[#91a9c1] hover:text-[#eaf4ff] text-xs tracking-wider transition"
        >
          <Keyboard className="w-3.5 h-3.5 text-[#4aa8ff]" />
          <span>KEYS</span>
        </button>

        {!isStandalone && (
          <button
            onClick={onOpenInstall}
            title="Install app on Phone or Laptop"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#4aa8ff]/80 bg-[#0a1c2d] hover:bg-[#0f2b45] text-[#8acaff] text-[11px] font-semibold tracking-wider transition shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-[#4aa8ff]" />
            <span>INSTALL</span>
          </button>
        )}
      </div>
    </header>
  );
};
