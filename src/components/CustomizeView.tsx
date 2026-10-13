import React, { useState } from 'react';
import { AlarmConfig, Quote, AlarmType } from '../types';
import { Volume2, Play, Square, Upload, Trash2, Pin, Sparkles, RotateCcw, Plus } from 'lucide-react';
import { saveSoundBlob, removeSoundBlob } from '../utils/idb';
import { triggerAlarm, stopAlarm } from '../utils/audio';

interface CustomizeViewProps {
  title: string;
  tagline: string;
  alarm: AlarmConfig;
  quotes: Quote[];
  quoteId: string | null;
  quoteMode: 'rotate' | 'random' | 'pinned';
  onUpdateTitle: (title: string) => void;
  onUpdateTagline: (tagline: string) => void;
  onResetBrand: () => void;
  onUpdateAlarm: (alarm: AlarmConfig) => void;
  onAddQuote: (text: string, author: string) => void;
  onUpdateQuote: (quote: Quote) => void;
  onDeleteQuote: (id: string) => void;
  onSetQuoteMode: (mode: 'rotate' | 'random' | 'pinned') => void;
  onShowQuote: (id: string) => void;
  onPinQuote: (id: string) => void;
  onResetDefaultQuotes: () => void;
  onToast: (msg: string) => void;
}

export const CustomizeView: React.FC<CustomizeViewProps> = ({
  title,
  tagline,
  alarm,
  quotes,
  quoteId,
  quoteMode,
  onUpdateTitle,
  onUpdateTagline,
  onResetBrand,
  onUpdateAlarm,
  onAddQuote,
  onUpdateQuote,
  onDeleteQuote,
  onSetQuoteMode,
  onShowQuote,
  onPinQuote,
  onResetDefaultQuotes,
  onToast,
}) => {
  const [newQuoteText, setNewQuoteText] = useState('');
  const [newQuoteAuthor, setNewQuoteAuthor] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    if (!/^audio\//.test(file.type) && !/\.(mp3|wav|m4a|ogg|aac|flac|webm)$/i.test(file.name)) {
      onToast('Please select a valid audio file (mp3, wav, m4a, ogg).');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      onToast('File exceeds 8 MB. Please select a shorter audio file.');
      return;
    }

    try {
      await saveSoundBlob(file, file.name);
      onUpdateAlarm({
        ...alarm,
        type: 'custom',
        fileName: file.name,
      });
      onToast('Custom alarm audio saved!');
    } catch {
      onToast('Could not save sound to IndexedDB on this device.');
    }
  };

  const handleRemoveCustomSound = async () => {
    await removeSoundBlob();
    onUpdateAlarm({
      ...alarm,
      type: alarm.type === 'custom' ? 'chime' : alarm.type,
      fileName: '',
    });
    onToast('Custom sound removed.');
  };

  const handleQuoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuoteText.trim()) return;
    onAddQuote(newQuoteText.trim(), newQuoteAuthor.trim());
    setNewQuoteText('');
    setNewQuoteAuthor('');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-[#18344f]/70">
        <div>
          <div className="text-[10px] tracking-[0.2em] text-[#8acaff] uppercase font-bold">
            Make it yours
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">Customization & Alarms</h2>
          <p className="text-xs text-[#91a9c1] mt-1 max-w-2xl leading-relaxed">
            Personalize your workspace title, pick synthesizer chimes or upload your own audio soundbite, and curate motivation quotes.
          </p>
        </div>
      </div>

      {/* Top Grid: Title & Alarm Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* App Title Customizer */}
        <section className="bg-gradient-to-br from-[#0d2033]/95 to-[#071522]/98 border border-[#244463] rounded-3xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#18344f]">
              <h3 className="text-sm font-bold text-white tracking-wider uppercase">Application Title</h3>
              <button
                onClick={onResetBrand}
                className="flex items-center gap-1 text-xs text-[#8acaff] hover:underline"
              >
                <RotateCcw className="w-3 h-3" />
                <span>RESET</span>
              </button>
            </div>

            <div className="space-y-4 mt-4">
              <div>
                <label className="block text-[10px] text-[#91a9c1] font-semibold tracking-wider uppercase mb-1">
                  Title
                </label>
                <input
                  type="text"
                  maxLength={24}
                  value={title}
                  onChange={(e) => onUpdateTitle(e.target.value)}
                  placeholder="Josiah James"
                  className="w-full bg-[#061321] border border-[#244463] rounded-xl px-3 py-2 text-sm text-white font-bold tracking-wider focus:outline-none focus:border-[#4aa8ff]"
                />
              </div>

              <div>
                <label className="block text-[10px] text-[#91a9c1] font-semibold tracking-wider uppercase mb-1">
                  Tagline
                </label>
                <input
                  type="text"
                  maxLength={40}
                  value={tagline}
                  onChange={(e) => onUpdateTagline(e.target.value)}
                  placeholder="FOCUS / PLAN / BUILD"
                  className="w-full bg-[#061321] border border-[#244463] rounded-xl px-3 py-2 text-xs text-white tracking-wider focus:outline-none focus:border-[#4aa8ff]"
                />
              </div>
            </div>
          </div>

          <p className="text-[11px] text-[#91a9c1] mt-4 pt-3 border-t border-[#18344f] leading-relaxed">
            Displayed across the top navigation bar, browser tab title, and notifications. Changes save instantaneously on this device.
          </p>
        </section>

        {/* Alarm Settings */}
        <section className="bg-gradient-to-br from-[#0d2033]/95 to-[#071522]/98 border border-[#244463] rounded-3xl p-5 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-[#18344f]">
            <h3 className="text-sm font-bold text-white tracking-wider uppercase flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-[#4aa8ff]" />
              <span>Alarm Sound</span>
            </h3>
            <span className="text-[10px] text-[#91a9c1] uppercase font-semibold">
              WHEN TIME IS UP
            </span>
          </div>

          <div className="space-y-3.5 mt-4">
            <div>
              <label className="block text-[10px] text-[#91a9c1] font-semibold tracking-wider uppercase mb-1">
                Sound Theme
              </label>
              <select
                value={alarm.type}
                onChange={(e) =>
                  onUpdateAlarm({
                    ...alarm,
                    type: e.target.value as AlarmType,
                  })
                }
                className="w-full bg-[#061321] border border-[#244463] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#4aa8ff] cursor-pointer"
              >
                <option value="chime">Chime (default synthetic chords)</option>
                <option value="bell">Resonant Bell (pure harmonics)</option>
                <option value="digital">Digital Beeps (classic watch)</option>
                <option value="rise">Rising Tones (energetic)</option>
                <option value="custom">My Own Custom Sound</option>
                <option value="none">Silent (visual only)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-[#91a9c1] font-semibold tracking-wider uppercase mb-1">
                  Volume: {alarm.vol}%
                </label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={alarm.vol}
                  onChange={(e) =>
                    onUpdateAlarm({
                      ...alarm,
                      vol: parseInt(e.target.value),
                    })
                  }
                  className="w-full accent-[#4aa8ff]"
                />
              </div>

              <div>
                <label className="block text-[10px] text-[#91a9c1] font-semibold tracking-wider uppercase mb-1">
                  Rings For
                </label>
                <select
                  value={alarm.len}
                  onChange={(e) =>
                    onUpdateAlarm({
                      ...alarm,
                      len: parseInt(e.target.value),
                    })
                  }
                  className="w-full bg-[#061321] border border-[#244463] rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#4aa8ff] cursor-pointer"
                >
                  <option value={0}>Play Once</option>
                  <option value={10}>10 seconds</option>
                  <option value={30}>30 seconds</option>
                  <option value={60}>1 minute</option>
                </select>
              </div>
            </div>

            {/* Drag & drop upload area */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                const file = e.dataTransfer.files[0];
                if (file) handleFileUpload(file);
              }}
              className={`p-3.5 rounded-2xl border border-dashed transition flex flex-col items-center justify-center text-center gap-2 ${
                isDragOver
                  ? 'border-[#b8ff5c] bg-[#16361f]/30'
                  : 'border-[#2f5a80] bg-[#061523]'
              }`}
            >
              <div className="text-xs font-semibold text-white truncate max-w-[250px]">
                {alarm.fileName ? alarm.fileName : 'No custom sound uploaded'}
              </div>
              <div className="text-[10px] text-[#91a9c1]">
                Drop an audio file here (mp3, wav, m4a up to 8 MB)
              </div>
              <div className="flex gap-2">
                <label className="py-1 px-3 rounded-xl bg-[#0a1c2d] hover:bg-[#122e49] border border-[#315578] text-[#8acaff] text-xs font-semibold tracking-wider transition cursor-pointer flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5" />
                  <span>CHOOSE FILE</span>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                      e.target.value = '';
                    }}
                    className="hidden"
                  />
                </label>
                {alarm.fileName && (
                  <button
                    type="button"
                    onClick={handleRemoveCustomSound}
                    className="py-1 px-2.5 rounded-xl border border-rose-900/60 text-rose-400 hover:bg-rose-950/40 text-xs font-semibold transition"
                  >
                    REMOVE
                  </button>
                )}
              </div>
            </div>

            {/* Preview & Stop */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => triggerAlarm(alarm.type, alarm.vol, alarm.len, true)}
                className="flex-1 py-2 px-3 rounded-xl bg-[#4aa8ff] hover:bg-[#82c5ff] text-[#041322] font-bold text-xs tracking-wider transition flex items-center justify-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-[#041322]" />
                <span>PREVIEW ALARM</span>
              </button>
              <button
                type="button"
                onClick={() => stopAlarm()}
                className="py-2 px-4 rounded-xl bg-[#0a1c2d] hover:bg-[#122e49] border border-[#315578] text-[#8acaff] font-bold text-xs tracking-wider transition flex items-center gap-1.5"
              >
                <Square className="w-3 h-3 fill-[#8acaff]" />
                <span>STOP</span>
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Motivational Quotes Section */}
      <section className="bg-gradient-to-br from-[#0d2033]/95 to-[#071522]/98 border border-[#244463] rounded-3xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#18344f] gap-2">
          <div>
            <h3 className="text-sm font-bold text-white tracking-wider uppercase flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#ffb454]" />
              <span>Quotes & Inspirations</span>
            </h3>
            <p className="text-[10px] text-[#91a9c1] mt-0.5">
              These appear below your progress metrics on the Timer screen.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onResetDefaultQuotes}
              className="flex items-center gap-1 text-xs text-[#8acaff] hover:underline"
            >
              <RotateCcw className="w-3 h-3" />
              <span>RESTORE DEFAULTS</span>
            </button>
          </div>
        </div>

        {/* Add Quote Form */}
        <form onSubmit={handleQuoteSubmit} className="space-y-3 mt-4">
          <div>
            <label className="block text-[10px] text-[#91a9c1] font-semibold tracking-wider uppercase mb-1">
              New Quote
            </label>
            <textarea
              required
              rows={2}
              maxLength={280}
              placeholder="Type something that keeps you focused and motivated through grueling problem sets..."
              value={newQuoteText}
              onChange={(e) => setNewQuoteText(e.target.value)}
              className="w-full bg-[#061321] border border-[#244463] rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-[#4aa8ff] resize-y"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
            <input
              type="text"
              maxLength={60}
              placeholder="Author or Source (optional, e.g. CE Board Creed)"
              value={newQuoteAuthor}
              onChange={(e) => setNewQuoteAuthor(e.target.value)}
              className="bg-[#061321] border border-[#244463] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#4aa8ff]"
            />
            <button
              type="submit"
              className="py-2 px-5 rounded-xl bg-[#4aa8ff] hover:bg-[#82c5ff] text-[#041322] font-bold text-xs tracking-wider transition shadow-sm flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>ADD QUOTE</span>
            </button>
          </div>
        </form>

        {/* Quote Rotation Setting */}
        <div className="mt-4 pt-3 border-t border-[#18344f] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <label className="text-xs text-[#91a9c1] font-medium">
            When should the quote change on the timer screen?
          </label>
          <select
            value={quoteMode}
            onChange={(e) => onSetQuoteMode(e.target.value as any)}
            className="bg-[#061321] border border-[#244463] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#4aa8ff] cursor-pointer"
          >
            <option value="rotate">Next quote after each session</option>
            <option value="random">Random quote after each session</option>
            <option value="pinned">Keep the pinned quote</option>
          </select>
        </div>

        {/* List of Quotes */}
        <div className="space-y-3 mt-4">
          {quotes.map((q) => {
            const isShowingNow = q.id === quoteId;

            return (
              <div
                key={q.id}
                className={`p-3.5 rounded-2xl border transition space-y-2 ${
                  isShowingNow
                    ? 'border-[#4aa8ff] bg-[#0c243a]/70 ring-1 ring-[#4aa8ff]/40'
                    : 'border-[#1b3853] bg-[#071725]'
                }`}
              >
                <textarea
                  value={q.text}
                  maxLength={280}
                  onChange={(e) => onUpdateQuote({ ...q, text: e.target.value })}
                  className="w-full bg-[#061321] border border-[#244463] rounded-xl p-2 text-xs text-white leading-relaxed focus:outline-none focus:border-[#4aa8ff] resize-none"
                  rows={2}
                />

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <input
                    type="text"
                    maxLength={60}
                    value={q.author || ''}
                    placeholder="Author (optional)"
                    onChange={(e) => onUpdateQuote({ ...q, author: e.target.value })}
                    className="flex-1 min-w-[140px] bg-[#061321] border border-[#244463] rounded-xl px-2.5 py-1 text-xs text-[#b9cde0] focus:outline-none focus:border-[#4aa8ff]"
                  />

                  <div className="flex items-center gap-1.5">
                    {isShowingNow && (
                      <span className="px-2 py-0.5 rounded-full bg-[#16361f] border border-[#3f8f4f] text-[#b8ff5c] text-[10px] font-bold tracking-wider">
                        SHOWING NOW {quoteMode === 'pinned' ? '· PINNED' : ''}
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => onShowQuote(q.id)}
                      className="px-2.5 py-1 rounded-xl bg-[#0a1c2d] hover:bg-[#122e49] border border-[#315578] text-[#8acaff] text-xs font-semibold transition"
                    >
                      SHOW
                    </button>

                    <button
                      type="button"
                      onClick={() => onPinQuote(q.id)}
                      className="px-2.5 py-1 rounded-xl bg-[#0a1c2d] hover:bg-[#122e49] border border-[#315578] text-[#ffb454] text-xs font-semibold transition flex items-center gap-1"
                    >
                      <Pin className="w-3 h-3" />
                      <span>PIN</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteQuote(q.id)}
                      className="p-1 rounded-lg text-[#91a9c1] hover:text-rose-400 hover:bg-[#12283e] transition"
                      aria-label="Delete quote"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
