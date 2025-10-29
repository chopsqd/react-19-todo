import { createUser, deleteUser, type User } from "../../shared/api.ts";

type CreateUserActionState = {
  email: string
  error?: string
}

export type CreateUserAction = (
  state: CreateUserActionState,
  formData: FormData
) => Promise<CreateUserActionState>

export function createUserAction({
  refetchUsers,
  optimisticCreate
}: {
  refetchUsers: () => void,
  optimisticCreate: (user: User) => void
}): CreateUserAction {
  return async (state, formData) => {
    const email = formData.get("email") as string;

    if (email === "admin@mail.com") {
      return {
        error: "Admin account is not allowed",
        email
      };
    }

    try {
      const newUser: User = { email, id: crypto.randomUUID() };

      optimisticCreate(newUser);
      await createUser(newUser);

      refetchUsers();

      return {
        email: ""
      };
    } catch (e) {
      return {
        email,
        error: "Error while creating user"
      };
    }
  };
}

type DeleteUserActionState = {
  error?: string
}

export type DeleteUserAction = (
  state: DeleteUserActionState,
  formData: FormData
) => Promise<DeleteUserActionState>

export function deleteUserAction({
  refetchUsers,
  optimisticDelete
}: {
  refetchUsers: () => void,
  optimisticDelete: (id: string) => void
}): DeleteUserAction {
  return async (state, formData) => {
    const id = formData.get("id") as string;

    try {
      optimisticDelete(id)
      await deleteUser(id);

      refetchUsers();

      return {};
    } catch (e) {
      return {
        error: "Error while deleting user"
      };
    }
  };
}
