import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isInIframe, setIsInIframe] = useState(false);
  const [browserName, setBrowserName] = useState<string>('Browser');
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    // Check if running in iframe (e.g. AI Studio preview pane)
    try {
      setIsInIframe(window.self !== window.top);
    } catch {
      setIsInIframe(true);
    }

    // Check standalone mode (already installed & running like an app)
    const standaloneMedia = window.matchMedia('(display-mode: standalone)').matches;
    const navStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsStandalone(standaloneMedia || navStandalone);

    // Detect OS & Browser
    const ua = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(ua);
    const isAndroidDevice = /android/.test(ua);
    setIsIOS(isIOSDevice);
    setIsAndroid(isAndroidDevice);

    if (/edg\//.test(ua)) {
      setBrowserName('Microsoft Edge');
    } else if (/chrome|crios/.test(ua) && !/edg\//.test(ua) && !/opr\//.test(ua)) {
      setBrowserName('Google Chrome');
    } else if (/safari/.test(ua) && !/chrome/.test(ua)) {
      setBrowserName('Apple Safari');
    } else if (/firefox|fxios/.test(ua)) {
      setBrowserName('Mozilla Firefox');
    } else {
      setBrowserName('Browser');
    }

    const handlePrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setIsStandalone(true);
      setDeferredPrompt(null);
    };

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('beforeinstallprompt', handlePrompt);
    window.addEventListener('appinstalled', handleInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handlePrompt);
      window.removeEventListener('appinstalled', handleInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const promptInstall = async (): Promise<boolean> => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      setIsStandalone(true);
      setDeferredPrompt(null);
      return true;
    }
    return false;
  };

  return {
    canInstall: !!deferredPrompt,
    isStandalone,
    isIOS,
    isAndroid,
    isInIframe,
    browserName,
    isOnline,
    promptInstall
  };
}

