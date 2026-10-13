import React, { useState } from 'react';
import { Session, Subject, IntensityLevel, INTENSITY_CONFIG } from '../types';
import {
  Flame,
  Sun,
  Sunrise,
  Sunset,
  Moon,
  Clock,
  Zap,
  TrendingUp,
  Award,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { dayKey, mondayOf, addDays, parseDayKey, formatMinutes, DAYS_SHORT } from '../utils/storage';

interface StudyHeatmapProps {
  sessions: Session[];
  subjects: Subject[];
}

interface PeriodStat {
  id: 'morning' | 'afternoon' | 'evening' | 'night';
  label: string;
  timeRange: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  minutes: number;
  sessionCount: number;
  extremeCount: number;
}

export const StudyHeatmap: React.FC<StudyHeatmapProps> = ({ sessions, subjects }) => {
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

  const todayStr = dayKey();
  const todayDate = parseDayKey(todayStr);

  // We show a 35-day calendar grid (5 full weeks, Mon-Sun) up to end of this current week
  const currentWeekMon = mondayOf(todayDate);
  const startMon = addDays(currentWeekMon, -28); // 4 weeks before this week's Monday = 5 weeks total (35 days)

  const days: {
    date: Date;
    key: string;
    isToday: boolean;
    isFuture: boolean;
    daySessions: Session[];
    minutes: number;
    count: number;
    dominantIntensity: IntensityLevel | null;
    heatLevel: 0 | 1 | 2 | 3 | 4;
  }[] = [];

  for (let i = 0; i < 35; i++) {
    const d = addDays(startMon, i);
    const k = dayKey(d);
    const isToday = k === todayStr;
    const isFuture = d > todayDate;

    const daySessions = sessions.filter((s) => dayKey(new Date(s.ts)) === k);
    const minutes = daySessions.reduce((acc, s) => acc + s.min, 0);
    const count = daySessions.length;

    // Determine dominant or highest intensity for the day
    let dominantIntensity: IntensityLevel | null = null;
    if (daySessions.some((s) => s.intensity === 'extreme')) {
      dominantIntensity = 'extreme';
    } else if (daySessions.some((s) => s.intensity === 'high')) {
      dominantIntensity = 'high';
    } else if (daySessions.some((s) => s.intensity === 'moderate')) {
      dominantIntensity = 'moderate';
    } else if (daySessions.some((s) => s.intensity === 'light')) {
      dominantIntensity = 'light';
    }

    // Heat Level 0 - 4 based on minutes and intensity
    let heatLevel: 0 | 1 | 2 | 3 | 4 = 0;
    if (minutes > 0) {
      if (minutes >= 150 || dominantIntensity === 'extreme') {
        heatLevel = 4;
      } else if (minutes >= 90 || dominantIntensity === 'high') {
        heatLevel = 3;
      } else if (minutes >= 45) {
        heatLevel = 2;
      } else {
        heatLevel = 1;
      }
    }

    days.push({
      date: d,
      key: k,
      isToday,
      isFuture,
      daySessions,
      minutes,
      count,
      dominantIntensity,
      heatLevel,
    });
  }

  // Time-of-Day Productivity Analysis over the past 30 days
  const thirtyDaysAgoTs = addDays(todayDate, -30).getTime();
  const recentSessions = sessions.filter((s) => s.ts >= thirtyDaysAgoTs && !s.legacy);

  const periods: Record<'morning' | 'afternoon' | 'evening' | 'night', PeriodStat> = {
    morning: {
      id: 'morning',
      label: 'Early / Morning',
      timeRange: '05:00 – 12:00',
      icon: Sunrise,
      color: '#4aa8ff',
      minutes: 0,
      sessionCount: 0,
      extremeCount: 0,
    },
    afternoon: {
      id: 'afternoon',
      label: 'Afternoon',
      timeRange: '12:00 – 17:00',
      icon: Sun,
      color: '#ffb454',
      minutes: 0,
      sessionCount: 0,
      extremeCount: 0,
    },
    evening: {
      id: 'evening',
      label: 'Prime Evening',
      timeRange: '17:00 – 22:00',
      icon: Sunset,
      color: '#b8ff5c',
      minutes: 0,
      sessionCount: 0,
      extremeCount: 0,
    },
    night: {
      id: 'night',
      label: 'Late Night',
      timeRange: '22:00 – 05:00',
      icon: Moon,
      color: '#b48cff',
      minutes: 0,
      sessionCount: 0,
      extremeCount: 0,
    },
  };

  recentSessions.forEach((s) => {
    const dt = new Date(s.ts);
    const hour = dt.getHours();

    let pKey: 'morning' | 'afternoon' | 'evening' | 'night' = 'evening';
    if (hour >= 5 && hour < 12) pKey = 'morning';
    else if (hour >= 12 && hour < 17) pKey = 'afternoon';
    else if (hour >= 17 && hour < 22) pKey = 'evening';
    else pKey = 'night';

    periods[pKey].minutes += s.min;
    periods[pKey].sessionCount += 1;
    if (s.intensity === 'extreme') periods[pKey].extremeCount += 1;
  });

  const periodList = Object.values(periods);
  const maxPeriodMinutes = Math.max(1, ...periodList.map((p) => p.minutes));

  // Determine Peak Study Period
  const peakPeriod = [...periodList].sort((a, b) => b.minutes - a.minutes)[0];
  const totalRecentMinutes = periodList.reduce((acc, p) => acc + p.minutes, 0);
  const peakPercent =
    totalRecentMinutes > 0 ? Math.round((peakPeriod.minutes / totalRecentMinutes) * 100) : 0;

  // Selected Day Details
  const selectedDayInfo = days.find((d) => d.key === selectedDateKey);

  // Heat cell styles
  const getCellClasses = (heatLevel: number, dominantIntensity: IntensityLevel | null, isSelected: boolean) => {
    let base = 'transition-all duration-200 cursor-pointer relative';
    if (isSelected) base += ' ring-2 ring-white scale-105 z-10 shadow-lg';

    if (heatLevel === 0) return `${base} bg-[#081726] border border-[#162d42] hover:border-[#2f5a82]`;
    if (heatLevel === 1) return `${base} bg-[#0c2f4d] border border-[#20517d] text-[#8acaff] hover:border-[#4aa8ff]`;
    if (heatLevel === 2) return `${base} bg-[#12422a] border border-[#247047] text-[#b8ff5c] hover:border-[#4ae386]`;
    if (heatLevel === 3) return `${base} bg-[#57350b] border border-[#8f5a18] text-[#ffb454] hover:border-[#ffa338]`;
    // heatLevel === 4 (Hardcore/Beast Mode)
    return `${base} bg-[#591423] border border-[#94263e] text-[#ff7a90] shadow-[0_0_8px_rgba(255,122,144,0.35)] hover:border-[#ff7a90]`;
  };

  return (
    <section className="bg-gradient-to-br from-[#0d2033]/95 to-[#071522]/98 border border-[#244463] rounded-3xl p-5 sm:p-6 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#18344f] gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#ffb454]" />
            <h3 className="text-sm font-bold text-white tracking-wider uppercase">
              Study Intensity & Frequency Heatmap
            </h3>
          </div>
          <p className="text-[11px] text-[#91a9c1] mt-0.5">
            Past month activity matrix. Color depth reflects study duration and intensity rigor.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-1.5 text-[9px] font-mono text-[#91a9c1] shrink-0 flex-wrap">
          <span>Less</span>
          <span className="w-3.5 h-3.5 rounded bg-[#081726] border border-[#162d42]" title="0 min (Rest)" />
          <span className="w-3.5 h-3.5 rounded bg-[#0c2f4d] border border-[#20517d]" title="< 45 min (Light)" />
          <span className="w-3.5 h-3.5 rounded bg-[#12422a] border border-[#247047]" title="45–90 min (Moderate)" />
          <span className="w-3.5 h-3.5 rounded bg-[#57350b] border border-[#8f5a18]" title="90–150 min (Deep Drill)" />
          <span className="w-3.5 h-3.5 rounded bg-[#591423] border border-[#94263e]" title="150+ min / Beast Mode" />
          <span>More / Beast</span>
        </div>
      </div>

      {/* Main Grid: Heatmap (Left/Top) & Peak Productivity Insights (Right/Bottom) */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.3fr)_minmax(300px,0.9fr)] gap-5">
        {/* The 35-Day Heatmap Matrix */}
        <div className="space-y-2">
          {/* Weekday Column Headers */}
          <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-bold text-[#91a9c1]">
            {DAYS_SHORT.map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>

          {/* 5 Weeks of Cells */}
          <div className="grid grid-cols-7 gap-1.5">
            {days.map((d) => {
              const isSelected = selectedDateKey === d.key;
              const hasExtreme = d.daySessions.some((s) => s.intensity === 'extreme');

              return (
                <button
                  key={d.key}
                  type="button"
                  disabled={d.isFuture}
                  onClick={() => setSelectedDateKey(isSelected ? null : d.key)}
                  className={`aspect-square rounded-xl p-1 flex flex-col justify-between select-none ${getCellClasses(
                    d.heatLevel,
                    d.dominantIntensity,
                    isSelected
                  )} ${d.isFuture ? 'opacity-25 cursor-not-allowed' : ''} ${
                    d.isToday ? 'ring-1 ring-[#4aa8ff]' : ''
                  }`}
                  title={`${d.key}: ${formatMinutes(d.minutes)} across ${d.count} session(s)`}
                >
                  <div className="flex items-center justify-between w-full text-[9px] font-mono leading-none">
                    <span className={`${d.isToday ? 'text-[#b8ff5c] font-bold' : 'text-white/80'}`}>
                      {d.date.getDate()}
                    </span>
                    {hasExtreme && <Flame className="w-2.5 h-2.5 text-[#ff7a90] shrink-0" />}
                  </div>

                  <div className="text-right">
                    {d.count > 0 ? (
                      <span className="text-[9px] font-mono font-bold block truncate">
                        {d.count}x
                      </span>
                    ) : (
                      <span className="text-[8px] opacity-20 block">·</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected Day Expanded Drawer */}
          {selectedDayInfo && (
            <div className="mt-3 p-3.5 rounded-2xl bg-[#061523] border border-[#2b547b] text-xs space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#4aa8ff]" />
                  <span>
                    {selectedDayInfo.date.toLocaleDateString(undefined, {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedDateKey(null)}
                  className="text-[10px] text-[#91a9c1] hover:text-white"
                >
                  ✕ close
                </button>
              </div>

              <div className="flex items-center gap-3 text-[11px] font-mono">
                <span className="text-[#8acaff] font-bold">
                  {formatMinutes(selectedDayInfo.minutes)} total
                </span>
                <span>·</span>
                <span className="text-white">
                  {selectedDayInfo.count} session{selectedDayInfo.count === 1 ? '' : 's'}
                </span>
                {selectedDayInfo.dominantIntensity && (
                  <>
                    <span>·</span>
                    <span
                      className="px-2 py-0.2 rounded-full text-[9px] font-bold uppercase border"
                      style={{
                        color: INTENSITY_CONFIG[selectedDayInfo.dominantIntensity].color,
                        borderColor: INTENSITY_CONFIG[selectedDayInfo.dominantIntensity].borderColor,
                        backgroundColor: `${INTENSITY_CONFIG[selectedDayInfo.dominantIntensity].color}15`,
                      }}
                    >
                      {INTENSITY_CONFIG[selectedDayInfo.dominantIntensity].icon}{' '}
                      {INTENSITY_CONFIG[selectedDayInfo.dominantIntensity].label}
                    </span>
                  </>
                )}
              </div>

              {/* Day sessions list */}
              {selectedDayInfo.daySessions.length > 0 && (
                <div className="space-y-1.5 pt-1.5 border-t border-[#16334f]">
                  {selectedDayInfo.daySessions.map((s) => {
                    const sub = subjects.find((x) => x.id === s.subjectId);
                    const dt = new Date(s.ts);
                    return (
                      <div
                        key={s.id}
                        className="flex items-center justify-between text-[11px] p-1.5 rounded-lg bg-[#071a2c]"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: sub ? sub.color : '#5d7a96' }}
                          />
                          <span className="text-white truncate">{sub ? sub.name : 'No subject'}</span>
                          <span className="text-[10px] font-mono text-[#91a9c1]">
                            {s.legacy ? '—' : dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {s.intensity && (
                            <span className="text-[10px]">
                              {INTENSITY_CONFIG[s.intensity]?.icon}
                            </span>
                          )}
                          <span className="font-mono font-bold text-[#8acaff]">
                            {formatMinutes(s.min)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Most Productive Study Periods Analysis */}
        <div className="flex flex-col justify-between space-y-4 p-4 rounded-2xl bg-[#061523] border border-[#193550]">
          {/* Peak Window Badge */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] tracking-wider uppercase font-bold text-[#91a9c1] flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-[#b8ff5c]" />
                <span>Peak Focus Window</span>
              </span>
              <span className="text-[9px] font-mono text-[#8acaff]">PAST 30 DAYS</span>
            </div>

            {totalRecentMinutes > 0 ? (
              <div className="p-3 rounded-2xl bg-[#0a2238] border border-[#26537f] space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <peakPeriod.icon className="w-4 h-4 text-[#ffb454]" />
                    <span className="font-bold text-white text-xs sm:text-sm">
                      {peakPeriod.label}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-[#16361f] border border-[#3f8f4f] text-[#b8ff5c] text-[10px] font-bold">
                    {peakPercent}% of study time
                  </span>
                </div>
                <div className="text-[11px] text-[#91a9c1]">
                  Peak window: <strong className="text-white">{peakPeriod.timeRange}</strong> with{' '}
                  <strong className="text-[#8acaff]">{formatMinutes(peakPeriod.minutes)}</strong> logged across {peakPeriod.sessionCount} sessions.
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-[#071a2c] text-xs text-[#91a9c1] text-center">
                Log focus sessions to identify your peak study hours.
              </div>
            )}
          </div>

          {/* Diurnal Time-of-Day Distribution Bars */}
          <div className="space-y-2.5 pt-2 border-t border-[#18344f]">
            <div className="text-[10px] font-bold text-[#91a9c1] uppercase tracking-wider">
              Productivity by Time of Day
            </div>

            {periodList.map((p) => {
              const pct = (p.minutes / maxPeriodMinutes) * 100;
              const Icon = p.icon;
              return (
                <div key={p.id} className="space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-medium text-white">
                      <Icon className="w-3.5 h-3.5 text-[#91a9c1]" />
                      <span>{p.label}</span>
                      <span className="text-[10px] font-mono text-[#5d7a96]">({p.timeRange})</span>
                    </div>
                    <div className="font-mono text-[#8acaff] font-bold text-[11px]">
                      {formatMinutes(p.minutes)}
                      <span className="text-[#5d7a96] font-normal ml-1">({p.sessionCount}x)</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#0a1a2b] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: p.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Intensity Rigor Distribution */}
          <div className="pt-2 border-t border-[#18344f]">
            <div className="flex items-center justify-between text-[10px] font-bold text-[#91a9c1] uppercase tracking-wider mb-2">
              <span>Study Rigor Breakdown</span>
              <span className="font-mono text-white">{recentSessions.length} sessions</span>
            </div>

            <div className="grid grid-cols-4 gap-1.5 text-center">
              {(['light', 'moderate', 'high', 'extreme'] as IntensityLevel[]).map((lvl) => {
                const cfg = INTENSITY_CONFIG[lvl];
                const count = recentSessions.filter((s) => s.intensity === lvl).length;
                return (
                  <div key={lvl} className="p-1.5 rounded-xl bg-[#081b2e] border border-[#1b3853]">
                    <div className="text-xs">{cfg.icon}</div>
                    <div className="text-xs font-mono font-bold text-white mt-0.5">{count}</div>
                    <div className="text-[8px] text-[#91a9c1] truncate">{cfg.label.split(' ')[0]}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
