"use client";

import { useActionState } from "react";
import { LoaderCircle, Save } from "lucide-react";
import { PasswordField } from "@/components/admin/password-field";
import type { SaveResult } from "@/lib/admin/editor";

function FormStatus({ state, pending, idle }: { state: SaveResult | null; pending: boolean; idle: string }) {
  return (
    <p className="text-sm" role="status">
      {pending ? (
        <span className="text-muted-foreground">Saving…</span>
      ) : state?.ok ? (
        <span className="text-navy-800">{state.message}</span>
      ) : state && !state.ok ? (
        <span className="text-danger">{state.error}</span>
      ) : (
        <span className="text-muted-foreground">{idle}</span>
      )}
    </p>
  );
}

export function AccountProfileForm({
  name,
  email,
  role,
  lastLoginLabel,
  action,
}: {
  name: string;
  email: string;
  role: string;
  lastLoginLabel: string;
  action: (prev: SaveResult | null, formData: FormData) => Promise<SaveResult>;
}) {
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className="card p-5 sm:p-6">
      <h2 className="text-lg font-semibold tracking-tight text-navy-900">Account details</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        This name and email appear in the audit log when you save dashboard data.
      </p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="account-name" className="block text-sm font-medium text-navy-900">
            Name <span className="text-gold">*</span>
          </label>
          <input id="account-name" name="name" defaultValue={name} required className="field mt-1" autoComplete="name" />
        </div>
        <div>
          <label htmlFor="account-email" className="block text-sm font-medium text-navy-900">
            Email <span className="text-gold">*</span>
          </label>
          <input
            id="account-email"
            name="email"
            type="email"
            defaultValue={email}
            required
            className="field mt-1"
            autoComplete="username"
          />
        </div>
        <div>
          <p className="block text-sm font-medium text-navy-900">Role</p>
          <p className="mt-1 min-h-11 rounded-xl bg-muted px-3 py-2 text-sm text-navy-900">{role}</p>
        </div>
        <div>
          <p className="block text-sm font-medium text-navy-900">Last sign-in</p>
          <p className="mt-1 min-h-11 rounded-xl bg-muted px-3 py-2 text-sm text-navy-900">{lastLoginLabel}</p>
        </div>
      </div>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <FormStatus state={state} pending={pending} idle="Save to update the name or email on this account." />
        <button disabled={pending} className="btn btn-primary disabled:opacity-60">
          {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Save className="size-4" aria-hidden="true" />}
          Save account
        </button>
      </div>
    </form>
  );
}

export function AccountPasswordForm({
  action,
}: {
  action: (prev: SaveResult | null, formData: FormData) => Promise<SaveResult>;
}) {
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className="card p-5 sm:p-6">
      <h2 className="text-lg font-semibold tracking-tight text-navy-900">Password</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Use a password that only this administrator knows. It must be at least 10 characters.
      </p>
      <div className="mt-5 grid gap-4">
        <PasswordField id="current-password" name="currentPassword" label="Current password" autoComplete="current-password" />
        <PasswordField
          id="new-password"
          name="newPassword"
          label="New password"
          autoComplete="new-password"
          hint="At least 10 characters."
        />
        <PasswordField id="confirm-password" name="confirmPassword" label="Confirm new password" autoComplete="new-password" />
      </div>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <FormStatus state={state} pending={pending} idle="Leave this blank unless you are changing the password." />
        <button disabled={pending} className="btn btn-primary disabled:opacity-60">
          {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Save className="size-4" aria-hidden="true" />}
          Update password
        </button>
      </div>
    </form>
  );
}
