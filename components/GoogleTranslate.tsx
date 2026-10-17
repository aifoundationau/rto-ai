'use client';

import React, { useEffect } from 'react';

declare global {
  interface Window {
    google?: any;
    googleTranslateElementInit?: () => void;
  }
}

/**
 * Sets or clears the official Google Translate cookies and triggers translation
 */
export function setGoogleTranslateLanguage(langCode: string) {
  if (typeof window === 'undefined') return;

  const hostname = window.location.hostname;
  const isEnglish = !langCode || langCode === 'en' || langCode.toLowerCase() === 'en-au';

  if (isEnglish) {
    // Clear cookies across all paths and domain levels
    const expireStr = '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = `googtrans${expireStr}`;
    document.cookie = `googtrans${expireStr} domain=${hostname};`;
    if (hostname.includes('.')) {
      const parts = hostname.split('.');
      const rootDomain = '.' + parts.slice(-2).join('.');
      document.cookie = `googtrans${expireStr} domain=${rootDomain};`;
    }

    const selectElem = document.querySelector<HTMLSelectElement>('.goog-te-combo');
    if (selectElem) {
      selectElem.value = 'en';
      selectElem.dispatchEvent(new Event('change'));
    }
    // Reload to ensure all DOM text nodes revert to pristine English
    window.location.reload();
    return;
  }

  // Set Google Translate cookie: /en/<targetLanguage>
  const cookieVal = `/en/${langCode}`;
  document.cookie = `googtrans=${cookieVal}; path=/;`;
  document.cookie = `googtrans=${cookieVal}; path=/; domain=${hostname};`;
  if (hostname.includes('.')) {
    const parts = hostname.split('.');
    const rootDomain = '.' + parts.slice(-2).join('.');
    document.cookie = `googtrans=${cookieVal}; path=/; domain=${rootDomain};`;
  }

  // Trigger Google Translate combo element
  const selectElem = document.querySelector<HTMLSelectElement>('.goog-te-combo');
  if (selectElem) {
    selectElem.value = langCode;
    selectElem.dispatchEvent(new Event('change'));
  } else {
    // If combo element not yet ready in DOM, reload to let Google Translate initialize with the cookie
    window.location.reload();
  }
}

/**
 * Gets currently active Google Translate language code from cookies
 */
export function getActiveGoogleTranslateLanguage(): string {
  if (typeof window === 'undefined') return 'en';
  const match = document.cookie.match(/(?:^|;\s*)googtrans=\/en\/([a-zA-Z-]+)/);
  return match && match[1] ? match[1] : 'en';
}

export const GoogleTranslate: React.FC = () => {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Define initialization callback for Google Translate
    window.googleTranslateElementInit = () => {
      try {
        if (window.google?.translate?.TranslateElement) {
          new window.google.translate.TranslateElement(
            {
              pageLanguage: 'en',
              autoDisplay: false,
              includedLanguages:
                'en,id,ms,tl,vi,th,km,my,zh-CN,zh-TW,ja,ko,hi,bn,pa,ta,ne,ar,es,fr,de,pt,it,el',
              layout: window.google.translate.TranslateElement.InlineLayout?.SIMPLE,
            },
            'google_translate_element'
          );
        }
      } catch (err) {
        console.warn('[GoogleTranslate] Init warning:', err);
      }
    };

    // Load Google Translate script
    const scriptId = 'google-translate-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.type = 'text/javascript';
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);
    } else if (window.google?.translate?.TranslateElement) {
      window.googleTranslateElementInit();
    }

    // Listen to custom language events
    const handleLangChange = (e: any) => {
      const langCode = e.detail?.code || e.detail;
      if (langCode) {
        setGoogleTranslateLanguage(langCode);
      }
    };

    window.addEventListener('edupulse-language-changed', handleLangChange);
    return () => {
      window.removeEventListener('edupulse-language-changed', handleLangChange);
    };
  }, []);

  return <div id="google_translate_element" style={{ display: 'none' }} />;
};
