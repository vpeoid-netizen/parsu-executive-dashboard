# Administrator guide

## Access

There is no public registration. Create the first account with:

```bash
npm run bootstrap:admin
```

or by running the seed. Sign in at `/admin/login`. The link in the public footer is intentionally discreet.

## First-time publishing

1. Confirm `.env` has `ADMIN_EMAIL` and `ADMIN_PASSWORD`
2. `npm run db:seed` loads and publishes the Excel workbook
3. Review **Validation warnings** on `/admin`
4. Use **Manage content** for History and VMGO
5. Add officials, flagship programs and documents as they become available

## Everyday work

| Task | Where |
| --- | --- |
| Replace a large dataset | `/admin/import` |
| Edit History / VMGO / flagship programs | `/admin/content` |
| Officials | `/admin/officials` |
| Documents | `/admin/documents` |
| Assets, infrastructure, budget, international partners | matching `/admin/*` forms |
| See who changed what | `/admin/audit` |

Destructive replacements go through dataset versions. Publishing a new academic-program version archives the previous published snapshot.

## Sessions and security

- Passwords are hashed with bcrypt (cost 12)
- Sessions expire after 8 hours
- Failed logins are rate-limited
- Admin APIs return 401 without a valid session
- Upload types and size are checked on the server

## Public vs draft

Only records with `PUBLISHED` status, or CMS rows with `published = true`, appear on the public dashboard. Budget rows also require `publiclyPublishable`.
