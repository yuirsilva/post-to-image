# Postcard

Postcard turns the complete visual presentation of an Instagram or X post into a downloadable PNG or framed MP4. It renders each platform's familiar post layout with creator, media, caption, engagement, and date.

The React client, Vite configuration, and Express server are written in strict TypeScript.

## Setup

1. Copy `.env.example` to `.env`.
2. Open Instagram while signed in and inspect a normal request to `instagram.com`.
3. Copy the complete `Cookie` request header into `INSTAGRAM_COOKIE`.
4. Optionally copy the matching browser `User-Agent` into `INSTAGRAM_USER_AGENT`.
5. For X posts that require a session, optionally set `X_COOKIE`. Public X posts work without one when X exposes their server-rendered media.
6. Start the app.

```bash
npm install
npm run dev
```

Run the compiler independently with `npm run typecheck`.

The cookie stays on the server. It is never sent to the Postcard frontend or included in the client bundle.

## Production

```bash
npm run build
npm start
```

Set `INSTAGRAM_COOKIE` and, when needed, `X_COOKIE` in the hosting provider's secret environment settings. Use dedicated accounts and rotate sessions when they expire. Do not commit cookies or `.env`.

## Notes

- Private posts are available only when the cookie's account can view them.
- Instagram changes its internal web responses periodically. The loader supports both the JSON web response and Open Graph HTML fallback.
- X image and native video posts are loaded from X's server-rendered post data.
- The server converts remote media URLs into data URLs so PNG export does not fail because of cross-origin image restrictions.
