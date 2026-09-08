"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Person } from "./mock-data";

interface ProfileNav {
  /** Open a read-only profile for another person. */
  openPerson: (person: Person) => void;
}

const ProfileNavContext = createContext<ProfileNav>({ openPerson: () => {} });

export function ProfileNavProvider({
  openPerson,
  children,
}: {
  openPerson: (person: Person) => void;
  children: ReactNode;
}) {
  return <ProfileNavContext.Provider value={{ openPerson }}>{children}</ProfileNavContext.Provider>;
}

export function useProfileNav() {
  return useContext(ProfileNavContext);
}
