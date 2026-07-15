export interface IUser {
  _id: string;
  firebaseId: string;
  email: string;
  username: string;
  role: "user" | "admin";
  bio: string;
  avatarUrl: string;
  website: string;
  socialLinks: { label: string; url: string }[];
  followersCount: number;
  followingCount: number;
  hasPassword: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProject {
  _id: string;
  title: string;
  description: string;
  categories: string[];
  cloudinaryPublicId: string;
  mediaUrl: string;
  mediaType: "video" | "image";
  images: string[];
  soundtrackId?: string;
  soundtrackTitle?: string;
  soundtrackArtist?: string;
  soundtrackThumbnail?: string;
  thumbnailUrl?: string;
  signedVideoUrl?: string;
  signedImageUrls?: string[];
  userId: IUser;
  likes: string[];
  views: number;
  status: "draft" | "published" | "flagged";
  protected: boolean;
  isDownloadable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMoodboard {
  _id: string;
  name: string;
  userId: string;
  projects: IProject[];
  visibility: "public" | "private";
  createdAt: Date;
  updatedAt: Date;
}

export interface ISubscriber {
  _id: string;
  email: string;
  subscribedAt: Date;
}

export interface IComment {
  _id: string;
  projectId: string;
  userId: IUser;
  text: string;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
