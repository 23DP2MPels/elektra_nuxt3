# Elektra Nuxt3

## Projekta raksturojums

- Frontends: Nuxt 4 / Vue 3, UI bibliotēka Vuetify 4, Vite.

- Backends: Nuxt 4 servera API ar `serverDir: '../backend/server'` un Node.js.

API: Servera maršruti (routes) atrodas `backend/server/api`, tiem frontends piekļūst caur `/api/....`.

- Datubāzes:
    - SQLite (`better-sqlite3`) lokāli failā `.data/app.sqlite.`

    - MongoDB (`mongodb`) lietotājiem, sesijām un autentifikācijai. Konfigurācija caur `MONGODB_URI`, noklusējuma DB nosaukums `elektra_db`.

- Autentifikācija: `bcryptjs` paroļu jaukšanai (hashing) un `jsonwebtoken` priekš JWT.

- Konfigurācija: `dotenv` vides mainīgo (environment variables) ielādei.




# Nuxt Minimal Starter

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.
