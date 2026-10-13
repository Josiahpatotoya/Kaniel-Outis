import React, { useState } from 'react';
import { TaskItem, Subject } from '../types';
import { Plus, Trash2, CheckCircle2, AlertCircle, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { dayKey, mondayOf, addDays, parseDayKey, DAYS_SHORT } from '../utils/storage';

interface TasksViewProps {
  tasks: TaskItem[];
  subjects: Subject[];
  onAddTask: (task: Omit<TaskItem, 'id' | 'created'>) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onClearDone: () => void;
}

export const TasksView: React.FC<TasksViewProps> = ({
  tasks,
  subjects,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onClearDone,
}) => {
  const [filter, setFilter] = useState<'active' | 'done' | 'all'>('active');
  const [selectedDayFilter, setSelectedDayFilter] = useState<string | null>(null);

  // Form state
  const [taskText, setTaskText] = useState('');
  const [taskSubjectId, setTaskSubjectId] = useState<string>('');
  const [taskDue, setTaskDue] = useState<string>(dayKey());
  const [taskPrio, setTaskPrio] = useState<'h' | 'm' | 'l'>('m');

  const todayStr = dayKey();
  const mon = mondayOf();

  // Metrics
  const openTasks = tasks.filter((t) => !t.done);
  const dueTodayCount = openTasks.filter((t) => t.due === todayStr).length;
  const overdueCount = openTasks.filter((t) => t.due && t.due < todayStr).length;
  const doneThisWeekCount = tasks.filter((t) => t.done && t.doneAt && t.doneAt >= mon.getTime()).length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskText.trim()) return;
    onAddTask({
      text: taskText.trim(),
      done: false,
      due: taskDue,
      prio: taskPrio,
      subjectId: taskSubjectId || null,
      doneAt: null,
    });
    setTaskText('');
  };

  // Filter tasks
  let displayedTasks = tasks.filter((t) => {
    if (filter === 'active') return !t.done;
    if (filter === 'done') return t.done;
    return true;
  });

  if (selectedDayFilter) {
    displayedTasks = displayedTasks.filter((t) => t.due === selectedDayFilter);
  }

  // Sort tasks: Active first, then Overdue/Today, priority, then created
  displayedTasks.sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    const aDue = a.due || '9999-99-99';
    const bDue = b.due || '9999-99-99';
    if (aDue !== bDue) return aDue.localeCompare(bDue);
    const prioWeight = { h: 1, m: 2, l: 3 };
    return prioWeight[a.prio] - prioWeight[b.prio];
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-[#18344f]/70">
        <div>
          <div className="text-[10px] tracking-[0.2em] text-[#8acaff] uppercase font-bold">
            To-do list tracker
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">Tasks & Problem Sets</h2>
          <p className="text-xs text-[#91a9c1] mt-1 max-w-2xl leading-relaxed">
            Assignments, problem sets, readings, and board exam drills. Tap any day in the Monday to Sunday strip to see what's due that day.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onClearDone}
            className="px-3.5 py-2 rounded-xl bg-[#0a1c2d] hover:bg-[#122e49] border border-[#315578] text-[#8acaff] text-xs font-semibold tracking-wider transition"
          >
            CLEAR COMPLETED
          </button>
        </div>
      </div>

      {/* 4 Stat Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl border border-[#1b3853] bg-[#071725]">
          <div className="text-2xl font-mono font-light text-white">{openTasks.length}</div>
          <div className="text-[10px] text-[#91a9c1] mt-1 uppercase font-semibold">Open tasks</div>
        </div>
        <div className="p-3.5 rounded-2xl border border-[#1b3853] bg-[#071725]">
          <div className="text-2xl font-mono font-light text-[#4aa8ff]">{dueTodayCount}</div>
          <div className="text-[10px] text-[#91a9c1] mt-1 uppercase font-semibold">Due today</div>
        </div>
        <div className="p-3.5 rounded-2xl border border-[#1b3853] bg-[#071725]">
          <div className="text-2xl font-mono font-light text-[#ff7a90]">{overdueCount}</div>
          <div className="text-[10px] text-[#91a9c1] mt-1 uppercase font-semibold">Overdue</div>
        </div>
        <div className="p-3.5 rounded-2xl border border-[#1b3853] bg-[#071725]">
          <div className="text-2xl font-mono font-light text-[#b8ff5c]">{doneThisWeekCount}</div>
          <div className="text-[10px] text-[#91a9c1] mt-1 uppercase font-semibold">Done this week</div>
        </div>
      </div>

      {/* Monday to Sunday Day Strip */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {DAYS_SHORT.map((dayLabel, i) => {
          const d = addDays(mon, i);
          const k = dayKey(d);
          const isToday = k === todayStr;
          const isSelected = selectedDayFilter === k;
          const dueCount = openTasks.filter((t) => t.due === k).length;

          return (
            <button
              key={k}
              type="button"
              onClick={() => setSelectedDayFilter(isSelected ? null : k)}
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
                  dueCount > 0 ? 'text-[#8acaff] font-bold' : 'text-[#5d7a96]'
                }`}
              >
                {dueCount > 0 ? `${dueCount} due` : '·'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Add Task Form */}
      <section className="bg-gradient-to-br from-[#0d2033]/95 to-[#071522]/98 border border-[#244463] rounded-3xl p-4 sm:p-5 shadow-xl">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="sm:col-span-2 lg:col-span-4">
            <label className="block text-[10px] text-[#91a9c1] font-semibold tracking-wider uppercase mb-1">
              Task or Problem Set
            </label>
            <input
              type="text"
              required
              maxLength={120}
              placeholder="e.g. Solve PSAD problem set 3 / Review Reynolds number derivations"
              value={taskText}
              onChange={(e) => setTaskText(e.target.value)}
              className="w-full bg-[#061321] border border-[#244463] rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-[#4aa8ff]"
            />
          </div>

          <div>
            <label className="block text-[10px] text-[#91a9c1] font-semibold tracking-wider uppercase mb-1">
              Subject
            </label>
            <select
              value={taskSubjectId}
              onChange={(e) => setTaskSubjectId(e.target.value)}
              className="w-full bg-[#061321] border border-[#244463] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#4aa8ff] cursor-pointer"
            >
              <option value="">No subject (General)</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-[#91a9c1] font-semibold tracking-wider uppercase mb-1">
              Due Date
            </label>
            <input
              type="date"
              value={taskDue}
              onChange={(e) => setTaskDue(e.target.value)}
              className="w-full bg-[#061321] border border-[#244463] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#4aa8ff]"
            />
          </div>

          <div>
            <label className="block text-[10px] text-[#91a9c1] font-semibold tracking-wider uppercase mb-1">
              Priority
            </label>
            <select
              value={taskPrio}
              onChange={(e) => setTaskPrio(e.target.value as 'h' | 'm' | 'l')}
              className="w-full bg-[#061321] border border-[#244463] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#4aa8ff] cursor-pointer"
            >
              <option value="h">High Priority</option>
              <option value="m">Medium Priority</option>
              <option value="l">Low Priority</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-[#4aa8ff] hover:bg-[#82c5ff] text-[#041322] font-bold text-xs tracking-wider transition shadow-sm flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>ADD TASK</span>
            </button>
          </div>
        </form>
      </section>

      {/* Task List Section */}
      <section className="bg-gradient-to-br from-[#0d2033]/95 to-[#071522]/98 border border-[#244463] rounded-3xl p-5 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-[#18344f] flex-wrap gap-2">
          <h3 className="text-sm font-bold text-white tracking-wider uppercase flex items-center gap-2">
            <span>
              {selectedDayFilter
                ? `Due on ${parseDayKey(selectedDayFilter).toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}`
                : 'All Tasks'}
            </span>
            {selectedDayFilter && (
              <button
                onClick={() => setSelectedDayFilter(null)}
                className="text-xs text-[#4aa8ff] hover:underline lowercase font-normal"
              >
                (clear date filter)
              </button>
            )}
          </h3>

          <div className="flex rounded-xl bg-[#0a1c2d] border border-[#315578] p-0.5 text-xs font-semibold">
            {(['active', 'done', 'all'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setFilter(mode)}
                className={`px-3 py-1 rounded-lg uppercase tracking-wider transition ${
                  filter === mode
                    ? 'bg-[#123452] text-[#8acaff] shadow-sm'
                    : 'text-[#91a9c1] hover:text-white'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Items */}
        <div className="mt-4 space-y-2">
          {displayedTasks.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#91a9c1] rounded-2xl border border-dashed border-[#1b3853]">
              {selectedDayFilter
                ? 'No tasks due on this day.'
                : filter === 'done'
                ? 'No completed tasks yet.'
                : 'No open tasks. Add one above to start your agenda.'}
            </div>
          ) : (
            displayedTasks.map((t) => {
              const sub = subjects.find((s) => s.id === t.subjectId);
              const isOverdue = !t.done && t.due && t.due < todayStr;
              const isToday = !t.done && t.due === todayStr;

              return (
                <div
                  key={t.id}
                  className={`flex items-center justify-between gap-3 p-3 rounded-2xl border transition ${
                    t.done
                      ? 'border-[#152e46] bg-[#061421]/60 opacity-70'
                      : 'border-[#1b3853] bg-[#071725] hover:border-[#2b547b]'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={t.done}
                      onChange={() => onToggleTask(t.id)}
                      className="w-4 h-4 rounded accent-[#b8ff5c] shrink-0 cursor-pointer"
                      aria-label="Toggle task completion"
                    />
                    <div className="min-w-0 flex-1">
                      <div
                        className={`text-xs sm:text-sm font-medium leading-snug break-words ${
                          t.done ? 'line-through text-[#91a9c1]' : 'text-white'
                        }`}
                      >
                        {t.text}
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {sub && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-[#91a9c1]">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: sub.color }}
                            />
                            {sub.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Due Badge */}
                    {t.due && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider font-mono border ${
                          isOverdue
                            ? 'border-rose-800 bg-rose-950/50 text-rose-300'
                            : isToday
                            ? 'border-emerald-800 bg-emerald-950/50 text-emerald-300'
                            : 'border-[#244463] bg-[#0a1c2d] text-[#91a9c1]'
                        }`}
                      >
                        {isOverdue ? 'OVERDUE · ' : isToday ? 'TODAY · ' : ''}
                        {parseDayKey(t.due).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    )}

                    {/* Priority Badge */}
                    {!t.done && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${
                          t.prio === 'h'
                            ? 'border-rose-900 bg-rose-950/40 text-rose-400'
                            : t.prio === 'm'
                            ? 'border-amber-900 bg-amber-950/40 text-amber-300'
                            : 'border-[#244463] bg-[#0a1c2d] text-[#91a9c1]'
                        }`}
                      >
                        {t.prio === 'h' ? 'HIGH' : t.prio === 'm' ? 'MED' : 'LOW'}
                      </span>
                    )}

                    <button
                      onClick={() => onDeleteTask(t.id)}
                      className="p-1.5 rounded-lg text-[#91a9c1] hover:text-rose-400 hover:bg-[#12283e] transition"
                      aria-label="Delete task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
};
