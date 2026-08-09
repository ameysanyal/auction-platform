"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth.store";
import { getMe } from "@/services/auth.service";

export const useAuth = () => {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const verifyAuth = async () => {
      try {
        if (!user) {
          const me = await getMe();
          if (isMounted && me) {
            setUser(me);
            setChecking(false);
            return;
          }
        }
      } catch (err) {
        if (isMounted) {
          setUser(null);
          router.push("/login");
        }
      } finally {
        if (isMounted) {
          setChecking(false);
        }
      }
    };

    verifyAuth();

    return () => {
      isMounted = false;
    };
  }, [user, setUser, router]);

  useEffect(() => {
    if (!checking && !user) {
      router.push("/login");
    }
  }, [checking, user, router]);
};