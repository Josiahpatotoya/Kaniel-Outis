import React, { useState, useEffect } from 'react';
import {
  Exam,
  Subject,
  Session,
  calculateExamReadiness,
  ExamReadinessResult,
} from '../types';
import {
  Plus,
  Trash2,
  Calendar,
  Clock,
  Award,
  BookOpen,
  TrendingUp,
  Target,
  Play,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Check,
} from 'lucide-react';
import { pad, dayKey, formatMinutes } from '../utils/storage';

interface ExamsViewProps {
  exams: Exam[];
  subjects: Subject[];
  sessions: Session[];
  onAddExam: (exam: Omit<Exam, 'id'>) => void;
  onDeleteExam: (id: string) => void;
  onSelectSubjectToStudy?: (subjectId: string) => void;
}

export const ExamsView: React.FC<ExamsViewProps> = ({
  exams,
  subjects,
  sessions,
  onAddExam,
  onDeleteExam,
  onSelectSubjectToStudy,
}) => {
  const [examName, setExamName] = useState('');
  const [examDate, setExamDate] = useState('');
  const [examTime, setExamTime] = useState('08:00');
  const [targetMastery, setTargetMastery] = useState<number>(85);
  const [targetSessions, setTargetSessions] = useState<number>(20);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [linkAllSubjects, setLinkAllSubjects] = useState<boolean>(true);

  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!examName.trim() || !examDate) return;

    onAddExam({
      name: examName.trim(),
      date: examDate,
      time: examTime || '08:00',
      subjectIds: linkAllSubjects ? [] : selectedSubjectIds,
      targetMastery,
      targetSessions,
    });

    setExamName('');
    setExamDate('');
    setSelectedSubjectIds([]);
    setLinkAllSubjects(true);
  };

  const toggleSubjectLink = (id: string) => {
    if (linkAllSubjects) {
      setLinkAllSubjects(false);
      setSelectedSubjectIds([id]);
      return;
    }

    setSelectedSubjectIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const examsWithTime = exams.map((e) => {
    const targetMs = new Date(`${e.date}T${e.time || '08:00'}`).getTime();
    const readiness = calculateExamReadiness(e, subjects, sessions);
    return { ...e, targetMs, readiness };
  });

  const upcomingExams = examsWithTime
    .filter((e) => e.targetMs > currentTime)
    .sort((a, b) => a.targetMs - b.targetMs);

  const pastExams = examsWithTime
    .filter((e) => e.targetMs <= currentTime)
    .sort((a, b) => b.targetMs - a.targetMs);

  // Overall average readiness across active exams
  const avgExamReadiness =
    upcomingExams.length > 0
      ? Math.round(
          upcomingExams.reduce((acc, e) => acc + e.readiness.score, 0) / upcomingExams.length
        )
      : null;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-[#18344f]/70">
        <div>
          <div className="text-[10px] tracking-[0.2em] text-[#8acaff] uppercase font-bold">
            Exam-day countdowns & Readiness Diagnostics
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Deadlines & Board Exam Readiness
          </h2>
          <p className="text-xs text-[#91a9c1] mt-1 max-w-2xl leading-relaxed">
            Track exam countdowns and evaluate your real-time <strong>Readiness Score</strong> computed from
            study sessions logged against the target mastery level of linked subjects.
          </p>
        </div>
      </div>

      {/* Aggregate Overview Banner if exams exist */}
      {upcomingExams.length > 0 && avgExamReadiness !== null && (
        <section className="bg-gradient-to-br from-[#0d263e]/95 via-[#081b2d]/95 to-[#061421]/98 border border-[#2b547b] rounded-3xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-[#b8ff5c]" />
              <span className="text-xs font-bold text-[#8acaff] uppercase tracking-wider">
                Average Examination Readiness
              </span>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-mono font-light text-white">{avgExamReadiness}%</span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${
                  avgExamReadiness >= 85
                    ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300'
                    : avgExamReadiness >= 65
                    ? 'border-sky-500 bg-sky-950/40 text-sky-300'
                    : avgExamReadiness >= 45
                    ? 'border-amber-500 bg-amber-950/40 text-amber-300'
                    : 'border-rose-500 bg-rose-950/40 text-rose-300'
                }`}
              >
                {avgExamReadiness >= 85
                  ? '🏆 PEAK READINESS'
                  : avgExamReadiness >= 65
                  ? '🛡️ ON TRACK'
                  : avgExamReadiness >= 45
                  ? '⚠️ DEVELOPING'
                  : '🚨 CRITICAL STUDY NEEDED'}
              </span>
            </div>
            <p className="text-xs text-[#91a9c1]">
              Computed from session frequency logged for subjects linked to your upcoming exams vs.
              their target mastery benchmarks.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="p-3 rounded-2xl bg-[#061523] border border-[#1b3853] text-center min-w-[120px]">
              <div className="text-lg font-mono font-bold text-white">
                {upcomingExams[0]?.name.slice(0, 16)}
              </div>
              <div className="text-[10px] text-[#b8ff5c] uppercase font-bold tracking-wider mt-0.5">
                Nearest Goal: {upcomingExams[0]?.readiness.score}%
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Add Exam Form */}
      <section className="bg-gradient-to-br from-[#0d2033]/95 to-[#071522]/98 border border-[#244463] rounded-3xl p-5 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-[#18344f] mb-4">
          <h3 className="text-xs font-bold text-white tracking-wider uppercase flex items-center gap-1.5">
            <Target className="w-4 h-4 text-[#4aa8ff]" />
            <span>Schedule Exam & Link Subjects</span>
          </h3>
          <span className="text-[10px] text-[#91a9c1] uppercase font-semibold">
            READINESS ENGINE
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[10px] text-[#91a9c1] font-semibold tracking-wider uppercase mb-1">
                Exam or Milestone Name
              </label>
              <input
                type="text"
                required
                maxLength={60}
                placeholder="e.g. Civil Engineering Board Exam"
                value={examName}
                onChange={(e) => setExamName(e.target.value)}
                className="w-full bg-[#061321] border border-[#244463] rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-[#4aa8ff]"
              />
            </div>

            <div>
              <label className="block text-[10px] text-[#91a9c1] font-semibold tracking-wider uppercase mb-1">
                Date
              </label>
              <input
                type="date"
                required
                min={dayKey()}
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="w-full bg-[#061321] border border-[#244463] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#4aa8ff]"
              />
            </div>

            <div>
              <label className="block text-[10px] text-[#91a9c1] font-semibold tracking-wider uppercase mb-1">
                Start Time
              </label>
              <input
                type="time"
                value={examTime}
                onChange={(e) => setExamTime(e.target.value)}
                className="w-full bg-[#061321] border border-[#244463] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#4aa8ff]"
              />
            </div>
          </div>

          {/* Readiness Parameters: Target Mastery & Target Sessions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#18344f]/60">
            <div>
              <div className="flex items-center justify-between text-[10px] text-[#91a9c1] font-semibold uppercase mb-1">
                <span>Target Mastery Level</span>
                <span className="font-mono text-white font-bold">{targetMastery}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="100"
                step="5"
                value={targetMastery}
                onChange={(e) => setTargetMastery(parseInt(e.target.value) || 85)}
                className="w-full accent-[#4aa8ff] cursor-pointer"
              />
              <span className="text-[9px] text-[#91a9c1]">
                Recommended benchmark: 85% for full board readiness.
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between text-[10px] text-[#91a9c1] font-semibold uppercase mb-1">
                <span>Target Study Sessions</span>
                <span className="font-mono text-white font-bold">{targetSessions} sessions</span>
              </div>
              <input
                type="range"
                min="5"
                max="60"
                step="5"
                value={targetSessions}
                onChange={(e) => setTargetSessions(parseInt(e.target.value) || 20)}
                className="w-full accent-[#4aa8ff] cursor-pointer"
              />
              <span className="text-[9px] text-[#91a9c1]">
                Target preparation volume for the linked subjects.
              </span>
            </div>
          </div>

          {/* Linked Subjects Selection */}
          <div className="pt-2 border-t border-[#18344f]/60">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] text-[#91a9c1] font-semibold tracking-wider uppercase">
                Subjects Linked to this Exam
              </label>
              <button
                type="button"
                onClick={() => {
                  setLinkAllSubjects(!linkAllSubjects);
                  if (linkAllSubjects) {
                    setSelectedSubjectIds(subjects.map((s) => s.id));
                  } else {
                    setSelectedSubjectIds([]);
                  }
                }}
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-lg border transition ${
                  linkAllSubjects
                    ? 'bg-[#123452] border-[#4aa8ff] text-[#8acaff]'
                    : 'bg-[#0a1a2b] border-[#244463] text-[#91a9c1]'
                }`}
              >
                {linkAllSubjects ? '✓ All Subjects (Full Board Exam)' : 'Select Specific Subjects'}
              </button>
            </div>

            <div className="flex gap-2 flex-wrap">
              {subjects.map((sub) => {
                const isSelected = linkAllSubjects || selectedSubjectIds.includes(sub.id);
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => toggleSubjectLink(sub.id)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition flex items-center gap-1.5 select-none ${
                      isSelected
                        ? 'bg-[#0c2740] border-[#4aa8ff] text-white ring-1 ring-[#4aa8ff]/40 shadow-sm'
                        : 'bg-[#071725] border-[#1b3853] text-[#91a9c1] hover:border-[#2b547b]'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: sub.color }}
                    />
                    <span>{sub.name}</span>
                    <span className="text-[10px] font-mono text-[#8acaff] ml-0.5">
                      ({sub.masteryLevel ?? 50}%)
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="py-2.5 px-5 rounded-xl bg-[#4aa8ff] hover:bg-[#82c5ff] text-[#041322] font-bold text-xs tracking-wider transition shadow-sm flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>SCHEDULE COUNTDOWN & CALIBRATE READINESS</span>
            </button>
          </div>
        </form>
      </section>

      {/* Exam Cards List */}
      <div className="space-y-4">
        {upcomingExams.length === 0 && pastExams.length === 0 ? (
          <div className="p-10 rounded-2xl border border-dashed border-[#244463] text-center text-xs text-[#91a9c1]">
            No exam countdowns active. Schedule your target board exam date above to calculate your
            Readiness Score.
          </div>
        ) : (
          <>
            {upcomingExams.map((e, index) => {
              const isNearest = index === 0;
              const diffSec = Math.max(0, Math.floor((e.targetMs - currentTime) / 1000));
              const days = Math.floor(diffSec / 86400);
              const hours = Math.floor((diffSec % 86400) / 3600);
              const minutes = Math.floor((diffSec % 3600) / 60);
              const seconds = diffSec % 60;

              const examDateObj = new Date(e.targetMs);
              const { readiness } = e;

              // Find weakest linked subject
              const weakestSubject =
                readiness.linkedSubjects.length > 0
                  ? [...readiness.linkedSubjects].sort(
                      (a, b) => (a.masteryLevel ?? 50) - (b.masteryLevel ?? 50)
                    )[0]
                  : null;

              return (
                <article
                  key={e.id}
                  className={`bg-gradient-to-br from-[#0d2033]/95 to-[#071522]/98 border rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col gap-5 transition ${
                    isNearest
                      ? 'border-[#4aa8ff] ring-1 ring-[#4aa8ff]/50 shadow-[0_0_30px_rgba(74,168,255,0.12)]'
                      : 'border-[#1b3853] hover:border-[#285073]'
                  }`}
                >
                  {/* Top Bar: Title, Date, Live Countdown, Delete */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
                          {e.name}
                        </h3>
                        {isNearest && (
                          <span className="px-2 py-0.5 rounded-full bg-[#16361f] border border-[#3f8f4f] text-[#b8ff5c] text-[10px] font-bold tracking-wider uppercase">
                            NEXT UP
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[#91a9c1] mt-1 flex items-center gap-2 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-[#4aa8ff]" />
                          <span>
                            {examDateObj.toLocaleDateString(undefined, {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </span>
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-[#4aa8ff]" />
                          <span>{e.time || '08:00'}</span>
                        </span>
                      </div>
                    </div>

                    {/* Countdown Blocks */}
                    <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
                      <div className="flex gap-1.5 sm:gap-2">
                        <div className="min-w-[50px] sm:min-w-[58px] text-center p-2 rounded-2xl bg-[#071725] border border-[#1c3b58]">
                          <div
                            className={`text-xl font-light font-mono leading-none ${
                              isNearest ? 'text-[#b8ff5c]' : 'text-white'
                            }`}
                          >
                            {days}
                          </div>
                          <div className="text-[9px] text-[#91a9c1] uppercase tracking-wider font-semibold mt-1">
                            Days
                          </div>
                        </div>
                        <div className="min-w-[50px] sm:min-w-[58px] text-center p-2 rounded-2xl bg-[#071725] border border-[#1c3b58]">
                          <div
                            className={`text-xl font-light font-mono leading-none ${
                              isNearest ? 'text-[#b8ff5c]' : 'text-white'
                            }`}
                          >
                            {pad(hours)}
                          </div>
                          <div className="text-[9px] text-[#91a9c1] uppercase tracking-wider font-semibold mt-1">
                            Hours
                          </div>
                        </div>
                        <div className="min-w-[50px] sm:min-w-[58px] text-center p-2 rounded-2xl bg-[#071725] border border-[#1c3b58]">
                          <div
                            className={`text-xl font-light font-mono leading-none ${
                              isNearest ? 'text-[#b8ff5c]' : 'text-white'
                            }`}
                          >
                            {pad(minutes)}
                          </div>
                          <div className="text-[9px] text-[#91a9c1] uppercase tracking-wider font-semibold mt-1">
                            Min
                          </div>
                        </div>
                        <div className="min-w-[50px] sm:min-w-[58px] text-center p-2 rounded-2xl bg-[#071725] border border-[#1c3b58]">
                          <div
                            className={`text-xl font-light font-mono leading-none ${
                              isNearest ? 'text-[#b8ff5c]' : 'text-white'
                            }`}
                          >
                            {pad(seconds)}
                          </div>
                          <div className="text-[9px] text-[#91a9c1] uppercase tracking-wider font-semibold mt-1">
                            Sec
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => onDeleteExam(e.id)}
                        className="p-2 rounded-xl text-[#91a9c1] hover:text-rose-400 hover:bg-[#12283e] transition ml-2"
                        aria-label="Delete countdown"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* READINESS SCORE COMPONENT */}
                  <div className="p-4 rounded-2xl bg-[#061523] border border-[#1c3b58] space-y-3.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {/* Circular Score Badge */}
                        <div
                          className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-mono shrink-0 shadow-inner border"
                          style={{
                            backgroundColor: `${readiness.color}15`,
                            borderColor: `${readiness.color}50`,
                          }}
                        >
                          <span
                            className="text-xl font-bold leading-none"
                            style={{ color: readiness.color }}
                          >
                            {readiness.score}%
                          </span>
                          <span className="text-[8px] font-bold tracking-wider text-[#91a9c1] mt-0.5">
                            READY
                          </span>
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${readiness.bgClass}`}
                              style={{ borderColor: readiness.borderColor }}
                            >
                              {readiness.badge}
                            </span>
                            <span className="text-xs font-semibold text-white">
                              {readiness.label}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#91a9c1] mt-1">
                            Based on {readiness.sessionsLogged} logged session(s) vs target mastery of{' '}
                            {readiness.targetMastery}% across {readiness.linkedSubjects.length} subject(s).
                          </p>
                        </div>
                      </div>

                      {/* Weakest Subject Quick Drill Action */}
                      {weakestSubject && onSelectSubjectToStudy && (
                        <button
                          onClick={() => onSelectSubjectToStudy(weakestSubject.id)}
                          className="py-1.5 px-3 rounded-xl bg-[#0a1c2d] hover:bg-[#122e49] border border-[#315578] text-[#8acaff] text-xs font-semibold tracking-wider transition flex items-center gap-1.5 self-start sm:self-auto shrink-0"
                          title="Drill subject with lowest mastery"
                        >
                          <Play className="w-3 h-3 fill-[#8acaff]" />
                          <span>Drill {weakestSubject.name.split(' ')[0]} ({weakestSubject.masteryLevel ?? 50}%)</span>
                        </button>
                      )}
                    </div>

                    {/* Readiness Visual Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="h-2 rounded-full bg-[#0a1a2b] border border-[#1b3853] overflow-hidden p-0.5">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${readiness.score}%`,
                            background: `linear-gradient(90deg, #4aa8ff, ${readiness.color})`,
                            boxShadow: `0 0 10px ${readiness.color}66`,
                          }}
                        />
                      </div>

                      {/* Detailed Metric Ratios */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px] font-mono text-[#91a9c1] pt-1">
                        <div>
                          <span className="text-[#5d7a96]">Mastery Ratio:</span>{' '}
                          <strong className="text-white">
                            {readiness.currentMasteryAvg}% / {readiness.targetMastery}%
                          </strong>{' '}
                          <span className="text-[#8acaff]">({readiness.masteryRatio}%)</span>
                        </div>
                        <div>
                          <span className="text-[#5d7a96]">Session Volume:</span>{' '}
                          <strong className="text-white">
                            {readiness.sessionsLogged} / {readiness.targetSessions}
                          </strong>{' '}
                          <span className="text-[#8acaff]">({readiness.sessionRatio}%)</span>
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <span className="text-[#5d7a96]">Logged Hours:</span>{' '}
                          <strong className="text-[#b8ff5c]">
                            {formatMinutes(readiness.totalStudyMinutes)}
                          </strong>
                        </div>
                      </div>
                    </div>

                    {/* Linked Subjects Badges */}
                    <div className="pt-2 border-t border-[#16334f]">
                      <div className="text-[10px] text-[#91a9c1] font-semibold uppercase tracking-wider mb-1.5">
                        Linked Subjects & Individual Mastery:
                      </div>
                      <div className="flex gap-1.5 flex-wrap">
                        {readiness.linkedSubjects.map((sub) => (
                          <div
                            key={sub.id}
                            className="px-2 py-1 rounded-lg bg-[#081b2e] border border-[#1b3853] text-[11px] flex items-center gap-1.5"
                          >
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: sub.color }}
                            />
                            <span className="text-white">{sub.name}</span>
                            <span
                              className={`font-mono font-bold text-[10px] ${
                                (sub.masteryLevel ?? 50) >= readiness.targetMastery
                                  ? 'text-[#b8ff5c]'
                                  : (sub.masteryLevel ?? 50) >= 65
                                  ? 'text-[#4aa8ff]'
                                  : 'text-[#ffb454]'
                              }`}
                            >
                              {sub.masteryLevel ?? 50}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}

            {/* Past exams if any */}
            {pastExams.map((e) => (
              <article
                key={e.id}
                className="bg-[#071522]/60 border border-[#162e44] rounded-3xl p-4 flex items-center justify-between gap-4 opacity-50"
              >
                <div>
                  <h4 className="text-sm font-semibold text-white">{e.name}</h4>
                  <p className="text-[10px] text-[#91a9c1] mt-0.5">
                    {e.date} · Exam date has passed · Final Readiness: {e.readiness.score}%
                  </p>
                </div>
                <button
                  onClick={() => onDeleteExam(e.id)}
                  className="p-1.5 rounded-lg text-[#91a9c1] hover:text-rose-400 hover:bg-[#12283e] transition"
                  aria-label="Delete countdown"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </article>
            ))}
          </>
        )}
      </div>
    </div>
  );
};
