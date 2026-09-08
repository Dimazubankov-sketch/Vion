"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { RiAppleFill, RiArrowLeftLine, RiGithubFill, RiGoogleFill } from "@remixicon/react";
import { useAuth } from "@/lib/auth-context";
import { useT } from "@/lib/settings-context";
import {
  EMAIL_DOMAIN,
  createAccount,
  findAccount,
  findAccountByPhone,
  normalizeUsername,
  usernameTaken,
  verifyAccount,
} from "@/lib/accounts";
import { Input } from "@/components/base/input";
import { InputOtp } from "@/components/base/input-otp";
import { PhoneInput, formatPhone } from "@/components/base/phone-input";
import { cx } from "@/utils/cx";

export type AuthMode = "signin" | "signup";

/** The demo verification code — no SMS gateway behind this build. */
const DEMO_CODE = "123456";

/** "ada.lovelace" → "Ada Lovelace", for accounts with no stored name. */
function titleCase(value: string) {
  return normalizeUsername(value)
    .replace(/[._-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Accounts live on the @voidops.ru domain, so the field takes a username and
 * the domain is appended for you. Sign-up collects a username, email domain,
 * phone and password; sign-in takes the username + password, or the phone.
 * Any phone route goes through an SMS code before the account opens.
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
  const [method, setMethod] = useState<"email" | "phone">("email");
  const [step, setStep] = useState<"form" | "otp">("form");

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [fullPhone, setFullPhone] = useState("");
  const [code, setCode] = useState("");
  const [codeInvalid, setCodeInvalid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Which fields to paint red. */
  const [badFields, setBadFields] = useState<{ username?: boolean; password?: boolean; phone?: boolean }>({});

  const isSignup = mode === "signup";
  const usesPhone = isSignup || method === "phone";

  const heading = title ?? (isSignup ? t("signUpTitle") : t("signInTitle"));
  const sub = description ?? (isSignup ? t("signUpSub") : t("signInSub"));

  const [pending, setPending] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const clearErrors = () => {
    setError(null);
    setBadFields({});
  };

  const fail = (message: string, fields: typeof badFields) => {
    setError(message);
    setBadFields(fields);
  };

  const enter = (account: { username: string; name: string; phone?: string }) => {
    setPending(true);
    onPendingChange?.(true, mode);
    timer.current = setTimeout(() => {
      if (isSignup) signUp(account.name, account.username, account.phone ?? "");
      else signIn(account);
    }, 2600);
  };

  const canSubmitForm = isSignup
    ? name.trim().length > 1 && normalizeUsername(username).length > 1 && phone.length >= 6 && password.length >= 8
    : method === "email"
      ? normalizeUsername(username).length > 1 && password.length >= 8
      : phone.length >= 6;

  const submitForm = async () => {
    if (!canSubmitForm || pending) return;
    clearErrors();

    if (isSignup) {
      if (usernameTaken(username)) {
        fail(t("usernameTaken"), { username: true });
        return;
      }
      setCode("");
      setCodeInvalid(false);
      setStep("otp");
      return;
    }

    if (method === "email") {
      const ok = await verifyAccount(username, password);
      if (!ok) {
        fail(t("signInFailed"), { username: true, password: true });
        return;
      }
      const account = findAccount(username);
      enter({
        username: normalizeUsername(username),
        name: account?.name ?? titleCase(username),
        phone: account?.phone,
      });
      return;
    }

    // Phone sign-in: the number has to belong to a registered account.
    const account = findAccountByPhone(fullPhone);
    if (!account) {
      fail(t("signInFailed"), { phone: true });
      return;
    }
    setCode("");
    setCodeInvalid(false);
    setStep("otp");
  };

  const verify = async (entered: string) => {
    if (entered !== DEMO_CODE) {
      setCodeInvalid(true);
      return;
    }
    if (isSignup) {
      await createAccount({
        username,
        name: name.trim(),
        phone: fullPhone,
        password,
      });
      enter({ username: normalizeUsername(username), name: name.trim(), phone: fullPhone });
    } else {
      const account = findAccountByPhone(fullPhone);
      enter({
        username: account?.username ?? normalizeUsername(username),
        name: account?.name ?? titleCase(username),
        phone: fullPhone,
      });
    }
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
            {t("verifyPhoneSub")}{" "}
            <span className="font-medium text-ink">{formatPhone(fullPhone)}</span>
          </p>
        </div>

        <div className={cx("mt-7 flex flex-col gap-3", centered && "items-center")}>
          <div className={cx(codeInvalid && "animate-shake")} key={codeInvalid ? "bad" : "ok"}>
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
          </div>
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

      {!isSignup && (
        <div className="mt-6 flex gap-1 rounded-full bg-surface-2 p-1">
          {(["email", "phone"] as const).map((m) => (
            <button
              key={m}
              onClick={() => {
                setMethod(m);
                clearErrors();
              }}
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
          void submitForm();
        }}
      >
        {isSignup && (
          <Input
            label={t("fullName")}
            placeholder="Ada Lovelace"
            value={name}
            onChange={(v) => {
              setName(v);
              clearErrors();
            }}
            autoComplete="name"
          />
        )}

        {(isSignup || method === "email") && (
          <Input
            label={t("username")}
            placeholder="ada"
            value={username}
            onChange={(v) => {
              setUsername(v);
              clearErrors();
            }}
            autoComplete="username"
            suffix={`@${EMAIL_DOMAIN}`}
            isInvalid={!!badFields.username}
            hint={
              badFields.username
                ? error ?? undefined
                : username
                  ? `${normalizeUsername(username)}@${EMAIL_DOMAIN}`
                  : undefined
            }
          />
        )}

        {usesPhone && (
          <div className={cx(badFields.phone && "animate-shake")}>
            <PhoneInput
              label={t("phoneNumber")}
              value={phone}
              onChange={(national, full) => {
                setPhone(national);
                setFullPhone(full);
                clearErrors();
              }}
              isInvalid={!!badFields.phone}
              hint={badFields.phone ? error ?? undefined : undefined}
            />
          </div>
        )}

        {(isSignup || method === "email") && (
          <Input
            label={t("password")}
            type="password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(v) => {
              setPassword(v);
              clearErrors();
            }}
            autoComplete={isSignup ? "new-password" : "current-password"}
            isInvalid={!!badFields.password}
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

        <button
          type="submit"
          disabled={!canSubmitForm}
          className={cx(
            "mt-1 flex h-11 w-full items-center justify-center rounded-xl bg-accent text-sm font-semibold text-white transition",
            "hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          {isSignup ? t("createAccount") : t("signIn")}
        </button>
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
            clearErrors();
          }}
          className="font-semibold text-accent hover:underline"
        >
          {isSignup ? t("signIn") : t("createAccount")}
        </button>
      </p>
    </>,
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
