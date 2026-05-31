function deepLinkToHttps(url: string): string {
  if (url.startsWith('huputiyu://bbs/postImg')) {
    // 发帖 → 虎扑论坛湿乎乎的话题发帖页
    return 'https://bbs.hupu.com/post?fid=177&tagId=37312&tagName=NBA梦幻1阵';
  }
  if (url.startsWith('huputiyu://bbs/topicTag')) {
    // 标签页 → 虎扑论坛 NBA梦幻1阵 标签
    return 'https://bbs.hupu.com/tag?id=37312';
  }
  if (url.startsWith('huputiyu://bbs/topic/')) {
    // 帖子 → 对应的帖子页面
    const topicId = url.split('/').pop()?.split('?')[0];
    return `https://bbs.hupu.com/${topicId}.html`;
  }
  // fallback: 直接用 https 版本
  return url.replace('huputiyu://', 'https://');
}

export function openHupuLink(url: string, onFail: () => void) {
  const httpsUrl = deepLinkToHttps(url);
  window.open(httpsUrl, '_blank');
}
