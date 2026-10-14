import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';

export default function PwaInstallButton({ toast, compact = false, className = '' }) {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [installed, setInstalled] = useState(() => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true);

  useEffect(() => {
    const beforeInstall = event => { event.preventDefault(); setInstallPrompt(event); };
    const appInstalled = () => { setInstalled(true); setInstallPrompt(null); toast?.('QuickFix installed on this device'); };
    window.addEventListener('beforeinstallprompt', beforeInstall);
    window.addEventListener('appinstalled', appInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', beforeInstall);
      window.removeEventListener('appinstalled', appInstalled);
    };
  }, [toast]);

  if (installed) return null;

  const install = async () => {
    if (!installPrompt) {
      toast?.('Browser menu open pannunga → Install app / Add to Home Screen select pannunga. iPhone-na Share → Add to Home Screen.');
      return;
    }
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === 'accepted') setInstalled(true);
    setInstallPrompt(null);
  };

  return <button className={`${compact ? 'button button-outline pwa-install-button pwa-install-compact' : 'button button-outline pwa-install-button'} ${className}`.trim()} onClick={install} type="button" aria-label="Install QuickFix app">
    <Download size={15} /> {compact ? 'Install' : 'Install app'}
  </button>;
}
