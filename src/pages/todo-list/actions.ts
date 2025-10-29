import { createTask, deleteTask, type Task } from "../../shared/api.ts";

type CreateTaskActionState = {
  title: string
  error?: string
}

export type CreateTaskAction = (
  state: CreateTaskActionState,
  formData: FormData
) => Promise<CreateTaskActionState>

export function createTaskAction({
  userId,
  refetchTasks,
}: {
  userId: string,
  refetchTasks: () => void,
}): CreateTaskAction {
  return async (state, formData) => {
    const title = formData.get("title") as string;

    try {
      const newTask: Task = {
        title,
        userId,
        done: false,
        createdAt: Date.now(),
        id: crypto.randomUUID()
      };

      await createTask(newTask);

      refetchTasks();

      return {
        title: ""
      };
    } catch (e) {
      return {
        title,
        error: "Error while creating task"
      };
    }
  };
}

type DeleteTaskActionState = {
  error?: string
}

export type DeleteTaskAction = (
  state: DeleteTaskActionState,
  formData: FormData
) => Promise<DeleteTaskActionState>

export function deleteTaskAction({
  refetchTasks,
}: {
  refetchTasks: () => void,
}): DeleteTaskAction {
  return async (state, formData) => {
    const id = formData.get("id") as string;

    try {
      await deleteTask(id);

      refetchTasks();

      return {};
    } catch (e) {
      return {
        error: "Error while deleting task"
      };
    }
  };
}
