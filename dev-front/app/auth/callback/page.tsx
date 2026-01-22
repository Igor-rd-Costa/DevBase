"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";

function AuthCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { login } = useAuth();
  const token = searchParams.get("token");
  const [hasProcessed, setHasProcessed] = useState(false);

  useEffect(() => {
    if (hasProcessed) return;

    const processAuth = async () => {
      if (token) {
        setHasProcessed(true);
        await login(token);
        router.push("/");
      } else {
        setHasProcessed(true);
        router.push("/");
      }
    };

    processAuth();
  }, [token, login, router, hasProcessed]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div>Completing authentication...</div>
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen">
        <div>Loading...</div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}

