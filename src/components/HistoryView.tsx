import React, { useState } from 'react';
import { Session, Subject, IntensityLevel, INTENSITY_CONFIG } from '../types';
import { Download, Upload, Trash2, Plus, BarChart2, Calendar, Clock, Zap, Flame, FileText, Edit2, Check, X } from 'lucide-react';
import {
  dayKey,
  mondayOf,
  addDays,
  formatMinutes,
  NONE_COLOR,
  exportBackupJson,
  exportHistoryCsv,
  DAYS_SHORT,
  dayIdx,
} from '../utils/storage';
import { StudyHeatmap } from './StudyHeatmap';

interface HistoryViewProps {
  sessions: Session[];
  subjects: Subject[];
  legacySessions: number;
  onAddManualSession: (
    minutes: number,
    subjectId: string | null,
    date: string,
    intensity?: IntensityLevel,
    notes?: string
  ) => void;
  onUpdateSessionNotes: (sessionId: string, notes: string) => void;
  onDeleteSession: (id: string) => void;
  onClearHistory: () => void;
  onImportBackup: (importedData: any) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  sessions,
  subjects,
  legacySessions,
  onAddManualSession,
  onUpdateSessionNotes,
  onDeleteSession,
  onClearHistory,
  onImportBackup,
}) => {
  const [chartRange, setChartRange] = useState<7 | 30>(7);
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('');

  // Manual logging form
  const [manualSubjectId, setManualSubjectId] = useState('');
  const [manualMinutes, setManualMinutes] = useState(30);
  const [manualDate, setManualDate] = useState(dayKey());
  const [manualIntensity, setManualIntensity] = useState<IntensityLevel>('moderate');
  const [manualNotes, setManualNotes] = useState('');

  // Editing note on past session
  const [editingSessionNoteId, setEditingSessionNoteId] = useState<string | null>(null);
  const [tempNoteText, setTempNoteText] = useState('');

  // Metrics
  const totalMinutes = sessions.reduce((acc, s) => acc + s.min, 0);
  const weightedMinutes = sessions.reduce((acc, s) => {
    const factor = s.intensity ? INTENSITY_CONFIG[s.intensity]?.factor ?? 1.25 : 1.25;
    return acc + Math.round(s.min * factor);
  }, 0);
  const totalSessionsCount = sessions.filter((s) => !s.legacy).length + (legacySessions || 0);

  // Group by day for streak and best day
  const byDayMap: Record<string, number> = {};
  sessions.forEach((s) => {
    const k = dayKey(new Date(s.ts));
    byDayMap[k] = (byDayMap[k] || 0) + s.min;
  });

  let currentStreak = 0;
  const tempDate = new Date();
  if (!byDayMap[dayKey(tempDate)]) {
    tempDate.setDate(tempDate.getDate() - 1);
  }
  while (byDayMap[dayKey(tempDate)]) {
    currentStreak++;
    tempDate.setDate(tempDate.getDate() - 1);
  }

  const bestDayMinutes = Math.max(0, ...Object.values(byDayMap));

  // Chart data calculation
  const chartDays: Date[] = [];
  if (chartRange === 7) {
    const mon = mondayOf();
    for (let i = 0; i < 7; i++) chartDays.push(addDays(mon, i));
  } else {
    for (let i = 29; i >= 0; i--) chartDays.push(addDays(new Date(), -i));
  }

  const chartStacks = chartDays.map((d) => {
    const k = dayKey(d);
    const subMap: Record<string, number> = {};
    sessions.forEach((s) => {
      if (dayKey(new Date(s.ts)) === k) {
        const sid = s.subjectId && subjects.some((sub) => sub.id === s.subjectId) ? s.subjectId : '';
        subMap[sid] = (subMap[sid] || 0) + s.min;
      }
    });
    const totalDayMin = Object.values(subMap).reduce((a, b) => a + b, 0);
    return { date: d, subMap, totalDayMin };
  });

  const maxChartMin = Math.max(60, ...chartStacks.map((s) => s.totalDayMin));

  // Subject breakdown in current range
  const rangeStartTs =
    chartRange === 7
      ? mondayOf().getTime()
      : addDays(new Date().setHours(0, 0, 0, 0), -29).getTime();

  const sessionsInRange = sessions.filter((s) => s.ts >= rangeStartTs);

  const subjectBreakdown = subjects.map((sub) => {
    const min = sessionsInRange
      .filter((s) => s.subjectId === sub.id)
      .reduce((a, b) => a + b.min, 0);
    return { id: sub.id, name: sub.name, color: sub.color, min };
  });

  const unassignedMin = sessionsInRange
    .filter((s) => !s.subjectId || !subjects.some((sub) => sub.id === s.subjectId))
    .reduce((a, b) => a + b.min, 0);

  if (unassignedMin > 0) {
    subjectBreakdown.push({
      id: '',
      name: 'No subject',
      color: NONE_COLOR,
      min: unassignedMin,
    });
  }

  const maxBreakdownMin = Math.max(1, ...subjectBreakdown.map((s) => s.min));

  // Filtered session list
  const filteredSessions = sessions
    .filter((s) => {
      if (!selectedSubjectFilter) return true;
      if (selectedSubjectFilter === 'none') return !s.subjectId;
      return s.subjectId === selectedSubjectFilter;
    })
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 150);

  // File import handling
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (parsed && Array.isArray(parsed.sessions)) {
        onImportBackup(parsed);
      } else {
        alert('Invalid CIVI TIMER backup file.');
      }
    } catch {
      alert('Could not parse JSON file.');
    }
    e.target.value = '';
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualMinutes <= 0 || !manualDate) return;
    onAddManualSession(
      manualMinutes,
      manualSubjectId || null,
      manualDate,
      manualIntensity,
      manualNotes.trim() || undefined
    );
    setManualNotes('');
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-[#18344f]/70">
        <div>
          <div className="text-[10px] tracking-[0.2em] text-[#8acaff] uppercase font-bold">
            Persistent study history & rigor matrix
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">Study Analytics & Logs</h2>
          <p className="text-xs text-[#91a9c1] mt-1 max-w-2xl leading-relaxed">
            Every completed focus session is stored locally on this device with its study intensity. Export a backup before switching phones or laptops.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => exportBackupJson({ sessions, subjects } as any)}
            className="flex items-center gap-1.5 py-2 px-3 rounded-xl bg-[#0a1c2d] hover:bg-[#122e49] border border-[#315578] text-[#8acaff] text-xs font-semibold tracking-wider transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>EXPORT JSON</span>
          </button>
          <button
            onClick={() => exportHistoryCsv({ sessions, subjects } as any)}
            className="flex items-center gap-1.5 py-2 px-3 rounded-xl bg-[#0a1c2d] hover:bg-[#122e49] border border-[#315578] text-[#8acaff] text-xs font-semibold tracking-wider transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>EXPORT CSV</span>
          </button>
          <label className="flex items-center gap-1.5 py-2 px-3 rounded-xl bg-[#0a1c2d] hover:bg-[#122e49] border border-[#315578] text-[#8acaff] text-xs font-semibold tracking-wider transition cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            <span>IMPORT</span>
            <input type="file" accept="application/json" onChange={handleFileChange} className="hidden" />
          </label>
        </div>
      </div>

      {/* 4 Summary Stat Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl border border-[#1b3853] bg-[#071725]">
          <div className="text-xl sm:text-2xl font-mono font-light text-white">
            {formatMinutes(totalMinutes)}
          </div>
          <div className="text-[10px] text-[#91a9c1] mt-1 uppercase font-semibold">Total focus time</div>
          <div className="text-[9px] text-[#ffb454] font-mono mt-0.5 font-semibold">
            ⚡ {formatMinutes(weightedMinutes)} weighted rigor
          </div>
        </div>
        <div className="p-3.5 rounded-2xl border border-[#1b3853] bg-[#071725]">
          <div className="text-xl sm:text-2xl font-mono font-light text-[#4aa8ff]">
            {totalSessionsCount}
          </div>
          <div className="text-[10px] text-[#91a9c1] mt-1 uppercase font-semibold">Sessions completed</div>
        </div>
        <div className="p-3.5 rounded-2xl border border-[#1b3853] bg-[#071725]">
          <div className="text-xl sm:text-2xl font-mono font-light text-[#b8ff5c]">
            {currentStreak} days
          </div>
          <div className="text-[10px] text-[#91a9c1] mt-1 uppercase font-semibold">Current streak</div>
        </div>
        <div className="p-3.5 rounded-2xl border border-[#1b3853] bg-[#071725]">
          <div className="text-xl sm:text-2xl font-mono font-light text-[#ffb454]">
            {formatMinutes(bestDayMinutes)}
          </div>
          <div className="text-[10px] text-[#91a9c1] mt-1 uppercase font-semibold">Best day</div>
        </div>
      </div>

      {/* Visual Study Intensity & Session Frequency Heatmap */}
      <StudyHeatmap sessions={sessions} subjects={subjects} />

      {/* Analytics 2-Col: Stacked Bar Chart & By Subject */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.85fr)] gap-5">
        {/* Stacked Chart */}
        <section className="bg-gradient-to-br from-[#0d2033]/95 to-[#071522]/98 border border-[#244463] rounded-3xl p-5 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-[#18344f]">
            <h3 className="text-sm font-bold text-white tracking-wider uppercase">Focus Time Chart</h3>
            <div className="flex rounded-xl bg-[#0a1c2d] border border-[#315578] p-0.5 text-xs font-semibold">
              <button
                onClick={() => setChartRange(7)}
                className={`px-3 py-1 rounded-lg uppercase tracking-wider transition ${
                  chartRange === 7
                    ? 'bg-[#123452] text-[#8acaff] shadow-sm'
                    : 'text-[#91a9c1] hover:text-white'
                }`}
              >
                THIS WEEK
              </button>
              <button
                onClick={() => setChartRange(30)}
                className={`px-3 py-1 rounded-lg uppercase tracking-wider transition ${
                  chartRange === 30
                    ? 'bg-[#123452] text-[#8acaff] shadow-sm'
                    : 'text-[#91a9c1] hover:text-white'
                }`}
              >
                30 DAYS
              </button>
            </div>
          </div>

          {/* Bar Columns Container */}
          <div className="flex items-end gap-1 sm:gap-2 h-44 pt-4 border-b border-[#19334b]">
            {chartStacks.map((s, idx) => {
              const heightPx = s.totalDayMin > 0 ? Math.max(4, (s.totalDayMin / maxChartMin) * 140) : 0;
              return (
                <div
                  key={idx}
                  className="flex-1 flex flex-col items-center justify-end h-full group"
                  title={`${s.date.toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })}: ${formatMinutes(s.totalDayMin)}`}
                >
                  <div
                    className="w-full max-w-[24px] flex flex-col-reverse rounded-t-sm overflow-hidden transition-all"
                    style={{ height: `${heightPx}px` }}
                  >
                    {Object.entries(s.subMap).map(([sid, min]) => {
                      const sub = subjects.find((x) => x.id === sid);
                      const color = sub ? sub.color : NONE_COLOR;
                      const segmentPct = s.totalDayMin > 0 ? (min / s.totalDayMin) * 100 : 0;
                      return (
                        <div
                          key={sid}
                          style={{
                            height: `${segmentPct}%`,
                            backgroundColor: color,
                          }}
                          className="w-full"
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Axis Labels */}
          <div className="flex gap-1 sm:gap-2 mt-2">
            {chartStacks.map((s, idx) => (
              <span
                key={idx}
                className="flex-1 text-center text-[9px] font-mono text-[#91a9c1] truncate"
              >
                {chartRange === 7
                  ? DAYS_SHORT[dayIdx(s.date)]
                  : idx % 5 === 0 || idx === chartStacks.length - 1
                  ? s.date.getDate()
                  : ''}
              </span>
            ))}
          </div>

          {/* Chart Legend */}
          <div className="flex flex-wrap gap-2.5 mt-4 pt-3 border-t border-[#17324c] text-[10px] text-[#91a9c1]">
            {subjects.map((sub) => (
              <div key={sub.id} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: sub.color }} />
                <span>{sub.name}</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: NONE_COLOR }} />
              <span>No subject</span>
            </div>
          </div>
        </section>

        {/* By Subject Breakdown */}
        <section className="bg-gradient-to-br from-[#0d2033]/95 to-[#071522]/98 border border-[#244463] rounded-3xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#18344f]">
              <h3 className="text-sm font-bold text-white tracking-wider uppercase">By Subject</h3>
              <span className="text-[10px] text-[#91a9c1] uppercase font-semibold">
                {chartRange === 7 ? 'THIS WEEK' : '30 DAYS'}
              </span>
            </div>

            <div className="space-y-3 mt-4">
              {subjectBreakdown
                .sort((a, b) => b.min - a.min)
                .map((item) => {
                  const pct = (item.min / maxBreakdownMin) * 100;
                  return (
                    <div key={item.name} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-white truncate">{item.name}</span>
                        <span className="font-mono text-[#91a9c1]">{formatMinutes(item.min)}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[#12293f] overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: item.color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </section>
      </div>

      {/* Manual Past Session Logger */}
      <section className="bg-gradient-to-br from-[#0d2033]/95 to-[#071522]/98 border border-[#244463] rounded-3xl p-5 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-[#18344f]">
          <h3 className="text-sm font-bold text-white tracking-wider uppercase">Log a Past Session</h3>
          <span className="text-[10px] text-[#91a9c1] uppercase font-semibold">
            FORGOT TO START TIMER?
          </span>
        </div>

        <form onSubmit={handleManualSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-4">
          <div className="lg:col-span-2">
            <label className="block text-[10px] text-[#91a9c1] font-semibold tracking-wider uppercase mb-1">
              Subject
            </label>
            <select
              value={manualSubjectId}
              onChange={(e) => setManualSubjectId(e.target.value)}
              className="w-full bg-[#061321] border border-[#244463] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#4aa8ff] cursor-pointer"
            >
              <option value="">No subject (General focus)</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-[#91a9c1] font-semibold tracking-wider uppercase mb-1">
              Intensity / Rigor
            </label>
            <select
              value={manualIntensity}
              onChange={(e) => setManualIntensity(e.target.value as IntensityLevel)}
              className="w-full bg-[#061321] border border-[#244463] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#4aa8ff] cursor-pointer"
            >
              <option value="light">⚡ Light (1.0x)</option>
              <option value="moderate">🎯 Moderate (1.25x)</option>
              <option value="high">🔬 High Drill (1.5x)</option>
              <option value="extreme">🔥 Beast Mode (2.0x)</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-[#91a9c1] font-semibold tracking-wider uppercase mb-1">
              Minutes
            </label>
            <input
              type="number"
              min="1"
              max="720"
              value={manualMinutes}
              onChange={(e) => setManualMinutes(Math.max(1, parseInt(e.target.value) || 0))}
              className="w-full bg-[#061321] border border-[#244463] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#4aa8ff]"
            />
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-[10px] text-[#91a9c1] font-semibold tracking-wider uppercase mb-1">
                Date
              </label>
              <input
                type="date"
                max={dayKey()}
                value={manualDate}
                onChange={(e) => setManualDate(e.target.value)}
                className="w-full bg-[#061321] border border-[#244463] rounded-xl px-2 py-2 text-xs text-white focus:outline-none focus:border-[#4aa8ff]"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="py-2.5 px-3 rounded-xl bg-[#4aa8ff] hover:bg-[#82c5ff] text-[#041322] font-bold text-xs tracking-wider transition shadow-sm flex items-center justify-center gap-1 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">LOG</span>
              </button>
            </div>
          </div>

          <div className="sm:col-span-2 lg:col-span-5 pt-1 border-t border-[#18344f]/60">
            <label className="block text-[10px] text-[#91a9c1] font-semibold tracking-wider uppercase mb-1">
              Key Takeaways / Formulas Learned (optional)
            </label>
            <input
              type="text"
              maxLength={350}
              placeholder="e.g. Mastered moment distribution method carry-over factor, checked sign conventions..."
              value={manualNotes}
              onChange={(e) => setManualNotes(e.target.value)}
              className="w-full bg-[#061321] border border-[#244463] rounded-xl px-3 py-1.5 text-xs text-white placeholder-[#5a7693] focus:outline-none focus:border-[#4aa8ff]"
            />
          </div>
        </form>
      </section>

      {/* Detailed Session Log */}
      <section className="bg-gradient-to-br from-[#0d2033]/95 to-[#071522]/98 border border-[#244463] rounded-3xl p-5 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-[#18344f] flex-wrap gap-2">
          <h3 className="text-sm font-bold text-white tracking-wider uppercase">Session Log</h3>

          <div className="flex items-center gap-2">
            <select
              value={selectedSubjectFilter}
              onChange={(e) => setSelectedSubjectFilter(e.target.value)}
              className="bg-[#061321] border border-[#244463] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#4aa8ff]"
            >
              <option value="">All Subjects</option>
              <option value="none">No subject</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            <button
              onClick={onClearHistory}
              className="px-3 py-1.5 rounded-xl border border-rose-900/60 text-rose-400 hover:bg-rose-950/40 text-xs font-semibold tracking-wider transition"
            >
              CLEAR HISTORY
            </button>
          </div>
        </div>

        {/* List of individual sessions */}
        <div className="mt-4 space-y-2">
          {filteredSessions.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#91a9c1] rounded-2xl border border-dashed border-[#1b3853]">
              No sessions found matching current filter.
            </div>
          ) : (
            filteredSessions.map((s) => {
              const dt = new Date(s.ts);
              const sub = subjects.find((x) => x.id === s.subjectId);

              const isEditingNote = editingSessionNoteId === s.id;

              return (
                <div
                  key={s.id}
                  className="p-3 rounded-2xl border border-[#1b3853] bg-[#071725] text-xs hover:border-[#2b547b] transition space-y-2"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-mono text-[#91a9c1] shrink-0">
                        {s.legacy
                          ? '—'
                          : dt.toLocaleTimeString(undefined, {
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                      </span>

                      <div className="flex items-center gap-2 truncate">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: sub ? sub.color : NONE_COLOR }}
                        />
                        <span className="font-medium text-white truncate">
                          {sub ? sub.name : 'No subject'}
                        </span>
                        {s.intensity && INTENSITY_CONFIG[s.intensity] && (
                          <span
                            className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold tracking-wider font-mono border ${INTENSITY_CONFIG[s.intensity].bgClass}`}
                            style={{ borderColor: INTENSITY_CONFIG[s.intensity].borderColor }}
                          >
                            {INTENSITY_CONFIG[s.intensity].icon} {INTENSITY_CONFIG[s.intensity].label.split(' ')[0]}
                          </span>
                        )}
                        {s.manual && (
                          <span className="px-2 py-0.2 rounded-full border border-[#244463] bg-[#0a1c2d] text-[#91a9c1] text-[10px]">
                            MANUAL
                          </span>
                        )}
                        {s.legacy && (
                          <span className="px-2 py-0.2 rounded-full border border-[#244463] bg-[#0a1c2d] text-[#91a9c1] text-[10px]">
                            DAY TOTAL
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                      <span className="font-mono font-bold text-white">{formatMinutes(s.min)}</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (isEditingNote) {
                            setEditingSessionNoteId(null);
                          } else {
                            setEditingSessionNoteId(s.id);
                            setTempNoteText(s.notes || '');
                          }
                        }}
                        className={`p-1.5 rounded-lg border transition text-[10px] flex items-center gap-1 ${
                          s.notes
                            ? 'border-[#20496f] bg-[#0c2237] text-[#8acaff] hover:border-[#3a75a7]'
                            : 'border-[#1b3853] bg-[#061421] text-[#62819f] hover:text-[#91a9c1] hover:border-[#285078]'
                        }`}
                        title={s.notes ? 'Edit takeaway note' : 'Attach note / key takeaway'}
                        aria-label={s.notes ? 'Edit note' : 'Add note'}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">{s.notes ? 'Note' : '+ Note'}</span>
                      </button>
                      <button
                        onClick={() => onDeleteSession(s.id)}
                        className="p-1 rounded-lg text-[#91a9c1] hover:text-rose-400 hover:bg-[#12283e] transition"
                        aria-label="Delete session"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Display Attached Note / Takeaway if exists and not editing */}
                  {s.notes && !isEditingNote && (
                    <div
                      onClick={() => {
                        setEditingSessionNoteId(s.id);
                        setTempNoteText(s.notes || '');
                      }}
                      className="p-2 sm:p-2.5 rounded-xl bg-[#05111c] border border-[#1b3956] text-[11px] text-[#cfe3f8] leading-relaxed cursor-pointer hover:border-[#315b85] transition flex items-start gap-2 group"
                      title="Click to edit takeaway note"
                    >
                      <FileText className="w-3.5 h-3.5 text-[#4aa8ff] shrink-0 mt-0.5" />
                      <div className="flex-1 whitespace-pre-wrap">{s.notes}</div>
                      <Edit2 className="w-3 h-3 text-[#62819f] group-hover:text-[#8acaff] shrink-0 mt-0.5 opacity-60 group-hover:opacity-100" />
                    </div>
                  )}

                  {/* Inline Note Editor */}
                  {isEditingNote && (
                    <div className="p-2.5 rounded-xl bg-[#061423] border border-[#27537e] space-y-2 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between text-[10px] text-[#8acaff] font-semibold">
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          <span>Key Takeaways / Formulas Learned</span>
                        </span>
                        <span className="text-[#91a9c1]">Session takeaway</span>
                      </div>
                      <textarea
                        value={tempNoteText}
                        onChange={(e) => setTempNoteText(e.target.value)}
                        rows={2}
                        maxLength={350}
                        placeholder="e.g. Mastered shear & moment diagrams, checked sign conventions..."
                        className="w-full bg-[#030d17] border border-[#1e4266] rounded-xl p-2 text-xs text-white placeholder-[#58738e] focus:outline-none focus:border-[#4aa8ff] resize-none"
                        autoFocus
                      />
                      <div className="flex items-center justify-end gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => setEditingSessionNoteId(null)}
                          className="px-2.5 py-1 rounded-lg border border-[#1a3854] bg-[#071725] text-[#91a9c1] hover:text-white text-[11px]"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onUpdateSessionNotes(s.id, tempNoteText.trim());
                            setEditingSessionNoteId(null);
                          }}
                          className="px-3 py-1 rounded-lg bg-[#4aa8ff] hover:bg-[#82c5ff] text-[#041322] font-bold text-[11px] flex items-center gap-1"
                        >
                          <Check className="w-3 h-3 stroke-[3]" />
                          <span>Save Takeaway</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
};
