const AVATAR_PALETTE = ['bg-violet-500', 'bg-amber-400', 'bg-emerald-500', 'bg-sky-500', 'bg-rose-500', 'bg-orange-500'] as const;

/** Deterministic badge color for a project, so the same project always gets the same color across renders. */
export function getAvatarColor(seed: string): string {
  const hash = [...seed].reduce((total, char) => total + char.charCodeAt(0), 0);
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}

export function getInitials(name: string): string {
  const [first = '', second = ''] = name.trim().split(/\s+/);
  const initials = second ? `${first[0]}${second[0]}` : first.slice(0, 2);
  return initials.toUpperCase();
}
