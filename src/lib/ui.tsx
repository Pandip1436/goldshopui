import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

interface UIState {
  cartOpen: boolean;
  searchOpen: boolean;
  menuOpen: boolean;
  /** What a WhatsApp chat started from the current page should be about (e.g. a product). */
  chatTopic: string | null;
  openCart: () => void;
  setCartOpen: (v: boolean) => void;
  setSearchOpen: (v: boolean) => void;
  setMenuOpen: (v: boolean) => void;
  setChatTopic: (v: string | null) => void;
}

const Ctx = createContext<UIState | null>(null);

export function UIProvider({ children }: { children: ReactNode }) {
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [chatTopic, setChatTopic] = useState<string | null>(null);
  const openCart = useCallback(() => setCartOpen(true), []);
  const value = useMemo(
    () => ({ cartOpen, searchOpen, menuOpen, chatTopic, openCart, setCartOpen, setSearchOpen, setMenuOpen, setChatTopic }),
    [cartOpen, searchOpen, menuOpen, chatTopic, openCart],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useUI(): UIState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useUI must be used inside UIProvider');
  return v;
}
