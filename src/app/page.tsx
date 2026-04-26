"use client";

import { useEffect, useState } from "react";
import Login from "../components/Login";
import MainTracker from "../components/MainTracker";
import { useAuthStore } from "../store/authStore";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const role = useAuthStore((state) => state.role);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "var(--background)" }}>
      {role ? <MainTracker /> : <Login />}
    </main>
  );
}
