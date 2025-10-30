import { startTransition, useState } from "react";
import { fetchTasks } from "../../shared/api.ts";

export function useTasks({ userId }: { userId: string }) {
  const [paginatedTasksPromise, setTasksPromise] = useState(() =>
    fetchTasks({
      page: 1,
      filters: { userId, title: "" },
      sort: { createdAt: "asc" }
    })
  );

  const refetchTasks = async ({
    page,
    title = "",
    createdAt = "asc"
  }: {
    page?: number;
    title?: string;
    createdAt?: "asc" | "desc";
  } = {}) => {
    const nextPage = page ?? 1;

    startTransition(() =>
      setTasksPromise(
        fetchTasks({
          filters: { userId, title },
          page: nextPage,
          sort: { createdAt }
        })
      )
    );
  };

  return {
    paginatedTasksPromise,
    refetchTasks
  };
}
