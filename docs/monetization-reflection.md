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

## Décisions tranchées (2026-06-10)

> La réflexion ci-dessus reste le contexte ; voici ce qui est **acté** et alimente les plans de slices.

- **La démo EST un produit payant.** On ne fait pas une vitrine débloquée : une démo doit démontrer le produit réel, et un premium crédible vend *mieux* le white-label tout en ouvrant la facturation. → **fork #1 = monétisée**, **fork #4 = paiement câblé AVANT publication**.
- **Paiement réel day-1 = RevenueCat + IAP Apple** (~30 %), **2 €/mois + 2 semaines d'essai** (modèle inspiré de **Gleeph**). Le provider **écrit la table `entitlements`** ; on flippe `PREMIUM_PAYMENT_DEFERRED = false` ; **le read path ne change pas** ([[entitlement-read-api-stable]]).
- **Feature signature premium = analyse de goûts + sélection connexe**, inspirée de Gleeph :
  - un **texte « journaliste »** expliquant ce que l'utilisateur aime (analyse **globale**, **pas** de « pourquoi » par item) ;
  - une **sélection de contenus connexes** susceptibles de l'intéresser ;
  - **génération par CRON quotidien à heure fixe** (le « chrono ») pour chaque membre premium — **pas** paresseux-à-l'ouverture ;
  - **page analyse dédiée + page historique** de toutes les analyses passées ; **à l'ouverture de l'app, si une nouvelle analyse a été générée depuis la dernière visite du membre → navigation auto** vers la page du jour. **Profil** garde une **carte d'entrée/aperçu** vers ces pages.
  - Le **LLM n'écrit que la prose** ; la **sélection connexe vient du moteur `discovery/scoring` déterministe** (zéro ID halluciné). S'appuie sur la donnée déjà calculée (`userPreferences`, `categoryInterests`, `contentInteractions`, `bookmarks`).
  - Agents : composant **`@convex-dev/agent`**, squelette inspiré d'`../editia/web/convex/agent/` (buildSystemPrompt, sanitizeUserInput, recordSecurityEvent).
- **Daily digest = feed personnalisé quotidien, GRATUIT** (façon Daily.dev) — **la feature feed existe déjà** (`discovery/scoring`+`feed`). Le slice ne fait qu'ajouter la **notification locale** qui **ritualise le retour quotidien** : l'utilisateur revient → voit son feed à jour. Module notif calqué sur `../editia/mobile/lib/notifications/` (v1 local, plus simple que le push).
- **`Sync multi-appareils` n'est PAS un levier premium** : inhérent à Convex (même compte = synchronisé), la gater = dégrader artificiellement le gratuit. Retiré des candidats premium.
- **Candidats premium retenus :** analyse IA (signature), **offline downloads** (Article/Episode/HostedVideo, **pas YouTube**). **Gating par quantité** (ex. collections limitées) = nouveau mécanisme (modèle actuel binaire) → **différé** (slice S-E).
- **Badges d'accès = natifs** : afficher le badge **uniquement si la feature est bloquée pour cet utilisateur** (`requiresPremium`/`requiresSignIn` de `use-feature-access.ts`), jamais sur `access === "premium"` brut. Déjà fait sur Profil → sweep des autres surfaces (S-A).
- **Périmètre 1ʳᵉ soumission = 4 slices, ordre d'implémentation fixé** : **(1)** Digest + notification locale *(la feature feed existe déjà)* → **(2)** Analyse premium *(cron quotidien + pages dédiée/historique + nav auto)* → **(3)** Sweep badges natifs → **(4)** RevenueCat + IAP *(bloquant soumission, en dernier)*. **Gating par quantité différé.** Implémentation **séquentielle**, plans suivants mis à jour après chaque slice si besoin.
- **Chantier suivant après publication = landing pages** (démo + white-label + CMS).

## Cross-refs

- ADR 0008 — Feature catalog & access model (Operator → Creator → Member).
- Backlog → « 💰 Démo & monétisation white-label », « 🧱 Couche Operator », « 📺 Providers ».
- Entitlements : règle de lecture stable (les providers de paiement n'écrivent que la table).
