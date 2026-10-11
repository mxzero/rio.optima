# RIO OPTIMA INC.

Business solutions website for technical, project management, and logistics work, including the **SLIDER** application for screens and playlists.

## Pages

- Home
- About Us
- Vision & Mission
- Services
- Contact Us
- Log in
- SLIDER (`/slider` overview when signed out, manage view when signed in)

Contact details on the site (domain, email, phone, address) are placeholders.

## Local

```bash
npm install
npm run dev
```

## Deploy

- GitHub: https://github.com/mxzero/rio.optima
- Production: https://rio-optima.vercel.app

## Accounts and storage

- First run creates the admin account `admin@rio.optima` / `Pass123!`. Change the password in the Admin console (`/admin`).
- Admins add users with a role (Admin or Subscriber) and a service (TMS or Slider). Subscribers manage only their own SLIDER media; admins see everyone's.
- **Local:** users, playlist and uploads are stored in `.data/` (git-ignored). No setup needed.
- **Vercel:** in the project's **Storage** tab, connect
  1. **Upstash for Redis** (adds `KV_REST_API_URL`, `KV_REST_API_TOKEN`) for users and playlists, and
  2. **Blob** (adds `BLOB_READ_WRITE_TOKEN`) for uploaded files,

  then redeploy. Optionally set `SESSION_SECRET` (any long random string). Until storage is connected, login shows a setup message.
