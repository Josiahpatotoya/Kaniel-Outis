import { AppState, Subject } from '../types';

export const STORAGE_KEY = 'civiTimerV2';
export const OLD_KEY = 'civiTimerStats';

export const PALETTE = ['#4aa8ff', '#b8ff5c', '#ffb454', '#ff7a90', '#b48cff', '#4fe3c1', '#ffd84a'];
export const NONE_COLOR = '#5d7a96';

export const DEFAULT_CE_SUBJECTS: [string, number, string[]][] = [
  ['Mathematics & Engineering Sciences', 4, ['Algebra', 'Trigonometry', 'Analytic Geometry', 'Differential Calculus', 'Integral Calculus', 'Differential Equations', 'Engineering Mechanics']],
  ['Surveying', 4, ['Leveling', 'Traverse & Area Computation', 'Horizontal & Vertical Curves', 'Stadia & Tacheometry', 'Photogrammetry']],
  ['Transportation Engineering', 3, ['Highway Geometric Design', 'Pavement Design', 'Traffic Engineering', 'Railway, Airport & Harbor']],
  ['Hydraulics', 4, ['Fluid Properties', 'Hydrostatics', 'Fluid Flow & Energy Equation', 'Pipe Flow & Networks', 'Open Channel Flow', 'Hydrology']],
  ['Geotechnical Engineering', 3, ['Soil Properties & Classification', 'Stresses & Seepage', 'Consolidation & Settlement', 'Shear Strength', 'Foundations & Retaining Walls']],
  ['PSAD (Structural Analysis & Design)', 6, ['Determinate Structures', 'Indeterminate Structures', 'Reinforced Concrete Design', 'Steel Design', 'Timber Design', 'Prestressed Concrete']],
  ['Construction & Engineering Economics', 3, ['Construction Methods & Safety', 'CPM / Project Scheduling', 'Quantity Estimates', 'Engineering Economy', 'Laws, Codes & Ethics']]
];

export function createDefaultSubjects(): Subject[] {
  const defaultMasteries = [65, 55, 50, 60, 55, 75, 50];
  const defaultIntensities: ('light' | 'moderate' | 'high' | 'extreme')[] = [
    'high',
    'moderate',
    'light',
    'high',
    'moderate',
    'extreme',
    'moderate',
  ];
  const defaultDifficulties = [4, 3, 3, 4, 3, 5, 3];

  return DEFAULT_CE_SUBJECTS.map(([name, goal, topics], i) => ({
    id: `subj-${i + 1}-${Math.random().toString(36).slice(2, 6)}`,
    name,
    goal,
    color: PALETTE[i % PALETTE.length],
    masteryLevel: defaultMasteries[i] || 50,
    intensity: defaultIntensities[i] || 'moderate',
    difficulty: defaultDifficulties[i] || 3,
    targetScore: 85,
    topics: topics.map((t, idx) => ({
      id: `top-${i + 1}-${idx + 1}-${Math.random().toString(36).slice(2, 6)}`,
      t,
      done: idx < 2,
      mastery: idx < 2 ? 'mastered' : idx === 2 ? 'practicing' : 'learning',
    })),
  }));
}

export const DEFAULT_QUOTES = [
  { text: 'Discipline today. Stronger structures tomorrow.', author: 'CE Board Creed' },
  { text: 'Small steps. Big structures.', author: '' },
  { text: 'Every formula you learn is a beam you can trust.', author: 'Structural Axiom' },
  { text: 'The board exam is the load. Your preparation is the foundation.', author: 'Civil Wisdom' },
  { text: 'Check your assumptions, then check them again.', author: 'Engineering Rule #1' },
  { text: 'One more problem set. One less thing to fear.', author: '' },
  { text: 'A factor of safety applies to studying too. Review twice.', author: '' }
];

export function createDefaultRoutines() {
  return [
    { id: 'rt-1', name: 'Review formulas & code provisions', time: '06:30', days: [0, 1, 2, 3, 4, 5, 6] },
    { id: 'rt-2', name: 'Solve practice problem set', time: '19:00', days: [0, 1, 2, 3, 4, 5] },
    { id: 'rt-3', name: 'Physical workout / walk & reset', time: '17:30', days: [0, 2, 4] },
    { id: 'rt-4', name: 'Wind down & sleep by 11:00 PM', time: '23:00', days: [0, 1, 2, 3, 4, 5, 6] }
  ];
}

export function createFreshState(): AppState {
  const defaultQuotes = DEFAULT_QUOTES.map((q, i) => ({
    id: `q-${i + 1}-${Math.random().toString(36).slice(2, 6)}`,
    text: q.text,
    author: q.author
  }));

  return {
    v: 2,
    title: 'Josiah James',
    tagline: 'FOCUS / PLAN / BUILD',
    activeSubject: null,
    cycle: 0,
    legacySessions: 0,
    subjects: createDefaultSubjects(),
    exams: [
      {
        id: 'exam-sample',
        name: 'CE Licensure Examination',
        date: new Date(Date.now() + 65 * 86400000).toISOString().split('T')[0],
        time: '08:00'
      }
    ],
    sessions: [],
    quotes: defaultQuotes,
    quoteId: defaultQuotes[0].id,
    quoteMode: 'rotate',
    tasks: [
      {
        id: 'task-1',
        text: 'Review fluid properties and hydrostatic pressure formulas',
        done: false,
        due: new Date().toISOString().split('T')[0],
        prio: 'h',
        subjectId: null,
        created: Date.now() - 3600000
      },
      {
        id: 'task-2',
        text: 'Practice 15 determinate truss joint method problems',
        done: false,
        due: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        prio: 'm',
        subjectId: null,
        created: Date.now() - 7200000
      }
    ],
    routines: createDefaultRoutines(),
    routineLog: {},
    alarm: {
      type: 'chime',
      vol: 75,
      len: 0,
      fileName: ''
    },
    timerState: null
  };
}

export function loadSavedState(): AppState {
  const base = createFreshState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        const merged: AppState = { ...base, ...parsed };
        if (merged.title === 'CIVI TIMER' || !merged.title) {
          merged.title = 'Josiah James';
        }
        if (!Array.isArray(merged.subjects)) merged.subjects = base.subjects;
        else {
          merged.subjects = merged.subjects.map((s, idx) => ({
            ...s,
            masteryLevel: typeof s.masteryLevel === 'number' ? s.masteryLevel : 50,
            intensity: s.intensity || 'moderate',
            difficulty: typeof s.difficulty === 'number' ? s.difficulty : 3,
            targetScore: typeof s.targetScore === 'number' ? s.targetScore : 85,
            topics: (s.topics || []).map((t) => ({
              ...t,
              mastery: t.mastery || (t.done ? 'mastered' : 'learning'),
            })),
          }));
        }
        if (!merged.defaultIntensity) merged.defaultIntensity = 'moderate';
        if (!Array.isArray(merged.exams)) merged.exams = base.exams;
        if (!Array.isArray(merged.sessions)) merged.sessions = base.sessions;
        if (!Array.isArray(merged.quotes)) merged.quotes = base.quotes;
        if (!Array.isArray(merged.tasks)) merged.tasks = base.tasks;
        if (!Array.isArray(merged.routines)) merged.routines = base.routines;
        if (!merged.routineLog || typeof merged.routineLog !== 'object') merged.routineLog = {};
        merged.alarm = { ...base.alarm, ...(merged.alarm || {}) };
        return merged;
      }
    }
  } catch (err) {
    console.error('Error loading saved state:', err);
  }

  // Check legacy stats
  try {
    const oldRaw = localStorage.getItem(OLD_KEY);
    if (oldRaw) {
      const old = JSON.parse(oldRaw);
      if (old && old.days) {
        Object.entries(old.days).forEach(([k, min]) => {
          const [y, m, d] = (k as string).split('-').map(Number);
          if (y && (min as number) > 0) {
            base.sessions.push({
              id: `leg-${Math.random().toString(36).slice(2, 7)}`,
              ts: new Date(y, m - 1, d, 12).getTime(),
              subjectId: null,
              min: min as number,
              legacy: true
            });
          }
        });
        base.legacySessions = old.sessions || 0;
        base.cycle = old.cycle || 0;
      }
    }
  } catch {
    // ignore
  }

  return base;
}

export function saveStateToStorage(state: AppState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Could not save to localStorage:', err);
  }
}

// Helpers
export const pad = (n: number) => String(n).padStart(2, '0');

export const dayKey = (d: Date = new Date()) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const parseDayKey = (k: string) => {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const mondayOf = (d: Date = new Date()): Date => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
};

export const addDays = (d: Date | number, n: number): Date => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

export const dayIdx = (d: Date) => (d.getDay() + 6) % 7; // 0=Mon ... 6=Sun

export const formatMinutes = (m: number): string => {
  m = Math.round(m);
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h > 0) {
    return r > 0 ? `${h}h ${r}m` : `${h}h`;
  }
  return `${r}m`;
};

export const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function exportBackupJson(state: AppState) {
  const cleanState = { ...state, timerState: null };
  const jsonStr = JSON.stringify(cleanState, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `civi-timer-backup-${dayKey()}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function exportHistoryCsv(state: AppState) {
  const rows = [
    ['Date', 'Time', 'Subject', 'Minutes', 'Intensity', 'Type', 'Notes / Key Takeaways']
  ];

  const sorted = [...state.sessions].sort((a, b) => a.ts - b.ts);
  for (const s of sorted) {
    const d = new Date(s.ts);
    const sub = state.subjects.find(sub => sub.id === s.subjectId);
    const timeStr = s.legacy ? '' : `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    const subjectName = sub ? sub.name : 'No subject';
    const type = s.legacy ? 'Imported Day Total' : s.manual ? 'Manual Entry' : 'Timer Session';
    const intensity = s.intensity ? s.intensity.toUpperCase() : 'MODERATE';
    const notes = s.notes ? `"${s.notes.replace(/"/g, '""')}"` : '""';
    rows.push([
      dayKey(d),
      timeStr,
      `"${subjectName.replace(/"/g, '""')}"`,
      String(s.min),
      intensity,
      type,
      notes
    ]);
  }

  const csvContent = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `civi-timer-history-${dayKey()}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
