# Réflexion — Monétisation (démo + white-label)

> Document de **réflexion vivante** (pas une décision figée). But : poser le problème, les axes, les forks, et les questions ouvertes pour reprendre la discussion sans rien perdre. Aboutira à un **ADR « modèle de monétisation »** une fois tranché.

## Le contexte

Cette app est **à la fois** :
- **notre démo** (vitrine, candidate à publication App Store / Play — EAS déjà configuré),
- **la référence de politique** du produit **white-label** (ce qu'un tenant/créateur pourra faire).

## Deux axes de revenus distincts (qui s'imbriquent)

### Axe B2C — l'utilisateur final paie (dans une app tenant, dont la démo)
- Le contenu `premium` est **déjà gaté** via les **entitlements** — API de lecture **stable** : `useIsMember` / `requireMember` / `isPro` ([[entitlement-read-api-stable]]).
- **Le paiement n'est pas câblé** → aujourd'hui `premium` passe par défaut (« premium gratuit », `PREMIUM_PAYMENT_DEFERRED`).
- Pour facturer : un provider (RevenueCat / Stripe) **écrit** la table `entitlements`. Le chemin de **lecture ne change pas** (règle stable). On ne touche jamais au read path.

### Axe B2B — le tenant/créateur nous paie (le vrai modèle white-label)
- C'est la **couche Operator** (`docs/adr/0008-feature-catalog-and-access-model.md`, hiérarchie **Operator → Creator → Member**, parquée au backlog).
- On vend des **packages de features** par tenant (« quelles features ce tenant a le **droit** d'activer » — la licence/package vendable), + add-ons : **notifications-as-a-package**, **clés API**.
- Deux faces : **on facture le tenant** (SaaS plateforme) ; **le tenant facture ses utilisateurs** (son premium, son provider, via ses entitlements).

## Les décisions qui débloquent tout (forks)

1. **La démo au store : vitrine gratuite ou app monétisée ?**
   - *Vitrine* : tout `premium` débloqué (garder « premium gratuit »), **zéro IAP** → review store simple, on montre l'expérience complète. Recommandé pour une 1ʳᵉ soumission.
   - *Monétisée* : abonnement réel → sur **iOS, IAP Apple obligatoire** (~30 %) pour du digital in-app (pas Stripe in-app). Plus lourd.

2. **Le modèle B2B white-label : comment on facture le tenant ?**
   - Abonnement plateforme par tenant ? Packages de features à la carte (Operator) ? Add-ons (notifications, API) ? Les deux ?
   - → définit l'**écran Operator** (super-admin où *nous* cochons les droits/package par tenant).

3. **Provider(s) de paiement.**
   - **RevenueCat** = standard mobile (gère IAP App Store/Play + sync entitlements cross-platform) → axe B2C mobile.
   - **Stripe** plutôt côté CMS/web → axe B2B (facturer les tenants).
   - Les deux **n'écrivent que la table `entitlements`** (B2C) / une table d'abonnement tenant (B2B).

4. **Échéance.** Store *maintenant* (donc vitrine simple, paiement plus tard) **ou** câbler le paiement avant publication ?

5. **Contrainte « démo crédible ».** Articles + vidéos OK ; **podcasts vides** (aucun épisode ingéré). Croise les providers backloggés (Podcasts RSS audio, Blogs) — une démo riche aide la vitrine ET la vente.

## Questions ouvertes (à reprendre)

- [ ] Démo = vitrine 100 % débloquée, ou vend un abonnement à l'utilisateur final ?
- [ ] White-label : abonnement plateforme, packages de features, ou les deux ? Quels tiers/prix ?
- [ ] Quels **scopes** par rôle (admin vs manager, cf. backlog CMS) côté tenant ?
- [ ] RevenueCat (B2C mobile) + Stripe (B2B) : on câble lequel d'abord ?
- [ ] Quand publie-t-on la démo ? Qu'est-ce qui est *bloquant* pour la soumission ?

## Cross-refs

- ADR 0008 — Feature catalog & access model (Operator → Creator → Member).
- Backlog → « 💰 Démo & monétisation white-label », « 🧱 Couche Operator », « 📺 Providers ».
- Entitlements : règle de lecture stable (les providers de paiement n'écrivent que la table).
