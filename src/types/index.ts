export type TopicMastery = 'learning' | 'practicing' | 'mastered';

export interface Topic {
  id: string;
  t: string;
  done: boolean;
  mastery?: TopicMastery;
}

export type IntensityLevel = 'light' | 'moderate' | 'high' | 'extreme';

export interface Subject {
  id: string;
  name: string;
  goal: number; // weekly hours
  color: string;
  topics: Topic[];
  masteryLevel?: number; // 0 - 100 percentage
  intensity?: IntensityLevel;
  difficulty?: number; // 1 - 5 stars
  targetScore?: number; // target percentage e.g. 85
}

export interface Exam {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  subjectIds?: string[]; // Linked subject IDs (empty or omitted = all subjects)
  targetMastery?: number; // Target mastery percentage, default 85%
  targetSessions?: number; // Target study session count, default 20
}

export interface Session {
  id: string;
  ts: number; // timestamp ms
  subjectId: string | null;
  min: number;
  intensity?: IntensityLevel;
  notes?: string; // short notes or key takeaways
  manual?: boolean;
  legacy?: boolean;
}

export interface Quote {
  id: string;
  text: string;
  author: string;
}

export interface TaskItem {
  id: string;
  text: string;
  done: boolean;
  due: string; // YYYY-MM-DD
  prio: 'h' | 'm' | 'l';
  subjectId: string | null;
  created: number;
  doneAt?: number | null;
}

export interface Routine {
  id: string;
  name: string;
  time?: string; // HH:mm
  days: number[]; // 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun
}

export type AlarmType = 'chime' | 'bell' | 'digital' | 'rise' | 'custom' | 'none';

export interface AlarmConfig {
  type: AlarmType;
  vol: number; // 0 - 100
  len: number; // 0 (once), 10, 30, 60 seconds
  fileName?: string;
}

export interface AppState {
  v: number;
  title: string;
  tagline: string;
  activeSubject: string | null;
  cycle: number;
  legacySessions: number;
  subjects: Subject[];
  exams: Exam[];
  sessions: Session[];
  quotes: Quote[];
  quoteId: string | null;
  quoteMode: 'rotate' | 'random' | 'pinned';
  tasks: TaskItem[];
  routines: Routine[];
  routineLog: Record<string, string[]>; // YYYY-MM-DD -> routineId[]
  alarm: AlarmConfig;
  defaultIntensity?: IntensityLevel;
  timerState?: {
    duration: number;
    remaining: number;
    running: boolean;
    stopwatch: boolean;
    endAt: number;
    kind: 'focus' | 'break';
    name: string;
    intensity?: IntensityLevel;
  } | null;
}

export type TabKey = 'timer' | 'subjects' | 'tasks' | 'routine' | 'exams' | 'history' | 'quotes';

export const INTENSITY_CONFIG: Record<
  IntensityLevel,
  {
    label: string;
    badge: string;
    factor: number;
    description: string;
    color: string;
    borderColor: string;
    bgClass: string;
    icon: string;
  }
> = {
  light: {
    label: 'Light Review',
    badge: '⚡ LIGHT',
    factor: 1.0,
    description: 'Conceptual reading, formula skimming & definitions',
    color: '#8acaff',
    borderColor: '#25507a',
    bgClass: 'bg-sky-950/40 text-sky-300',
    icon: '⚡',
  },
  moderate: {
    label: 'Standard Practice',
    badge: '🎯 MODERATE',
    factor: 1.25,
    description: 'Textbook problems, standard code provisions & notes',
    color: '#b8ff5c',
    borderColor: '#3a782a',
    bgClass: 'bg-emerald-950/40 text-emerald-300',
    icon: '🎯',
  },
  high: {
    label: 'Deep Problem Drill',
    badge: '🔬 HIGH INTENSITY',
    factor: 1.5,
    description: 'Past board exam questions, derivations & speed solving',
    color: '#ffb454',
    borderColor: '#825619',
    bgClass: 'bg-amber-950/40 text-amber-300',
    icon: '🔬',
  },
  extreme: {
    label: 'Hardcore Crunch (Beast Mode)',
    badge: '🔥 EXTREME / BEAST',
    factor: 2.0,
    description: 'Closed-notes simulated exam pressure & complex edge cases',
    color: '#ff7a90',
    borderColor: '#822438',
    bgClass: 'bg-rose-950/40 text-rose-300',
    icon: '🔥',
  },
};

export function getMasteryStage(level: number): {
  stage: string;
  color: string;
  badge: string;
  desc: string;
} {
  if (level >= 85) {
    return {
      stage: 'Master Engineer',
      color: '#b8ff5c',
      badge: '🏆 MASTER (ELITE)',
      desc: 'Flawless formula recall & mastery of complex indeterminate structures',
    };
  }
  if (level >= 65) {
    return {
      stage: 'Board Ready',
      color: '#4aa8ff',
      badge: '🛡️ BOARD READY',
      desc: 'High speed, standard & past board exam problems conquered',
    };
  }
  if (level >= 40) {
    return {
      stage: 'Apprentice',
      color: '#ffb454',
      badge: '⚙️ APPRENTICE',
      desc: 'Comfortable with standard textbook drills and core code equations',
    };
  }
  return {
    stage: 'Novice',
    color: '#91a9c1',
    badge: '🌱 NOVICE',
    desc: 'Building foundation concepts and understanding basic variables',
  };
}

export interface MilestoneProgress {
  currentStage: string;
  currentLevel: number;
  nextMilestoneName: string;
  nextMilestoneTarget: number;
  prevMilestoneTarget: number;
  progressPercentTowardNext: number; // 0 - 100 within current bracket
  remainingToNext: number; // percentage points needed
  color: string;
  nextColor: string;
  badge: string;
  nextBadge: string;
}

export function getNextMasteryMilestone(level: number): MilestoneProgress {
  const clamped = Math.max(0, Math.min(100, Math.round(level)));
  if (clamped < 40) {
    const progress = Math.round((clamped / 40) * 100);
    return {
      currentStage: 'Novice',
      currentLevel: clamped,
      nextMilestoneName: 'Apprentice',
      nextMilestoneTarget: 40,
      prevMilestoneTarget: 0,
      progressPercentTowardNext: Math.min(100, progress),
      remainingToNext: 40 - clamped,
      color: '#91a9c1',
      nextColor: '#ffb454',
      badge: '🌱 NOVICE',
      nextBadge: '⚙️ APPRENTICE (40%)',
    };
  } else if (clamped < 65) {
    const progress = Math.round(((clamped - 40) / (65 - 40)) * 100);
    return {
      currentStage: 'Apprentice',
      currentLevel: clamped,
      nextMilestoneName: 'Board Ready',
      nextMilestoneTarget: 65,
      prevMilestoneTarget: 40,
      progressPercentTowardNext: Math.min(100, progress),
      remainingToNext: 65 - clamped,
      color: '#ffb454',
      nextColor: '#4aa8ff',
      badge: '⚙️ APPRENTICE',
      nextBadge: '🛡️ BOARD READY (65%)',
    };
  } else if (clamped < 85) {
    const progress = Math.round(((clamped - 65) / (85 - 65)) * 100);
    return {
      currentStage: 'Board Ready',
      currentLevel: clamped,
      nextMilestoneName: 'Master Engineer',
      nextMilestoneTarget: 85,
      prevMilestoneTarget: 65,
      progressPercentTowardNext: Math.min(100, progress),
      remainingToNext: 85 - clamped,
      color: '#4aa8ff',
      nextColor: '#b8ff5c',
      badge: '🛡️ BOARD READY',
      nextBadge: '🏆 MASTER (85%)',
    };
  } else {
    const progress = Math.round(((clamped - 85) / (100 - 85)) * 100);
    return {
      currentStage: 'Master Engineer',
      currentLevel: clamped,
      nextMilestoneName: 'Pinnacle Mastery',
      nextMilestoneTarget: 100,
      prevMilestoneTarget: 85,
      progressPercentTowardNext: Math.min(100, progress),
      remainingToNext: Math.max(0, 100 - clamped),
      color: '#b8ff5c',
      nextColor: '#b8ff5c',
      badge: '🏆 MASTER (ELITE)',
      nextBadge: '👑 100% PINNACLE',
    };
  }
}

export interface ExamReadinessResult {
  score: number; // 0 - 100
  label: string;
  badge: string;
  color: string;
  bgClass: string;
  borderColor: string;
  currentMasteryAvg: number;
  targetMastery: number;
  sessionsLogged: number;
  totalStudyMinutes: number;
  targetSessions: number;
  masteryRatio: number;
  sessionRatio: number;
  linkedSubjects: Subject[];
}

export function calculateExamReadiness(
  exam: Exam,
  allSubjects: Subject[],
  allSessions: Session[]
): ExamReadinessResult {
  const linked =
    exam.subjectIds && exam.subjectIds.length > 0
      ? allSubjects.filter((s) => exam.subjectIds!.includes(s.id))
      : allSubjects;

  const linkedIds = new Set(linked.map((s) => s.id));
  const targetMastery = exam.targetMastery ?? 85;
  const targetSessions = exam.targetSessions ?? Math.max(10, linked.length * 4);

  const currentMasteryAvg =
    linked.length > 0
      ? Math.round(
          linked.reduce((acc, s) => acc + (s.masteryLevel ?? 50), 0) / linked.length
        )
      : 50;

  const relevantSessions = allSessions.filter(
    (s) => s.subjectId && linkedIds.has(s.subjectId)
  );
  const sessionsLogged = relevantSessions.length;
  const totalStudyMinutes = relevantSessions.reduce((acc, s) => acc + s.min, 0);

  const sessionRatio = Math.min(1.5, sessionsLogged / targetSessions);
  const masteryRatio = Math.min(1.2, currentMasteryAvg / targetMastery);

  // Composite Readiness Score:
  // (Mastery Ratio * 0.6 + Session Ratio * 0.4) * 100
  const weightedScore = (masteryRatio * 0.6 + Math.min(1.0, sessionRatio) * 0.4) * 100;
  const score = Math.max(0, Math.min(100, Math.round(weightedScore)));

  if (score >= 85) {
    return {
      score,
      label: 'Board Ready / Peak Preparation',
      badge: '🏆 PEAK READINESS',
      color: '#b8ff5c',
      bgClass: 'bg-emerald-950/40 text-emerald-300',
      borderColor: '#3f8f4f',
      currentMasteryAvg,
      targetMastery,
      sessionsLogged,
      totalStudyMinutes,
      targetSessions,
      masteryRatio: Math.round(masteryRatio * 100),
      sessionRatio: Math.round(sessionRatio * 100),
      linkedSubjects: linked,
    };
  } else if (score >= 65) {
    return {
      score,
      label: 'On Track / Proficient',
      badge: '🛡️ ON TRACK',
      color: '#4aa8ff',
      bgClass: 'bg-sky-950/40 text-sky-300',
      borderColor: '#2b5a86',
      currentMasteryAvg,
      targetMastery,
      sessionsLogged,
      totalStudyMinutes,
      targetSessions,
      masteryRatio: Math.round(masteryRatio * 100),
      sessionRatio: Math.round(sessionRatio * 100),
      linkedSubjects: linked,
    };
  } else if (score >= 45) {
    return {
      score,
      label: 'Developing / More Sessions Needed',
      badge: '⚠️ DEVELOPING',
      color: '#ffb454',
      bgClass: 'bg-amber-950/40 text-amber-300',
      borderColor: '#825619',
      currentMasteryAvg,
      targetMastery,
      sessionsLogged,
      totalStudyMinutes,
      targetSessions,
      masteryRatio: Math.round(masteryRatio * 100),
      sessionRatio: Math.round(sessionRatio * 100),
      linkedSubjects: linked,
    };
  } else {
    return {
      score,
      label: 'Critical / Intensive Drills Required',
      badge: '🚨 CRITICAL',
      color: '#ff7a90',
      bgClass: 'bg-rose-950/40 text-rose-300',
      borderColor: '#822438',
      currentMasteryAvg,
      targetMastery,
      sessionsLogged,
      totalStudyMinutes,
      targetSessions,
      masteryRatio: Math.round(masteryRatio * 100),
      sessionRatio: Math.round(sessionRatio * 100),
      linkedSubjects: linked,
    };
  }
}
