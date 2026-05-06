export interface Member {
  id: string
  name: string
  en_name: string
  generation: number
  isActive: boolean
  graduationDate?: string
  profileImage: string
  birthDate: string
  bloodType: string
  height: string
  hometown: string
}

export interface Content {
  id: string
  title: string
  type: "movie" | "audio" | "tver" | "column"
  members: string[]
  url: string
  platform: string
  description: string
  thumbnail: string
  publishDate: string
}
