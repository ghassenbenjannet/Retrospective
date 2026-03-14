# Retrospective Live

Application de rétrospective agile en temps réel.

## Architecture

```
client/   → React + TypeScript + Vite + Tailwind (déployé sur GitHub Pages)
server/   → Node.js + Express + Socket.io + MongoDB (déployé sur Railway/Render)
```

## Démarrage local

### Backend
```bash
cd server
cp .env.example .env   # renseigner les variables
npm install
npm run dev
```

### Frontend
```bash
cd client
npm install
npm run dev
```

## Déploiement

### Backend → Railway
1. Connecter le repo GitHub sur [railway.app](https://railway.app)
2. Ajouter les variables d'environnement :
   - `MONGO_URI`
   - `JWT_SECRET`
   - `CLIENT_URL` (URL GitHub Pages, ex: `https://user.github.io/Retrospective`)
3. Railway détecte automatiquement le `railway.json`

### Frontend → GitHub Pages
- Se déploie automatiquement sur push `main`
- Ajouter le secret `VITE_API_URL` dans Settings > Secrets (URL du backend Railway)

## Premier démarrage

Créer le premier compte admin via l'endpoint :
```
POST /api/auth/register-admin
{
  "email": "admin@example.com",
  "password": "motdepasse",
  "name": "Admin",
  "workspaceName": "Mon Équipe"
}
```
