import { useTranslation } from "react-i18next";

import { useClerkAuth } from "../../features/auth/use-clerk-auth";
import { getContentCoverImageUrl } from "../../features/content/selectors";
import { useDownloads } from "../../features/downloads/use-downloads";
import { useIsMember } from "../../features/membership/use-is-member";
import {
  LibraryCollectionSection,
  type LibraryCollectionItem,
} from "./library-collection-section";

export function DownloadedLibrarySection() {
  const { t } = useTranslation(["library"]);
  const { isSignedIn } = useClerkAuth();
  const { isMember, isLoading: isMembershipLoading } = useIsMember();
  const { downloads, isLoading } = useDownloads({
    enabled: isSignedIn && isMember,
  });

  const items: LibraryCollectionItem[] = downloads.map((download) => ({
    id: download.content._id,
    href: `/${download.content.kind}/${download.content._id}`,
    title: download.content.title,
    eyebrow: `${t(`library:kinds.${download.content.kind}`)} · ${download.content.category}`,
    meta: t("library:downloads.rowMeta"),
    imageUrl:
      download.localCoverImagePath ??
      getContentCoverImageUrl(download.content),
    iconName: "download",
    badgeLabel: t("library:downloads.badge"),
    tone: download.content.isPremium ? "premium" : "accent",
  }));

  return (
    <LibraryCollectionSection
      emptyBody={
        !isSignedIn
          ? t("library:downloads.guestHint")
          : isMember
            ? t("library:downloads.empty")
            : t("library:downloads.memberHint")
      }
      emptyCtaHref={
        !isSignedIn ? "/sign-in" : isMember ? "/home" : "/premium"
      }
      emptyCtaLabel={
        !isSignedIn
          ? t("library:actions.signInCta")
          : isMember
            ? t("library:downloads.exploreCta")
            : t("library:actions.memberCta")
      }
      emptyIconName="download-outline"
      emptyTitle={
        !isSignedIn
          ? t("library:downloads.guestTitle")
          : isMember
            ? t("library:downloads.emptyTitle")
            : t("library:downloads.memberTitle")
      }
      isLoading={isMembershipLoading || isLoading}
      items={items}
      loadingLabel={t("library:downloads.loading")}
      subtitle={t("library:screen.offlineSubtitle")}
      title={t("library:screen.sections.offline")}
    />
  );
}
