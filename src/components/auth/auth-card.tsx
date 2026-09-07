"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button, Input, Label, TextField } from "react-aria-components";
import { RiAppleFill, RiGithubFill, RiGoogleFill } from "@remixicon/react";
import { useAuth } from "@/lib/auth-context";
import { cx } from "@/utils/cx";

export type AuthMode = "signin" | "signup";

/**
 * Recreation of BoardUI's <AuthCard>. `logo` takes a node (your mark), so the
 * card owns layout, not the image source. Left-aligned by default; pass
 * `centered` to center the header. Auth is mocked via the local AuthProvider.
 */
export function AuthCard({
  mode: modeProp,
  centered = false,
  logo,
  title,
  description,
  className,
  onPendingChange,
}: {
  mode?: AuthMode;
  centered?: boolean;
  logo?: ReactNode;
  title?: string;
  description?: string;
  className?: string;
  /** Fired while the "configuring your account" beat is running. */
  onPendingChange?: (pending: boolean, mode: AuthMode) => void;
}) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<AuthMode>(modeProp ?? "signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const isSignup = mode === "signup";
  const heading = title ?? (isSignup ? "Create your account" : "Sign in to Vion");
  const sub =
    description ??
    (isSignup
      ? "Start building your world on Vion in a couple of minutes."
      : "Welcome back. Pick up right where you left off.");

  const canSubmit =
    email.trim().length > 3 && password.length >= 8 && (!isSignup || name.trim().length > 1);

  // Brief "configuring your account" beat before we drop the user into the app.
  const [pending, setPending] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const submit = () => {
    if (!canSubmit || pending) return;
    setPending(true);
    onPendingChange?.(true, mode);
    timer.current = setTimeout(() => {
      if (isSignup) signUp(name.trim(), email.trim());
      else signIn(email.trim());
    }, 2600);
  };

  // Stays mounted (so the timer survives) but hands the screen to the loader.
  if (pending) return null;

  return (
    <div
      className={cx(
        "w-full max-w-md rounded-3xl border border-line bg-surface p-7 shadow-panel sm:p-9",
        className,
      )}
    >
      <div className={cx("flex flex-col gap-2", centered && "items-center text-center")}>
        {logo && <div className="mb-3">{logo}</div>}
        <h1 className="text-2xl font-bold tracking-tight text-ink">{heading}</h1>
        <p className="text-sm text-muted">{sub}</p>
      </div>

      <form
        className="mt-7 flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        {isSignup && (
          <Field label="Full name" placeholder="Ada Lovelace" value={name} onChange={setName} autoComplete="name" />
        )}
        <Field
          label="Email"
          type="email"
          placeholder="you@company.com"
          value={email}
          onChange={setEmail}
          autoComplete="email"
          hint={isSignup ? "We'll use it to reach you and never share it." : undefined}
        />
        <Field
          label="Password"
          type="password"
          placeholder="At least 8 characters"
          value={password}
          onChange={setPassword}
          autoComplete={isSignup ? "new-password" : "current-password"}
        />

        {!isSignup && (
          <div className="flex items-center justify-between text-sm">
            <label className="flex cursor-pointer items-center gap-2 text-muted">
              <input type="checkbox" defaultChecked className="accent-[var(--accent)]" />
              Remember me
            </label>
            <button type="button" className="font-medium text-accent hover:underline">
              Forgot password?
            </button>
          </div>
        )}

        <Button
          type="submit"
          isDisabled={!canSubmit}
          className={cx(
            "mt-1 flex h-11 w-full items-center justify-center rounded-xl bg-accent text-sm font-semibold text-white transition",
            "hover:bg-accent-strong data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
            "outline-none data-[focus-visible]:ring-2 data-[focus-visible]:ring-accent data-[focus-visible]:ring-offset-2 data-[focus-visible]:ring-offset-surface",
          )}
        >
          {isSignup ? "Create account" : "Sign in"}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs text-faint">
        <span className="h-px flex-1 bg-line" />
        or continue with
        <span className="h-px flex-1 bg-line" />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Social icon={<RiGoogleFill className="size-5" />} label="Google" />
        <Social icon={<RiAppleFill className="size-5" />} label="Apple" />
        <Social icon={<RiGithubFill className="size-5" />} label="GitHub" />
      </div>

      <p className="mt-6 text-center text-sm text-muted">
        {isSignup ? "Already have an account? " : "New here? "}
        <button
          type="button"
          onClick={() => setMode(isSignup ? "signin" : "signup")}
          className="font-semibold text-accent hover:underline"
        >
          {isSignup ? "Sign in" : "Create account"}
        </button>
      </p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  hint,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  hint?: string;
  autoComplete?: string;
}) {
  return (
    <TextField className="flex flex-col gap-1.5">
      <Label className="text-sm font-medium text-ink">{label}</Label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={cx(
          "h-11 w-full rounded-xl border border-line bg-surface-2 px-3.5 text-sm text-ink outline-none transition",
          "placeholder:text-faint focus:border-accent focus:ring-2 focus:ring-accent/30",
        )}
      />
      {hint && <p className="text-xs text-faint">{hint}</p>}
    </TextField>
  );
}

function Social({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <button
      type="button"
      aria-label={`Continue with ${label}`}
      className="flex h-11 items-center justify-center rounded-xl border border-line bg-surface text-ink transition hover:bg-surface-3"
    >
      {icon}
    </button>
  );
}
