export function openHupuLink(url: string, onFail: () => void) {
  window.location.href = url;

  const timer = setTimeout(() => {
    if (!document.hidden) {
      onFail();
    }
  }, 1000);

  const handleVisibility = () => {
    if (document.hidden) {
      clearTimeout(timer);
    }
  };

  document.addEventListener('visibilitychange', handleVisibility, { once: true });
}
