"use client";

import Image from "next/image";
import { useActionState } from "react";
import { loginAction } from "../actions";

export default function AdminLoginPage() {
  const [state, action, pending] = useActionState(loginAction, null);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <form action={action} className="card w-full max-w-md p-8">
        <Image
          src="/parsu-logo.png"
          alt="Partido State University official seal"
          width={64}
          height={64}
          className="mx-auto"
        />
        <p className="section-kicker mt-4 text-center">Partido State University</p>
        <h1 className="font-display mt-2 text-center text-2xl font-bold tracking-tight text-navy-900">
          Administrator Portal
        </h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">Authorized personnel only</p>
        <label className="mt-6 block text-sm font-medium" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="field mt-1"
          autoComplete="username"
        />
        <label className="mt-4 block text-sm font-medium" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          className="field mt-1"
          autoComplete="current-password"
        />
        {state?.error ? <p className="mt-3 text-sm text-danger">{state.error}</p> : null}
        <button disabled={pending} className="btn btn-gold mt-6 w-full disabled:opacity-60">
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
