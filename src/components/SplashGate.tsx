import { useEffect, useState } from 'react';
import { useSettings } from '../lib/hooks';
import { router } from '../router';

/**
 * Lifts the opening screen (index.html) once the first page's code has arrived and the store's
 * settings — name, logo, rates — are in, so visitors never see a half-drawn header. A slow or
 * failed settings call never holds the store back for more than a few seconds.
 */
export function SplashGate() {
  const { isSuccess, isError } = useSettings();
  const [routed, setRouted] = useState(router.state.initialized);
  useEffect(() => (routed ? undefined : router.subscribe((s) => s.initialized && setRouted(true))), [routed]);
  useEffect(() => {
    const el = document.getElementById('splash');
    if (!el) return;
    const lift = () => {
      el.classList.add('gone');
      setTimeout(() => el.remove(), 500);
    };
    if (routed && (isSuccess || isError)) {
      lift();
      return;
    }
    const t = setTimeout(lift, 6000);
    return () => clearTimeout(t);
  }, [routed, isSuccess, isError]);
  return null;
}
