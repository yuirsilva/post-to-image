import type { SocialPostData } from '../types'

export const samplePost = {
  platform: 'instagram',
  username: 'mika.travels',
  name: 'Mika Chen',
  avatar:
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=85',
  image:
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=90',
  mediaType: 'image',
  videoDuration: 0,
  location: 'Ponta do Sol, Madeira',
  caption:
    'Slow mornings, salt in the air, and nowhere else to be. Madeira, you have my heart.',
  likes: '12,486',
  comments: '328',
  reposts: '47',
  bookmarks: '0',
  views: '0',
  date: 'July 28, 2026',
  verified: false,
} satisfies SocialPostData
