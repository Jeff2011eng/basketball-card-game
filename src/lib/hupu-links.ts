export function isInHupuApp(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /huputiyu|hupu/i.test(navigator.userAgent);
}

const HUPU_LINKS = {
  postTopic: {
    deep: 'huputiyu://bbs/postImg?tagName=NBA梦幻1阵&tagId=37312&topicName=湿乎乎的话题&topicId=177',
    web: 'https://m.hupu.com/tag/37312',
  },
  viewTopic: {
    deep: 'huputiyu://bbs/topicTag?tagId=37312',
    web: 'https://m.hupu.com/tag/37312',
  },
  feedback: {
    deep: 'huputiyu://bbs/topic/639570451',
    web: 'https://bbs.hupu.com/639570451.html',
  },
} as const;

export function getPostTopicUrl() {
  return isInHupuApp() ? HUPU_LINKS.postTopic.deep : HUPU_LINKS.postTopic.web;
}

export function getViewTopicUrl() {
  return isInHupuApp() ? HUPU_LINKS.viewTopic.deep : HUPU_LINKS.viewTopic.web;
}

export function getFeedbackUrl() {
  return isInHupuApp() ? HUPU_LINKS.feedback.deep : HUPU_LINKS.feedback.web;
}
