"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Activity } from "lucide-react";
import { FormField } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

const schema = z
  .object({
    displayName: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(64, "Name must be 64 characters or fewer"),
    email: z.string().email("Enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Include at least one uppercase letter")
      .regex(/[0-9]/, "Include at least one number"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

export default function SignupPage() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    const supabase = createClient();
    let error: Error | null = null;

    try {
      const result = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: { display_name: data.displayName },
        },
      });
      error = result.error;
    } catch {
      toast.error(
        "Could not reach Supabase. Check NEXT_PUBLIC_SUPABASE_URL in .env."
      );
      return;
    }

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Account created! Redirecting…");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#FAFAF9] px-4 dark:bg-[#0C0A09]">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1E40AF]">
            <Activity className="h-6 w-6 text-white" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            Create your account
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Start managing your tests in one place
          </p>
        </div>

        {/* Form card */}
        <div className="rounded-lg border border-[#E7E5E4] bg-white p-6 shadow-sm dark:border-[#292524] dark:bg-[#1C1917]">
          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="space-y-4"
            aria-label="Create account form"
          >
            <FormField
              label="Display name"
              type="text"
              autoComplete="name"
              required
              placeholder="Jane Smith"
              error={errors.displayName?.message}
              {...register("displayName")}
            />
            <FormField
              label="Email"
              type="email"
              autoComplete="email"
              required
              placeholder="jane@company.com"
              error={errors.email?.message}
              {...register("email")}
            />
            <FormField
              label="Password"
              type="password"
              autoComplete="new-password"
              required
              hint="At least 8 characters, one uppercase, one number"
              error={errors.password?.message}
              {...register("password")}
            />
            <FormField
              label="Confirm password"
              type="password"
              autoComplete="new-password"
              required
              error={errors.confirmPassword?.message}
              {...register("confirmPassword")}
            />
            <Button type="submit" loading={isSubmitting} className="w-full">
              Create account
            </Button>
          </form>
        </div>

        <p className="mt-4 text-center text-sm text-[var(--text-secondary)]">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-[#1E40AF] hover:underline dark:text-[#60A5FA]"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
