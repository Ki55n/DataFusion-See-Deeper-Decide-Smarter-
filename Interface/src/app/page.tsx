"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { UserAuth } from "./context/AuthContext";

export default function Home() {
  const router = useRouter();
  const { user }: any = UserAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push("/login"); // Redirect to the login page if not authenticated
    } else {
      router.push("/dashboard/projects");
    }
    setLoading(false);
  }, [user, router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return <div>Data Fusion</div>;
}
