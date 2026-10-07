import type { AuthUser } from '@juandavidfuentes/indomitox-shared';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

/** Iniciales del nombre ("Valentina Rueda" → "VR"). */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? [parts[0]![0], parts.at(-1)![0]] : [parts[0]?.[0]];
  return letters.join('').toUpperCase();
}

/** Foto de Google si la hay; si no, las iniciales sobre la marca (texto Noche, 5,3:1). La foto propia llega con F3. */
export function UserAvatar({
  user,
  className,
  textClassName = 'text-sm',
}: {
  user: Pick<AuthUser, 'name' | 'avatarUrl'>;
  className?: string;
  textClassName?: string;
}) {
  return (
    <Avatar className={className}>
      {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" referrerPolicy="no-referrer" /> : null}
      <AvatarFallback className={`bg-brand font-display font-bold text-night ${textClassName}`}>{initials(user.name)}</AvatarFallback>
    </Avatar>
  );
}
