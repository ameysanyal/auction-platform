"use client";

import {
  useRouter,
} from "next/navigation";

import {
  useEffect,
  useState,
} from "react";

import {
  useAuthStore,
} from "@/store/auth.store";

export const useAuth =
  () => {
    const router =
      useRouter();

    const { token } =
      useAuthStore();

    // Track whether the Zustand persist middleware
    // has finished rehydrating from localStorage.
    // Without this, on page refresh the store briefly
    // shows token=null (before hydration) and wrongly
    // redirects to /login.
    const [hydrated, setHydrated] =
      useState(false);

    useEffect(() => {
      setHydrated(true);
    }, []);

    useEffect(() => {
      if (hydrated && !token) {
        router.push(
          "/login"
        );
      }
    }, [
      token,
      router,
      hydrated,
    ]);
  };