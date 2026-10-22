import { normaliseJourney, withStepDefaults } from '../../shared/journey.js';
import { emptyBlessings } from '../../shared/blessings.js';

export function contentReferences(content, publicOnly = false) {
  const b = content.blessings || emptyBlessings;
  const devotional = !publicOnly || b.enabled
    ? b.photos.filter(p => !publicOnly || p.visible) : [];
  return new Set([
    ...content.photos.map(p => p.mediaId), content.musicId,
    ...(content.memoryVideos||[]).filter(v=>!publicOnly||(content.sections.memories&&v.visible&&normaliseJourney(content.journey).chapters.some(c=>c.id==='memories'&&c.visible))).map(v=>v.mediaId),
    ...normaliseJourney(content.journey).chapters.filter(c=>!publicOnly||c.visible).map(c=>c.trackId),
    ...devotional.map(p => p.mediaId),
    ...(!publicOnly || b.enabled ? [b.videoId] : []),
  ].filter(Boolean));
}

export function resolveBlessings(content, state, view, privateLinks) {
  const b = content.blessings || emptyBlessings;
  const photos = b.photos.filter(p => privateLinks || (b.enabled && p.visible)).map(p => ({
    ...withStepDefaults(p, b.photos.indexOf(p)), ...view(state.media.find(m => m.id === p.mediaId), state, privateLinks),
  }));
  return { ...b, photos, video: (privateLinks || b.enabled) && b.videoId
    ? view(state.media.find(m => m.id === b.videoId), state, privateLinks) : null };
}
