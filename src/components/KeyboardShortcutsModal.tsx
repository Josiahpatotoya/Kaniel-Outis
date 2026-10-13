import React from 'react';
import { Modal } from './Modal';
import { Keyboard, Laptop } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const shortcuts = [
    { key: 'Space', desc: 'Start or Pause the timer / stopwatch' },
    { key: 'R', desc: 'Reset timer to current preset or log stopwatch' },
    { key: '+ / =', desc: 'Quick add 1 minute to timer' },
    { key: 'S', desc: 'Switch directly into Stopwatch mode' },
    { key: '1 – 7', desc: 'Switch tabs (1: Timer, 2: Subjects, 3: Tasks, 4: Routine, 5: Exams, 6: History, 7: Settings)' },
    { key: 'Esc', desc: 'Silence ringing alarm or close dialogs' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Laptop Keyboard Shortcuts">
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-[#071725] border border-[#1b3853] text-xs text-[#91a9c1]">
          <Laptop className="w-5 h-5 text-[#4aa8ff] shrink-0" />
          <span>Engineered for fast desktop & laptop keyboard workflow. Shortcuts work anywhere outside text inputs.</span>
        </div>

        <div className="grid gap-2">
          {shortcuts.map(({ key, desc }) => (
            <div key={key} className="flex items-center justify-between p-2.5 rounded-xl bg-[#061523] border border-[#17324c] text-xs">
              <span className="text-[#b9cde0]">{desc}</span>
              <kbd className="px-2.5 py-1 rounded-lg bg-[#0d263e] border border-[#2b547b] font-mono text-[#8acaff] text-[11px] font-semibold tracking-wider shrink-0 shadow-inner">
                {key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};
