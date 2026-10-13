import React, { useState } from 'react';
import { Subject, IntensityLevel, INTENSITY_CONFIG } from '../types';
import { Award, BookOpen, Check, Clock, Flame, Sparkles, X, FileText } from 'lucide-react';
import { formatMinutes } from '../utils/storage';

interface SessionCompleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  subject: Subject | null;
  durationMinutes: number;
  intensity: IntensityLevel;
  masteryBonus: number;
  onSaveNotes: (notes: string) => void;
}

export const SessionCompleteModal: React.FC<SessionCompleteModalProps> = ({
  isOpen,
  onClose,
  subject,
  durationMinutes,
  intensity,
  masteryBonus,
  onSaveNotes,
}) => {
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const intensityCfg = INTENSITY_CONFIG[intensity];

  const quickPrompts = [
    '💡 Key formula mastered',
    '⚠️ Watch sign conventions',
    '⚡ Timed drill completed',
    '📐 Derivation verified',
    '🔍 Code provision reviewed',
  ];

  const handleAddPrompt = (prompt: string) => {
    setNotes((prev) => (prev ? `${prev}\n• ${prompt}` : `• ${prompt}`));
  };

  const handleSave = () => {
    onSaveNotes(notes.trim());
    setNotes('');
    onClose();
  };

  const handleSkip = () => {
    setNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg rounded-3xl bg-[#0a1a2b] border border-[#244463] p-5 sm:p-6 shadow-2xl text-[#eaf4ff] space-y-4 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow */}
        <div
          className="absolute -top-16 -right-16 w-48 h-48 rounded-full opacity-20 pointer-events-none blur-3xl"
          style={{ background: intensityCfg.color }}
        />

        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-[#1b3853]">
          <div>
            <div className="text-[10px] tracking-[0.2em] text-[#b8ff5c] font-bold uppercase flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#b8ff5c]" />
              <span>Session Accomplished</span>
            </div>
            <h3 className="text-lg font-bold text-white mt-0.5">
              Great Work, Engineer!
            </h3>
          </div>
          <button
            onClick={handleSkip}
            className="p-1 rounded-lg text-[#91a9c1] hover:text-white hover:bg-[#12283e] transition"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Session Snapshot Stats Card */}
        <div className="p-3.5 rounded-2xl bg-[#061523] border border-[#1d3d5d] grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
          <div>
            <div className="text-[10px] text-[#91a9c1] uppercase font-semibold">Subject</div>
            <div className="font-bold text-white truncate mt-0.5 flex items-center gap-1.5">
              {subject ? (
                <>
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: subject.color }}
                  />
                  <span>{subject.name}</span>
                </>
              ) : (
                <span className="text-[#91a9c1]">No subject</span>
              )}
            </div>
          </div>

          <div>
            <div className="text-[10px] text-[#91a9c1] uppercase font-semibold">Time Logged</div>
            <div className="font-bold font-mono text-[#8acaff] mt-0.5">
              {formatMinutes(durationMinutes)}
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <div className="text-[10px] text-[#91a9c1] uppercase font-semibold">Rigor & Gain</div>
            <div className="font-bold text-white mt-0.5 flex items-center gap-1">
              <span>{intensityCfg.icon}</span>
              <span style={{ color: intensityCfg.color }}>+{masteryBonus}% Mastery</span>
            </div>
          </div>
        </div>

        {/* Note / Key Takeaways Input */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-white flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#4aa8ff]" />
              <span>Key Takeaways & Formulas Learned</span>
            </span>
            <span className="text-[10px] text-[#91a9c1] font-normal">Optional</span>
          </label>

          <textarea
            rows={3}
            maxLength={350}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Mastered moment distribution method carry-over factor, remembered negative sign on compressive stress..."
            className="w-full bg-[#061321] border border-[#244463] rounded-2xl p-3 text-xs sm:text-sm text-white placeholder-[#5a7693] focus:outline-none focus:border-[#4aa8ff] resize-none leading-relaxed"
          />

          {/* Quick Prompts Chips */}
          <div className="flex gap-1.5 flex-wrap pt-0.5">
            {quickPrompts.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => handleAddPrompt(p)}
                className="px-2 py-0.5 rounded-lg bg-[#071725] border border-[#1b3853] hover:border-[#315578] text-[10px] text-[#91a9c1] hover:text-white transition"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#1b3853]">
          <button
            type="button"
            onClick={handleSkip}
            className="px-4 py-2 rounded-xl text-xs font-semibold tracking-wider text-[#91a9c1] bg-[#071725] border border-[#1b3853] hover:text-white hover:border-[#315578] transition"
          >
            SKIP
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl text-xs font-bold tracking-wider text-[#041322] bg-[#4aa8ff] hover:bg-[#82c5ff] transition flex items-center gap-1.5 shadow-sm"
          >
            <Check className="w-3.5 h-3.5 stroke-[3]" />
            <span>SAVE TAKEAWAY</span>
          </button>
        </div>
      </div>
    </div>
  );
};
