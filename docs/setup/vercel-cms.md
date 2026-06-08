# Déployer le CMS sur Vercel

Guide pour publier `apps/cms` (Next.js + Clerk + Convex). Le backend reste sur **Convex Cloud** — Vercel n’héberge que le front admin.

---

## Prérequis

- Repo GitHub connecté (`suarja/MediumShip` ou équivalent)
- Compte [Vercel](https://vercel.com)
- Déploiement Convex déjà utilisable (ex. `https://….convex.cloud`)
- Clés Clerk (publishable au minimum ; secret recommandé pour Next.js en prod)

---

## 1. Créer le projet Vercel (dashboard)

1. [vercel.com/new](https://vercel.com/new)
2. **Import Git Repository** → choisir **MediumShip**
3. **Configure Project** :
   - **Framework Preset** : Next.js (auto)
   - **Root Directory** : `apps/cms` → **Edit** → saisir `apps/cms` → confirmer
   - **Build Command** : `npm run build` (défaut OK)
   - **Output Directory** : laisser vide (Next.js gère `.next`)
   - **Install Command** : `npm install` (défaut OK)
4. Ne pas déployer tout de suite — ajouter les variables d’environnement d’abord.

---

## 2. Variables d’environnement (Vercel)

Dans **Settings → Environment Variables**, pour **Production** (et **Preview** si tu testes des PR) :

| Variable | Exemple | Obligatoire |
| -------- | ------- | ----------- |
| `NEXT_PUBLIC_CONVEX_URL` | `https://striped-fennec-326.convex.cloud` | Oui |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_test_…` ou `pk_live_…` | Oui |
| `CLERK_SECRET_KEY` | `sk_test_…` ou `sk_live_…` | Recommandé (Clerk Next.js) |

Les `NEXT_PUBLIC_*` sont injectées au **build** — après modification, **redéployer**.

Pour l’instant, le même déploiement Convex **dev** suffit pour un smoke test ; une prod Convex viendra plus tard.

---

## 3. Premier déploiement

1. **Deploy**
2. Attendre le build (2–5 min)
3. Ouvrir l’URL `https://….vercel.app`

Si le build échoue sur les imports `convex/` : vérifier que **Root Directory = `apps/cms`** (le clone contient tout le monorepo, dont `convex/` à la racine).

---

## 4. Clerk (obligatoire pour la connexion admin)

Dans le [dashboard Clerk](https://dashboard.clerk.com) :

1. **Configure** → **Domains** (ou **Paths / URLs** selon l’UI)
2. Ajouter l’URL Vercel :
   - Production : `https://ton-projet.vercel.app`
   - Preview (optionnel) : `https://*.vercel.app` si Clerk le permet, ou chaque preview
3. Vérifier que le **JWT template `convex`** existe (voir [`docs/setup/clerk-auth.md`](./clerk-auth.md))

Sans ça : la page charge, mais sign-in / Convex auth peut échouer.

---

## 5. Accès admin Convex

Le CMS exige un utilisateur **admin** côté Convex (`api.cms.queries.getViewer`).

Après première connexion Clerk sur le CMS déployé :

- utiliser le flux **bootstrap admin** si prévu dans l’app, ou
- promouvoir manuellement l’utilisateur en admin sur le déploiement Convex (dashboard / mutation seed).

---

## 6. Déploiements suivants

- **Push sur `main` / `dev`** (branche connectée) → Vercel rebuild automatiquement
- Ou en CLI depuis `apps/cms` :

```bash
npx vercel login
cd apps/cms
npx vercel          # preview
npx vercel --prod   # production
```

---

## 7. Domaine personnalisé (optionnel)

Vercel → projet → **Settings → Domains** → ex. `cms.knowly.app`

Puis ajouter ce domaine dans Clerk (étape 4).

---

## Checklist rapide

- [ ] Projet Vercel, root `apps/cms`
- [ ] `NEXT_PUBLIC_CONVEX_URL` + `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- [ ] `CLERK_SECRET_KEY` (recommandé)
- [ ] URL Vercel autorisée dans Clerk
- [ ] Build vert
- [ ] Connexion admin + écriture Convex OK

---

## Liens

- CMS local : `cd apps/cms && npm run dev`
- Auth Clerk + Convex : [`clerk-auth.md`](./clerk-auth.md)
- Env partagées : [`.env.example`](../../.env.example)
