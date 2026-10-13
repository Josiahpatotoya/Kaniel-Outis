import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  AppState,
  TabKey,
  Subject,
  Session,
  TaskItem,
  Routine,
  Exam,
  Quote,
  AlarmConfig,
  IntensityLevel,
} from './types';
import {
  loadSavedState,
  saveStateToStorage,
  createDefaultSubjects,
  createDefaultRoutines,
  DEFAULT_QUOTES,
  dayKey,
  mondayOf,
} from './utils/storage';
import {
  triggerAlarm,
  stopAlarm,
  primeAudioForPlayback,
  registerRingListener,
} from './utils/audio';
import { usePWA } from './hooks/usePWA';

// Components
import { Header } from './components/Header';
import { NavTabs } from './components/NavTabs';
import { TimerView } from './components/TimerView';
import { SubjectsView } from './components/SubjectsView';
import { TasksView } from './components/TasksView';
import { RoutineView } from './components/RoutineView';
import { ExamsView } from './components/ExamsView';
import { HistoryView } from './components/HistoryView';
import { CustomizeView } from './components/CustomizeView';
import { Modal } from './components/Modal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { PWAInstallModal } from './components/PWAInstallModal';
import { SessionCompleteModal } from './components/SessionCompleteModal';

export default function App() {
  const [state, setState] = useState<AppState>(() => loadSavedState());
  const [currentTab, setCurrentTab] = useState<TabKey>('timer');
  const [isAlarmRinging, setIsAlarmRinging] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [sessionIntensity, setSessionIntensity] = useState<IntensityLevel>(
    () => state.defaultIntensity || 'moderate'
  );

  // Modals state
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [installModalOpen, setInstallModalOpen] = useState(false);
  const [completeSessionModalData, setCompleteSessionModalData] = useState<{
    isOpen: boolean;
    sessionId: string;
    subject: Subject | null;
    durationMinutes: number;
    intensity: IntensityLevel;
    masteryBonus: number;
  } | null>(null);

  // Confirmation dialog state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    danger?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Timer engine state
  const [timerDuration, setTimerDuration] = useState<number>(1500);
  const [timerRemaining, setTimerRemaining] = useState<number>(1500);
  const [timerRunning, setTimerRunning] = useState<boolean>(false);
  const [timerStopwatch, setTimerStopwatch] = useState<boolean>(false);
  const [timerEndAt, setTimerEndAt] = useState<number>(0);
  const [timerName, setTimerName] = useState<string>('Study Focus');
  const [timerKind, setTimerKind] = useState<'focus' | 'break'>('focus');

  const tickerRef = useRef<number | null>(null);
  const wakeLockRef = useRef<any>(null);

  const {
    canInstall,
    isStandalone,
    isIOS,
    isAndroid,
    isInIframe,
    browserName,
    isOnline,
    promptInstall
  } = usePWA();

  // Toast notification trigger
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 3200);
  }, []);

  // Sync state changes to storage
  useEffect(() => {
    saveStateToStorage(state);
  }, [state]);

  // Sync alarm ringing listener
  useEffect(() => {
    registerRingListener((ringing) => {
      setIsAlarmRinging(ringing);
    });
  }, []);

  // Synchronize document title with app name and timer
  useEffect(() => {
    const sec = Math.max(0, Math.floor(timerRemaining));
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    const pad = (n: number) => String(n).padStart(2, '0');
    const timeStr = h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;

    document.title = timerRunning
      ? `${timeStr} · ${state.title}`
      : `${state.title} — Precision Study & Engineering Focus`;
  }, [timerRemaining, timerRunning, state.title]);

  // WakeLock API to keep screen awake on phone/laptop during focus sessions
  const requestWakeLock = useCallback(async (enabled: boolean) => {
    try {
      if (enabled && 'wakeLock' in navigator && !wakeLockRef.current) {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        wakeLockRef.current.addEventListener('release', () => {
          wakeLockRef.current = null;
        });
      } else if (!enabled && wakeLockRef.current) {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
    } catch {
      // Ignore wakeLock unsupported / blocked
    }
  }, []);

  // Web Notification trigger
  const sendPushNotice = useCallback(
    (title: string, body: string) => {
      try {
        if ('Notification' in window && Notification.permission === 'granted') {
          if (navigator.serviceWorker && navigator.serviceWorker.ready) {
            navigator.serviceWorker.ready
              .then((reg) => {
                (reg as any).showNotification(title, {
                  body,
                  icon: '/pwa-192x192.png',
                  badge: '/pwa-192x192.png',
                  vibrate: [150, 80, 150],
                });
              })
              .catch(() => new Notification(title, { body }));
          } else {
            new Notification(title, { body });
          }
        }
      } catch {
        // ignore
      }
    },
    []
  );

  // Quote advancement logic
  const advanceQuote = useCallback(
    (force: boolean = false) => {
      if (!state.quotes.length) return;
      if (state.quoteMode === 'pinned' && !force) return;

      if (state.quoteMode === 'random' && state.quotes.length > 1) {
        let nextQuote = state.quotes[Math.floor(Math.random() * state.quotes.length)];
        while (nextQuote.id === state.quoteId) {
          nextQuote = state.quotes[Math.floor(Math.random() * state.quotes.length)];
        }
        setState((prev) => ({ ...prev, quoteId: nextQuote.id }));
      } else {
        const curIdx = state.quotes.findIndex((q) => q.id === state.quoteId);
        const nextIdx = (curIdx + 1) % state.quotes.length;
        setState((prev) => ({ ...prev, quoteId: state.quotes[nextIdx].id }));
      }
    },
    [state.quotes, state.quoteMode, state.quoteId]
  );

  // Complete session callback
  const handleSessionComplete = useCallback(
    (late: boolean = false) => {
      setTimerRunning(false);
      requestWakeLock(false);

      if (!timerStopwatch && timerKind === 'focus') {
        const loggedMinutes = Math.max(1, Math.ceil(timerDuration / 60));
        const bonus =
          sessionIntensity === 'extreme'
            ? 2
            : sessionIntensity === 'high'
            ? 1
            : 0.5;
        const newSession: Session = {
          id: `sess-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          ts: Date.now(),
          subjectId: state.activeSubject,
          min: loggedMinutes,
          intensity: sessionIntensity,
        };

        const activeSub = state.subjects.find((s) => s.id === state.activeSubject) || null;

        setState((prev) => {
          let updatedSubjects = prev.subjects;
          if (prev.activeSubject) {
            updatedSubjects = prev.subjects.map((sub) => {
              if (sub.id !== prev.activeSubject) return sub;
              const currentMastery = sub.masteryLevel ?? 50;
              const nextMastery = Math.min(100, Math.round(currentMastery + bonus));
              return { ...sub, masteryLevel: nextMastery };
            });
          }
          return {
            ...prev,
            cycle: prev.cycle + 1,
            subjects: updatedSubjects,
            sessions: [...prev.sessions, newSession],
          };
        });

        // Trigger session takeaway modal so the user can attach notes
        setCompleteSessionModalData({
          isOpen: true,
          sessionId: newSession.id,
          subject: activeSub,
          durationMinutes: loggedMinutes,
          intensity: sessionIntensity,
          masteryBonus: bonus,
        });

        advanceQuote(false);
        showToast(
          sessionIntensity === 'extreme'
            ? '🔥 Beast Mode complete — +2% Subject Mastery unlocked!'
            : 'Focus session complete — exceptional work, engineer!'
        );
        sendPushNotice(
          state.title,
          'Focus session complete. Take a breather, hydrate, and prepare for the next load.'
        );
      } else {
        showToast('Break timer complete — ready to build again?');
        sendPushNotice(state.title, 'Break is over. Ready to build again?');
      }

      if (!late) {
        triggerAlarm(state.alarm.type, state.alarm.vol, state.alarm.len);
      }
    },
    [
      timerStopwatch,
      timerKind,
      timerDuration,
      sessionIntensity,
      state.activeSubject,
      state.subjects,
      state.alarm,
      state.title,
      advanceQuote,
      requestWakeLock,
      sendPushNotice,
      showToast,
    ]
  );

  // Tick interval handler
  useEffect(() => {
    if (!timerRunning) {
      if (tickerRef.current) {
        clearInterval(tickerRef.current);
        tickerRef.current = null;
      }
      return;
    }

    tickerRef.current = window.setInterval(() => {
      if (timerStopwatch) {
        const elapsed = Math.floor((Date.now() - timerEndAt) / 1000);
        setTimerRemaining(elapsed);
        return;
      }

      const diffSec = Math.max(0, Math.ceil((timerEndAt - Date.now()) / 1000));
      setTimerRemaining(diffSec);

      if (diffSec <= 0) {
        handleSessionComplete(false);
      }
    }, 200);

    return () => {
      if (tickerRef.current) {
        clearInterval(tickerRef.current);
        tickerRef.current = null;
      }
    };
  }, [timerRunning, timerStopwatch, timerEndAt, handleSessionComplete]);

  // Tab visibility change handler (e.g. phone lock screen unlock)
  useEffect(() => {
    const handleVisibility = () => {
      if (!document.hidden && timerRunning) {
        if (timerStopwatch) {
          const elapsed = Math.floor((Date.now() - timerEndAt) / 1000);
          setTimerRemaining(elapsed);
        } else {
          const diffSec = Math.max(0, Math.ceil((timerEndAt - Date.now()) / 1000));
          setTimerRemaining(diffSec);
          if (diffSec <= 0) {
            handleSessionComplete(true);
          }
        }
        requestWakeLock(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [timerRunning, timerStopwatch, timerEndAt, handleSessionComplete, requestWakeLock]);

  // Timer controls
  const handleStartPause = () => {
    if (timerRunning) {
      // Pause
      setTimerRunning(false);
      requestWakeLock(false);
      return;
    }

    // Starting or resuming
    primeAudioForPlayback();
    if (!timerStopwatch && timerRemaining <= 0) {
      setTimerRemaining(timerDuration);
    }

    setTimerRunning(true);
    setTimerEndAt(
      timerStopwatch ? Date.now() - timerRemaining * 1000 : Date.now() + timerRemaining * 1000
    );
    requestWakeLock(true);

    // Request notification permissions gracefully on first start
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  const handleReset = () => {
    if (timerStopwatch && timerRemaining >= 60) {
      const loggedMinutes = Math.floor(timerRemaining / 60);
      const activeSub = state.subjects.find((s) => s.id === state.activeSubject) || null;
      const newSession: Session = {
        id: `stop-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        ts: Date.now(),
        subjectId: state.activeSubject,
        min: loggedMinutes,
        intensity: sessionIntensity,
      };
      setState((prev) => ({ ...prev, sessions: [...prev.sessions, newSession] }));
      showToast(`Stopwatch logged: ${loggedMinutes} minutes.`);

      setCompleteSessionModalData({
        isOpen: true,
        sessionId: newSession.id,
        subject: activeSub,
        durationMinutes: loggedMinutes,
        intensity: sessionIntensity,
        masteryBonus: 0.5,
      });
    }

    setTimerRunning(false);
    requestWakeLock(false);
    setTimerRemaining(timerStopwatch ? 0 : timerDuration);
  };

  const handleAddMinute = () => {
    if (timerStopwatch) return;
    setTimerRemaining((prev) => prev + 60);
    setTimerDuration((prev) => prev + 60);
    if (timerRunning) {
      setTimerEndAt((prev) => prev + 60000);
    }
    showToast('Added +1 minute to session.');
  };

  const handleSetPreset = (
    seconds: number,
    name: string,
    kind: 'focus' | 'break',
    isStopwatch: boolean = false
  ) => {
    setTimerRunning(false);
    requestWakeLock(false);
    setTimerStopwatch(isStopwatch);
    setTimerDuration(Math.max(1, Math.floor(seconds)));
    setTimerRemaining(isStopwatch ? 0 : Math.max(1, Math.floor(seconds)));
    setTimerName(name);
    setTimerKind(kind);
  };

  // Keyboard shortcuts listener (Desktop & Laptop workflow)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in input or textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        handleStartPause();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleReset();
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handleAddMinute();
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        handleSetPreset(1, 'Stopwatch', 'focus', true);
        showToast('Switched to Stopwatch.');
      } else if (e.key === 'Escape') {
        stopAlarm();
        setIsAlarmRinging(false);
      } else if (['1', '2', '3', '4', '5', '6', '7'].includes(e.key)) {
        const tabs: TabKey[] = [
          'timer',
          'subjects',
          'tasks',
          'routine',
          'exams',
          'history',
          'quotes',
        ];
        const idx = parseInt(e.key) - 1;
        if (tabs[idx]) {
          setCurrentTab(tabs[idx]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [timerRunning, timerRemaining, timerStopwatch, timerDuration]);

  // Subject Actions
  const handleSelectSubjectToStudy = (id: string, intensity?: IntensityLevel) => {
    setState((prev) => ({ ...prev, activeSubject: id }));
    if (intensity) {
      setSessionIntensity(intensity);
    } else {
      const sub = state.subjects.find((s) => s.id === id);
      if (sub?.intensity) {
        setSessionIntensity(sub.intensity);
      }
    }
    setCurrentTab('timer');
    const sub = state.subjects.find((s) => s.id === id);
    showToast(
      `Studying ${sub ? sub.name : 'Subject'} at ${intensity || sub?.intensity || 'moderate'} intensity.`
    );
  };

  const handleAddSubject = () => {
    const colors = ['#4aa8ff', '#b8ff5c', '#ffb454', '#ff7a90', '#b48cff', '#4fe3c1', '#ffd84a'];
    const newSub: Subject = {
      id: `subj-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: 'New Engineering Subject',
      goal: 3,
      color: colors[state.subjects.length % colors.length],
      masteryLevel: 50,
      intensity: 'moderate',
      difficulty: 3,
      targetScore: 85,
      topics: [],
    };
    setState((prev) => ({ ...prev, subjects: [...prev.subjects, newSub] }));
    showToast('New subject added.');
  };

  const handleUpdateSubject = (updated: Subject) => {
    setState((prev) => ({
      ...prev,
      subjects: prev.subjects.map((s) => (s.id === updated.id ? updated : s)),
    }));
  };

  const handleDeleteSubject = (id: string) => {
    const sub = state.subjects.find((s) => s.id === id);
    setConfirmModal({
      isOpen: true,
      title: 'Delete Subject?',
      message: `"${sub ? sub.name : 'This subject'}" and its checklist will be removed. Completed study sessions remain in your history.`,
      confirmLabel: 'DELETE',
      danger: true,
      onConfirm: () => {
        setState((prev) => ({
          ...prev,
          subjects: prev.subjects.filter((s) => s.id !== id),
          activeSubject: prev.activeSubject === id ? null : prev.activeSubject,
        }));
        showToast('Subject deleted.');
      },
    });
  };

  const handleResetDefaultSubjects = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Restore Default Civil Engineering Subjects?',
      message:
        'This will restore standard CE subjects (Math, Surveying, Transportation, Hydraulics, Geotechnical, PSAD, Construction). Existing study sessions stay safely recorded.',
      confirmLabel: 'RESTORE',
      danger: false,
      onConfirm: () => {
        setState((prev) => ({
          ...prev,
          subjects: createDefaultSubjects(),
          activeSubject: null,
        }));
        showToast('Default CE subjects restored.');
      },
    });
  };

  const handleAddTopic = (subjectId: string, topicText: string) => {
    setState((prev) => ({
      ...prev,
      subjects: prev.subjects.map((s) => {
        if (s.id !== subjectId) return s;
        return {
          ...s,
          topics: [
            ...s.topics,
            {
              id: `top-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              t: topicText,
              done: false,
            },
          ],
        };
      }),
    }));
  };

  const handleToggleTopic = (subjectId: string, topicId: string) => {
    setState((prev) => ({
      ...prev,
      subjects: prev.subjects.map((s) => {
        if (s.id !== subjectId) return s;
        return {
          ...s,
          topics: s.topics.map((t) => (t.id === topicId ? { ...t, done: !t.done } : t)),
        };
      }),
    }));
  };

  const handleDeleteTopic = (subjectId: string, topicId: string) => {
    setState((prev) => ({
      ...prev,
      subjects: prev.subjects.map((s) => {
        if (s.id !== subjectId) return s;
        return {
          ...s,
          topics: s.topics.filter((t) => t.id !== topicId),
        };
      }),
    }));
  };

  // Task Actions
  const handleAddTask = (newTask: Omit<TaskItem, 'id' | 'created'>) => {
    const item: TaskItem = {
      ...newTask,
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      created: Date.now(),
    };
    setState((prev) => ({ ...prev, tasks: [item, ...prev.tasks] }));
    showToast('Task added to agenda.');
  };

  const handleToggleTask = (id: string) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => {
        if (t.id !== id) return t;
        const newDone = !t.done;
        return { ...t, done: newDone, doneAt: newDone ? Date.now() : null };
      }),
    }));
  };

  const handleDeleteTask = (id: string) => {
    setState((prev) => ({ ...prev, tasks: prev.tasks.filter((t) => t.id !== id) }));
  };

  const handleClearDoneTasks = () => {
    const count = state.tasks.filter((t) => t.done).length;
    if (count === 0) {
      showToast('No completed tasks to clear.');
      return;
    }
    setConfirmModal({
      isOpen: true,
      title: 'Clear Completed Tasks?',
      message: `Remove ${count} finished task${count === 1 ? '' : 's'} from your list?`,
      confirmLabel: 'CLEAR',
      danger: true,
      onConfirm: () => {
        setState((prev) => ({ ...prev, tasks: prev.tasks.filter((t) => !t.done) }));
        showToast('Completed tasks cleared.');
      },
    });
  };

  // Routine Actions
  const handleToggleRoutine = (dateKey: string, routineId: string) => {
    setState((prev) => {
      const curList = prev.routineLog[dateKey] || [];
      const isAlreadyDone = curList.includes(routineId);
      const nextList = isAlreadyDone
        ? curList.filter((id) => id !== routineId)
        : [...curList, routineId];

      const newLog = { ...prev.routineLog };
      if (nextList.length === 0) {
        delete newLog[dateKey];
      } else {
        newLog[dateKey] = nextList;
      }
      return { ...prev, routineLog: newLog };
    });
  };

  const handleAddRoutine = (routine: Omit<Routine, 'id'>) => {
    const item: Routine = {
      ...routine,
      id: `rt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    };
    setState((prev) => ({ ...prev, routines: [...prev.routines, item] }));
    showToast('Daily routine added.');
  };

  const handleDeleteRoutine = (id: string) => {
    const r = state.routines.find((x) => x.id === id);
    setConfirmModal({
      isOpen: true,
      title: 'Delete Routine?',
      message: `"${r ? r.name : 'This routine'}" and its historical check-offs will be deleted.`,
      confirmLabel: 'DELETE',
      danger: true,
      onConfirm: () => {
        setState((prev) => {
          const newLog = { ...prev.routineLog };
          Object.keys(newLog).forEach((k) => {
            newLog[k] = newLog[k].filter((x) => x !== id);
            if (!newLog[k].length) delete newLog[k];
          });
          return {
            ...prev,
            routines: prev.routines.filter((x) => x.id !== id),
            routineLog: newLog,
          };
        });
        showToast('Routine deleted.');
      },
    });
  };

  // Exam Actions
  const handleAddExam = (exam: Omit<Exam, 'id'>) => {
    const item: Exam = {
      ...exam,
      id: `exam-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    };
    setState((prev) => ({ ...prev, exams: [...prev.exams, item] }));
    showToast('Exam countdown active.');
  };

  const handleDeleteExam = (id: string) => {
    setState((prev) => ({ ...prev, exams: prev.exams.filter((e) => e.id !== id) }));
  };

  // History Actions
  const handleAddManualSession = (
    minutes: number,
    subjectId: string | null,
    date: string,
    intensity?: IntensityLevel,
    notes?: string
  ) => {
    const [y, m, d] = date.split('-').map(Number);
    const now = new Date();
    const sessionTime = new Date(y, m - 1, d, now.getHours(), now.getMinutes()).getTime();

    const newSession: Session = {
      id: `man-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      ts: Math.min(sessionTime, Date.now()),
      subjectId: subjectId || null,
      min: minutes,
      intensity: intensity || 'moderate',
      notes: notes?.trim() || undefined,
      manual: true,
    };

    setState((prev) => ({ ...prev, sessions: [...prev.sessions, newSession] }));
    showToast(`Logged ${minutes}m session (${intensity || 'moderate'} rigor) to history.`);
  };

  const handleUpdateSessionNotes = (sessionId: string, notes: string) => {
    setState((prev) => ({
      ...prev,
      sessions: prev.sessions.map((s) =>
        s.id === sessionId ? { ...s, notes: notes.trim() || undefined } : s
      ),
    }));
    showToast('Session takeaway note saved.');
  };

  const handleDeleteSession = (id: string) => {
    setState((prev) => ({ ...prev, sessions: prev.sessions.filter((s) => s.id !== id) }));
  };

  const handleClearHistory = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Clear All Study History?',
      message:
        'All logged sessions and streaks will be wiped from this device. Please export a backup first if you might need it.',
      confirmLabel: 'CLEAR ALL',
      danger: true,
      onConfirm: () => {
        setState((prev) => ({
          ...prev,
          sessions: [],
          cycle: 0,
          legacySessions: 0,
        }));
        showToast('Study history cleared.');
      },
    });
  };

  const handleImportBackup = (importedData: any) => {
    setConfirmModal({
      isOpen: true,
      title: 'Import Backup File?',
      message: `This will replace your current workspace data with the imported file (${
        importedData.sessions?.length || 0
      } study sessions).`,
      confirmLabel: 'IMPORT',
      danger: false,
      onConfirm: () => {
        setState((prev) => ({
          ...prev,
          ...importedData,
          timerState: null,
        }));
        showToast('Backup restored successfully!');
      },
    });
  };

  // Customize Actions
  const handleUpdateTitle = (title: string) => {
    setState((prev) => ({ ...prev, title: title.trim() || 'Josiah James' }));
  };

  const handleUpdateTagline = (tagline: string) => {
    setState((prev) => ({ ...prev, tagline: tagline.trim() }));
  };

  const handleResetBrand = () => {
    setState((prev) => ({
      ...prev,
      title: 'Josiah James',
      tagline: 'FOCUS / PLAN / BUILD',
    }));
    showToast('Brand title reset to default.');
  };

  const handleUpdateAlarm = (alarm: AlarmConfig) => {
    setState((prev) => ({ ...prev, alarm }));
  };

  const handleAddQuote = (text: string, author: string) => {
    const newQ: Quote = {
      id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      text,
      author,
    };
    setState((prev) => ({
      ...prev,
      quotes: [newQ, ...prev.quotes],
      quoteId: newQ.id,
    }));
    showToast('Quote added and displaying on timer screen.');
  };

  const handleUpdateQuote = (updated: Quote) => {
    setState((prev) => ({
      ...prev,
      quotes: prev.quotes.map((q) => (q.id === updated.id ? updated : q)),
    }));
  };

  const handleDeleteQuote = (id: string) => {
    setState((prev) => {
      const remaining = prev.quotes.filter((q) => q.id !== id);
      return {
        ...prev,
        quotes: remaining,
        quoteId: prev.quoteId === id ? remaining[0]?.id || null : prev.quoteId,
      };
    });
  };

  const handleSetQuoteMode = (mode: 'rotate' | 'random' | 'pinned') => {
    setState((prev) => ({ ...prev, quoteMode: mode }));
  };

  const handleShowQuote = (id: string) => {
    setState((prev) => ({ ...prev, quoteId: id }));
    showToast('Quote now active on timer screen.');
  };

  const handlePinQuote = (id: string) => {
    setState((prev) => ({ ...prev, quoteId: id, quoteMode: 'pinned' }));
    showToast('Quote pinned to timer screen.');
  };

  const handleResetDefaultQuotes = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Restore Default Motivation Quotes?',
      message: 'Your custom quotes will be replaced with the default engineering quotes.',
      confirmLabel: 'RESTORE',
      danger: false,
      onConfirm: () => {
        const fresh = DEFAULT_QUOTES.map((q, i) => ({
          id: `q-def-${i + 1}-${Math.random().toString(36).slice(2, 6)}`,
          text: q.text,
          author: q.author,
        }));
        setState((prev) => ({
          ...prev,
          quotes: fresh,
          quoteId: fresh[0].id,
        }));
        showToast('Default quotes restored.');
      },
    });
  };

  const currentQuote =
    state.quotes.find((q) => q.id === state.quoteId) || state.quotes[0] || null;

  return (
    <div className="min-h-screen bg-[#06111e] text-[#eaf4ff] flex flex-col justify-between selection:bg-[#4aa8ff]/30">
      {/* Background Radial Glow */}
      <div
        className="fixed inset-0 pointer-events-none opacity-40 z-0"
        style={{
          background: 'radial-gradient(ellipse at 50% -10%, #173c60 0%, transparent 60%)',
        }}
      />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-[1260px] mx-auto px-4 sm:px-6 lg:px-8 pt-[max(1rem,env(safe-area-inset-top))] pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-10 flex-1 flex flex-col">
        {/* Top Header */}
        <Header
          title={state.title}
          tagline={state.tagline}
          exams={state.exams}
          onSelectTab={setCurrentTab}
          onOpenShortcuts={() => setShortcutsOpen(true)}
          onOpenInstall={() => setInstallModalOpen(true)}
          canInstall={canInstall}
          isStandalone={isStandalone}
          isOnline={isOnline}
          isAlarmRinging={isAlarmRinging}
          onStopAlarm={() => {
            stopAlarm();
            setIsAlarmRinging(false);
          }}
        />

        {/* Navigation Tabs (Top for Laptop / Desktop) */}
        <NavTabs currentTab={currentTab} onSelectTab={setCurrentTab} tasks={state.tasks} />

        {/* Views */}
        <main className="flex-1 mt-2">
          {currentTab === 'timer' && (
            <TimerView
              remaining={timerRemaining}
              duration={timerDuration}
              running={timerRunning}
              stopwatch={timerStopwatch}
              name={timerName}
              kind={timerKind}
              cycle={state.cycle}
              activeSubjectId={state.activeSubject}
              sessionIntensity={sessionIntensity}
              subjects={state.subjects}
              sessions={state.sessions}
              legacySessions={state.legacySessions}
              currentQuote={currentQuote}
              onStartPause={handleStartPause}
              onReset={handleReset}
              onAddMinute={handleAddMinute}
              onSetPreset={handleSetPreset}
              onSelectSubject={(id) => setState((prev) => ({ ...prev, activeSubject: id }))}
              onSetIntensity={setSessionIntensity}
              onCycleQuote={() => advanceQuote(true)}
              onNavigateTab={setCurrentTab}
            />
          )}

          {currentTab === 'subjects' && (
            <SubjectsView
              subjects={state.subjects}
              sessions={state.sessions}
              activeSubjectId={state.activeSubject}
              onSelectSubjectToStudy={handleSelectSubjectToStudy}
              onAddSubject={handleAddSubject}
              onUpdateSubject={handleUpdateSubject}
              onDeleteSubject={handleDeleteSubject}
              onResetDefaultSubjects={handleResetDefaultSubjects}
              onAddTopic={handleAddTopic}
              onToggleTopic={handleToggleTopic}
              onDeleteTopic={handleDeleteTopic}
            />
          )}

          {currentTab === 'tasks' && (
            <TasksView
              tasks={state.tasks}
              subjects={state.subjects}
              onAddTask={handleAddTask}
              onToggleTask={handleToggleTask}
              onDeleteTask={handleDeleteTask}
              onClearDone={handleClearDoneTasks}
            />
          )}

          {currentTab === 'routine' && (
            <RoutineView
              routines={state.routines}
              routineLog={state.routineLog}
              onToggleRoutine={handleToggleRoutine}
              onAddRoutine={handleAddRoutine}
              onDeleteRoutine={handleDeleteRoutine}
            />
          )}

          {currentTab === 'exams' && (
            <ExamsView
              exams={state.exams}
              subjects={state.subjects}
              sessions={state.sessions}
              onAddExam={handleAddExam}
              onDeleteExam={handleDeleteExam}
              onSelectSubjectToStudy={(subjectId) => handleSelectSubjectToStudy(subjectId)}
            />
          )}

          {currentTab === 'history' && (
            <HistoryView
              sessions={state.sessions}
              subjects={state.subjects}
              legacySessions={state.legacySessions}
              onAddManualSession={handleAddManualSession}
              onUpdateSessionNotes={handleUpdateSessionNotes}
              onDeleteSession={handleDeleteSession}
              onClearHistory={handleClearHistory}
              onImportBackup={handleImportBackup}
            />
          )}

          {currentTab === 'quotes' && (
            <CustomizeView
              title={state.title}
              tagline={state.tagline}
              alarm={state.alarm}
              quotes={state.quotes}
              quoteId={state.quoteId}
              quoteMode={state.quoteMode}
              onUpdateTitle={handleUpdateTitle}
              onUpdateTagline={handleUpdateTagline}
              onResetBrand={handleResetBrand}
              onUpdateAlarm={handleUpdateAlarm}
              onAddQuote={handleAddQuote}
              onUpdateQuote={handleUpdateQuote}
              onDeleteQuote={handleDeleteQuote}
              onSetQuoteMode={handleSetQuoteMode}
              onShowQuote={handleShowQuote}
              onPinQuote={handlePinQuote}
              onResetDefaultQuotes={handleResetDefaultQuotes}
              onToast={showToast}
            />
          )}
        </main>

        {/* Global Footer */}
        <footer className="mt-10 pt-4 border-t border-[#18334c]/50 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] tracking-[0.16em] uppercase text-[#6f8aa4]">
          <span>
            {state.title} / STUDY · ENGINEER · SUCCEED
          </span>
          <span className="text-[#8acaff] font-medium">
            Created by Josiah James Nganiii
          </span>
        </footer>
      </div>

      {/* Floating Global Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-full bg-[#dfffc3] text-[#0f280a] text-xs font-bold shadow-2xl tracking-wide max-w-[92vw] text-center animate-in fade-in slide-in-from-bottom-3 duration-200 pointer-events-none">
          {toastMessage}
        </div>
      )}

      {/* Modals */}
      <KeyboardShortcutsModal
        isOpen={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />

      <PWAInstallModal
        isOpen={installModalOpen}
        onClose={() => setInstallModalOpen(false)}
        isIOS={isIOS}
        isAndroid={isAndroid}
        isInIframe={isInIframe}
        isStandalone={isStandalone}
        browserName={browserName}
        onNativeInstall={promptInstall}
        canNativeInstall={canInstall}
        onToast={showToast}
      />

      <Modal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        title={confirmModal.title}
        onConfirm={confirmModal.onConfirm}
        confirmLabel={confirmModal.confirmLabel || 'CONFIRM'}
        confirmDanger={confirmModal.danger}
      >
        <p>{confirmModal.message}</p>
      </Modal>

      <SessionCompleteModal
        isOpen={!!completeSessionModalData?.isOpen}
        onClose={() => setCompleteSessionModalData(null)}
        subject={completeSessionModalData?.subject || null}
        durationMinutes={completeSessionModalData?.durationMinutes || 0}
        intensity={completeSessionModalData?.intensity || 'moderate'}
        masteryBonus={completeSessionModalData?.masteryBonus || 0}
        onSaveNotes={(notes) => {
          if (completeSessionModalData?.sessionId) {
            handleUpdateSessionNotes(completeSessionModalData.sessionId, notes);
          }
        }}
      />
    </div>
  );
}
