"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button, Input, Label, TextField } from "react-aria-components";
import { RiAppleFill, RiArrowLeftLine, RiGithubFill, RiGoogleFill } from "@remixicon/react";
import { useAuth } from "@/lib/auth-context";
import { useT } from "@/lib/settings-context";
import { InputOtp } from "@/components/base/input-otp";
import { PhoneInput, formatPhone } from "@/components/base/phone-input";
import { cx } from "@/utils/cx";

export type AuthMode = "signin" | "signup";

/** The demo verification code — no SMS gateway behind this build. */
const DEMO_CODE = "123456";

/**
 * Recreation of BoardUI's <AuthCard>. Sign-up collects both an email and a
 * phone number; sign-in takes either one. A phone always goes through an SMS
 * code step before the account is created or entered.
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
  onPendingChange?: (pending: boolean, mode: AuthMode) => void;
}) {
  const { signIn, signUp } = useAuth();
  const t = useT();

  const [mode, setMode] = useState<AuthMode>(modeProp ?? "signin");
  /** Sign-in only: which identifier the user is typing. */
  const [method, setMethod] = useState<"email" | "phone">("email");
  const [step, setStep] = useState<"form" | "otp">("form");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [fullPhone, setFullPhone] = useState("");
  const [code, setCode] = useState("");
  const [codeInvalid, setCodeInvalid] = useState(false);

  const isSignup = mode === "signup";
  const usesPhone = isSignup || method === "phone";

  const heading = title ?? (isSignup ? t("signUpTitle") : t("signInTitle"));
  const sub = description ?? (isSignup ? t("signUpSub") : t("signInSub"));

  const [pending, setPending] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const finish = () => {
    setPending(true);
    onPendingChange?.(true, mode);
    timer.current = setTimeout(() => {
      if (isSignup) signUp(name.trim(), email.trim(), fullPhone);
      else if (method === "phone") signIn({ phone: fullPhone });
      else signIn({ email: email.trim() });
    }, 2600);
  };

  const canSubmitForm = isSignup
    ? name.trim().length > 1 && email.trim().length > 3 && phone.length >= 6 && password.length >= 8
    : method === "email"
      ? email.trim().length > 3 && password.length >= 8
      : phone.length >= 6;

  const submitForm = () => {
    if (!canSubmitForm || pending) return;
    // Anything involving a phone number needs the SMS code first.
    if (usesPhone) {
      setCode("");
      setCodeInvalid(false);
      setStep("otp");
    } else {
      finish();
    }
  };

  const verify = (entered: string) => {
    if (entered === DEMO_CODE) finish();
    else setCodeInvalid(true);
  };

  if (pending) return null;

  const shell = (children: ReactNode) => (
    <div
      className={cx(
        "w-full max-w-md rounded-3xl border border-line bg-surface p-7 shadow-panel sm:p-9",
        className,
      )}
    >
      {children}
    </div>
  );

  // ---- Step 2: SMS code ----------------------------------------------------
  if (step === "otp") {
    return shell(
      <>
        <button
          onClick={() => setStep("form")}
          className="mb-4 flex items-center gap-1.5 text-sm font-medium text-muted transition hover:text-ink"
        >
          <RiArrowLeftLine className="size-4" />
          {t("changeNumber")}
        </button>

        <div className={cx("flex flex-col gap-2", centered && "items-center text-center")}>
          {logo && <div className="mb-3">{logo}</div>}
          <h1 className="text-2xl font-bold tracking-tight text-ink">{t("verifyPhone")}</h1>
          <p className="text-sm text-muted">
            {t("verifyPhoneSub")} <span className="font-medium text-ink">{formatPhone(fullPhone)}</span>
          </p>
        </div>

        <div className={cx("mt-7 flex flex-col gap-3", centered && "items-center")}>
          <InputOtp
            aria-label={t("verificationCode")}
            groupEvery={3}
            value={code}
            onChange={(v) => {
              setCode(v);
              setCodeInvalid(false);
            }}
            onComplete={verify}
            isInvalid={codeInvalid}
          />
          {codeInvalid && <p className="text-sm text-danger">{t("wrongCode")}</p>}
        </div>

        <button
          onClick={() => verify(code)}
          disabled={code.length < 6}
          className="mt-6 h-11 w-full rounded-xl bg-accent text-sm font-semibold text-white transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t("verify")}
        </button>

        <button
          onClick={() => {
            setCode("");
            setCodeInvalid(false);
          }}
          className="mt-3 w-full text-center text-sm font-medium text-accent hover:underline"
        >
          {t("resendCode")}
        </button>
      </>,
    );
  }

  // ---- Step 1: credentials -------------------------------------------------
  return shell(
    <>
      <div className={cx("flex flex-col gap-2", centered && "items-center text-center")}>
        {logo && <div className="mb-3">{logo}</div>}
        <h1 className="text-2xl font-bold tracking-tight text-ink">{heading}</h1>
        <p className="text-sm text-muted">{sub}</p>
      </div>

      {/* Sign-in lets you pick which identifier to use */}
      {!isSignup && (
        <div className="mt-6 flex gap-1 rounded-full bg-surface-2 p-1">
          {(["email", "phone"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMethod(m)}
              className={cx(
                "flex-1 rounded-full py-2 text-sm font-medium transition",
                method === m ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink",
              )}
            >
              {m === "email" ? t("useEmail") : t("usePhone")}
            </button>
          ))}
        </div>
      )}

      <form
        className="mt-5 flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          submitForm();
        }}
      >
        {isSignup && (
          <Field label={t("fullName")} placeholder="Ada Lovelace" value={name} onChange={setName} autoComplete="name" />
        )}

        {(isSignup || method === "email") && (
          <Field
            label={t("email")}
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={setEmail}
            autoComplete="email"
            hint={isSignup ? t("emailHint") : undefined}
          />
        )}

        {usesPhone && (
          <PhoneInput
            label={t("phoneNumber")}
            value={phone}
            onChange={(national, full) => {
              setPhone(national);
              setFullPhone(full);
            }}
          />
        )}

        {(isSignup || method === "email") && (
          <Field
            label={t("password")}
            type="password"
            placeholder="At least 8 characters"
            value={password}
            onChange={setPassword}
            autoComplete={isSignup ? "new-password" : "current-password"}
          />
        )}

        {!isSignup && method === "email" && (
          <div className="flex items-center justify-between text-sm">
            <label className="flex cursor-pointer items-center gap-2 text-muted">
              <input type="checkbox" defaultChecked className="accent-[var(--accent)]" />
              {t("rememberMe")}
            </label>
            <button type="button" className="font-medium text-accent hover:underline">
              {t("forgotPassword")}
            </button>
          </div>
        )}

        <Button
          type="submit"
          isDisabled={!canSubmitForm}
          className={cx(
            "mt-1 flex h-11 w-full items-center justify-center rounded-xl bg-accent text-sm font-semibold text-white transition",
            "hover:bg-accent-strong data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
            "outline-none data-[focus-visible]:ring-2 data-[focus-visible]:ring-accent data-[focus-visible]:ring-offset-2 data-[focus-visible]:ring-offset-surface",
          )}
        >
          {isSignup ? t("createAccount") : t("signIn")}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs text-faint">
        <span className="h-px flex-1 bg-line" />
        {t("orContinueWith")}
        <span className="h-px flex-1 bg-line" />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Social icon={<RiGoogleFill className="size-5" />} label="Google" />
        <Social icon={<RiAppleFill className="size-5" />} label="Apple" />
        <Social icon={<RiGithubFill className="size-5" />} label="GitHub" />
      </div>

      <p className="mt-6 text-center text-sm text-muted">
        {isSignup ? `${t("alreadyHaveAccount")} ` : `${t("newHere")} `}
        <button
          type="button"
          onClick={() => {
            setMode(isSignup ? "signin" : "signup");
            setStep("form");
          }}
          className="font-semibold text-accent hover:underline"
        >
          {isSignup ? t("signIn") : t("createAccount")}
        </button>
      </p>
    </>,
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
