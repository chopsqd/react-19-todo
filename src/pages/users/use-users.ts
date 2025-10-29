import { use, useOptimistic } from "react";
import { type User } from "../../shared/api.ts";
import { createUserAction, deleteUserAction } from "./actions.ts";
import { useUsersGlobal } from "../../entities/user.tsx";

export function useUsers() {
  const { usersPromise, refetchUsers } = useUsersGlobal();

  const [createdUsers, optimisticCreate] = useOptimistic(
    [] as User[],
    (createdUsers, user: User) => [...createdUsers, user]
  );

  const [deletedUsersIds, optimisticDelete] = useOptimistic(
    [] as string[],
    (deletedUsersIds, id: string) => deletedUsersIds.concat(id)
  );

  const useUsersList = () => {
    const users = use(usersPromise);

    return users
      .concat(createdUsers)
      .filter(user => !deletedUsersIds.includes(user.id));
  };

  return {
    createUserAction: createUserAction({ refetchUsers, optimisticCreate }),
    deleteUserAction: deleteUserAction({ refetchUsers, optimisticDelete }),
    useUsersList
  } as const;
}
