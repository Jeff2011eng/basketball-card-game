export function openHupuLink(url: string, onFail: () => void) {
  window.location.href = url;

  const timer = setTimeout(() => {
    if (!document.hidden) {
      onFail();
    }
  }, 2000);

  const handleVisibility = () => {
    if (document.hidden) {
      clearTimeout(timer);
    }
  };

  document.addEventListener('visibilitychange', handleVisibility, { once: true });
}
