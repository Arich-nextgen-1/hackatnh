'use client';

import { UserProfile } from '@/lib/types';
import { useLocalStorage } from './useLocalStorage';

const PROFILE_KEY = 'mediroute_profile';

export function useProfile() {
  const { value: profile, setValue: setProfile, removeValue: removeProfile, isLoaded } =
    useLocalStorage<UserProfile | null>(PROFILE_KEY, null);

  const hasProfile = isLoaded && profile !== null;

  const saveProfile = (data: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    if (profile) {
      setProfile({ ...profile, ...data, updatedAt: now });
    } else {
      setProfile({
        id: crypto.randomUUID(),
        ...data,
        createdAt: now,
        updatedAt: now,
      });
    }
  };

  const updateProfile = (data: Partial<UserProfile>) => {
    if (profile) {
      setProfile({ ...profile, ...data, updatedAt: new Date().toISOString() });
    }
  };

  return { profile, hasProfile, saveProfile, updateProfile, removeProfile, isLoaded };
}
