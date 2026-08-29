# Connect CreaseIQ to Supabase

## 1. Create the project

Create a new project at [Supabase](https://supabase.com/dashboard). In **Project Settings → API**, copy:

- Project URL
- Publishable (anon) key

Do not use the `service_role` key in this website.

## 2. Create the database and private video bucket

Open **SQL Editor** in your Supabase project, paste the complete contents of [`supabase/schema.sql`](supabase/schema.sql), and run it once. This creates all tables, the private `cricket-videos` bucket, and Row Level Security policies.

## 3. Add the browser-safe configuration

Open `supabase-config.js` and fill in your values:

```js
window.CREASEIQ_SUPABASE = {
  url: "https://your-project.supabase.co",
  publishableKey: "your-publishable-anon-key"
};
```

The publishable/anon key is intended for browser applications. The security policies in `schema.sql` ensure each authenticated player can access only their own records and video files.

## 4. Configure sign-in redirect URLs

In **Authentication → URL Configuration**, add the local address you use to run the app, for example:

```text
http://localhost:8000
```

For production, add your real website URL too.

## 5. Run the site with a local web server

From the `creaseiq` directory:

```powershell
py -m http.server 8000
```

Then visit `http://localhost:8000`. Sign in with an email address, return from the email link, and upload a video. The video goes into the private storage bucket; its details go into the `sessions` table.

## What remains server-side

The website saves videos and session metadata. The future video-analysis worker must use a server-only secret to read the video, extract pose landmarks, run `comparison-model.js` logic (or its server equivalent), and write the completed score to `analyses` and `technique_scores`. Never put that server-only secret in these browser files.
