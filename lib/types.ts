// Shared TypeScript types for MediRoute AI

export interface UserProfile {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  height: number; // cm
  weight: number; // kg
  allergies: string;
  chronicDiseases: string;
  city: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConsultationRecord {
  id: string;
  description: string;
  createdAt: string;
  status: 'pending' | 'completed' | 'ai_pending';
  result?: string;
}

export interface Clinic {
  id: string;
  name: string;
  address: string;
  rating: number;
  reviewCount: number;
  phone: string;
  description: string;
  specializations: string[];
  workingHours: string;
  type: 'public' | 'private';
  lat: number;
  lng: number;
  image?: string;
}

export interface RehabCenter {
  id: string;
  name: string;
  address: string;
  rating: number;
  reviewCount: number;
  phone: string;
  description: string;
  programs: string[];
  workingHours: string;
  capacity: number;
  lat: number;
  lng: number;
}

export type NavSection =
  | 'home'
  | 'consultation'
  | 'clinics'
  | 'rehabilitation'
  | 'history'
  | 'profile';
