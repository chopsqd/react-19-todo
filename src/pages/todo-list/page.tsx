import { startTransition, Suspense, use, useActionState, useMemo, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import type { Task } from "../../shared/api.ts";
import { useParams } from "react-router-dom";
import { fetchTasks } from "../../shared/api.ts";
import { createTaskAction, deleteTaskAction } from "./actions.ts";
import { useUsersGlobal } from "../../entities/user.tsx";

export function TodoListPage() {
  const { userId = "" } = useParams();

  const [paginatedTasksPromise, setTasksPromise] = useState(() =>
    fetchTasks({ filters: { userId } })
  );

  const refetchTasks = () =>
    startTransition(() => setTasksPromise(fetchTasks({ filters: { userId } })));

  // Не создавай новый промис при каждом рендере —
  // используй тот же самый, пока исходный промис не изменился
  const tasksPromise = useMemo(
    () => paginatedTasksPromise.then(r => r.data),
    [paginatedTasksPromise]
  );

  return (
    <main className={"container mx-auto pt-10 flex flex-col gap-4"}>
      <h1 className={"text-3xl font-bold"}>
        Tasks of user: {userId}
      </h1>

      <CreateTaskForm
        userId={userId}
        refetchTasks={refetchTasks}
      />

      <ErrorBoundary
        fallbackRender={(e) => (
          <div className={"text-red-500"}>
            Something went wrong: {JSON.stringify(e)}
          </div>
        )}
      >
        <Suspense fallback={<div>Loading...</div>}>
          <TasksList
            refetchTasks={refetchTasks}
            tasksPromise={tasksPromise}
          />
        </Suspense>
      </ErrorBoundary>
    </main>
  );
}

function UserPreview({ userId }: { userId: string }) {
  const { usersPromise } = useUsersGlobal();
  const users = use(usersPromise);

  return <span>{users.find(u => u.id === userId)?.email}</span>;
}

export function CreateTaskForm({
  userId,
  refetchTasks
}: {
  userId: string,
  refetchTasks: () => void
}) {
  const [state, dispatch, isPending] = useActionState(
    createTaskAction({ refetchTasks, userId }),
    { title: "" }
  );

  return (
    <form
      className={"flex gap-2"}
      action={dispatch}
    >
      <input
        name="title"
        type="text"
        className={"border p-2 rounded"}
        defaultValue={state.title}
      />
      <button
        className={"bg-blue-500 rounded p-2 text-white disabled:bg-gray-400"}
        type={"submit"}
        disabled={isPending}
      >
        Add
      </button>
      {state.error && <div className={"text-red-500"}>{state.error}</div>}
    </form>
  );
}

export function TasksList({
  tasksPromise,
  refetchTasks
}: {
  tasksPromise: Promise<Task[]>,
  refetchTasks: () => void
}) {
  const tasks: Task[] = use(tasksPromise);

  return (
    <div className={"flex flex-col gap-2"}>
      {tasks.map(task =>
        <TaskCard
          key={task.id}
          task={task}
          refetchTasks={refetchTasks}
        />
      )}
    </div>
  );
}

export function TaskCard({
  task,
  refetchTasks
}: {
  task: Task,
  refetchTasks: () => void
}) {
  const [state, handleDelete, isPending] = useActionState(
    deleteTaskAction({ refetchTasks }),
    {}
  );

  return (
    <div className={"border p-2 rounded bg-gray-100 flex items-center"}>
      {task.title} -
      <Suspense fallback={<div>Loading...</div>}>
        <UserPreview userId={task.userId} />
      </Suspense>

      <form
        action={handleDelete}
        className={"ml-auto "}
      >
        <input
          type="hidden"
          name={"id"}
          value={task.id}
        />
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
