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
- Each user gets a TV link, `/sfs/<code>` (a letter plus 2 characters, at least one a digit), and a **Total TV**: how many screens may play at once. A TV signs in there with the account password and a TV number (or All), then plays media set to that TV number plus media set to All. Each TV number plays on one screen at a time; slots free up about a minute after a screen stops checking in, or at once with "Switch TV" (see `lib/server/screens.ts`).
- **Local:** users, playlist and uploads are stored in `.data/` (git-ignored). No setup needed.
- **Vercel:** connect a private **Blob** store to the project (Storage tab; adds `BLOB_READ_WRITE_TOKEN`). Users, playlists (`data/*.json`) and uploads (`slider/<user>/…`) all live there. Optionally connect **Upstash for Redis** for users/playlists instead, and set `SESSION_SECRET` (any long random string). Until storage is connected, login shows a setup message.
