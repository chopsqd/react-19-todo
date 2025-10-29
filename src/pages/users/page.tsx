import { Suspense, useActionState, useOptimistic, useRef } from "react";
import { type User } from "../../shared/api.ts";
import { ErrorBoundary } from "react-error-boundary";
import { type CreateUserAction, type DeleteUserAction } from "./actions.ts";
import { useUsers } from "./use-users.ts";
import { Link } from "react-router-dom";

/*
  == Render as you fetch pattern ==
  "Render as You Fetch" — это паттерн, при котором запрос данных запускается сразу,
  до рендера компонента, чтобы начать загрузку как можно раньше и избежать задержек

  Компонент затем "подписывается" на результат этого запроса
  (например, через Suspense или обработку промиса),
  что позволяет рендерить UI параллельно с загрузкой данных, а не после неё
*/
// const defaultUsersPromise = fetchUsers();

/*
  useActionState() — для работы с формами и асинхронными действиями

  Запоминает результат последнего действия и обновляет состояние автоматически,
  когда действие завершается

  useActionState(action-функция, начальное состояние)
*/
// const [state, dispatch, isPending] = useActionState(
//   createUserAction({ refetchUsers }),
//   { email: "" }
// );

/*
  useTransition() — позволяет пометить не срочные обновления состояния как переходы,
  чтобы они не блокировали рендер критически важного UI

  Суть: разделить обновления на срочные и не срочные

  isPending — выполняется ли сейчас Transition
  startTransition(() => { ... }) — обёртка для обновлений состояния

  isPending становится true сразу при вызове startTransition и остаётся true,
  пока все обновления состояния внутри колбэка startTransition не завершат рендер
*/
// const [isPending, startTransition] = useTransition();

/*
  use() - прямо в рендере превращает промис в данные

  Позволяет прямо в теле компонента "развернуть" промис в его результат,
  приостанавливая рендер через Suspense, пока промис не завершится
*/
// const users = use(usersPromise);

/*
   useOptimistic() - мгновенно показывает изменение в UI, пока ждём ответ от сервера

     Принимает:
    - настоящее состояние
    - функцию: (настоящее_состояние, новое_временное_значение) => обновлённое_временное_состояние

    Возвращает:
    - [временное_состояние, запустить_оптимистичное_обновление]
*/
// const [optimisticUsers, addOptimistic] = useOptimistic(
//   users,                                     // настоящее состояние
//   (state, newUser) => [...state, newUser]    // как оно выглядит "сразу"
// );

export function UsersPage() {
  const { useUsersList, createUserAction, deleteUserAction } = useUsers();

  return (
    <main className={"container mx-auto pt-10 flex flex-col gap-4"}>
      <h1 className={"text-3xl font-bold"}>Users:</h1>

      <CreateUserForm createUserAction={createUserAction} />

      <ErrorBoundary
        fallbackRender={(e) => (
          <div className={"text-red-500"}>
            Something went wrong: {JSON.stringify(e)}
          </div>
        )}
      >
        <Suspense fallback={<div>Loading...</div>}>
          <UsersList
            useUsersList={useUsersList}
            deleteUserAction={deleteUserAction}
          />
        </Suspense>
      </ErrorBoundary>
    </main>
  );
}

export function CreateUserForm({
  createUserAction
}: {
  createUserAction: CreateUserAction
}) {
  const [state, dispatch, isPending] = useActionState(createUserAction, { email: "" });

  const [optimisticState, setOptimisticState] = useOptimistic(state);

  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      className={"flex gap-2"}
      action={(formData: FormData) => {
        setOptimisticState({ email: "" });
        dispatch(formData);
        formRef.current?.reset();
      }}
    >
      <input
        name="email"
        type="email"
        disabled={isPending}
        className={"border p-2 rounded"}
        defaultValue={optimisticState.email}
      />
      <button
        className={"bg-blue-500 rounded p-2 text-white disabled:bg-gray-400"}
        disabled={isPending}
        type={"submit"}
      >
        Add
      </button>
      {optimisticState.error && <div className={"text-red-500"}>{optimisticState.error}</div>}
    </form>
  );
}

export function UsersList({
  useUsersList,
  deleteUserAction
}: {
  useUsersList: () => User[],
  deleteUserAction: DeleteUserAction
}) {
  const users = useUsersList();

  return (
    <div className={"flex flex-col gap-2"}>
      {users.map(user =>
        <UserCard
          key={user.id}
          user={user}
          deleteUserAction={deleteUserAction}
        />
      )}
    </div>
  );
}

export function UserCard({
  user,
  deleteUserAction
}: {
  user: User,
  deleteUserAction: DeleteUserAction
}) {
  const [state, handleDelete, isPending] = useActionState(deleteUserAction, {});

  return (
    <div className={"border p-2 rounded bg-gray-100 flex items-center"}>
      {user.email}

      <form
        action={handleDelete}
        className={"ml-auto "}
      >
        <input
          type="hidden"
          name={"id"}
          value={user.id}
        />
        <Link
          to={`/${user.id}/tasks`}
          className={"bg-blue-500 text-white p-2 rounded disabled:bg-gray-400"}
        >
          Tasks
        </Link>
        <button
          type={"submit"}
          disabled={isPending}
          className={"bg-red-500 text-white p-2 rounded disabled:bg-gray-400"}
        >
          Delete

          {state.error && <div>{state.error}</div>}
        </button>
      </form>
    </div>
  );
}
