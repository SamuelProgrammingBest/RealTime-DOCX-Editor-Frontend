"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  AlertCircle,
  BookOpenText,
  Check,
  FileText,
  LoaderCircle,
  LockKeyhole,
  Mail,
  Sparkles,
  UserRound,
} from "lucide-react";
import { apiCall } from "@/utils/apiCall";
import { getPostAuthPath } from "@/utils/authRedirect";

type AuthMode = "login" | "register";
type FormValues = {
  username: string;
  email: string;
  password: string;
};

type AuthField = keyof FormValues;
type AuthErrors = Partial<Record<AuthField, string>>;

function getAuthError(error: unknown, mode: AuthMode) {
  const axiosError = error as {
    code?: string;
    response?: {
      status?: number;
      data?: unknown;
    };
  };
  const status = axiosError.response?.status;
  const responseData = axiosError.response?.data;
  const data =
    responseData && typeof responseData === "object"
      ? (responseData as {
          message?: unknown;
          error?: unknown;
          errors?: unknown;
        })
      : undefined;
  const fieldErrors: AuthErrors = {};
  const serverMessage =
    typeof responseData === "string"
      ? responseData
      : typeof data?.message === "string"
        ? data.message
        : typeof data?.error === "string"
          ? data.error
          : undefined;

  if (data?.errors && typeof data.errors === "object") {
    if (Array.isArray(data.errors)) {
      for (const item of data.errors) {
        if (
          item &&
          typeof item === "object" &&
          (("field" in item && typeof item.field === "string") ||
            ("path" in item && typeof item.path === "string") ||
            ("param" in item && typeof item.param === "string")) &&
          (("message" in item && typeof item.message === "string") ||
            ("msg" in item && typeof item.msg === "string"))
        ) {
          const field =
            "field" in item
              ? item.field
              : "path" in item
                ? item.path
                : item.param;
          const message = "message" in item ? item.message : item.msg;
          if (
            typeof field === "string" &&
            typeof message === "string" &&
            ["username", "email", "password"].includes(field)
          ) {
            fieldErrors[field as AuthField] = message;
          }
        }
      }
    } else {
      for (const field of ["username", "email", "password"] as const) {
        const value = (data.errors as Record<string, unknown>)[field];
        if (typeof value === "string") fieldErrors[field] = value;
        else if (Array.isArray(value) && typeof value[0] === "string") {
          fieldErrors[field] = value[0];
        }
      }
    }
  }

  if (
    mode === "register" &&
    /email is already registered|already registered/i.test(serverMessage ?? "")
  ) {
    fieldErrors.email = "Email is already registered.";
    return {
      message: "Email is already registered. Try logging in instead.",
      fieldErrors,
    };
  }

  if (status === 401 || status === 403) {
    if (mode === "login") {
      fieldErrors.email = "Check your email and password.";
      fieldErrors.password = "Check your email and password.";
    }
    return {
      message:
        mode === "login"
          ? `${serverMessage ?? "Email or password is incorrect."}. Check your details and try again.`
          : (serverMessage ??
            "We couldn’t verify those details. Please check them and try again."),
      fieldErrors,
    };
  }

  if (
    mode === "register" &&
    (status === 409 ||
      /already (exists|registered|in use)/i.test(serverMessage ?? ""))
  ) {
    fieldErrors.email ??= "An account with this email already exists.";
    return {
      message: "This email is already registered. Try logging in instead.",
      fieldErrors,
    };
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      message: serverMessage ?? "Please check the highlighted fields.",
      fieldErrors,
    };
  }

  if (status === 400 || status === 422) {
    const message =
      serverMessage ?? "Please check the information you entered.";
    const lowerMessage = message.toLowerCase();
    for (const field of ["username", "email", "password"] as const) {
      if (lowerMessage.includes(field)) fieldErrors[field] = message;
    }
    if (Object.keys(fieldErrors).length > 0) {
      return { message, fieldErrors };
    }
  }

  if (!axiosError.response || axiosError.code === "ERR_NETWORK") {
    return {
      message:
        "We couldn’t reach the server. Check your connection and try again.",
      fieldErrors,
    };
  }

  return {
    message: serverMessage ?? "Something went wrong. Please try again.",
    fieldErrors,
  };
}

function getAuthResponseError(response: unknown, mode: AuthMode) {
  if (!response || typeof response !== "object") return null;

  const body = response as Record<string, unknown>;
  const statusValue = body.statusCode ?? body.status;
  const status = typeof statusValue === "number" ? statusValue : 400;
  const statusText =
    typeof statusValue === "string" ? statusValue.toLowerCase() : "";
  const responseMessage =
    typeof body.message === "string"
      ? body.message
      : typeof body.error === "string"
        ? body.error
        : "";
  const failed =
    body.success === false ||
    body.ok === false ||
    ["error", "failed", "failure"].includes(statusText) ||
    Boolean(body.error) ||
    /\b(invalid|incorrect|wrong|failed|failure|unauthorized|not found|already registered|already exists)\b/i.test(
      responseMessage,
    );

  if (!failed) return null;

  return getAuthError({ response: { status, data: body } }, mode);
}

export default function Home() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("register");
  const [form, setForm] = useState<FormValues>({
    username: "",
    email: "",
    password: "",
  });
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<AuthErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isRegistering = mode === "register";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prevForm) => ({
      ...prevForm,
      [name]: value,
    }));
    setFieldErrors((current) => ({ ...current, [name]: undefined }));
    setFormError("");
  };

  const submitForm = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError("");
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const path = isRegistering ? "/signup" : "/login";
      const payload = isRegistering
        ? form
        : { email: form.email, password: form.password };
      const response = await apiCall<unknown>(path, "POST", payload);
      const responseError = getAuthResponseError(response, mode);
      if (responseError) {
        setFormError(responseError.message);
        setFieldErrors(responseError.fieldErrors);
        return;
      }
      router.push(getPostAuthPath(window.location.search));
    } catch (error) {
      const authError = getAuthError(error, mode);
      setFormError(authError.message);
      setFieldErrors(authError.fieldErrors);
    } finally {
      setIsSubmitting(false);
    }
  };

  const changeMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setFormError("");
    setFieldErrors({});
  };

  return (
    <main className="min-h-screen px-4 py-5 sm:px-8 sm:py-8">
      <header className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <a
          href="#home"
          className="flex items-center gap-3 rounded-2xl"
          aria-label="Draftwell home"
        >
          <span className="flex size-11 items-center justify-center rounded-2xl border-4 border-[#282828] bg-[#58CC02] shadow-neobrutalism">
            <BookOpenText aria-hidden="true" size={23} strokeWidth={2.5} />
          </span>
          <span className="font-ui text-xl font-black sm:text-2xl">
            Draftwell
          </span>
        </a>

        <div className="flex items-center gap-2 text-sm font-bold sm:gap-3 sm:text-base">
          <span className="hidden text-[#282828]/70 sm:inline">
            {isRegistering ? "Already have an account?" : "New to Draftwell?"}
          </span>
          <button
            type="button"
            onClick={() => setMode(isRegistering ? "login" : "register")}
            className="rounded-2xl border-4 border-[#282828] bg-white px-4 py-2 shadow-neobrutalism transition-transform hover:-translate-y-0.5"
          >
            {isRegistering ? "Log in" : "Create account"}
          </button>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl items-center gap-8 py-10 sm:py-14 lg:grid-cols-[1fr_0.9fr] lg:gap-16 lg:py-20">
        <div className="mx-auto w-full max-w-xl lg:mx-0">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border-4 border-[#282828] bg-[#FFC800] px-4 py-2 text-sm font-extrabold shadow-neobrutalism">
            <Sparkles aria-hidden="true" size={17} />
            YOUR DOCUMENTS, ALL IN ONE PLACE
          </div>
          <h1 className="max-w-lg text-4xl font-black leading-[1.08] sm:text-5xl lg:text-6xl">
            Your words, ready to take shape.
          </h1>
          <p className="mt-5 max-w-lg text-lg font-semibold leading-relaxed text-[#282828]/70 sm:text-xl">
            Write, format, and work together on Word documents in one simple
            workspace.
          </p>

          <div className="mt-9 rounded-4xl border-4 border-[#282828] bg-[#1CB0F6] p-5 shadow-neobrutalism sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-extrabold uppercase">DOCX EDITOR</p>
                <p className="mt-1 text-2xl font-black">
                  A better page starts here
                </p>
              </div>
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl border-4 border-[#282828] bg-white">
                <FileText aria-hidden="true" size={22} strokeWidth={2.5} />
              </span>
            </div>
            <div className="mt-6 space-y-3 rounded-2xl border-4 border-[#282828] bg-white p-4 sm:p-5">
              <div className="h-3 w-2/3 rounded-full bg-[#282828]" />
              <div className="h-2.5 w-full rounded-full bg-[#282828]/15" />
              <div className="h-2.5 w-5/6 rounded-full bg-[#282828]/15" />
              <div className="flex flex-wrap gap-2 pt-2">
                <span className="rounded-full border-2 border-[#282828] bg-[#FFC800] px-3 py-1 text-xs font-extrabold">
                  DRAFT
                </span>
                <span className="rounded-full border-2 border-[#282828] bg-[#CE82FF] px-3 py-1 text-xs font-extrabold">
                  REPORT
                </span>
                <span className="rounded-full border-2 border-[#282828] bg-[#FF4B4B] px-3 py-1 text-xs font-extrabold">
                  DOCX
                </span>
              </div>
            </div>
            <div className="mt-5 flex items-center gap-2 text-sm font-extrabold">
              <Check aria-hidden="true" size={18} strokeWidth={3} />
              Create and edit Word documents in your browser.
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-xl rounded-4xl border-4 border-[#282828] bg-white p-5 shadow-neobrutalism sm:p-8 lg:p-10">
          <div className="mb-7">
            <p className="text-sm font-extrabold uppercase text-[#282828]/55">
              {isRegistering ? "GET STARTED" : "WELCOME BACK"}
            </p>
            <h2 className="mt-2 text-3xl font-black sm:text-4xl">
              {isRegistering
                ? "Create your space"
                : "Pick up where you left off"}
            </h2>
            <p className="mt-2 font-semibold leading-relaxed text-[#282828]/65">
              {isRegistering
                ? "Create an account to start writing and editing DOCX files."
                : "Log in to get back to your documents."}
            </p>
          </div>

          <div className="mb-7 grid grid-cols-2 gap-3 rounded-2xl bg-[#FFFAEE] p-2">
            <button
              type="button"
              aria-pressed={isRegistering}
              onClick={() => changeMode("register")}
              className={`rounded-2xl border-4 border-[#282828] px-3 py-3 font-extrabold transition-colors ${
                isRegistering ? "bg-[#58CC02] shadow-neobrutalism" : "bg-white"
              }`}
            >
              Create account
            </button>
            <button
              type="button"
              aria-pressed={!isRegistering}
              onClick={() => changeMode("login")}
              className={`rounded-2xl border-4 border-[#282828] px-3 py-3 font-extrabold transition-colors ${
                !isRegistering ? "bg-[#1CB0F6] shadow-neobrutalism" : "bg-white"
              }`}
            >
              Log in
            </button>
          </div>

          <form onSubmit={(event) => submitForm(event)} className="space-y-5">
            {formError && (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-2xl border-4 border-[#282828] bg-[#FF4B4B]/15 p-4 font-bold text-[#8F1515]"
              >
                <AlertCircle
                  aria-hidden="true"
                  className="mt-0.5 shrink-0"
                  size={20}
                />
                <p>{formError}</p>
              </div>
            )}
            {isRegistering && (
              <div className="space-y-2">
                <label
                  htmlFor="username"
                  className="block text-sm font-extrabold"
                >
                  Your name
                </label>
                <div className="relative">
                  <UserRound
                    aria-hidden="true"
                    size={19}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#282828]/55"
                  />
                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="name"
                    placeholder="What should we call you?"
                    required
                    aria-invalid={Boolean(fieldErrors.username)}
                    aria-describedby={
                      fieldErrors.username ? "username-error" : undefined
                    }
                    className={`w-full rounded-2xl border-4 bg-white py-3 pl-11 pr-4 font-semibold outline-none placeholder:text-[#282828]/40 focus:shadow-neobrutalism ${fieldErrors.username ? "border-[#FF4B4B]" : "border-[#282828]"}`}
                    onChange={(e) => handleChange(e)}
                  />
                </div>
                {fieldErrors.username && (
                  <p id="username-error" className="font-bold text-[#B42318]">
                    {fieldErrors.username}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-extrabold">
                Email address
              </label>
              <div className="relative">
                <Mail
                  aria-hidden="true"
                  size={19}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#282828]/55"
                />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  required
                  aria-invalid={Boolean(fieldErrors.email)}
                  aria-describedby={
                    fieldErrors.email ? "email-error" : undefined
                  }
                  className={`w-full rounded-2xl border-4 bg-white py-3 pl-11 pr-4 font-semibold outline-none placeholder:text-[#282828]/40 focus:shadow-neobrutalism ${fieldErrors.email ? "border-[#FF4B4B]" : "border-[#282828]"}`}
                  onChange={(e) => handleChange(e)}
                />
              </div>
              {fieldErrors.email && (
                <p id="email-error" className="font-bold text-[#B42318]">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <label
                  htmlFor="password"
                  className="block text-sm font-extrabold"
                >
                  Password
                </label>
                {!isRegistering && (
                  <button
                    type="button"
                    className="rounded-full border-0 px-1 py-1 text-sm font-extrabold text-[#282828] underline decoration-2 underline-offset-4"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <LockKeyhole
                  aria-hidden="true"
                  size={19}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#282828]/55"
                />
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={
                    isRegistering ? "new-password" : "current-password"
                  }
                  placeholder="At least 8 characters"
                  minLength={8}
                  required
                  aria-invalid={Boolean(fieldErrors.password)}
                  aria-describedby={
                    fieldErrors.password ? "password-error" : undefined
                  }
                  className={`w-full rounded-2xl border-4 bg-white py-3 pl-11 pr-4 font-semibold outline-none placeholder:text-[#282828]/40 focus:shadow-neobrutalism ${fieldErrors.password ? "border-[#FF4B4B]" : "border-[#282828]"}`}
                  onChange={(e) => handleChange(e)}
                />
              </div>
              {fieldErrors.password && (
                <p id="password-error" className="font-bold text-[#B42318]">
                  {fieldErrors.password}
                </p>
              )}
              {isRegistering && (
                <p className="text-sm font-semibold text-[#282828]/55">
                  Use 8 or more characters.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border-4 border-[#282828] bg-[#58CC02] px-5 py-3.5 text-lg font-black shadow-neobrutalism transition-transform hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-wait disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle
                    aria-hidden="true"
                    size={21}
                    className="animate-spin"
                  />
                  {isRegistering ? "Creating account…" : "Logging in…"}
                </>
              ) : (
                <>
                  {isRegistering ? "Create my account" : "Log in to Draftwell"}
                  <ArrowRight aria-hidden="true" size={21} strokeWidth={2.7} />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm font-semibold leading-relaxed text-[#282828]/60">
            By continuing, you agree to our{" "}
            <a
              href="#terms"
              className="font-extrabold text-[#282828] underline underline-offset-4"
            >
              Terms
            </a>{" "}
            and{" "}
            <a
              href="#privacy"
              className="font-extrabold text-[#282828] underline underline-offset-4"
            >
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </section>
    </main>
  );
}
