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
  createdAt: Date;
  updatedAt: Date;
}

export interface IProject {
  _id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  cloudinaryPublicId: string;
  mediaUrl: string;
  thumbnailUrl?: string;
  userId: IUser;
  likes: string[];
  views: number;
  status: "draft" | "published" | "flagged";
  protected: boolean;
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
