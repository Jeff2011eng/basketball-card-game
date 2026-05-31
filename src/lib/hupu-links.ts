function deepLinkToHttps(url: string): string {
  if (url.startsWith('huputiyu://bbs/postImg')) {
    return 'https://bbs.hupu.com/post?fid=177&tagId=37312&tagName=NBA梦幻1阵';
  }
  if (url.startsWith('huputiyu://bbs/topicTag')) {
    const match = url.match(/tagId=(\d+)/);
    return `https://bbs.hupu.com/tag?id=${match ? match[1] : '37312'}`;
  }
  if (url.startsWith('huputiyu://bbs/topic/')) {
    const topicId = url.split('/').pop()?.split('?')[0];
    return `https://bbs.hupu.com/${topicId}.html`;
  }
  return url.replace('huputiyu://', 'https://');
}

function isInHupuApp(): boolean {
  const ua = navigator.userAgent.toLowerCase();
  return ua.includes('hupu') || ua.includes('hoopchina');
}

export function openHupuLink(url: string, onFail: () => void) {
  if (isInHupuApp()) {
    // 虎扑 app 内：用深度链接
    window.location.href = url;
    const timer = setTimeout(() => {
      if (!document.hidden) onFail();
    }, 1000);
    const handleVisibility = () => {
      if (document.hidden) clearTimeout(timer);
    };
    document.addEventListener('visibilitychange', handleVisibility, { once: true });
  } else {
    // 外部浏览器：用 HTTPS
    const httpsUrl = deepLinkToHttps(url);
    window.open(httpsUrl, '_blank');
  }
}
