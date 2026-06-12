"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const firstNameRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const queryFirstName = new URLSearchParams(window.location.search).get("firstName")?.trim();

    if (queryFirstName && firstNameRef.current && !firstNameRef.current.value) {
      firstNameRef.current.value = queryFirstName;
    }
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const submittedFirstName = new FormData(form).get("firstName")?.toString().trim() ?? "";

    if (!submittedFirstName) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName: submittedFirstName })
    });

    if (!response.ok) {
      const result = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(result?.error ?? "Could not log in.");
      setIsSubmitting(false);
      return;
    }

    router.refresh();
  }

  return (
    <section className="login-panel" aria-labelledby="login-title">
      <p className="eyebrow">Cape house weekends</p>
      <h1 id="login-title">Family Weekend Planner</h1>
      <p className="login-copy">Enter your first name to view and update weekend availability.</p>
      <form className="login-form" onSubmit={handleSubmit}>
        <label htmlFor="firstName">First name</label>
        <input
          ref={firstNameRef}
          id="firstName"
          name="firstName"
          autoComplete="given-name"
          autoFocus
          required
          placeholder="Brendan"
        />
        {error ? <p className="form-error">{error}</p> : null}
        <button className="primary-button" type="submit" disabled={isSubmitting}>
          <LogIn aria-hidden="true" size={18} />
          {isSubmitting ? "Signing in" : "Continue"}
        </button>
      </form>
    </section>
  );
}
