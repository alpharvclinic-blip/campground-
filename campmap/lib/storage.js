// Saved groups live in this browser's localStorage.
const GROUPS_KEY = 'campmap.groups.v1';

export function loadGroups() {
  try {
    const value = JSON.parse(localStorage.getItem(GROUPS_KEY) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function saveGroups(groups) {
  localStorage.setItem(GROUPS_KEY, JSON.stringify(groups));
}
