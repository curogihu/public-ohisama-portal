import type { Content } from '../types/member'

export const uploadedYoutubeContent: Content[] = [
  { id: 'youtube-fake-001', title: '公開サンプル: メイキングムービー', type: 'movie', members: ['youtube-movie', 'moon-haru'], url: 'https://example.com/youtube/fake-001', platform: 'YouTube', description: '公開サンプル用の架空データです', thumbnail: '/placeholder.svg?height=180&width=320', publishDate: '2026/05/05' },
  { id: 'youtube-fake-002', title: '公開サンプル: ショートクリップ', type: 'movie', members: ['youtube-shorts', 'sunrise-aoi'], url: 'https://example.com/youtube/fake-002', platform: 'YouTube', description: '公開サンプル用の架空データです', thumbnail: '/placeholder.svg?height=180&width=320', publishDate: '2026/05/04' },
  { id: 'youtube-fake-003', title: '公開サンプル: 生配信アーカイブ', type: 'movie', members: ['youtube-live', 'sunset-rin'], url: 'https://example.com/youtube/fake-003', platform: 'YouTube', description: '公開サンプル用の架空データです', thumbnail: '/placeholder.svg?height=180&width=320', publishDate: '2026/05/03' },
]
