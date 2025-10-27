import { startTransition, Suspense, use, useState, useTransition } from "react";
import { createUser, deleteUser, fetchUsers, type User } from "../../shared/api.ts";
import { ErrorBoundary } from "react-error-boundary";

/*
 == Render as you fetch pattern ==
 "Render as You Fetch" — это паттерн, при котором запрос данных запускается сразу,
 до рендера компонента, чтобы начать загрузку как можно раньше и избежать задержек

 Компонент затем "подписывается" на результат этого запроса
 (например, через Suspense или обработку промиса),
 что позволяет рендерить UI параллельно с загрузкой данных, а не после неё
 */
const defaultUsersPromise = fetchUsers();

export function UsersPage() {
  const [usersPromise, setUsersPromise] = useState(defaultUsersPromise);
  const refetchUsers = () =>
    startTransition(() => setUsersPromise(fetchUsers()));

  return (
    <main className={"container mx-auto pt-10 flex flex-col gap-4"}>
      <h1 className={"text-3xl font-bold"}>Users:</h1>

      <CreateUserForm refetchUsers={refetchUsers} />

      <ErrorBoundary
        fallbackRender={(e) => (
          <div className={"text-red-500"}>
            Something went wrong: {JSON.stringify(e)}
          </div>
        )}
      >
        <Suspense fallback={<div>Loading...</div>}>
          <UsersList
            usersPromise={usersPromise}
            refetchUsers={refetchUsers}
          />
        </Suspense>
      </ErrorBoundary>
    </main>
  );
}

export function CreateUserForm({ refetchUsers }: { refetchUsers: () => void }) {
  const [email, setEmail] = useState("");

  /*
   useTransition() — позволяет пометить не срочные обновления состояния как переходы,
   чтобы они не блокировали рендер критически важного UI

   Суть: разделить обновления на срочные и не срочные

   isPending — выполняется ли сейчас Transition
   startTransition(() => { ... }) — обёртка для обновлений состояния

   isPending становится true сразу при вызове startTransition и остаётся true,
   пока все обновления состояния внутри колбэка startTransition не завершат рендер
   */
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Stale-While-Revalidate
    startTransition(async () => {
      await createUser({ email, id: crypto.randomUUID() });
      // Pessimistic update — ждём ответа от сервера, и только потом обновляем UI
      refetchUsers();
      setEmail("");
    });
  };

  return (
    <form
      className={"flex gap-2"}
      onSubmit={handleSubmit}
    >
      <input
        type="email"
        className={"border p-2 rounded"}
        disabled={isPending}
        value={email}
        onChange={e => setEmail(e.target.value)}
      />
      <button
        className={"bg-blue-500 rounded p-2 text-white disabled:bg-gray-400"}
        type={"submit"}
        disabled={isPending}
      >
        Add
      </button>
    </form>
  );
}

export function UsersList({
                            usersPromise,
                            refetchUsers
                          }: {
  usersPromise: Promise<User[]>,
  refetchUsers: () => void
}) {
  /*
   use() - прямо в рендере превращает промис в данные
   позволяет прямо в теле компонента "развернуть" промис в его результат,
   приостанавливая рендер через Suspense, пока промис не завершится
   */
  const users = use(usersPromise);

  return (
    <div className={"flex flex-col gap-2"}>
      {users.map(user =>
        <UserCard
          key={user.id}
          user={user}
          refetchUsers={refetchUsers}
        />
      )}
    </div>
  );
}

export function UserCard({
                           user,
                           refetchUsers
}: {
  user: User,
  refetchUsers: () => void
}) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    // Stale-While-Revalidate
    startTransition(async () => {
      await deleteUser(user.id);
      // Pessimistic update — ждём ответа от сервера, и только потом обновляем UI
      refetchUsers();
    });
  };

  return (
    <div className={"border p-2 rounded bg-gray-100 flex items-center"}>
      {user.email}

      <button
        type={"button"}
        disabled={isPending}
        onClick={handleDelete}
        className={"bg-red-500 text-white p-2 rounded ml-auto disabled:bg-gray-400"}
      >
        Delete
      </button>
    </div>
  );
}
