import React, { useState } from 'react';
import { Routine } from '../types';
import { ChevronLeft, ChevronRight, Plus, Trash2, Flame, Check } from 'lucide-react';
import { dayKey, mondayOf, addDays, parseDayKey, dayIdx, DAYS_SHORT } from '../utils/storage';

interface RoutineViewProps {
  routines: Routine[];
  routineLog: Record<string, string[]>;
  onToggleRoutine: (dateKey: string, routineId: string) => void;
  onAddRoutine: (routine: Omit<Routine, 'id'>) => void;
  onDeleteRoutine: (id: string) => void;
}

export const RoutineView: React.FC<RoutineViewProps> = ({
  routines,
  routineLog,
  onToggleRoutine,
  onAddRoutine,
  onDeleteRoutine,
}) => {
  const [weekOffset, setWeekOffset] = useState(0);
  const todayStr = dayKey();
  const todayDate = parseDayKey(todayStr);

  const [selectedDayKey, setSelectedDayKey] = useState<string>(todayStr);

  // Add routine form state
  const [routineName, setRoutineName] = useState('');
  const [routineTime, setRoutineTime] = useState('');
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);

  const currentMonday = addDays(mondayOf(), weekOffset * 7);

  // Helper check if routine is completed on date
  const isCompleted = (k: string, id: string) => {
    return (routineLog[k] || []).includes(id);
  };

  // Streak calculation
  const calculateStreak = (r: Routine) => {
    let streak = 0;
    const t0 = parseDayKey(todayStr);
    for (let i = 0; i < 365; i++) {
      const d = addDays(t0, -i);
      const dIdx = dayIdx(d);
      if (!r.days.includes(dIdx)) continue; // day not scheduled
      const k = dayKey(d);
      if (isCompleted(k, r.id)) {
        streak++;
      } else if (i === 0) {
        // Not completed yet today, check yesterday
        continue;
      } else {
        break;
      }
    }
    return streak;
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!routineName.trim() || selectedDays.length === 0) return;
    onAddRoutine({
      name: routineName.trim(),
      time: routineTime || undefined,
      days: [...selectedDays].sort(),
    });
    setRoutineName('');
    setRoutineTime('');
  };

  const toggleDaySelection = (idx: number) => {
    setSelectedDays((prev) =>
      prev.includes(idx) ? prev.filter((d) => d !== idx) : [...prev, idx].sort()
    );
  };

  // Selected Day Details
  const selectedDate = parseDayKey(selectedDayKey);
  const selectedDayIndex = dayIdx(selectedDate);
  const isFutureDay = selectedDate > todayDate;

  const scheduledForSelectedDay = routines.filter((r) => r.days.includes(selectedDayIndex));
  const completedCountForSelectedDay = scheduledForSelectedDay.filter((r) =>
    isCompleted(selectedDayKey, r.id)
  ).length;
  const dayProgressPct =
    scheduledForSelectedDay.length > 0
      ? (completedCountForSelectedDay / scheduledForSelectedDay.length) * 100
      : 0;

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-[#18344f]/70">
        <div>
          <div className="text-[10px] tracking-[0.2em] text-[#8acaff] uppercase font-bold">
            Daily routine tracker
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">Habits & Daily Disciplines</h2>
          <p className="text-xs text-[#91a9c1] mt-1 max-w-2xl leading-relaxed">
            Recurring habits for board preparation. Check off routines on your phone or laptop each day and maintain your active streak.
          </p>
        </div>

        {/* Week Switcher */}
        <div className="flex items-center gap-1.5 bg-[#0a1c2d] border border-[#315578] rounded-xl p-1">
          <button
            onClick={() => setWeekOffset((prev) => prev - 1)}
            className="p-1.5 rounded-lg text-[#91a9c1] hover:text-white hover:bg-[#123452] transition"
            aria-label="Previous week"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setWeekOffset(0)}
            className="px-3 py-1 rounded-lg text-xs font-bold tracking-wider text-[#8acaff] uppercase hover:bg-[#123452] transition"
          >
            {weekOffset === 0
              ? 'THIS WEEK'
              : `${currentMonday.toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })} – ${addDays(currentMonday, 6).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })}`}
          </button>
          <button
            onClick={() => setWeekOffset((prev) => prev + 1)}
            className="p-1.5 rounded-lg text-[#91a9c1] hover:text-white hover:bg-[#123452] transition"
            aria-label="Next week"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Monday to Sunday Day Strip */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {DAYS_SHORT.map((dayLabel, i) => {
          const d = addDays(currentMonday, i);
          const k = dayKey(d);
          const isToday = k === todayStr;
          const isSelected = selectedDayKey === k;

          const scheduled = routines.filter((r) => r.days.includes(i));
          const completed = scheduled.filter((r) => isCompleted(k, r.id)).length;

          return (
            <button
              key={k}
              type="button"
              onClick={() => setSelectedDayKey(k)}
              className={`p-2 sm:p-2.5 rounded-2xl border text-center transition flex flex-col items-center justify-center select-none ${
                isSelected
                  ? 'bg-[#0f2d48] border-[#4aa8ff] ring-1 ring-[#4aa8ff]'
                  : isToday
                  ? 'border-[#316aa5] bg-[#091f33]'
                  : 'border-[#1b3853] bg-[#071725] hover:bg-[#0c2236]'
              }`}
            >
              <span
                className={`text-[9px] font-bold tracking-wider ${
                  isToday ? 'text-[#b8ff5c]' : 'text-[#91a9c1]'
                }`}
              >
                {dayLabel}
              </span>
              <span className="text-sm sm:text-lg font-mono font-bold text-white my-0.5">
                {d.getDate()}
              </span>
              <span
                className={`text-[9px] font-mono ${
                  scheduled.length > 0 && completed === scheduled.length
                    ? 'text-[#b8ff5c] font-bold'
                    : scheduled.length > 0
                    ? 'text-[#8acaff]'
                    : 'text-[#5d7a96]'
                }`}
              >
                {scheduled.length > 0 ? `${completed}/${scheduled.length}` : '·'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main 2-Col Layout: Day Checklist + Add Routine Form */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.9fr)] gap-5">
        {/* Selected Day Checklist */}
        <section className="bg-gradient-to-br from-[#0d2033]/95 to-[#071522]/98 border border-[#244463] rounded-3xl p-5 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-[#18344f]">
            <div>
              <h3 className="text-sm font-bold text-white tracking-wider uppercase">
                {selectedDayKey === todayStr
                  ? 'Today'
                  : selectedDate.toLocaleDateString(undefined, {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric',
                    })}
              </h3>
              <div className="text-[10px] text-[#91a9c1] mt-0.5">
                {scheduledForSelectedDay.length > 0
                  ? `${completedCountForSelectedDay} OF ${scheduledForSelectedDay.length} COMPLETED`
                  : 'NO ROUTINES SCHEDULED'}
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-[#b8ff5c]">
              {Math.round(dayProgressPct)}%
            </span>
          </div>

          <div className="h-1.5 rounded-full bg-[#12293f] overflow-hidden my-3">
            <div
              className="h-full rounded-full bg-[#b8ff5c] transition-all duration-300"
              style={{ width: `${dayProgressPct}%` }}
            />
          </div>

          {/* Routine items for the day */}
          <div className="space-y-2 mt-4">
            {scheduledForSelectedDay.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#91a9c1] rounded-2xl border border-dashed border-[#1b3853]">
                Nothing scheduled for this day of the week.
              </div>
            ) : (
              scheduledForSelectedDay.map((r) => {
                const done = isCompleted(selectedDayKey, r.id);
                const streak = calculateStreak(r);

                return (
                  <div
                    key={r.id}
                    className={`flex items-center justify-between gap-3 p-3 rounded-2xl border transition ${
                      done
                        ? 'border-[#1b4831] bg-[#072418]/50'
                        : 'border-[#1b3853] bg-[#071725] hover:border-[#2b547b]'
                    }`}
                  >
                    <label className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={done}
                        disabled={isFutureDay}
                        onChange={() => onToggleRoutine(selectedDayKey, r.id)}
                        className="w-4 h-4 rounded accent-[#b8ff5c] shrink-0 cursor-pointer disabled:opacity-40"
                      />
                      <div className="min-w-0 flex-1">
                        <div
                          className={`text-xs sm:text-sm font-medium leading-snug ${
                            done ? 'line-through text-[#91a9c1]' : 'text-white'
                          }`}
                        >
                          {r.name}
                        </div>
                        {r.time && (
                          <div className="text-[10px] text-[#91a9c1] font-mono mt-0.5">
                            {r.time}
                          </div>
                        )}
                      </div>
                    </label>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono border ${
                          streak > 0
                            ? 'border-emerald-800 bg-emerald-950/40 text-emerald-300'
                            : 'border-[#244463] bg-[#0a1c2d] text-[#91a9c1]'
                        }`}
                      >
                        <Flame className="w-3 h-3 text-[#ffb454]" />
                        <span>{streak}d</span>
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {isFutureDay && (
            <p className="text-[11px] text-[#91a9c1] italic text-center mt-4">
              Future days will unlock for check-off when they arrive.
            </p>
          )}
        </section>

        {/* Add Routine Form */}
        <section className="bg-gradient-to-br from-[#0d2033]/95 to-[#071522]/98 border border-[#244463] rounded-3xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#18344f]">
              <h3 className="text-sm font-bold text-white tracking-wider uppercase">Add Routine</h3>
              <span className="text-[10px] text-[#91a9c1] uppercase font-semibold">
                REPEATS WEEKLY
              </span>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3.5 mt-4">
              <div>
                <label className="block text-[10px] text-[#91a9c1] font-semibold tracking-wider uppercase mb-1">
                  Routine Name
                </label>
                <input
                  type="text"
                  required
                  maxLength={60}
                  placeholder="e.g. Review formulas / Morning problem set"
                  value={routineName}
                  onChange={(e) => setRoutineName(e.target.value)}
                  className="w-full bg-[#061321] border border-[#244463] rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-[#4aa8ff]"
                />
              </div>

              <div>
                <label className="block text-[10px] text-[#91a9c1] font-semibold tracking-wider uppercase mb-1">
                  Target Time (optional)
                </label>
                <input
                  type="time"
                  value={routineTime}
                  onChange={(e) => setRoutineTime(e.target.value)}
                  className="w-full bg-[#061321] border border-[#244463] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#4aa8ff]"
                />
              </div>

              <div>
                <label className="block text-[10px] text-[#91a9c1] font-semibold tracking-wider uppercase mb-1.5">
                  Repeat on Days
                </label>
                <div className="flex gap-1.5 flex-wrap">
                  {DAYS_SHORT.map((dayLabel, idx) => {
                    const active = selectedDays.includes(idx);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => toggleDaySelection(idx)}
                        className={`flex-1 min-w-[36px] py-1.5 rounded-xl border text-[11px] font-bold transition select-none ${
                          active
                            ? 'bg-[#123452] border-[#4aa8ff] text-[#8acaff]'
                            : 'bg-[#0a1c2d] border-[#315578] text-[#91a9c1] hover:text-white'
                        }`}
                      >
                        {dayLabel}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-[#4aa8ff] hover:bg-[#82c5ff] text-[#041322] font-bold text-xs tracking-wider transition shadow-sm flex items-center justify-center gap-1.5 mt-2"
              >
                <Plus className="w-4 h-4" />
                <span>ADD ROUTINE</span>
              </button>
            </form>
          </div>
        </section>
      </div>

      {/* Week at a Glance Matrix Table */}
      <section className="bg-gradient-to-br from-[#0d2033]/95 to-[#071522]/98 border border-[#244463] rounded-3xl p-5 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-[#18344f]">
          <h3 className="text-sm font-bold text-white tracking-wider uppercase">Week at a Glance</h3>
          <span className="text-[10px] text-[#91a9c1] uppercase font-semibold">
            TAP ANY DAY BOX TO CHECK OFF
          </span>
        </div>

        <div className="overflow-x-auto mt-4">
          <table className="w-full min-w-[620px] text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#1b3853]">
                <th className="text-left py-2 px-3 text-[10px] font-semibold text-[#91a9c1] tracking-wider uppercase">
                  Routine
                </th>
                {DAYS_SHORT.map((dayLabel, i) => {
                  const d = addDays(currentMonday, i);
                  const isToday = dayKey(d) === todayStr;
                  return (
                    <th
                      key={i}
                      className={`text-center py-2 px-1 text-[10px] font-bold tracking-wider ${
                        isToday ? 'text-[#b8ff5c]' : 'text-[#91a9c1]'
                      }`}
                    >
                      {dayLabel}
                      <br />
                      <span className="font-mono text-[11px] font-normal">{d.getDate()}</span>
                    </th>
                  );
                })}
                <th className="text-center py-2 px-2 text-[10px] font-semibold text-[#91a9c1] tracking-wider uppercase">
                  Week
                </th>
                <th className="text-center py-2 px-2 text-[10px] font-semibold text-[#91a9c1] tracking-wider uppercase">
                  Streak
                </th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {routines.map((r) => {
                let scheduledInWeek = 0;
                let completedInWeek = 0;

                return (
                  <tr key={r.id} className="border-b border-[#142d45] hover:bg-[#0c2236]/40 transition">
                    <td className="py-2.5 px-3 min-w-[160px]">
                      <div className="font-semibold text-white truncate">{r.name}</div>
                      {r.time && <div className="text-[10px] text-[#91a9c1] font-mono">{r.time}</div>}
                    </td>

                    {DAYS_SHORT.map((_, i) => {
                      const d = addDays(currentMonday, i);
                      const k = dayKey(d);
                      const isScheduled = r.days.includes(i);
                      const isFuture = d > todayDate;
                      const done = isCompleted(k, r.id);

                      if (isScheduled && !isFuture) {
                        scheduledInWeek++;
                        if (done) completedInWeek++;
                      }

                      if (!isScheduled) {
                        return (
                          <td key={k} className="text-center py-2 px-1">
                            <span className="text-[#3b546e] select-none">–</span>
                          </td>
                        );
                      }

                      return (
                        <td key={k} className="text-center py-2 px-1">
                          <button
                            type="button"
                            disabled={isFuture}
                            onClick={() => onToggleRoutine(k, r.id)}
                            className={`w-8 h-8 rounded-xl border flex items-center justify-center mx-auto transition ${
                              done
                                ? 'bg-[#16361f] border-[#3f8f4f] text-[#b8ff5c] shadow-sm'
                                : 'bg-[#061523] border-[#28506f] text-[#5d7a96] hover:border-[#4aa8ff]'
                            } ${isFuture ? 'opacity-30 cursor-not-allowed' : 'active:scale-90'}`}
                            aria-label={`Toggle ${r.name} on ${k}`}
                          >
                            {done ? <Check className="w-4 h-4 stroke-[3]" /> : null}
                          </button>
                        </td>
                      );
                    })}

                    <td className="text-center py-2 px-2 font-mono font-bold text-[#8acaff]">
                      {scheduledInWeek > 0
                        ? `${Math.round((completedInWeek / scheduledInWeek) * 100)}%`
                        : '·'}
                    </td>
                    <td className="text-center py-2 px-2 font-mono text-[#ffb454]">
                      {calculateStreak(r)}d
                    </td>
                    <td className="text-center py-2 px-2">
                      <button
                        onClick={() => onDeleteRoutine(r.id)}
                        className="p-1 rounded-lg text-[#91a9c1] hover:text-rose-400 hover:bg-[#12283e] transition"
                        aria-label="Delete routine"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
