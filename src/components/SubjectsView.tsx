import React, { useState } from 'react';
import {
  Subject,
  Session,
  IntensityLevel,
  TopicMastery,
  INTENSITY_CONFIG,
  getMasteryStage,
} from '../types';
import {
  Plus,
  RotateCcw,
  Edit2,
  Trash2,
  BookOpen,
  Play,
  Flame,
  Award,
  Zap,
  Star,
  CheckCircle2,
  Sliders,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { PALETTE, formatMinutes, mondayOf } from '../utils/storage';

interface SubjectsViewProps {
  subjects: Subject[];
  sessions: Session[];
  activeSubjectId: string | null;
  onSelectSubjectToStudy: (id: string, intensity?: IntensityLevel) => void;
  onAddSubject: () => void;
  onUpdateSubject: (subject: Subject) => void;
  onDeleteSubject: (id: string) => void;
  onResetDefaultSubjects: () => void;
  onAddTopic: (subjectId: string, topicText: string) => void;
  onToggleTopic: (subjectId: string, topicId: string) => void;
  onDeleteTopic: (subjectId: string, topicId: string) => void;
}

export const SubjectsView: React.FC<SubjectsViewProps> = ({
  subjects,
  sessions,
  activeSubjectId,
  onSelectSubjectToStudy,
  onAddSubject,
  onUpdateSubject,
  onDeleteSubject,
  onResetDefaultSubjects,
  onAddTopic,
  onToggleTopic,
  onDeleteTopic,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedMasteryId, setExpandedMasteryId] = useState<string | null>(null);
  const [newTopicInputs, setNewTopicInputs] = useState<Record<string, string>>({});

  const mon = mondayOf();
  const weekStartTs = mon.getTime();

  // Aggregate Board Readiness Index calculation
  const totalSubjectsCount = subjects.length;
  const avgMastery =
    totalSubjectsCount > 0
      ? Math.round(
          subjects.reduce((acc, s) => acc + (s.masteryLevel ?? 50), 0) / totalSubjectsCount
        )
      : 0;

  const totalTopicsCount = subjects.reduce((acc, s) => acc + s.topics.length, 0);
  const masteredTopicsCount = subjects.reduce(
    (acc, s) =>
      acc + s.topics.filter((t) => t.mastery === 'mastered' || t.done).length,
    0
  );

  const overallStage = getMasteryStage(avgMastery);

  const handleTopicSubmit = (subjectId: string, e: React.FormEvent) => {
    e.preventDefault();
    const text = (newTopicInputs[subjectId] || '').trim();
    if (!text) return;
    onAddTopic(subjectId, text);
    setNewTopicInputs((prev) => ({ ...prev, [subjectId]: '' }));
  };

  // Cycle topic mastery stage: learning -> practicing -> mastered -> learning
  const handleCycleTopicMastery = (subject: Subject, topicId: string) => {
    const topic = subject.topics.find((t) => t.id === topicId);
    if (!topic) return;

    let nextMastery: TopicMastery = 'learning';
    let isDone = false;
    if (!topic.mastery || topic.mastery === 'learning') {
      nextMastery = 'practicing';
      isDone = false;
    } else if (topic.mastery === 'practicing') {
      nextMastery = 'mastered';
      isDone = true;
    } else {
      nextMastery = 'learning';
      isDone = false;
    }

    const updatedTopics = subject.topics.map((t) =>
      t.id === topicId ? { ...t, mastery: nextMastery, done: isDone } : t
    );

    // Also nudge subject mastery level based on topic completion
    const doneCount = updatedTopics.filter((t) => t.mastery === 'mastered' || t.done).length;
    const computedTopicMasteryPct = Math.round((doneCount / updatedTopics.length) * 100);

    onUpdateSubject({
      ...subject,
      topics: updatedTopics,
      // If subject mastery hasn't been manually fine-tuned much, keep it proportional
      masteryLevel: Math.max(subject.masteryLevel ?? 50, computedTopicMasteryPct),
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-[#18344f]/70">
        <div>
          <div className="text-[10px] tracking-[0.2em] text-[#8acaff] uppercase font-bold">
            Civil Engineering Board Prep & Mastery Matrix
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Subject Tracker & Intensity Lab
          </h2>
          <p className="text-xs text-[#91a9c1] mt-1 max-w-2xl leading-relaxed">
            Enhance and calibrate how intense your study sessions are, customize mastery percentage
            from Novice to Master Engineer, and track formula-level proficiency topic by topic.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            onClick={onAddSubject}
            className="flex items-center gap-1.5 py-2 px-3.5 rounded-xl bg-[#4aa8ff] hover:bg-[#82c5ff] text-[#041322] font-bold text-xs tracking-wider transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>ADD SUBJECT</span>
          </button>
          <button
            onClick={onResetDefaultSubjects}
            className="flex items-center gap-1.5 py-2 px-3.5 rounded-xl bg-[#0a1c2d] hover:bg-[#122e49] border border-[#315578] text-[#8acaff] font-bold text-xs tracking-wider transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>RESTORE CE SUBJECTS</span>
          </button>
        </div>
      </div>

      {/* Aggregate Board Readiness & Mastery Dashboard */}
      {totalSubjectsCount > 0 && (
        <section className="bg-gradient-to-br from-[#0d263e]/95 via-[#081b2d]/95 to-[#061421]/98 border border-[#2b547b] rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-[#4aa8ff]/5 pointer-events-none blur-3xl" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-[#b8ff5c]" />
                <span className="text-xs font-bold text-[#8acaff] tracking-wider uppercase">
                  Civil Engineering Board Exam Readiness Index
                </span>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl sm:text-4xl font-mono font-light text-white tracking-tight">
                  {avgMastery}%
                </span>
                <span
                  className="px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase border"
                  style={{
                    backgroundColor: `${overallStage.color}15`,
                    borderColor: `${overallStage.color}50`,
                    color: overallStage.color,
                  }}
                >
                  {overallStage.badge}
                </span>
              </div>
              <p className="text-xs text-[#91a9c1] max-w-xl leading-relaxed">
                {overallStage.desc}. Mastered {masteredTopicsCount} of {totalTopicsCount} key
                formula topics across {totalSubjectsCount} subjects.
              </p>
            </div>

            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 shrink-0">
              <div className="p-3 rounded-2xl bg-[#061523] border border-[#1b3853] text-center min-w-[100px]">
                <div className="text-lg font-mono font-bold text-white">
                  {subjects.filter((s) => (s.masteryLevel ?? 50) >= 85).length}
                </div>
                <div className="text-[10px] text-[#b8ff5c] uppercase font-bold tracking-wider mt-0.5">
                  🏆 Elite Master
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-[#061523] border border-[#1b3853] text-center min-w-[100px]">
                <div className="text-lg font-mono font-bold text-white">
                  {
                    subjects.filter(
                      (s) => (s.masteryLevel ?? 50) >= 65 && (s.masteryLevel ?? 50) < 85
                    ).length
                  }
                </div>
                <div className="text-[10px] text-[#4aa8ff] uppercase font-bold tracking-wider mt-0.5">
                  🛡️ Board Ready
                </div>
              </div>
              <div className="col-span-2 sm:col-span-1 p-3 rounded-2xl bg-[#061523] border border-[#1b3853] text-center min-w-[100px]">
                <div className="text-lg font-mono font-bold text-white">
                  {subjects.filter((s) => (s.intensity || 'moderate') === 'extreme').length}
                </div>
                <div className="text-[10px] text-[#ff7a90] uppercase font-bold tracking-wider mt-0.5 flex items-center justify-center gap-1">
                  <Flame className="w-3 h-3 text-[#ff7a90]" />
                  <span>Beast Mode</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Grid of Subject Cards */}
      {subjects.length === 0 ? (
        <div className="p-10 rounded-2xl border border-dashed border-[#244463] text-center text-sm text-[#91a9c1]">
          No subjects created yet. Tap "Add Subject" or "Restore CE Subjects" to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {subjects.map((s) => {
            const isCurrent = activeSubjectId === s.id;
            const isEditing = editingId === s.id;
            const isMasteryExpanded = expandedMasteryId === s.id;

            const masteryLevel = s.masteryLevel ?? 50;
            const currentIntensity = s.intensity || 'moderate';
            const intensityInfo = INTENSITY_CONFIG[currentIntensity];
            const masteryInfo = getMasteryStage(masteryLevel);

            // Stats
            const weekMinutes = sessions
              .filter((x) => x.subjectId === s.id && x.ts >= weekStartTs)
              .reduce((a, b) => a + b.min, 0);
            const totalMinutes = sessions
              .filter((x) => x.subjectId === s.id)
              .reduce((a, b) => a + b.min, 0);

            const goalMinutes = s.goal * 60;
            const weekGoalPct =
              goalMinutes > 0 ? Math.min(100, (weekMinutes / goalMinutes) * 100) : 0;

            const doneTopicsCount = s.topics.filter(
              (t) => t.mastery === 'mastered' || t.done
            ).length;
            const totalTopics = s.topics.length;
            const topicsPct = totalTopics > 0 ? (doneTopicsCount / totalTopics) * 100 : 0;

            return (
              <article
                key={s.id}
                className={`bg-gradient-to-br from-[#0d2033]/95 to-[#071522]/98 border rounded-3xl p-5 shadow-xl flex flex-col justify-between transition-all relative ${
                  isCurrent
                    ? 'border-[#4aa8ff] ring-1 ring-[#4aa8ff]/50 shadow-2xl'
                    : 'border-[#1b3853] hover:border-[#285073]'
                }`}
                style={{ borderTopWidth: '4px', borderTopColor: s.color }}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: s.color }}
                        />
                        <h3 className="text-sm font-bold text-white truncate">{s.name}</h3>
                      </div>
                      <div className="text-[10px] text-[#91a9c1] mt-1 flex items-center gap-2">
                        <span>{formatMinutes(totalMinutes)} logged all-time</span>
                        <span>·</span>
                        <span className="font-semibold" style={{ color: s.color }}>
                          Goal {s.goal}h/wk
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setEditingId(isEditing ? null : s.id)}
                      className="p-1.5 rounded-lg text-[#91a9c1] hover:text-white hover:bg-[#122b42] transition"
                      aria-label="Edit subject"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Inline Subject Settings Edit Form */}
                  {isEditing && (
                    <div className="my-3 p-3.5 rounded-2xl bg-[#061523] border border-[#1f4062] space-y-3 animate-in fade-in">
                      <div>
                        <label className="block text-[10px] text-[#91a9c1] font-medium mb-1">
                          Subject Name
                        </label>
                        <input
                          type="text"
                          value={s.name}
                          onChange={(e) => onUpdateSubject({ ...s, name: e.target.value })}
                          className="w-full bg-[#0a1a2b] border border-[#244463] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#4aa8ff]"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-[#91a9c1] font-medium mb-1">
                            Weekly Goal (hours)
                          </label>
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            max="80"
                            value={s.goal}
                            onChange={(e) =>
                              onUpdateSubject({
                                ...s,
                                goal: Math.max(0, parseFloat(e.target.value) || 0),
                              })
                            }
                            className="w-full bg-[#0a1a2b] border border-[#244463] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#4aa8ff]"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-[#91a9c1] font-medium mb-1">
                            Target Board Score %
                          </label>
                          <input
                            type="number"
                            min="50"
                            max="100"
                            value={s.targetScore ?? 85}
                            onChange={(e) =>
                              onUpdateSubject({
                                ...s,
                                targetScore: Math.max(50, Math.min(100, parseInt(e.target.value) || 85)),
                              })
                            }
                            className="w-full bg-[#0a1a2b] border border-[#244463] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#4aa8ff]"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] text-[#91a9c1] font-medium mb-1">
                          Color Theme
                        </label>
                        <div className="flex gap-2 flex-wrap">
                          {PALETTE.map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => onUpdateSubject({ ...s, color: c })}
                              className={`w-6 h-6 rounded-full transition-transform ${
                                s.color === c ? 'scale-125 ring-2 ring-white' : 'hover:scale-110'
                              }`}
                              style={{ backgroundColor: c }}
                              aria-label={`Select color ${c}`}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="pt-2 flex justify-end">
                        <button
                          type="button"
                          onClick={() => onDeleteSubject(s.id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-rose-900/60 text-rose-400 hover:bg-rose-950/40 text-xs font-semibold transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>DELETE SUBJECT</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Intensity & Mastery Badges Bar */}
                  <div className="mt-3.5 p-3 rounded-2xl bg-[#061523] border border-[#193550] space-y-2.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-[10px] font-bold tracking-wider text-[#91a9c1] uppercase flex items-center gap-1">
                        <Sliders className="w-3 h-3 text-[#4aa8ff]" />
                        <span>Mastery & Intensity</span>
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          setExpandedMasteryId(isMasteryExpanded ? null : s.id)
                        }
                        className="text-[10px] font-semibold text-[#8acaff] hover:underline flex items-center gap-0.5"
                      >
                        <span>{isMasteryExpanded ? 'Close Calibrator' : 'Calibrate'}</span>
                        {isMasteryExpanded ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )}
                      </button>
                    </div>

                    {/* Quick Badges display */}
                    <div className="flex items-center justify-between gap-2 pt-1">
                      {/* Mastery Badge */}
                      <div className="flex items-center gap-1.5">
                        <span
                          className="text-xs font-mono font-bold"
                          style={{ color: masteryInfo.color }}
                        >
                          {masteryLevel}%
                        </span>
                        <span
                          className="px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider border truncate max-w-[130px]"
                          style={{
                            backgroundColor: `${masteryInfo.color}15`,
                            borderColor: `${masteryInfo.color}40`,
                            color: masteryInfo.color,
                          }}
                        >
                          {masteryInfo.stage}
                        </span>
                      </div>

                      {/* Intensity Badge */}
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider border flex items-center gap-1 ${intensityInfo.bgClass}`}
                        style={{ borderColor: intensityInfo.borderColor }}
                        title={intensityInfo.description}
                      >
                        <span>{intensityInfo.icon}</span>
                        <span>{intensityInfo.badge}</span>
                      </span>
                    </div>

                    {/* Expanded Calibrator Panel */}
                    {isMasteryExpanded && (
                      <div className="pt-3 border-t border-[#183652] space-y-3 animate-in fade-in">
                        {/* 1. Mastery Slider & Quick Milestones */}
                        <div>
                          <div className="flex items-center justify-between text-[10px] font-medium text-[#91a9c1] mb-1">
                            <span>Set Mastery Level</span>
                            <span className="font-mono font-bold text-white">
                              {masteryLevel}% ({masteryInfo.stage})
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={masteryLevel}
                            onChange={(e) =>
                              onUpdateSubject({
                                ...s,
                                masteryLevel: parseInt(e.target.value) || 0,
                              })
                            }
                            className="w-full accent-[#4aa8ff] cursor-pointer"
                          />
                          {/* Quick Milestone Buttons */}
                          <div className="grid grid-cols-4 gap-1 mt-1.5">
                            {[
                              { label: 'Novice', val: 25 },
                              { label: 'Apprentice', val: 50 },
                              { label: 'Ready', val: 75 },
                              { label: 'Master', val: 95 },
                            ].map((m) => (
                              <button
                                key={m.val}
                                type="button"
                                onClick={() =>
                                  onUpdateSubject({
                                    ...s,
                                    masteryLevel: m.val,
                                  })
                                }
                                className={`py-1 rounded-lg text-[9px] font-semibold border transition ${
                                  masteryLevel === m.val
                                    ? 'bg-[#123452] border-[#4aa8ff] text-[#8acaff]'
                                    : 'bg-[#0a1a2b] border-[#244463] text-[#91a9c1] hover:text-white'
                                }`}
                              >
                                {m.label} ({m.val}%)
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* 2. Intensity Tier Selector */}
                        <div>
                          <div className="text-[10px] font-medium text-[#91a9c1] mb-1">
                            Study Intensity & Rigor
                          </div>
                          <div className="grid grid-cols-2 gap-1.5">
                            {(['light', 'moderate', 'high', 'extreme'] as IntensityLevel[]).map(
                              (lvl) => {
                                const cfg = INTENSITY_CONFIG[lvl];
                                const isSelected = currentIntensity === lvl;
                                return (
                                  <button
                                    key={lvl}
                                    type="button"
                                    onClick={() =>
                                      onUpdateSubject({
                                        ...s,
                                        intensity: lvl,
                                      })
                                    }
                                    className={`p-1.5 rounded-xl border text-left transition select-none flex items-center gap-1.5 ${
                                      isSelected
                                        ? 'bg-[#0e2c47] border-[#4aa8ff] ring-1 ring-[#4aa8ff]/50'
                                        : 'bg-[#071725] border-[#1b3853] hover:border-[#2b547b]'
                                    }`}
                                  >
                                    <span className="text-xs">{cfg.icon}</span>
                                    <div className="min-w-0 flex-1">
                                      <div
                                        className="text-[10px] font-bold truncate leading-tight"
                                        style={{ color: cfg.color }}
                                      >
                                        {cfg.label}
                                      </div>
                                      <div className="text-[8px] text-[#91a9c1]">
                                        {cfg.factor}x rigor
                                      </div>
                                    </div>
                                  </button>
                                );
                              }
                            )}
                          </div>
                          <p className="text-[9px] text-[#91a9c1] mt-1.5 italic">
                            {intensityInfo.description}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Goal Progress Bar */}
                  <div className="mt-3.5 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-medium">
                      <span className="text-[#91a9c1]">
                        This week: {formatMinutes(weekMinutes)}
                      </span>
                      <span className="text-[#8acaff]">Goal: {s.goal}h</span>
                    </div>
                    <div className="h-2 rounded-full bg-[#12293f] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${weekGoalPct}%`,
                          backgroundColor: s.color,
                        }}
                      />
                    </div>
                  </div>

                  {/* Topics Mastery Section */}
                  <div className="mt-4 pt-3 border-t border-[#17334d] space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[10px] text-[#91a9c1] tracking-wider uppercase font-semibold">
                        FORMULA TOPICS
                      </span>
                      <span className="text-white font-mono font-medium text-xs">
                        {doneTopicsCount}/{totalTopics} mastered
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[#12293f] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300 opacity-70"
                        style={{
                          width: `${topicsPct}%`,
                          backgroundColor: s.color,
                        }}
                      />
                    </div>

                    {/* Topics Checklist with Mastery Tagging */}
                    <ul className="space-y-1.5 mt-2.5 max-h-48 overflow-y-auto pr-1">
                      {s.topics.map((t) => {
                        const mStatus: TopicMastery = t.mastery || (t.done ? 'mastered' : 'learning');
                        const mBadge =
                          mStatus === 'mastered'
                            ? { label: '🏆 Mastered', color: '#b8ff5c', bg: 'bg-[#16361f]' }
                            : mStatus === 'practicing'
                            ? { label: '⚙️ Practicing', color: '#4aa8ff', bg: 'bg-[#0f2d48]' }
                            : { label: '📖 Learning', color: '#ffb454', bg: 'bg-[#2b2210]' };

                        return (
                          <li
                            key={t.id}
                            className="flex items-center justify-between gap-2 p-1.5 rounded-xl hover:bg-[#0c2236] text-xs transition group"
                          >
                            <label className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={t.done}
                                onChange={() => onToggleTopic(s.id, t.id)}
                                className="w-4 h-4 rounded accent-[#b8ff5c] shrink-0 cursor-pointer"
                              />
                              <span
                                className={`truncate leading-tight ${
                                  t.done ? 'line-through text-[#91a9c1]' : 'text-[#eaf4ff]'
                                }`}
                              >
                                {t.t}
                              </span>
                            </label>

                            {/* Clickable Topic Mastery Status Pill */}
                            <button
                              type="button"
                              onClick={() => handleCycleTopicMastery(s, t.id)}
                              title="Click to cycle topic mastery: Learning → Practicing → Mastered"
                              className={`px-2 py-0.5 rounded-md text-[9px] font-semibold border transition shrink-0 ${mBadge.bg}`}
                              style={{
                                color: mBadge.color,
                                borderColor: `${mBadge.color}40`,
                              }}
                            >
                              {mBadge.label}
                            </button>

                            <button
                              onClick={() => onDeleteTopic(s.id, t.id)}
                              className="text-[#91a9c1] hover:text-rose-400 opacity-0 group-hover:opacity-100 p-0.5 transition shrink-0"
                              aria-label="Delete topic"
                            >
                              ✕
                            </button>
                          </li>
                        );
                      })}
                    </ul>

                    {/* Add Topic Input Line */}
                    <form onSubmit={(e) => handleTopicSubmit(s.id, e)} className="flex gap-2 mt-2 pt-1">
                      <input
                        type="text"
                        placeholder="Add a topic or formula..."
                        value={newTopicInputs[s.id] || ''}
                        onChange={(e) =>
                          setNewTopicInputs((prev) => ({ ...prev, [s.id]: e.target.value }))
                        }
                        className="flex-1 bg-[#061321] border border-[#244463] rounded-xl px-2.5 py-1.5 text-xs text-white placeholder-[#5a7693] focus:outline-none focus:border-[#4aa8ff]"
                      />
                      <button
                        type="submit"
                        className="px-3 py-1.5 rounded-xl bg-[#0a1c2d] hover:bg-[#122e49] border border-[#315578] text-[#8acaff] text-xs font-semibold tracking-wider transition"
                      >
                        ADD
                      </button>
                    </form>
                  </div>
                </div>

                {/* Card Action: Study This with configured Intensity */}
                <div className="mt-5 pt-3 border-t border-[#17334d]">
                  <button
                    onClick={() => onSelectSubjectToStudy(s.id, s.intensity || 'moderate')}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#4aa8ff] hover:bg-[#82c5ff] text-[#041322] font-bold text-xs tracking-wider transition flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Play className="w-3.5 h-3.5 fill-[#041322]" />
                    <span>
                      STUDY AT {intensityInfo.badge.replace(/^[^\w]+/, '')}
                    </span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
