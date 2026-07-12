export interface IUser {
  _id: string;
  firebaseId: string;
  email: string;
  username: string;
  role: "user" | "admin";
  bio: string;
  avatarUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProject {
  _id: string;
  title: string;
  description: string;
  tags: string[];
  cloudinaryPublicId: string;
  mediaUrl: string;
  userId: IUser;
  likes: string[];
  views: number;
  status: "draft" | "published" | "flagged";
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
