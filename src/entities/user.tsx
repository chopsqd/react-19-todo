import { createContext, startTransition, use, useState } from "react";
import { create } from "zustand/react";
import type { User } from "../shared/api.ts";
import { fetchUsers } from "../shared/api.ts";

type UsersContextType = {
  usersPromise: Promise<User[]>,
  refetchUsers: () => void
}

const UsersContext = createContext<UsersContextType | null>(null);

const defaultUsersPromise = fetchUsers();

export function UsersProvider({ children }: { children: React.ReactNode }) {
  const [usersPromise, setUsersPromise] = useState(defaultUsersPromise);

  const refetchUsers = () =>
    startTransition(() => setUsersPromise(fetchUsers()));

  return (
    <UsersContext value={{ usersPromise, refetchUsers }}>
      {children}
    </UsersContext>
  );
}

export function useUsersGlobal() {
  const context = use(UsersContext);

  if (!context) {
    throw new Error("useUsers must be used within a UsersProvider");
  }

  return context;
}

// type UsersState = {
//   usersPromise: Promise<User[]>,
//   refetchUsers: () => void
// }
//
// Проблема: startTransition не работает в global state
// Для таких целей лучше использовать React Context
// export const useUsersGlobal = create<UsersState>((set) => ({
//   usersPromise: fetchUsers(),
//   refetchUsers: () =>
//     startTransition(() => set({ usersPromise: fetchUsers() }))
// }));
