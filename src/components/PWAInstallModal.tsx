import React, { useState } from 'react';
import { Modal } from './Modal';
import {
  Smartphone,
  Download,
  Share,
  PlusSquare,
  Monitor,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Copy,
  Check,
  HelpCircle,
  ShieldCheck,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  isIOS: boolean;
  isAndroid?: boolean;
  isInIframe?: boolean;
  isStandalone?: boolean;
  browserName?: string;
  onNativeInstall?: () => void;
  canNativeInstall: boolean;
  onToast?: (msg: string) => void;
}

export const PWAInstallModal: React.FC<Props> = ({
  isOpen,
  onClose,
  isIOS,
  isAndroid = false,
  isInIframe = false,
  isStandalone = false,
  browserName = 'Browser',
  onNativeInstall,
  canNativeInstall,
  onToast
}) => {
  const [copied, setCopied] = useState(false);
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);

  const appUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleCopyLink = () => {
    if (!appUrl) return;
    navigator.clipboard.writeText(appUrl).then(() => {
      setCopied(true);
      if (onToast) onToast('📋 Direct app link copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {
      if (onToast) onToast('📋 Copied app URL!');
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Install Josiah James on Phone or Laptop">
      <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
        {/* Intro */}
        <p className="text-xs text-[#91a9c1] leading-relaxed">
          Install Josiah James directly onto your home screen or desktop. It runs in standalone fullscreen, works 100% offline, and saves all your study timers, subjects, and exams locally.
        </p>

        {/* Already installed banner */}
        {isStandalone && (
          <div className="p-3.5 rounded-xl bg-[#092b1a] border border-[#1b6b3e] flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#42e883] shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-semibold text-[#42e883]">
                Already Running as an Installed App!
              </div>
              <p className="text-[11px] text-[#a1d9b6] mt-0.5">
                Josiah James is currently operating in standalone desktop/mobile mode on this device.
              </p>
            </div>
          </div>
        )}

        {/* Embedded Iframe / Preview Warning Callout */}
        {isInIframe && !isStandalone && (
          <div className="p-4 rounded-xl bg-[#2a1708] border border-[#7a4214] space-y-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-[#ffae42] shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-[#ffc87a] uppercase tracking-wider block">
                  Why you can't install from here:
                </span>
                <p className="text-xs text-[#e8c69f] mt-1 leading-relaxed">
                  You are viewing the app inside an <strong>embedded preview frame</strong>. Modern browsers (Chrome, Safari, Edge) strictly block PWA installation prompts inside iframes for security.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-[#7a4214]/60 flex flex-col sm:flex-row gap-2">
              <a
                href={appUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2 px-3 rounded-lg bg-[#ff9800] hover:bg-[#ffa726] text-[#1a0c02] text-xs font-bold tracking-wider text-center flex items-center justify-center gap-1.5 transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>OPEN IN DIRECT TAB & INSTALL</span>
              </a>

              <button
                type="button"
                onClick={handleCopyLink}
                className="py-2 px-3 rounded-lg border border-[#ffae42]/50 hover:bg-[#3d200b] text-[#ffc87a] text-xs font-semibold flex items-center justify-center gap-1.5 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#42e883]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'COPIED!' : 'COPY DIRECT LINK'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Native 1-Click Install Button (when browser supports beforeinstallprompt) */}
        {canNativeInstall && onNativeInstall && (
          <div className="p-4 rounded-xl bg-[#09223a] border border-[#26537f] space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#8acaff]">
              <Download className="w-4 h-4 text-[#b8ff5c]" />
              <span>One-Click Install Ready ({browserName})</span>
            </div>
            <p className="text-xs text-[#b9cde0]">
              Your browser is ready to install Josiah James as a native application with desktop/home screen icons.
            </p>
            <button
              onClick={() => {
                onNativeInstall();
                onClose();
              }}
              className="w-full py-2.5 rounded-xl bg-[#4aa8ff] hover:bg-[#82c5ff] text-[#041322] font-bold text-xs tracking-wider transition flex items-center justify-center gap-2 shadow-lg shadow-[#4aa8ff]/20"
            >
              <Download className="w-4 h-4" />
              INSTALL JOSIAH JAMES NOW
            </button>
          </div>
        )}

        {/* Device-specific install guides */}
        <div className="space-y-3">
          {/* iOS Safari Guide */}
          <div className={`p-3.5 rounded-xl bg-[#071725] border ${isIOS ? 'border-[#4aa8ff]/80 shadow-[0_0_12px_rgba(74,168,255,0.15)]' : 'border-[#1b3853]'} space-y-2`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#8acaff]">
                <Smartphone className="w-4 h-4 text-[#4aa8ff]" />
                <span>iPhone & iPad (Safari)</span>
              </div>
              {isIOS && (
                <span className="text-[10px] uppercase font-bold text-[#b8ff5c] bg-[#12281a] px-2 py-0.5 rounded-full border border-[#235832]">
                  Your Device
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#91a9c1]">
              Apple WebKit does not provide an automated install button; installation must be triggered via Safari's Share menu:
            </p>
            <ol className="text-xs text-[#b9cde0] space-y-1.5 list-decimal pl-5">
              <li className="flex items-center gap-1.5">
                Open in <strong>Safari</strong> (not Chrome or in-app webviews on iOS).
              </li>
              <li className="flex items-center gap-1.5">
                Tap the <Share className="w-3.5 h-3.5 text-[#4aa8ff] inline shrink-0" /> <strong>Share</strong> icon in the bottom toolbar.
              </li>
              <li className="flex items-center gap-1.5">
                Scroll down and select <PlusSquare className="w-3.5 h-3.5 text-[#b8ff5c] inline shrink-0" /> <strong>Add to Home Screen</strong>.
              </li>
              <li>Tap <strong>Add</strong> in the top-right corner.</li>
            </ol>
          </div>

          {/* Android Chrome Guide */}
          <div className={`p-3.5 rounded-xl bg-[#071725] border ${isAndroid ? 'border-[#b8ff5c]/80 shadow-[0_0_12px_rgba(184,255,92,0.15)]' : 'border-[#1b3853]'} space-y-2`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#8acaff]">
                <Smartphone className="w-4 h-4 text-[#b8ff5c]" />
                <span>Android (Chrome / Samsung Internet)</span>
              </div>
              {isAndroid && (
                <span className="text-[10px] uppercase font-bold text-[#b8ff5c] bg-[#12281a] px-2 py-0.5 rounded-full border border-[#235832]">
                  Your Device
                </span>
              )}
            </div>
            <ol className="text-xs text-[#b9cde0] space-y-1 list-decimal pl-5">
              <li>Open the app in Chrome at its direct web address.</li>
              <li>Tap the three dots <strong>⋮</strong> in the top-right corner.</li>
              <li>Select <strong>Install app</strong> or <strong>Add to Home screen</strong>.</li>
            </ol>
          </div>

          {/* Desktop Laptop Guide */}
          <div className="p-3.5 rounded-xl bg-[#071725] border border-[#1b3853] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#8acaff]">
                <Monitor className="w-4 h-4 text-[#ffb454]" />
                <span>Laptop & Desktop (Chrome / Edge / Brave)</span>
              </div>
            </div>
            <ol className="text-xs text-[#b9cde0] space-y-1 list-decimal pl-5">
              <li>Open Josiah James in a full browser window (not preview).</li>
              <li>Look for the <strong>Install [↓]</strong> icon on the right side of the URL address bar.</li>
              <li>Or click the 3 dots <strong>⋮</strong> &gt; <strong>Save and share</strong> &gt; <strong>Install Josiah James</strong>.</li>
            </ol>
          </div>
        </div>

        {/* Collapsible Troubleshooting Diagnostics */}
        <div className="border border-[#183552] rounded-xl overflow-hidden bg-[#051320]">
          <button
            type="button"
            onClick={() => setShowTroubleshooting(!showTroubleshooting)}
            className="w-full p-3 flex items-center justify-between text-left text-xs font-semibold text-[#8acaff] hover:bg-[#07192c] transition"
          >
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-[#4aa8ff]" />
              <span>Still having trouble installing? Click for diagnostics</span>
            </div>
            {showTroubleshooting ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showTroubleshooting && (
            <div className="p-3.5 border-t border-[#183552] space-y-2.5 text-xs text-[#b9cde0]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#b8ff5c] shrink-0" />
                <span><strong>HTTPS &amp; Service Worker:</strong> Registered and active for offline caching.</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#b8ff5c] shrink-0" />
                <span><strong>Web Manifest:</strong> Validated with high-res 192px, 512px, and maskable icons.</span>
              </div>
              <div className="flex items-center gap-2">
                {isInIframe ? (
                  <AlertTriangle className="w-4 h-4 text-[#ffae42] shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-[#b8ff5c] shrink-0" />
                )}
                <span>
                  <strong>Window Environment:</strong> {isInIframe ? 'Inside iframe preview (installation blocked by browser until opened in direct tab)' : 'Top-level browser tab (ready)'}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#091a2a] text-[11px] space-y-1 text-[#91a9c1]">
                <p><strong>Common reasons browsers block installation:</strong></p>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li><strong>Incognito / Private Mode:</strong> Browsers disable PWA installation in private tabs. Switch to a standard window.</li>
                  <li><strong>In-app Browser:</strong> If opened via social media or email links, tap <em>Open in Safari</em> or <em>Open in Chrome</em>.</li>
                  <li><strong>Storage Full:</strong> Check if your phone has sufficient device storage.</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Local Storage persistence guarantee */}
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[#061523] text-[11px] text-[#91a9c1]">
          <CheckCircle2 className="w-4 h-4 text-[#b8ff5c] shrink-0" />
          <span>All sessions, subjects, notes, and exam schedules remain 100% saved locally on this device.</span>
        </div>
      </div>
    </Modal>
  );
};

