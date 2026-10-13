import React from 'react';
import { Subject, getNextMasteryMilestone } from '../types';
import { Award, Zap, ChevronRight, Sparkles, TrendingUp, ShieldCheck } from 'lucide-react';

interface MasteryMilestoneBarProps {
  activeSubject: Subject | null;
  allSubjects: Subject[];
  onNavigateToSubjects?: () => void;
}

export const MasteryMilestoneBar: React.FC<MasteryMilestoneBarProps> = ({
  activeSubject,
  allSubjects,
  onNavigateToSubjects,
}) => {
  // If an active subject is selected, show its specific progress
  if (activeSubject) {
    const level = activeSubject.masteryLevel ?? 50;
    const milestone = getNextMasteryMilestone(level);

    return (
      <div className="mt-3 p-3 sm:p-3.5 rounded-2xl bg-[#061423] border border-[#1d3c5c] shadow-lg relative overflow-hidden transition-all">
        {/* Subtle background glow */}
        <div
          className="absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-10 pointer-events-none blur-2xl transition-colors"
          style={{ background: milestone.nextColor }}
        />

        {/* Top Header Row */}
        <div className="flex items-center justify-between gap-2 mb-2 flex-wrap text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
              style={{ backgroundColor: activeSubject.color }}
            />
            <span className="font-bold text-white truncate text-xs sm:text-sm">
              {activeSubject.name}
            </span>
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border shrink-0"
              style={{
                backgroundColor: `${milestone.color}18`,
                borderColor: `${milestone.color}50`,
                color: milestone.color,
              }}
            >
              {milestone.badge} · {level}%
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-mono shrink-0 ml-auto">
            <span className="text-[#91a9c1]">Next:</span>
            <span className="font-bold" style={{ color: milestone.nextColor }}>
              {milestone.nextMilestoneName} ({milestone.nextMilestoneTarget}%)
            </span>
            {milestone.remainingToNext > 0 ? (
              <span className="px-1.5 py-0.2 rounded-md bg-[#0a1c2d] border border-[#244463] text-[#ffb454] text-[10px] font-bold">
                +{milestone.remainingToNext}% needed
              </span>
            ) : (
              <span className="px-1.5 py-0.2 rounded-md bg-[#16361f] border border-[#3f8f4f] text-[#b8ff5c] text-[10px] font-bold">
                MAX PINNACLE
              </span>
            )}
          </div>
        </div>

        {/* The Visual Progress Track toward next milestone */}
        <div className="relative my-2">
          {/* Main Track */}
          <div className="h-2.5 rounded-full bg-[#0a1a2b] border border-[#1b3853] overflow-hidden p-0.5 relative">
            <div
              className="h-full rounded-full transition-all duration-500 relative"
              style={{
                width: `${milestone.progressPercentTowardNext}%`,
                background: `linear-gradient(90deg, ${milestone.color}, ${milestone.nextColor})`,
                boxShadow: `0 0 10px ${milestone.nextColor}66`,
              }}
            >
              {/* Shimmer light bar */}
              <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
            </div>
          </div>

          {/* Milestone markers along 100% scale */}
          <div className="flex justify-between items-center text-[9px] font-mono text-[#5d7a96] mt-1.5 px-0.5 select-none">
            <span className="flex items-center gap-0.5">
              <span>🌱 0%</span>
            </span>
            <span
              className={`flex items-center gap-0.5 ${
                level >= 40 ? 'text-[#ffb454] font-bold' : ''
              }`}
            >
              <span>⚙️ 40%</span>
            </span>
            <span
              className={`flex items-center gap-0.5 ${
                level >= 65 ? 'text-[#4aa8ff] font-bold' : ''
              }`}
            >
              <span>🛡️ 65%</span>
            </span>
            <span
              className={`flex items-center gap-0.5 ${
                level >= 85 ? 'text-[#b8ff5c] font-bold' : ''
              }`}
            >
              <span>🏆 85%</span>
            </span>
            <span
              className={`flex items-center gap-0.5 ${
                level >= 100 ? 'text-[#b8ff5c] font-bold' : ''
              }`}
            >
              <span>👑 100%</span>
            </span>
          </div>
        </div>

        {/* Milestone Subtext & Progress readout */}
        <div className="flex items-center justify-between gap-2 mt-1 text-[10px] text-[#91a9c1] flex-wrap">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-[#b8ff5c]" />
            <span>
              <strong>{milestone.progressPercentTowardNext}%</strong> progress toward{' '}
              <strong className="text-white">{milestone.nextMilestoneName}</strong> rank
            </span>
          </div>
          <span className="text-[9px] text-[#5d7a96] italic">
            Complete focus sessions to unlock rank up (+1% to +2% per session)
          </span>
        </div>
      </div>
    );
  }

  // Fallback when NO subject is chosen: Overall Board Readiness Progress
  const total = allSubjects.length;
  const avgLevel =
    total > 0
      ? Math.round(
          allSubjects.reduce((acc, s) => acc + (s.masteryLevel ?? 50), 0) / total
        )
      : 50;
  const milestone = getNextMasteryMilestone(avgLevel);

  return (
    <div className="mt-3 p-3 sm:p-3.5 rounded-2xl bg-[#061423] border border-[#1d3c5c] shadow-lg relative overflow-hidden transition-all">
      <div className="flex items-center justify-between gap-2 mb-2 flex-wrap text-xs">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-[#4aa8ff]" />
          <span className="font-bold text-white text-xs sm:text-sm">
            Overall CE Board Exam Readiness
          </span>
          <span
            className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border"
            style={{
              backgroundColor: `${milestone.color}18`,
              borderColor: `${milestone.color}50`,
              color: milestone.color,
            }}
          >
            {milestone.badge} · {avgLevel}%
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-mono shrink-0 ml-auto">
          <span className="text-[#91a9c1]">Cohort Next:</span>
          <span className="font-bold" style={{ color: milestone.nextColor }}>
            {milestone.nextMilestoneName} ({milestone.nextMilestoneTarget}%)
          </span>
        </div>
      </div>

      {/* Progress track */}
      <div className="relative my-2">
        <div className="h-2 rounded-full bg-[#0a1a2b] border border-[#1b3853] overflow-hidden p-0.5">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${milestone.progressPercentTowardNext}%`,
              background: `linear-gradient(90deg, ${milestone.color}, ${milestone.nextColor})`,
              boxShadow: `0 0 8px ${milestone.nextColor}66`,
            }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 text-[10px] text-[#91a9c1]">
        <span>
          <strong>{milestone.progressPercentTowardNext}%</strong> toward {milestone.nextMilestoneName} across all {total} CE subjects.
        </span>
        {onNavigateToSubjects && (
          <button
            onClick={onNavigateToSubjects}
            className="text-[#8acaff] hover:underline font-semibold"
          >
            Select a subject to target →
          </button>
        )}
      </div>
    </div>
  );
};
