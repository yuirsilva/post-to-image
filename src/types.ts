export type MediaType = 'image' | 'video'
export type Platform = 'instagram' | 'x'
export type XAppearance = 'light' | 'dark'
export type MetricName =
  'likes' | 'comments' | 'reposts' | 'bookmarks' | 'views'
export type Metrics = Record<MetricName, boolean>
export type ExportTheme = 'transparent' | 'paper' | 'ink' | 'coral'
export type ExportQuality = 1 | 2 | 3
export type LoadStatus = 'idle' | 'loading' | 'ready'

export interface QuotedPostData {
  postId?: string
  username: string
  name: string
  avatar: string
  image: string
  mediaType: MediaType
  caption: string
  date: string
  createdAt?: string
  verified: boolean
}

export interface SocialPostData {
  platform: Platform
  postId?: string
  shortcode?: string
  username: string
  name: string
  avatar: string
  image: string
  mediaType: MediaType
  videoDuration: number
  location: string
  caption: string
  likes: string
  comments: string
  reposts: string
  bookmarks: string
  views: string
  date: string
  createdAt?: string
  verified: boolean
  quotedPost?: QuotedPostData
  parentPost?: QuotedPostData
}

export interface Dimensions {
  width: number
  height: number
}

export interface ApiError {
  error?: string
}
