"use client";

import { useActionState } from "react";
import { importWorkbookAction } from "@/app/admin/actions";

export default function ImportPage() {
  const [state, action, pending] = useActionState(importWorkbookAction, null);

  return (
    <div className="max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-navy-900">Upload dataset</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Workflow: upload → parse → validate → preview → approve/publish. An upload never overwrites public information unless you choose Publish.
        </p>
      </header>
      <form action={action} className="card p-5">
        <label className="block text-sm font-medium" htmlFor="file">
          Excel or CSV file
        </label>
        <input id="file" name="file" type="file" accept=".xlsx,.csv" required className="mt-2 block w-full text-sm" />
        <label className="mt-4 flex items-center gap-2 text-sm">
          <input type="checkbox" name="publish" />
          Publish immediately after validation
        </label>
        <p className="mt-2 text-xs text-muted-foreground">
          Leave unchecked to import as a draft-quality load still recorded in the audit trail. For the initial workbook, publishing is appropriate after reviewing issues.
        </p>
        <button disabled={pending} className="btn btn-primary mt-5 disabled:opacity-60">
          {pending ? "Parsing…" : "Upload and validate"}
        </button>
      </form>
      {state && "error" in state && state.error ? <p className="text-sm text-danger">{state.error}</p> : null}
      {state && "ok" in state && state.ok ? (
        <section className="card p-5">
          <h2 className="text-lg font-semibold tracking-tight">{state.publish ? "Published" : "Imported"}</h2>
          <ul className="mt-3 grid grid-cols-2 gap-2 text-sm">
            {Object.entries(state.counts).map(([key, value]) => (
              <li key={key}>
                {key}: {value}
              </li>
            ))}
          </ul>
          <h3 className="mt-4 font-medium">Validation notes</h3>
          <ul className="mt-2 space-y-2 text-sm">
            {state.issues.length === 0 ? <li>No validation issues.</li> : null}
            {state.issues.map((issue, index) => (
              <li key={`${issue.code}-${index}`} className="field">
                <strong>{issue.severity}</strong> — {issue.message}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
