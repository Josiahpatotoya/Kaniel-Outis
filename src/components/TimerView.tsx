import React, { useState, useEffect } from 'react';
import {
  Subject,
  Session,
  Quote,
  IntensityLevel,
  INTENSITY_CONFIG,
  getMasteryStage,
} from '../types';
import {
  Play,
  Pause,
  RotateCcw,
  Plus,
  RefreshCw,
  Clock,
  Flame,
  BookOpen,
  Coffee,
  Sparkles,
  Zap,
  Award,
} from 'lucide-react';
import { pad, formatMinutes, mondayOf, addDays, dayKey, DAYS_SHORT } from '../utils/storage';
import { MasteryMilestoneBar } from './MasteryMilestoneBar';

interface TimerViewProps {
  remaining: number;
  duration: number;
  running: boolean;
  stopwatch: boolean;
  name: string;
  kind: 'focus' | 'break';
  cycle: number;
  activeSubjectId: string | null;
  sessionIntensity: IntensityLevel;
  subjects: Subject[];
  sessions: Session[];
  legacySessions: number;
  currentQuote: Quote | null;
  onStartPause: () => void;
  onReset: () => void;
  onAddMinute: () => void;
  onSetPreset: (seconds: number, name: string, kind: 'focus' | 'break', stopwatch?: boolean) => void;
  onSelectSubject: (id: string | null) => void;
  onSetIntensity: (intensity: IntensityLevel) => void;
  onCycleQuote: () => void;
  onNavigateTab: (tab: any) => void;
}

export const TimerView: React.FC<TimerViewProps> = ({
  remaining,
  duration,
  running,
  stopwatch,
  name,
  kind,
  cycle,
  activeSubjectId,
  sessionIntensity,
  subjects,
  sessions,
  legacySessions,
  currentQuote,
  onStartPause,
  onReset,
  onAddMinute,
  onSetPreset,
  onSelectSubject,
  onSetIntensity,
  onCycleQuote,
  onNavigateTab,
}) => {
  // Custom inputs state
  const [customHours, setCustomHours] = useState(0);
  const [customMinutes, setCustomMinutes] = useState(45);
  const [customSeconds, setCustomSeconds] = useState(0);

  // SVG Ring calculation
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = stopwatch ? 0 : duration > 0 ? remaining / duration : 0;
  const strokeDashoffset = circumference * (1 - progressRatio);

  const activeSubject = subjects.find((s) => s.id === activeSubjectId);
  const currentIntensityCfg = INTENSITY_CONFIG[sessionIntensity];
  const activeMastery = activeSubject
    ? getMasteryStage(activeSubject.masteryLevel ?? 50)
    : null;

  // Format digital display
  const formatTimeDisplay = (sec: number) => {
    sec = Math.max(0, Math.floor(sec));
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (h > 0) {
      return `${pad(h)}:${pad(m)}:${pad(s)}`;
    }
    return `${pad(m)}:${pad(s)}`;
  };

  // State text
  const stateText = stopwatch
    ? running
      ? 'STOPWATCH RUNNING'
      : 'STOPWATCH READY'
    : running
    ? sessionIntensity === 'extreme'
      ? '🔥 BEAST MODE IN PROGRESS'
      : 'SESSION IN PROGRESS'
    : remaining === 0
    ? 'SESSION COMPLETE'
    : 'READY TO FOCUS';

  // Stats calculation
  const todayKeyStr = dayKey();
  const todayMinutes = sessions.reduce((acc, s) => {
    return dayKey(new Date(s.ts)) === todayKeyStr ? acc + s.min : acc;
  }, 0);

  const totalSessionsCount = sessions.filter((s) => !s.legacy).length + (legacySessions || 0);

  // 7-day bar chart data
  const mon = mondayOf();
  const weekData = DAYS_SHORT.map((dayLabel, i) => {
    const d = addDays(mon, i);
    const k = dayKey(d);
    const isToday = k === todayKeyStr;
    const dayTotal = sessions.reduce((acc, s) => {
      return dayKey(new Date(s.ts)) === k ? acc + s.min : acc;
    }, 0);
    return {
      label: dayLabel,
      isToday,
      minutes: dayTotal,
      date: d.getDate(),
    };
  });

  const maxWeekMinutes = Math.max(30, ...weekData.map((d) => d.minutes));

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const totalSec = customHours * 3600 + customMinutes * 60 + customSeconds;
    if (totalSec <= 0) return;
    onSetPreset(totalSec, 'Custom Timer', 'focus', false);
  };

  // Dynamic stroke color based on intensity or subject
  const ringColor =
    sessionIntensity === 'extreme'
      ? '#ff7a90'
      : sessionIntensity === 'high'
      ? '#ffb454'
      : activeSubject
      ? activeSubject.color
      : '#4aa8ff';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.85fr)] gap-5">
      {/* Main Focus Instrument Panel */}
      <section className="bg-gradient-to-br from-[#0d2033]/95 to-[#071522]/98 border border-[#244463] rounded-3xl p-5 sm:p-7 shadow-2xl flex flex-col justify-between relative overflow-hidden backdrop-blur-sm">
        {/* Ambient subtle glow based on intensity or subject color */}
        <div
          className="absolute -top-32 -left-32 w-80 h-80 rounded-full opacity-15 pointer-events-none blur-3xl transition-colors duration-500"
          style={{ background: ringColor }}
        />

        {/* Head */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <div className="text-[10px] tracking-[0.22em] text-[#8acaff] uppercase font-semibold">
              PRECISION INSTRUMENT / 001
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white mt-1">Your focus session</h2>
          </div>
          <div
            className={`px-3 py-1 rounded-full border text-[10px] font-bold tracking-widest uppercase transition-colors flex items-center gap-1.5 ${
              sessionIntensity === 'extreme'
                ? 'border-rose-500 bg-rose-950/60 text-rose-300 shadow-[0_0_12px_rgba(255,122,144,0.3)]'
                : 'border-[#315578] text-[#8acaff] bg-[#091a2b]'
            }`}
          >
            <span>{currentIntensityCfg.icon}</span>
            <span>{stopwatch ? 'STOPWATCH' : name.toUpperCase()}</span>
          </div>
        </div>

        {/* Subject Row Selector */}
        <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-[#061321] border border-[#1d3d5d]">
          <label
            htmlFor="activeSubjectSelect"
            className="text-[10px] tracking-wider text-[#91a9c1] uppercase font-bold shrink-0 flex items-center gap-1.5 pl-1"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#4aa8ff]" />
            <span>STUDYING</span>
          </label>
          <select
            id="activeSubjectSelect"
            value={activeSubjectId || ''}
            onChange={(e) => onSelectSubject(e.target.value || null)}
            className="flex-1 min-w-0 bg-transparent border-0 text-xs sm:text-sm font-medium text-[#eaf4ff] focus:outline-none cursor-pointer"
          >
            <option value="" className="bg-[#0a1a2b] text-[#91a9c1]">
              No subject (General focus)
            </option>
            {subjects.map((sub) => (
              <option key={sub.id} value={sub.id} className="bg-[#0a1a2b] text-white">
                {sub.name} ({sub.masteryLevel ?? 50}% Mastered · {sub.intensity || 'moderate'} rigor)
              </option>
            ))}
          </select>
          {activeSubject && (
            <span
              className="w-3 h-3 rounded-full shrink-0 shadow-sm"
              style={{ backgroundColor: activeSubject.color }}
              title={activeSubject.name}
            />
          )}
        </div>

        {/* Study Intensity & Rigor Level Bar (Enhance Intensity) */}
        <div className="mt-2.5 p-2.5 rounded-2xl bg-[#061321] border border-[#193550] space-y-2">
          <div className="flex items-center justify-between text-[10px] text-[#91a9c1] px-1 font-semibold">
            <span className="flex items-center gap-1 uppercase tracking-wider">
              <Zap className="w-3 h-3 text-[#ffb454]" />
              <span>Session Intensity</span>
            </span>
            {activeSubject && activeMastery && (
              <span className="flex items-center gap-1 text-[9px] font-mono" style={{ color: activeMastery.color }}>
                <Award className="w-3 h-3" />
                <span>{activeSubject.name}: {activeSubject.masteryLevel ?? 50}% ({activeMastery.stage})</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {(['light', 'moderate', 'high', 'extreme'] as IntensityLevel[]).map((lvl) => {
              const cfg = INTENSITY_CONFIG[lvl];
              const isSelected = sessionIntensity === lvl;
              return (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => onSetIntensity(lvl)}
                  title={cfg.description}
                  className={`py-1.5 px-2 rounded-xl text-center border text-[10px] font-bold tracking-wider transition select-none flex items-center justify-center gap-1 ${
                    isSelected
                      ? `${cfg.bgClass} border-current shadow-md ring-1 ring-current/40 scale-[1.02]`
                      : 'border-[#1a3854] bg-[#071725] text-[#91a9c1] hover:text-white hover:border-[#2d5880]'
                  }`}
                >
                  <span>{cfg.icon}</span>
                  <span className="hidden sm:inline">{cfg.label.split(' ')[0]}</span>
                  <span className="font-mono text-[9px] opacity-75">({cfg.factor}x)</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Visual Mastery Milestone Progress Bar for Active Subject */}
        <MasteryMilestoneBar
          activeSubject={activeSubject || null}
          allSubjects={subjects}
          onNavigateToSubjects={() => onNavigateTab('subjects')}
        />

        {/* Circular Dial Timer */}
        <div className="py-6 sm:py-8 flex flex-col items-center justify-center">
          <div className="relative w-[min(300px,70vw)] aspect-square rounded-full flex items-center justify-center bg-[radial-gradient(circle,#0b1c2c_55%,transparent_56%)] select-none">
            {/* Ticks ring simulation */}
            <div
              className="absolute inset-0 rounded-full opacity-60 pointer-events-none"
              style={{
                background:
                  'repeating-conic-gradient(from -90deg, #254966 0deg 1deg, transparent 1deg 6deg)',
                mask: 'radial-gradient(farthest-side, transparent calc(100% - 8px), #000 calc(100% - 7px), #000 100%)',
                WebkitMask:
                  'radial-gradient(farthest-side, transparent calc(100% - 8px), #000 calc(100% - 7px), #000 100%)',
              }}
            />

            {/* SVG Ring */}
            <svg
              className="absolute inset-[8px] w-[calc(100%-16px)] h-[calc(100%-16px)] -rotate-90 pointer-events-none"
              viewBox="0 0 100 100"
              aria-hidden="true"
            >
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="fill-none stroke-[#18334c]"
                strokeWidth="4"
              />
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="fill-none transition-[stroke-dashoffset] duration-200 ease-linear"
                style={{
                  stroke: ringColor,
                  filter: `drop-shadow(0 0 10px ${ringColor}99)`,
                }}
                strokeWidth="4.5"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
              />
            </svg>

            {/* Center Dial Content */}
            <div className="text-center z-10 px-4">
              <div className="text-[clamp(44px,6.8vw,66px)] font-light tracking-[-0.05em] font-mono leading-none text-white drop-shadow-md">
                {formatTimeDisplay(remaining)}
              </div>
              <div
                className="text-[10px] tracking-[0.24em] font-bold uppercase mt-3 transition-colors"
                style={{ color: ringColor }}
              >
                {stateText}
              </div>
            </div>
          </div>

          <p className="text-xs text-[#91a9c1] text-center mt-4 max-w-xs font-medium">
            {activeSubject
              ? `Logging focus time to ${activeSubject.name} · ${currentIntensityCfg.label}`
              : `${currentIntensityCfg.description}`}
          </p>
        </div>

        {/* Controls Bar */}
        <div className="flex items-center justify-center gap-5 my-2">
          <button
            onClick={onReset}
            title="Reset timer (Shortcut: R)"
            aria-label="Reset timer"
            className="w-12 h-12 rounded-full border border-[#315578] bg-[#091a2a] hover:bg-[#122e49] text-[#8acaff] flex items-center justify-center transition-transform active:scale-95 shadow-md"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            onClick={onStartPause}
            title={running ? 'Pause timer (Space)' : 'Start timer (Space)'}
            aria-label={running ? 'Pause timer' : 'Start timer'}
            className="w-18 h-18 rounded-full border-2 border-[#4aa8ff] bg-[#0d2942] hover:bg-[#153b5c] text-white flex items-center justify-center transition-all active:scale-95 shadow-[0_0_28px_rgba(74,168,255,0.25)] hover:shadow-[0_0_35px_rgba(74,168,255,0.4)]"
            style={{
              borderColor: ringColor,
              boxShadow: `0 0 28px ${ringColor}40`,
            }}
          >
            {running ? <Pause className="w-7 h-7 fill-white" /> : <Play className="w-7 h-7 fill-white ml-1" />}
          </button>

          <button
            onClick={onAddMinute}
            disabled={stopwatch}
            title="Add one minute (Shortcut: +)"
            aria-label="Add one minute"
            className="w-12 h-12 rounded-full border border-[#315578] bg-[#091a2a] hover:bg-[#122e49] disabled:opacity-40 disabled:cursor-not-allowed text-[#8acaff] flex items-center justify-center transition-transform active:scale-95 shadow-md"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Bottom Details Cards */}
        <div className="grid grid-cols-2 gap-3 mt-6 pt-5 border-t border-[#193550]">
          <div className="p-3.5 rounded-2xl border border-[#1c3b58] bg-[#071725]">
            <div className="text-[10px] text-[#91a9c1] tracking-wider uppercase font-semibold">
              CURRENT RIGOR & INTENSITY
            </div>
            <div className="text-sm font-semibold text-white mt-1 truncate flex items-center gap-1.5">
              <span>{currentIntensityCfg.icon}</span>
              <span style={{ color: currentIntensityCfg.color }}>
                {currentIntensityCfg.label} ({currentIntensityCfg.factor}x)
              </span>
            </div>
          </div>
          <div className="p-3.5 rounded-2xl border border-[#1c3b58] bg-[#071725]">
            <div className="text-[10px] text-[#91a9c1] tracking-wider uppercase font-semibold">
              POMODORO CYCLE
            </div>
            <div className="text-sm font-semibold text-white mt-1">
              <span className="text-[#b8ff5c] font-bold">{cycle % 4}</span> / 4 completed
            </div>
          </div>
        </div>
      </section>

      {/* Right Column: Presets + Quick Custom Form + Progress Summary */}
      <div className="flex flex-col gap-5">
        {/* Study Modes & Presets */}
        <section className="bg-gradient-to-br from-[#0d2033]/95 to-[#071522]/98 border border-[#244463] rounded-3xl p-5 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-[#18344f]">
            <h3 className="text-xs font-bold text-white tracking-wider uppercase flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#4aa8ff]" />
              <span>Study Modes</span>
            </h3>
            <span className="text-[10px] text-[#91a9c1] tracking-wider uppercase font-semibold">
              CHOOSE FLOW
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2 mt-3.5">
            {[
              { label: 'Study Focus', sub: '25 minutes · warm-up', sec: 1500, kind: 'focus', icon: BookOpen },
              { label: 'Deep Work', sub: '50 minutes · uninterrupted', sec: 3000, kind: 'focus', icon: Flame },
              { label: 'Short Break', sub: '5 minutes · reset', sec: 300, kind: 'break', icon: Coffee },
              { label: 'Long Break', sub: '15 minutes · recharge', sec: 900, kind: 'break', icon: Sparkles },
            ].map((preset) => {
              const isSelected = !stopwatch && name === preset.label;
              const Icon = preset.icon;
              return (
                <button
                  key={preset.label}
                  onClick={() => onSetPreset(preset.sec, preset.label, preset.kind as 'focus' | 'break', false)}
                  className={`w-full flex items-center gap-3 p-3 rounded-2xl border text-left transition select-none ${
                    isSelected
                      ? 'border-[#4aa8ff] bg-[#0c2740] shadow-md ring-1 ring-[#4aa8ff]/50'
                      : 'border-[#1b3853] bg-[#071725] hover:bg-[#0c2236] hover:border-[#285073]'
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-[#102d47] text-[#8acaff] flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-white truncate">{preset.label}</div>
                    <div className="text-[10px] text-[#91a9c1] mt-0.5">{preset.sub}</div>
                  </div>
                  {isSelected && <span className="text-[#b8ff5c] text-sm font-bold">✓</span>}
                </button>
              );
            })}
          </div>

          {/* Custom Time & Stopwatch */}
          <div className="mt-5 pt-4 border-t border-[#18344f]">
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="text-xs font-bold text-white tracking-wider uppercase">Set Your Own Time</h4>
              <span className="text-[10px] text-[#91a9c1] font-mono">HH / MM / SS</span>
            </div>

            <form onSubmit={handleCustomSubmit} className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] text-[#91a9c1] font-medium mb-1 text-center">Hours</label>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={customHours}
                    onChange={(e) => setCustomHours(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-[#061321] border border-[#244463] rounded-xl py-2 px-1 text-center text-xs font-mono font-bold text-white focus:outline-none focus:border-[#4aa8ff]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[#91a9c1] font-medium mb-1 text-center">Minutes</label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={customMinutes}
                    onChange={(e) => setCustomMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-[#061321] border border-[#244463] rounded-xl py-2 px-1 text-center text-xs font-mono font-bold text-white focus:outline-none focus:border-[#4aa8ff]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[#91a9c1] font-medium mb-1 text-center">Seconds</label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={customSeconds}
                    onChange={(e) => setCustomSeconds(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-[#061321] border border-[#244463] rounded-xl py-2 px-1 text-center text-xs font-mono font-bold text-white focus:outline-none focus:border-[#4aa8ff]"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-3 rounded-xl bg-[#4aa8ff] hover:bg-[#82c5ff] text-[#041322] font-bold text-xs tracking-wider transition"
                >
                  SET CUSTOM
                </button>
                <button
                  type="button"
                  onClick={() => onSetPreset(1, 'Stopwatch', 'focus', true)}
                  className={`px-3 py-2.5 rounded-xl border font-bold text-xs tracking-wider transition ${
                    stopwatch
                      ? 'border-[#4aa8ff] bg-[#0c2740] text-[#8acaff]'
                      : 'border-[#315578] bg-[#0a1c2d] hover:border-[#4aa8ff] text-[#8acaff]'
                  }`}
                >
                  STOPWATCH
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* Progress Tracker Summary */}
        <section className="bg-gradient-to-br from-[#0d2033]/95 to-[#071522]/98 border border-[#244463] rounded-3xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#18344f]">
              <h3 className="text-xs font-bold text-white tracking-wider uppercase flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#b8ff5c]" />
                <span>Today's Progress</span>
              </h3>
              <span className="text-[10px] text-[#91a9c1] tracking-wider uppercase font-semibold">
                LOCAL STORAGE
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="p-3 rounded-2xl border border-[#1b3853] bg-[#071725]">
                <div className="text-xl sm:text-2xl font-light font-mono text-white tracking-tight">
                  {totalSessionsCount}
                </div>
                <div className="text-[10px] text-[#91a9c1] mt-0.5">Sessions completed</div>
              </div>
              <div className="p-3 rounded-2xl border border-[#1b3853] bg-[#071725]">
                <div className="text-xl sm:text-2xl font-light font-mono text-[#b8ff5c] tracking-tight">
                  {formatMinutes(todayMinutes)}
                </div>
                <div className="text-[10px] text-[#91a9c1] mt-0.5">Focus time today</div>
              </div>
            </div>

            {/* 7-day Mini Bars */}
            <div className="mt-4 pt-3 border-t border-[#18344f]">
              <div className="flex items-end gap-2 h-20 px-1">
                {weekData.map((d, idx) => {
                  const barHeight = Math.max(4, (d.minutes / maxWeekMinutes) * 55);
                  return (
                    <div
                      key={idx}
                      className="flex-1 flex flex-col items-center justify-end h-full gap-1.5 text-center group"
                      title={`${d.label} ${d.date}: ${formatMinutes(d.minutes)}`}
                    >
                      <div
                        className="w-full max-w-[20px] rounded-t-sm transition-all"
                        style={{
                          height: `${barHeight}px`,
                          background: d.isToday
                            ? 'linear-gradient(180deg, #b8ff5c, #6fb83a)'
                            : 'linear-gradient(180deg, #8acaff, #2678be)',
                          boxShadow: d.isToday ? '0 0 10px rgba(184, 255, 92, 0.3)' : undefined,
                        }}
                      />
                      <span
                        className={`text-[9px] font-semibold ${
                          d.isToday ? 'text-[#b8ff5c] font-bold' : 'text-[#91a9c1]'
                        }`}
                      >
                        {d.label}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#152e46] text-[10px] text-[#91a9c1]">
                <span>Mon to Sun minutes</span>
                <button
                  onClick={() => onNavigateTab('history')}
                  className="text-[#8acaff] hover:underline font-semibold"
                >
                  FULL HISTORY →
                </button>
              </div>
            </div>
          </div>

          {/* Motivational Quote Banner */}
          {currentQuote && (
            <div className="mt-4 p-3 rounded-2xl bg-[#061523] border-l-2 border-[#4aa8ff] flex items-start justify-between gap-3 text-xs text-[#b9cde0]">
              <div className="leading-relaxed">
                <span className="text-[#8acaff] font-serif font-bold text-sm mr-1">“</span>
                <span className="italic">{currentQuote.text}</span>
                <span className="text-[#8acaff] font-serif font-bold text-sm ml-1">”</span>
                {currentQuote.author && (
                  <div className="text-[10px] text-[#91a9c1] not-italic mt-1">
                    — {currentQuote.author}
                  </div>
                )}
              </div>
              <button
                onClick={onCycleQuote}
                title="Next inspirational quote"
                aria-label="Next inspirational quote"
                className="p-1 rounded-lg text-[#8acaff] hover:bg-[#0c243a] transition shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
