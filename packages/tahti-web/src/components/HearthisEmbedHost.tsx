import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

type HearthisEmbedHostContextValue = {
  claimed: boolean;
  claim: () => () => void;
};

const HearthisEmbedHostContext =
  createContext<HearthisEmbedHostContextValue | null>(null);

export function HearthisEmbedHostProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [claimCount, setClaimCount] = useState(0);
  const claim = useCallback(() => {
    setClaimCount((count) => count + 1);
    return () => setClaimCount((count) => Math.max(0, count - 1));
  }, []);
  const value = useMemo(
    () => ({ claimed: claimCount > 0, claim }),
    [claimCount, claim],
  );
  return (
    <HearthisEmbedHostContext.Provider value={value}>
      {children}
    </HearthisEmbedHostContext.Provider>
  );
}

export function useHearthisEmbedClaim(active: boolean) {
  const ctx = useContext(HearthisEmbedHostContext);
  useEffect(() => {
    if (!active || !ctx) {
      return;
    }
    return ctx.claim();
  }, [active, ctx]);
}

export function useHearthisEmbedClaimed() {
  return useContext(HearthisEmbedHostContext)?.claimed ?? false;
}
