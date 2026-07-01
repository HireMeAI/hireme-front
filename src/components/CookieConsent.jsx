import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Cookie, Shield } from 'lucide-react';

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    // Check if consent already exists in localStorage
    const savedConsent = localStorage.getItem('hireme_cookie_consent');
    if (savedConsent) {
      try {
        const parsed = JSON.parse(savedConsent);
        setPreferences({
          necessary: true,
          analytics: !!parsed.analytics,
          marketing: !!parsed.marketing,
        });
      } catch (e) {
        console.error('Failed to parse cookie consent preferences', e);
      }
    } else {
      // Show banner with a small delay for better user experience
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Listen to the custom event to reopen preferences
  useEffect(() => {
    const handleOpenSettings = () => {
      setShowModal(true);
    };
    window.addEventListener('open-cookie-settings', handleOpenSettings);
    return () => {
      window.removeEventListener('open-cookie-settings', handleOpenSettings);
    };
  }, []);

  const handleAcceptAll = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      marketing: true,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem('hireme_cookie_consent', JSON.stringify(allAccepted));
    setPreferences({ necessary: true, analytics: true, marketing: true });
    setShowBanner(false);
    setShowModal(false);
  };

  const handleDeclineAll = () => {
    const allDeclined = {
      necessary: true,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem('hireme_cookie_consent', JSON.stringify(allDeclined));
    setPreferences({ necessary: true, analytics: false, marketing: false });
    setShowBanner(false);
    setShowModal(false);
  };

  const handleSavePreferences = () => {
    const customPreferences = {
      ...preferences,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem('hireme_cookie_consent', JSON.stringify(customPreferences));
    setShowBanner(false);
    setShowModal(false);
  };

  if (!showBanner && !showModal) return null;

  return (
    <>
      {/* Consent Banner */}
      {showBanner && (
        <div className="fixed bottom-6 right-6 left-6 md:left-auto md:w-[420px] z-[40] bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-xl shadow-[var(--shadow-lg)] p-5 animate-in slide-in-from-bottom duration-300">
          <div className="flex items-start gap-4">
            <div className="p-2.5 bg-[var(--primary-glow)] text-[var(--primary)] rounded-lg shrink-0">
              <Cookie className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-[0.95rem] font-bold text-[var(--text-primary)] mb-1">
                Respect de votre vie privée
              </h4>
              <p className="text-[0.82rem] text-[var(--text-secondary)] leading-relaxed mb-4">
                Nous utilisons des cookies pour améliorer votre navigation, analyser l'audience et personnaliser nos contenus. Vous pouvez tout accepter, tout refuser ou personnaliser vos choix.
              </p>
              <div className="flex flex-wrap gap-2 justify-end">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-[0.8rem] h-8 px-3 cursor-pointer"
                  onClick={handleDeclineAll}
                >
                  Tout refuser
                </Button>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="text-[0.8rem] h-8 px-3 cursor-pointer"
                  onClick={() => setShowModal(true)}
                >
                  Personnaliser
                </Button>
                <Button 
                  variant="default" 
                  size="sm" 
                  className="text-[0.8rem] h-8 px-3 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-foreground)] cursor-pointer"
                  onClick={handleAcceptAll}
                >
                  Tout accepter
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preferences Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-[460px] p-6 bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-2xl shadow-[var(--shadow-lg)]">
          <DialogHeader className="mb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-[var(--primary-glow)] text-[var(--primary)] rounded-lg">
                <Shield className="w-5 h-5" />
              </div>
              <DialogTitle className="text-[1.1rem] font-bold text-[var(--text-primary)]">
                Préférences de confidentialité
              </DialogTitle>
            </div>
            <DialogDescription className="text-[0.82rem] text-[var(--text-secondary)]">
              Personnalisez votre consentement pour les cookies. Vous pouvez activer ou désactiver chaque catégorie à tout moment.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-4">
            {/* Necessary Cookies */}
            <div className="flex items-start justify-between gap-4 p-3 rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)]/50">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[0.85rem] font-bold text-[var(--text-primary)]">Cookies nécessaires</span>
                  <span className="text-[0.65rem] px-1.5 py-0.5 rounded-full bg-[var(--bg-tertiary)] text-[var(--text-muted)] font-semibold uppercase">Requis</span>
                </div>
                <p className="text-[0.76rem] text-[var(--text-muted)] leading-normal">
                  Ces cookies sont indispensables au fonctionnement du site (session de connexion, préférences de thème). Ils ne peuvent pas être désactivés.
                </p>
              </div>
              <div className="flex items-center h-8">
                <input 
                  type="checkbox" 
                  checked 
                  disabled 
                  className="w-4 h-4 rounded border-[var(--card-border)] bg-[var(--bg-tertiary)] accent-[var(--primary)] opacity-60 cursor-not-allowed"
                />
              </div>
            </div>

            {/* Analytics Cookies */}
            <div className="flex items-start justify-between gap-4 p-3 rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)]/50 hover:border-[var(--primary-glow)] transition-colors">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[0.85rem] font-bold text-[var(--text-primary)]">Cookies analytiques</span>
                </div>
                <p className="text-[0.76rem] text-[var(--text-muted)] leading-normal">
                  Ils nous permettent de mesurer l'audience de notre site, de détecter d'éventuels problèmes de performance et d'améliorer notre service.
                </p>
              </div>
              <div className="flex items-center h-8">
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={preferences.analytics}
                    onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-[var(--bg-tertiary)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--primary)]"></div>
                </label>
              </div>
            </div>

            {/* Marketing Cookies */}
            <div className="flex items-start justify-between gap-4 p-3 rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)]/50 hover:border-[var(--primary-glow)] transition-colors">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[0.85rem] font-bold text-[var(--text-primary)]">Cookies marketing</span>
                </div>
                <p className="text-[0.76rem] text-[var(--text-muted)] leading-normal">
                  Ces cookies nous permettent de vous proposer des offres d'emploi ciblées, des suggestions d'amélioration de CV personnalisées et des contenus publicitaires adaptés.
                </p>
              </div>
              <div className="flex items-center h-8">
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={preferences.marketing}
                    onChange={(e) => setPreferences({ ...preferences, marketing: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-[var(--bg-tertiary)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--primary)]"></div>
                </label>
              </div>
            </div>
          </div>

          <DialogFooter className="flex items-center justify-between gap-3 mt-6 pt-4 border-t border-[var(--card-border)]">
            <Button 
              variant="outline" 
              className="text-[0.8rem] h-9 px-3 cursor-pointer"
              onClick={handleDeclineAll}
            >
              Tout refuser
            </Button>
            <div className="flex gap-2">
              <Button 
                variant="secondary" 
                className="text-[0.8rem] h-9 px-3 cursor-pointer"
                onClick={handleSavePreferences}
              >
                Enregistrer
              </Button>
              <Button 
                variant="default" 
                className="text-[0.8rem] h-9 px-3 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-foreground)] cursor-pointer"
                onClick={handleAcceptAll}
              >
                Tout accepter
              </Button>
            </div>
          </DialogFooter>
        </Dialog>
      </Dialog>
    </>
  );
}
