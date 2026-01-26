import { useState, useEffect } from "react";
import { Toaster } from "@/app/components/ui/sonner";
import { SignIn } from "@/app/components/SignIn";
import { Dashboard } from "@/app/components/Dashboard";
import { Task } from "@/app/types";
import { toast } from "sonner";

export default function App() {
  const [user, setUser] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
const handleUpdateTask = (updatedTask: Task) => {
  setTasks((prev) =>
    prev.map((task) =>
      task.id === updatedTask.id ? updatedTask : task
    )
  );
};

useEffect(() => {
  // Load user
  const savedUser = localStorage.getItem("user");
  if (savedUser) {
    const userData = JSON.parse(savedUser);
    setUser(userData.email);
  }

  // Load tasks
 const savedTasks = localStorage.getItem("tasks");
if (savedTasks) {
  setTasks(JSON.parse(savedTasks));
} else {
  setTasks([]); // ✅ start empty
}



  // Load theme
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.documentElement.classList.add("dark");
  }
}, []);

useEffect(() => {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}, [tasks]);


  const handleSignIn = (email: string) => {
    setUser(email);
  };

  const handleAddTask = (task: Task) => {
    const updatedTasks = [...tasks, task];
    setTasks(updatedTasks);
    localStorage.setItem("tasks", JSON.stringify(updatedTasks));
  };

  const handleDeleteTask = (id: string) => {
    const updatedTasks = tasks.filter((task) => task.id !== id);
    setTasks(updatedTasks);
    localStorage.setItem("tasks", JSON.stringify(updatedTasks));
  };

  const handleToggleComplete = (id: string) => {
    const updatedTasks = tasks.map((task) =>
      task.id === id
        ? { ...task, completed: !task.completed }
        : task,
    );
    setTasks(updatedTasks);
    localStorage.setItem("tasks", JSON.stringify(updatedTasks));

    const task = tasks.find((t) => t.id === id);
    if (task) {
      toast.success(
        task.completed
          ? "Task marked as pending"
          : "Task completed! 🎉",
      );
    }
  };

  if (!user) {
    return (
      <>
        <SignIn onSignIn={handleSignIn} />
        <Toaster position="top-center" richColors />
      </>
    );
  }

  return (
    <>
      <Dashboard
        userEmail={user}
        tasks={tasks}
        onAddTask={handleAddTask}
        onDeleteTask={handleDeleteTask}
        onToggleComplete={handleToggleComplete}
        onUpdateTask={handleUpdateTask}
      />
      <Toaster position="top-center" richColors />
    </>
  );
}