# Policy Desk: Ideal Car Insurance

A private insurance policy tracker for one agent. It works on phone and desktop, and can be installed on the home screen.

**Features**

- **Dashboard**: total profit and sales, this month's figures, policy counts (total, active, expiring in 30 days, expired), renewals due and recently added policies.
- **Policies**: search by name, phone, policy number or company, and filter by status or company. Each policy has WhatsApp reminder, Call, Edit and Delete buttons.
- **Renewals**: show policies expiring in 7, 15, 30 or 60 days, expired policies, or both. You can edit the WhatsApp message (with `{name} {policy} {company} {expiry} {days} {status}` placeholders) and see a preview. The app records when a reminder was sent, and the nav shows a count badge.
- **Add / Edit**: phone numbers are formatted as UAE numbers (+971) as you type. Profit is calculated automatically, and a "1 year" button fills in the expiry date. Company names are suggested from earlier entries. The app warns about duplicate policy numbers and checks the dates.
- **Statement**: filter by date range (with This month, Last month and This year shortcuts), company and customer. Shows totals, can be printed or saved as PDF, and exported to CSV.
- **Import & backup**: download every policy as CSV, or import a CSV (including the statement export from the old tracker).
- **Offline**: changes are saved on the device first and sync automatically when the connection returns.
- **Login**: only the one configured account can sign in. The database link stays on the server and is never sent to the browser.

---

## Deploy on Vercel

1. Push this folder to a GitHub repository and import it at **vercel.com → Add New → Project**. Vercel detects Next.js automatically.
2. In **Project → Settings → Environment Variables**, add:

   | Variable | Value |
   | --- | --- |
   | `ADMIN_USERNAME` | the login name, e.g. `ideal` |
   | `ADMIN_PASSWORD` | a strong password |
   | `AUTH_SECRET` | a random string of 32+ characters (`openssl rand -base64 32`) |

3. Connect a database. Pick **one** of the options below (Turso is recommended).
4. Redeploy. Open the site and sign in.

### Option A: Turso (recommended)

1. Sign up at [turso.tech](https://turso.tech) and create a database (choose a region near the UAE, e.g. Mumbai or Frankfurt).
2. Copy the database URL (`libsql://…turso.io`) and create a database token.
3. In Vercel, add:
   - `TURSO_DATABASE_URL` = the `libsql://` URL
   - `TURSO_AUTH_TOKEN` = the token

The `policies` table is created automatically on the first request. Browse or back up the data in the Turso dashboard, or download a CSV from the app.

### Option B: Google Sheet

1. Open the Google Sheet → **Extensions → Apps Script**.
2. Paste in the contents of [`apps-script/Code.gs`](apps-script/Code.gs), and set `TOKEN` to a long random secret.
3. **Deploy → New deployment → Web app**. Set *Execute as* to **Me** and *Who has access* to **Anyone**. Copy the URL.
4. In Vercel, add:
   - `GOOGLE_SCRIPT_URL` = the web app URL
   - `GOOGLE_SCRIPT_TOKEN` = the same secret as `TOKEN`

The script writes to a tab called **Policies** and creates any missing columns. You can also point `GOOGLE_SCRIPT_URL` at the old tracker's existing script, because the app speaks the same protocol. However, that old script has no secret token, so anyone who has its URL can read the data. Switching to the new script is strongly advised.

### Option C: Upstash Redis

In Vercel, go to **Storage → Create Database → Upstash for Redis (free)** and connect it to this project. Vercel adds `KV_REST_API_URL` and `KV_REST_API_TOKEN` for you. Then redeploy.

### Optional branding

`NEXT_PUBLIC_BUSINESS_NAME`, `NEXT_PUBLIC_BUSINESS_TAGLINE`, `NEXT_PUBLIC_BUSINESS_PHONE` (used in the WhatsApp message), and `NEXT_PUBLIC_OWNER_NAME` (used in the dashboard greeting).

## Moving data from the old tracker

On the old site, open **Statement**, clear all filters and click **Download CSV**. In the new app, open **Import & backup → Import from CSV** and choose that file. Policy numbers that are already saved are skipped.



## Install on a phone

Open the site in Safari (iPhone) or Chrome (Android), then choose **Share → Add to Home Screen** or **Install app**.

## Local development

```bash
cp .env.example .env.local   # set ADMIN_USERNAME / ADMIN_PASSWORD
npm install
npm run dev
```

With no database configured, local development stores data in `.data/policies.json`.
