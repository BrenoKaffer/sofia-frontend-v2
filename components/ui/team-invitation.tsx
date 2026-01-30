import { type ReactNode } from 'react';
import Image from 'next/image';
import { Check, X } from 'lucide-react';

import { cn } from '@/lib/utils';

export type TeamInvitationProps = {
  title?: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
  left?: ReactNode;
  avatarSrc?: string;
  avatarAlt?: string;
  showStatusDot?: boolean;
  statusDotClassName?: string;
  right?: ReactNode;
  showActions?: boolean;
  onReject?: () => void;
  onAccept?: () => void;
  outerClassName?: string;
  cardClassName?: string;
};

export function TeamInvitation({
  title = 'Team Invitation',
  description = (
    <span>
      Kokonut invited you to join{' '}
      <span className="font-medium text-zinc-700 dark:text-zinc-300">Design Team</span>
    </span>
  ),
  meta = 'Invited 5 minutes ago',
  left,
  avatarSrc = 'https://ferf1mheo22r9ira.public.blob.vercel-storage.com/avatar-01-n0x8HFv8EUetf9z6ht0wScJKoTHqf8.png',
  avatarAlt = 'Sarah Chen',
  showStatusDot = true,
  statusDotClassName,
  right,
  showActions = true,
  onReject,
  onAccept,
  outerClassName,
  cardClassName,
}: TeamInvitationProps) {
  return (
    <div className={cn('w-full max-w-xl mx-auto', outerClassName)}>
      <div
        className={cn(
          'relative bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-[0_1px_6px_0_rgba(0,0,0,0.02)] rounded-xl p-4',
          cardClassName
        )}
      >
        <div className="flex items-center gap-4">
          <div className="relative h-10 w-10 flex-shrink-0">
            {left ?? (
              <Image
                src={avatarSrc}
                alt={avatarAlt}
                sizes="40px"
                fill
                className="rounded-full object-cover"
              />
            )}
            {showStatusDot ? (
              <div
                className={cn(
                  'absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white dark:ring-zinc-950',
                  statusDotClassName
                )}
              />
            ) : null}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300 truncate">{title}</div>
                <div className="text-[13px] text-zinc-500 dark:text-zinc-400 mt-0.5">{description}</div>
              </div>
            </div>
          </div>

          {right ? (
            <div className="flex items-center">{right}</div>
          ) : showActions ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onReject}
                className="rounded-lg flex items-center justify-center h-8 w-8 p-0 hover:bg-red-50 dark:hover:bg-red-950/50 text-zinc-400 hover:text-red-600 dark:text-zinc-500 dark:hover:text-red-400 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={onAccept}
                className={cn(
                  'rounded-lg flex items-center justify-center h-8 w-8 p-0',
                  'hover:bg-emerald-50 dark:hover:bg-emerald-950/50',
                  'text-zinc-400 hover:text-emerald-600',
                  'dark:text-zinc-500 dark:hover:text-emerald-400',
                  'transition-colors'
                )}
              >
                <Check className="h-4 w-4" />
              </button>
            </div>
          ) : null}
        </div>

        {meta ? (
          <div className="mt-2 ml-14">
            <div className="text-[12px] text-zinc-400 dark:text-zinc-500">{meta}</div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
