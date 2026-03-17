const KEY_PROFILE = 'tdys_ai_avatar_profile';
const KEY_DRAFT = 'tdys_ai_avatar_draft';
const KEY_TAGS = 'tdys_ai_avatar_tags';

export function loadDraft() {
  try {
    const raw = localStorage.getItem(KEY_DRAFT);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveDraft(draft) {
  try {
    localStorage.setItem(KEY_DRAFT, JSON.stringify(draft));
  } catch {
    // ignore
  }
}

export function clearDraft() {
  try {
    localStorage.removeItem(KEY_DRAFT);
  } catch {
    // ignore
  }
}

export function loadProfile() {
  try {
    const raw = localStorage.getItem(KEY_PROFILE);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveProfile(profile) {
  try {
    localStorage.setItem(KEY_PROFILE, JSON.stringify(profile));
  } catch {
    // ignore
  }
}

export function clearProfile() {
  try {
    localStorage.removeItem(KEY_PROFILE);
  } catch {
    // ignore
  }
}

export function loadTags() {
  try {
    const raw = localStorage.getItem(KEY_TAGS);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveTags(tagsPayload) {
  try {
    localStorage.setItem(KEY_TAGS, JSON.stringify(tagsPayload));
  } catch {
    // ignore
  }
}

export function clearTags() {
  try {
    localStorage.removeItem(KEY_TAGS);
  } catch {
    // ignore
  }
}

