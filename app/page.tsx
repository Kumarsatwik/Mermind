"use client";
import { Button } from "@/components/ui/button";
import useAuth from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push("/dashboard");
      return;
    }
    router.push("/auth/signin");
  }, [user, router]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-4xl font-bold">Mermind</h1>
      <p className="text-lg">
        Generate Mermaid diagrams from natural language descriptions
      </p>

      <Button onClick={() => router.push("/auth/signin")}>Get Started</Button>
    </div>
  );
}
