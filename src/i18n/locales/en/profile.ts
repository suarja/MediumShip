export default {
  title: "Profile",
  guestTitle: "Create your profile.",
  guestName: "Guest reader",
  guestBio:
    "Reading stays open. Create an account to save your favourite formats and sync your progress. Premium adds offline access and personal lists.",
  createAccount: "Create an account",
  discoverPremium: "Discover Premium",
  status: {
    memberFree: "Member · Free",
    memberPremium: "Member · Premium",
  },
  since: {
    member: "Your subscription is active",
    upgrade: "Free account · go Premium",
  },
  stats: {
    savedLabel: "Favorites",
    offlineLabel: "Offline",
    historyLabel: "History",
  },
  sections: {
    myLibrary: "My library",
    account: "Account",
  },
  rows: {
    saved: {
      title: "Favorites",
      sub_one: "{{count}} favorite",
      sub_other: "{{count}} favorites",
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
    briefing: {
      title: "Readings of the day",
      sub: "Interpreted readings · Premium",
      subMember_one: "{{count}} saved reading",
      subMember_other: "{{count}} saved readings",
      subMemberEmpty: "Your readings of the day",
    },
    subscription: {
      title: "Premium subscription",
      sub: "Manage or cancel your subscription",
    },
    subscriptionAccess: {
      title: "Your Premium access",
      sub: "See your benefits",
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
    premium: "Premium",
  },
} as const;
