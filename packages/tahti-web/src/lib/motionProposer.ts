import type { GovernanceMotion } from '../api/types';
import { safeCreditName } from './displayName';

type NamedUser = { displayName?: string | null; username: string };

export function isMotionProposer(
  motion: GovernanceMotion,
  user: NamedUser | null | undefined,
): boolean {
  if (!user || !motion.proposer) {
    return false;
  }
  return motion.proposer === safeCreditName(user.displayName, user.username);
}
