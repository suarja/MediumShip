export default {
  title: "Profile",
  eyebrow: "Your profile",
  guestTitle: "Create your profile.",
  guestName: "Guest reader",
  guestBio:
    "Reading stays open. Create an account to save favourite formats and sync progress. Premium adds offline access and personal lists.",
  signedInBio:
    "Your account keeps saved formats and progress in sync. Premium adds offline access and personal lists.",
  memberBio:
    "A profile designed to keep your reading list, resume your listening, and surface your favourite formats without friction.",
  memberBioActive:
    "Your collection is in motion: saved stories, offline copies, and synced progress stay within reach.",
  heroMetaGuest: "Open reading · account optional",
  heroMetaSignedIn: "Signed in · member options available",
  heroMetaMember: "Active member · sync ready",
  heroChipSaved_one: "{{count}} saved",
  heroChipSaved_other: "{{count}} saved",
  heroChipDownloaded_one: "{{count}} offline",
  heroChipDownloaded_other: "{{count}} offline",
  createAccount: "Create an account",
  discoverPremium: "Discover Premium",
  guestNote:
    "Your profile now focuses on identity, account state, and settings. Saved items and offline copies live in Library.",
  status: {
    memberFree: "Member · Free",
    memberPremium: "Member · Patron",
  },
  since: {
    member: "Sync ready · member account",
    upgrade: "Free account · go Premium",
  },
  stats: {
    savedLabel: "Saved",
    savedHint: "See Library",
    offlineLabel: "Offline",
    historyLabel: "History",
    downloadedLabel: "Downloaded",
    downloadedHint: "See Library",
    accessLabel: "Access",
    memberHint: "Premium active",
    guestHint: "Guest or standard account",
    syncLabel: "Sync",
    syncReady: "Convex and Clerk aligned",
    syncPending: "Local-only actions or guest session",
  },
  sections: {
    myLibrary: "My library",
    account: "Account",
    libraryTitle: "Saved library",
    librarySubtitle: "Quick access to the stories and episodes you want to keep close.",
    downloadsTitle: "Offline shelf",
    downloadsSubtitle: "Local copies with cover art, format context, and immediate offline access.",
  },
  rows: {
    saved: {
      title: "Saved items",
      sub_one: "{{count}} item set aside",
      sub_other: "{{count}} items set aside",
    },
    downloads: {
      title: "Downloads",
      subMember_one: "{{count}} episode offline",
      subMember_other: "{{count}} episodes offline",
      sub: "Members-only Premium",
    },
    lists: {
      title: "My lists",
      sub: "1 list · unlimited with Premium",
      subMember_one: "{{count}} list · private",
      subMember_other: "{{count}} lists · private",
      subMemberEmpty: "Create your first list",
    },
    history: {
      title: "History & progress",
      sub: "Resume synced across your devices",
    },
    subscription: {
      title: "Subscription · Annual",
      sub: "Billing details coming soon",
    },
    goPremium: {
      title: "Go Premium",
      sub: "Offline, unlimited lists, members lounge",
    },
    signOut: {
      title: "Sign out",
      sub: "Back to guest mode",
    },
  },
  badges: {
    free: "Free",
    member: "Member",
    premium: "Premium",
  },
} as const;
