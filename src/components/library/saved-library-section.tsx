import { useTranslation } from "react-i18next";

import { useClerkAuth } from "../../features/auth/use-clerk-auth";
import { useBookmarks } from "../../features/bookmarks/use-bookmarks";
import { getContentCoverImageUrl } from "../../features/content/selectors";
import {
  LibraryCollectionSection,
  type LibraryCollectionItem,
} from "./library-collection-section";

export function SavedLibrarySection() {
  const { t } = useTranslation(["library"]);
  const { isSignedIn } = useClerkAuth();
  const { bookmarks, isMembershipLoading, isBookmarksLoading } = useBookmarks();

  const items: LibraryCollectionItem[] = bookmarks.map((bookmark) => ({
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

  return (
    <LibraryCollectionSection
      hideHeader
      emptyBody={isSignedIn ? t("library:saved.empty") : t("library:saved.guestHint")}
      emptyCtaHref={isSignedIn ? "/home" : "/sign-in"}
      emptyCtaLabel={
        isSignedIn
          ? t("library:saved.exploreCta")
          : t("library:actions.signInCta")
      }
      emptyIconName="bookmark-outline"
      emptyTitle={
        isSignedIn
          ? t("library:saved.emptyTitle")
          : t("library:saved.guestTitle")
      }
      isLoading={isMembershipLoading || isBookmarksLoading}
      items={items}
      loadingLabel={t("library:saved.loading")}
      subtitle={t("library:screen.savedSubtitle")}
      title={t("library:screen.sections.saved")}
    />
  );
}
