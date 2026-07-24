import type { Media } from '@knky-chat/core-chat';
import type { SharedMediaItem } from './types';

export const LIMIT = 20;

export const categories: ('Media' | 'Audio' | 'Channel' | 'Posts' | 'Services')[] = ['Media', 'Audio', 'Channel', 'Posts', 'Services'];

export const IMAGE_DRAG_STYLE = {
  WebkitTouchCallout: 'none' as const,
  WebkitUserSelect: 'none' as const,
  userSelect: 'none' as const,
};

/** Map a shared-content media row to the library Media shape. */
export function sharedItemToMedia(item: SharedMediaItem): Media {
  return {
    _id: item._id,
    url: '',
    path: item.path,
    type: item.type,
    status: item.status,
    variations: item.variations,
    resolution: item.resolution,
    duration: item.duration ? parseFloat(item.duration) : undefined,
  } as Media;
}
