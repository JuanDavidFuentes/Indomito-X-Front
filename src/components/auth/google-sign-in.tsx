'use client';

import type { AuthResponse, SignupIntent } from '@juandavidfuentes/indomitox-shared';
import { useLocale, useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import Script from 'next/script';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api/client';
import { useErrorText } from '@/lib/forms';
import { useCompleteSignIn } from './use-auth-flow';

interface GoogleIdentity {
  accounts: {
    id: {
      initialize(options: {
        client_id: string;
        callback: (response: { credential: string }) => void;
        ux_mode?: 'popup' | 'redirect';
        use_fedcm_for_button?: boolean;
      }): void;
      renderButton(element: HTMLElement, options: Record<string, string | number>): void;
    };
  };
}

declare global {
  interface Window {
    google?: GoogleIdentity;
  }
}

/**
 * AUTH-01 en la web: botón oficial de Google Identity Services. Google entrega un ID token
 * que la API verifica. Solo se muestra si la API tiene `GOOGLE_CLIENT_ID_WEB` (si no, la
 * página no lo renderiza). El texto de consentimiento va justo encima del botón.
 */
export function GoogleSignIn({ clientId, intent }: { clientId: string; intent?: SignupIntent }) {
  const t = useTranslations('auth');
  const locale = useLocale();
  const { resolvedTheme } = useTheme();
  const errors = useErrorText();
  const complete = useCompleteSignIn();
  const container = useRef<HTMLDivElement>(null);
  const [scriptReady, setScriptReady] = useState(false);

  // Se guarda en un ref para no reinicializar Google en cada render.
  const onCredential = useRef<(credential: string) => void>(() => undefined);
  useEffect(() => {
    onCredential.current = async (idToken) => {
      try {
        const response = await api<AuthResponse>('/v1/auth/google', {
          method: 'POST',
          body: { idToken, locale, intent, acceptTerms: true, acceptPrivacy: true },
        });
        if (response.isNewUser) toast.success(t('welcomeCheckEmail'));
        complete(response, intent === 'HOST' ? 'host' : 'home');
      } catch (error) {
        toast.error(errors.api(error));
      }
    };
  });

  useEffect(() => {
    const google = window.google;
    if (!scriptReady || !google || !container.current) return;
    google.accounts.id.initialize({
      client_id: clientId,
      callback: ({ credential }) => onCredential.current(credential),
      ux_mode: 'popup',
      use_fedcm_for_button: true,
    });
    google.accounts.id.renderButton(container.current, {
      type: 'standard',
      theme: resolvedTheme === 'dark' ? 'filled_black' : 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'pill',
      locale,
      width: container.current.clientWidth || 320,
    });
  }, [scriptReady, clientId, locale, resolvedTheme]);

  return (
    <div className="grid gap-3">
      <p className="text-center text-xs text-muted-foreground">{t('socialConsent')}</p>
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onReady={() => setScriptReady(true)} />
      <div ref={container} className="flex min-h-11 w-full justify-center" />
    </div>
  );
}
