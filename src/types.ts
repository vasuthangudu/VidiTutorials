export type UserRole = 'admin' | 'user';

export interface UserProfile {
  uid: string;
  email: string;
  phone?: string;
  displayName?: string;
  photoURL?: string;
  role: UserRole;
  createdAt: any;
  bookmarks?: string[];
  watchHistory?: { videoId: string; timestamp: any }[];
}

export type VideoStatus = 'pending' | 'approved' | 'rejected';

export interface VideoQuality {
  label: string;
  url: string;
}

export interface Video {
  id: string;
  title: string;
  description?: string;
  url: string;
  qualities?: VideoQuality[];
  thumbnail?: string;
  category: string;
  tags: string[];
  status: VideoStatus;
  uploaderUid: string;
  uploaderName?: string;
  createdAt: any;
  likesCount: number;
  commentsCount: number;
}

export interface Comment {
  id: string;
  videoId: string;
  userUid: string;
  userName?: string;
  userPhoto?: string;
  text: string;
  createdAt: any;
}

export interface Like {
  id: string;
  userId: string;
  videoId: string;
  createdAt: any;
}
