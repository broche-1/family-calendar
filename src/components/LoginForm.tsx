"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName })
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
          id="firstName"
          autoComplete="given-name"
          autoFocus
          value={firstName}
          onChange={(event) => setFirstName(event.target.value)}
          placeholder="Brendan"
        />
        {error ? <p className="form-error">{error}</p> : null}
        <button className="primary-button" type="submit" disabled={isSubmitting || !firstName.trim()}>
          <LogIn aria-hidden="true" size={18} />
          {isSubmitting ? "Signing in" : "Continue"}
        </button>
      </form>
    </section>
  );
}
