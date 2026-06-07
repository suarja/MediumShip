# 0008 — Catalogue de features & modèle d'accès (Operator → Creator → Member)

- Statut : Accepté
- Date : 2026-06-07
- Contexte lié : ADR 0002 (white-label configuration model), `CONTEXT.md` (`Feature`, `FeatureCatalog`, `AccessLevel`, `Operator`), maquette `docs/podapp/project/cms/modules.jsx`.

## Contexte

La maquette CMS « Modules » expose deux contrôles par feature : un **toggle** d'activation et un **segment d'accès** `Gratuit / Membre / Premium`. La question ouverte du développeur-devenant-créateur était : « **peut-on activer ou non des features pour un tenant, et comment l'organiser ?** » — sans réintroduire une couche de paywall complexe.

Le risque était de confondre deux choses dans le même écran :

- **Qui, dans l'app, a le droit d'utiliser une feature activée ?** → l'audience (le `Member`/fan). C'est `free / member / premium`.
- **Quelles features ce créateur a-t-il le droit d'activer ?** → l'`Operator` (nous). C'est la licence/package.

Constat déterminant : **l'infra d'accès audience existe déjà et est stable** — `convex/entitlements/` (`requireMember`, `getMyEntitlementDoc`, `isProFromEntitlement`) + le gate mobile `useIsMember`. Il n'y a donc rien à construire pour le paywall.

## Décision

**Trois niveaux de configuration, explicitement séparés :**

```
Operator (nous)   → FeatureCatalog (en CODE) + autorisation des Feature par tenant (package)
Creator (tenant)  → parmi l'autorisé : { enabled, access } par Feature
Member (fan)      → voit/utilise selon enabled + son Entitlement
```

1. **`FeatureCatalog` en code** (statique, versionné), possédé par l'`Operator` : `{ key, label, desc, group, core?, lockAccess? }`. Il n'est pas piloté par la base.
2. **Config tenant par `Feature` : `{ enabled, access }`**, étend l'`enabledModules` existant. `enabled` = `FeatureFlag` ; `access` ∈ `{ free, member, premium }` = `AccessLevel`.
3. **L'`AccessLevel` réutilise le chemin `Entitlement` existant**, jamais une nouvelle infra : `member` → `requireMember`/`useIsMember` ; `premium` → `getMyEntitlementDoc` → `isPro` ; `free` → ouvert. Une feature désactivée disparaît de la navigation.
4. **Paiement différé** : tant qu'aucun provider n'écrit la table `entitlements`, l'entitlement par défaut fait passer `premium` — c'est le « **premium gratuit pour commencer** ». La bascule payante n'écrit que la table, sans toucher au chemin de lecture (cf. règle entitlements stable).
5. **Autorisation par tenant (axe Operator) = minimale d'abord** : les flags `core`/`lockAccess` du catalogue (en code) suffisent au départ ; tout le reste est disponible au `Creator`. L'écran super-admin « ce tenant a droit à X features » (vrai package vendable par tenant) est **différé** jusqu'à la monétisation.

## Conséquences

- Le CMS n'invente pas le paywall : il **mappe** sur les entitlements. Faible coût, cohérence garantie (une seule définition de « membre/pro »).
- L'onglet Modules est bâti **une fois** avec le bon modèle (`{ enabled, access }` + icône + sections de feed), pas en deux refontes.
- La couche `Operator` reste légère (flags en code) ; on peut la pousser plus tard (set d'autorisation par tenant) **sans casser** la config tenant ni le chemin d'accès.
- `FeatureCatalog` en code = pas de migration DB pour ajouter/retirer une feature ; le compromis est qu'ajouter une feature passe par un déploiement (acceptable pour l'`Operator`).
- Non-objectifs de cette décision : le câblage paiement (RevenueCat/Stripe écrivant `entitlements`), l'écran super-admin d'autorisation par tenant, les notifications-as-a-package. Parqués (`docs/superpowers/backlog.md`).
