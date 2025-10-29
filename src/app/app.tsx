import { Route, Routes } from "react-router-dom";
import { UsersProvider } from "../entities/user.tsx";
import { UsersPage } from "../pages/users";
import { TodoListPage } from "../pages/todo-list";

export function App() {
  return (
    <UsersProvider>
      <Routes>
        <Route path={"/"} element={<UsersPage />} />
        <Route path={"/:userId/tasks"} element={<TodoListPage />} />
      </Routes>
    </UsersProvider>
  );
}
