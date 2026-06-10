# Slice 1 — Digest quotidien + notification locale (ritualisation du retour)

> **Slice majoritairement mobile** (`app/` + `src/`, un peu de config). Brancher depuis `dev` (à jour). Première slice de la **vague monétisation** (`docs/superpowers/backlog.md` → « 💰 Vague monétisation »). **La feature feed personnalisé existe déjà** (`convex/discovery/scoring.ts` + `feed.ts`) — ce slice **n'ajoute aucun scoring**. Il pose le **module de notifications locales** qui **ritualise le retour quotidien** : une notif ramène l'utilisateur, qui retrouve son feed à jour. Module calqué sur `../editia/mobile/lib/notifications/` (production-proven).

> **For agentic workers:** REQUIRED SUB-SKILL : `superpowers:subagent-driven-development` ou `superpowers:executing-plans`. **UI/native `app/`+`src/` → skill `frontend-design`, mockups `docs/podapp/project/mobile-mockups/` = vérité visuelle, Jest (`npm test`).** Le rendu se valide en smoke Expo web + iPad (`docs/agents/ui-visual-testing.md`) — **mais les notifications natives ne sont PAS drivables headless** : couvrir par tests unitaires de la **logique de planification** (pure) + une **passe manuelle device/simulateur**. Steps use `- [ ]`.

**Goal :** un utilisateur qui a **accordé la permission** reçoit **une notification quotidienne** (« Ton feed du jour est prêt ») à une heure raisonnable ; au tap, l'app ouvre le **Home feed** (déjà personnalisé). La permission n'est **jamais** demandée automatiquement — uniquement sur une action explicite (réglage, ou prompt contextuel). Robuste au cold-start (replanifie une fenêtre glissante).

## Décisions verrouillées (issues du brainstorm)

- **Aucune nouvelle logique de feed.** Le digest = le Home feed perso **déjà en place**. Ce slice = **notification + planification**, point.
- **Notifications LOCALES en v1** (pas de push serveur) — plus simple à installer, suffisant pour ritualiser. Le push distant est parqué.
- **Permission PASSIVE** : lecture passive du statut (jamais de prompt auto au montage). Le prompt iOS n'est déclenché que par un **path explicite** (toggle réglage « Rappel quotidien », ou modal de rationale). Calque exact d'Editia (`permissionManager.tsx`, bug #1 : le hook ne déclenche plus le prompt).
- **Fenêtre glissante + replay cold-start** : on planifie N jours de rappels glissants ; replanification quand permission flips `granted`, changement de langue, ou fenêtre qui se vide (modèle `useNotificationSetup`/`scheduleCoachReminder`).
- **Réglage utilisateur** : un toggle on/off + (optionnel) choix d'heure, rangé dans Settings (croise le suivi haptics on/off déjà backloggé). Off → annule les rappels planifiés.
- **Heure locale device**, fenêtre raisonnable (ex. matin) — pas de calcul serveur.
- **i18n modulaire** (`notifications`), **tokens/responsive** pour toute UI (toggle/modal), `midnight` vérifié. **Dead code retiré.**

---

## Read First

**Protocole agent (obligatoire) :**
- `CLAUDE.md` (fondation mobile, tests, commit workflow).
- `docs/agents/slice-workflow.md` (rôles, boucle, invariants).
- `docs/agents/ui-visual-testing.md` (smoke Expo web + iPad ; rappel : notifs non drivables headless).

**Référence à copier (production-proven) — `../editia/mobile/lib/notifications/` :**
- `permissionManager.tsx` → lecture passive du statut + helper de demande **explicite** (clé du design : pas de prompt auto).
- `useNotificationSetup.ts` → hook monté une fois ; replanifie sur (permission `granted` / langue / fenêtre courte) ; auto-refresh de la fenêtre.
- `scheduleCoachReminder.ts` → fenêtres horaires locales, messages i18n, planification `expo-notifications` (à adapter : 1 message « feed du jour », pas le coach TikTok).
- `useNotificationListeners.ts` → tap → routing.
- `bootstrap.ts`, `reminderTimeSettings.ts`, `RationaleModal.tsx`, `useReminderSettings.ts` → patterns réglage/heure/rationale.
- `setNotificationHandler` (foreground display) — voir tête de `useNotificationSetup.ts`.

**App existante (à câbler) :**
- `app/(app)/_layout.tsx` → bon endroit pour monter le hook de setup une fois (après résolution thème/tenant).
- `app/(app)/home.tsx` (ou route Home) → cible du tap.
- Settings : l'écran de réglages mobile (où vit déjà le on/off haptics si présent) → y ajouter le toggle « Rappel quotidien ».
- `src/features/navigation/app-navigation.ts` → helper de navigation (routing au tap).
- `app.json` / config Expo → plugin `expo-notifications` (icône, permissions iOS/Android) si absent.
- i18n : `src/i18n/resources.ts` (+ nouveau module `notifications`).

**Tests à garder verts :** `npm test` global.

---

## Scope Guard

**Inclut :**
- `expo-notifications` installé + configuré (plugin, permissions, handler foreground).
- Module `src/features/notifications/` : permission passive, planification fenêtre glissante d'un rappel quotidien « feed du jour », listener de tap → Home, hook de setup monté une fois.
- Toggle réglage « Rappel quotidien » (on/off) + prompt **explicite** de permission (+ rationale modal). Annulation à l'off.
- i18n `fr`/`en` (module `notifications`).
- Tests Jest sur la **logique pure de planification** (calcul des dates/fenêtre, sélection message, no-op web).

**N'inclut PAS :**
- Toute logique de **scoring/feed** (déjà en place).
- **Push distant** / serveur (parqué — local seulement).
- Notification « analyse premium prête » (c'est **Slice 2**, qui réutilisera ce module).
- Deep-link vers un contenu précis (le tap ouvre le Home ; deep-link contenu parqué).

---

## File Structure

- `package.json` / `app.json` — `expo-notifications` + plugin/permissions.
- `src/features/notifications/permission.ts` — statut passif + demande explicite (NEW).
- `src/features/notifications/schedule-daily-digest.ts` — planification pure + effets `expo-notifications` (NEW, pur testable).
- `src/features/notifications/use-notification-setup.ts` — hook monté une fois (NEW).
- `src/features/notifications/use-notification-listeners.ts` — tap → Home (NEW).
- `src/features/notifications/use-digest-reminder-settings.ts` — on/off (+ heure) persistés (NEW).
- `app/(app)/_layout.tsx` — monte setup + listeners.
- `src/components/settings/daily-digest-toggle.tsx` — toggle + rationale (NEW).
- (écran Settings) — monte le toggle.
- `src/i18n/locales/{fr,en}/notifications.ts` + `resources.ts` (NEW).
- `__tests__/` — specs Jest planification/permission/no-op web.

---

### Task 1 : Installer + configurer expo-notifications

- [ ] **Step 1 :** installer `expo-notifications`, ajouter le plugin + permissions (`app.json`), `setNotificationHandler` (foreground banner, pas de son/badge) — copier la garde `try/require` d'Editia pour le web (no-op).
- [ ] **Step 2 :** `npx tsc --noEmit` clean ; l'app boot toujours sur web (module absent → no-op). **Commit** — `chore(notifications): add expo-notifications (plugin, permissions, foreground handler)`.

### Task 2 : Module notifications — permission passive + planification (Jest-first)

- [ ] **Step 1 :** `permission.ts` — `usePermissionStatus()` (lecture passive, **jamais** de prompt auto) + `requestPermissionExplicit()` (appelé uniquement par UI). Copie l'esprit `permissionManager.tsx`.
- [ ] **Step 2 (Jest) :** `schedule-daily-digest.ts` — fonction **pure** `computeReminderTriggers(now, hour, days, locale)` → liste de triggers (dates locales) + sélection de message i18n ; + `scheduleDailyDigest()` qui planifie via `expo-notifications` (effets isolés). Tester la **pure** : fenêtre correcte, N jours, message par locale, idempotence, no-op si module absent.
- [ ] **Step 3 :** `use-notification-setup.ts` — hook monté une fois : si `granted`, (re)planifie la fenêtre ; replanifie sur flip permission / changement langue / fenêtre courte (auto-refresh). Pattern `useNotificationSetup`.
- [ ] **Step 4 :** `use-notification-listeners.ts` — au tap d'une notif `kind: "daily_digest"` → navigue vers Home (via `app-navigation`).
- [ ] **Step 5 :** monter setup + listeners dans `app/(app)/_layout.tsx` (après résolution thème). `npm test` PASS. **Commit** — `feat(notifications): local daily-digest scheduling + tap-to-home (passive permission)`.

### Task 3 : Réglage utilisateur + prompt explicite (Jest-first)

- [ ] **Step 1 :** `use-digest-reminder-settings.ts` — état on/off (+ heure optionnelle) persisté (AsyncStorage ou pref existante). Off → annule les rappels planifiés.
- [ ] **Step 2 (Jest) :** `daily-digest-toggle.tsx` — toggle dans Settings ; à l'activation → `requestPermissionExplicit()` (avec `RationaleModal` si pertinent) puis planifie ; à la désactivation → annule. Tokens + `useResponsive` + `midnight`. Tester : on→demande permission+planifie, off→annule, état refusé (message).
- [ ] **Step 3 :** monter le toggle dans l'écran Settings ; i18n `notifications` (`fr`/`en`) : titre, sous-titre, rationale, message notif. Enregistrer dans `resources.ts`.
- [ ] **Step 4 :** `npm test` + `npx tsc --noEmit` clean. **Commit** — `feat(settings): daily-digest reminder toggle with explicit permission prompt`.

### Task 4 : Vérification du slice (standard — toujours)

- [ ] `npm test` (Jest) PASS ; `npx tsc --noEmit` clean ; `git status --short` clean.
- [ ] **Smoke visuel** (`docs/agents/ui-visual-testing.md`) : Expo web + headless Chrome **phone + iPad** sur **Settings** (toggle, états) ; **palette `midnight`** + claire. Vérifier que le web ne crash pas (module no-op).
- [ ] **Passe manuelle device/simulateur** (notifs non headless) : accorder la permission via le toggle → vérifier qu'un rappel se planifie (`getAllScheduledNotificationsAsync`) ; déclencher/avancer l'heure → tap → ouvre Home ; toggle off → annule.

---

## Self-Review

- **Zéro scoring neuf** : on ritualise une feature existante ; le risque est concentré sur la **plomberie notif**, déjà prouvée chez Editia → on copie, on n'invente pas.
- **Permission jamais intrusive** : lecture passive, prompt **uniquement** sur action explicite (la leçon « bug #1 » d'Editia est respectée).
- **Robustesse cold-start** : fenêtre glissante + auto-refresh ; web no-op garanti.
- **Fondation** : tokens/responsive/`midnight`, i18n modulaire (`notifications`), dead code nettoyé.

## After This Slice

- **Slice 2** réutilise ce module pour notifier « ton analyse premium est prête » + déclencher la nav auto.
- Parqués : push distant (serveur), deep-link notif → contenu précis, choix d'heure fin, réglage on/off centralisé avec haptics.
