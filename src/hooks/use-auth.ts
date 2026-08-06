import { useMutation } from "@tanstack/react-query";
import { useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuthContext } from "@/context/auth-context";

export function useAuth() {
  return useAuthContext();
}

function message(error: unknown) {
  return error instanceof Error ? error.message : "Authentication failed. Please try again.";
}

export function useSignOut() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { signOut } = useAuthContext();

  return useCallback(async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await signOut();
    await navigate({ to: "/auth", replace: true });
  }, [queryClient, signOut, navigate]);
}

export interface SignUpInput {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}

export function useEmailPasswordAuth(redirectPath: string) {
  const navigate = useNavigate();
  const isDefault = redirectPath === "/dashboard";
  const go = () => {
    if (isDefault) void navigate({ to: "/dashboard" });
    else window.location.assign(redirectPath);
  };

  const signIn = useMutation({
    mutationFn: async (input: { email: string; password: string }) => {
      const { error } = await supabase.auth.signInWithPassword(input);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Welcome back.");
      go();
    },
    onError: (error) => toast.error(message(error)),
  });

  const signUp = useMutation({
    mutationFn: async (input: SignUpInput) => {
      const { data, error } = await supabase.auth.signUp({
        email: input.email,
        password: input.password,
        options: {
          emailRedirectTo: `${window.location.origin}${redirectPath}`,
          data: { full_name: input.fullName, phone: input.phone ?? null },
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.session) {
        toast.success("Account created.");
        go();
      } else {
        toast.success("Check your email to confirm your account.");
      }
    },
    onError: (error) => toast.error(message(error)),
  });

  const google = useMutation({
    mutationFn: async () => {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}${redirectPath}`,
      });
      if (result.error) throw result.error;
      return result;
    },
    onSuccess: (result) => {
      if (!("redirected" in result && result.redirected)) {
        go();
      }
    },
    onError: (error) => toast.error(message(error)),
  });

  return { signIn, signUp, google };
}