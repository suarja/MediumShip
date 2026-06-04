import { useTranslation } from "react-i18next";

import { getContentCoverImageUrl } from "../../features/content/selectors";
import { useBookmarks } from "../../features/bookmarks/use-bookmarks";
import { useClerkAuth } from "../../features/auth/use-clerk-auth";
import { ProfileCollectionSection, type ProfileCollectionItem } from "./profile-collection-section";

export function SavedContentSection() {
  const { t } = useTranslation(["library", "profile"]);
  const { isSignedIn } = useClerkAuth();
  const { bookmarks, isMember, isMembershipLoading, isBookmarksLoading } = useBookmarks();

  const items: ProfileCollectionItem[] = bookmarks.map((bookmark) => ({
    id: bookmark.content._id,
    href: `/${bookmark.content.kind}/${bookmark.content._id}`,
    title: bookmark.content.title,
    eyebrow: `${t(`library:kinds.${bookmark.content.kind}`)} · ${bookmark.content.category}`,
    meta: bookmark.content.isPremium
      ? t("library:saved.rowMetaPremium")
      : t("library:saved.rowMeta"),
    imageUrl: getContentCoverImageUrl(bookmark.content),
    iconName: "bookmark",
    badgeLabel: t("library:saved.badge"),
    tone: bookmark.content.isPremium ? "premium" : "accent",
  }));

  let emptyTitle = t("library:saved.emptyTitle");
  let emptyBody = t("library:saved.empty");
  let emptyCtaLabel: string | undefined;
  let emptyCtaHref: string | undefined;

  if (!isSignedIn) {
    emptyTitle = t("library:saved.guestTitle");
    emptyBody = t("library:saved.guestHint");
    emptyCtaLabel = t("profile:createAccount");
    emptyCtaHref = "/sign-in";
  } else if (!isMember) {
    emptyTitle = t("library:saved.memberTitle");
    emptyBody = t("library:saved.memberHint");
    emptyCtaLabel = t("library:actions.memberCta");
    emptyCtaHref = "/premium";
  } else if (items.length === 0) {
    emptyCtaLabel = t("library:saved.exploreCta");
    emptyCtaHref = "/home";
  }

  return (
    <ProfileCollectionSection
      emptyBody={emptyBody}
      emptyCtaHref={emptyCtaHref}
      emptyCtaLabel={emptyCtaLabel}
      emptyIconName="bookmark-outline"
      emptyTitle={emptyTitle}
      isLoading={isMembershipLoading || isBookmarksLoading}
      items={items}
      loadingLabel={t("library:saved.loading")}
      subtitle={t("profile:sections.librarySubtitle")}
      title={t("profile:sections.libraryTitle")}
    />
  );
}
