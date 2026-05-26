export const PROFILE_STORAGE_KEY = 'docintel_profile_settings';
export const PROFILE_UPDATED_EVENT = 'docintel-profile-updated';

export const DEFAULT_PROFILE = {
  name: 'Admin User',
  email: 'admin@docintel.ai',
  photo: '/profile.png',
};

export const loadProfileSettings = () => {
  try {
    const saved = localStorage.getItem(PROFILE_STORAGE_KEY);
    return {
      ...DEFAULT_PROFILE,
      ...(saved ? JSON.parse(saved) : {}),
    };
  } catch (err) {
    console.error('Failed to load profile settings:', err);
    return DEFAULT_PROFILE;
  }
};

export const saveProfileSettings = (profile) => {
  const nextProfile = {
    ...DEFAULT_PROFILE,
    ...profile,
  };

  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(nextProfile));
  window.dispatchEvent(new CustomEvent(PROFILE_UPDATED_EVENT, { detail: nextProfile }));
  return nextProfile;
};
