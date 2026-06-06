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
      hideHeader
      emptyBody={
        !isSignedIn ? t("library:downloads.guestHint") : t("library:downloads.empty")
      }
      emptyCtaHref={!isSignedIn ? "/sign-in" : "/home"}
      emptyCtaLabel={
        !isSignedIn ? t("library:actions.signInCta") : t("library:downloads.exploreCta")
      }
      emptyIconName="download-outline"
      emptyTitle={
        !isSignedIn ? t("library:downloads.guestTitle") : t("library:downloads.emptyTitle")
      }
      isLoading={isMembershipLoading || isLoading}
      items={items}
      loadingLabel={t("library:downloads.loading")}
      subtitle={t("library:screen.offlineSubtitle")}
      title={t("library:screen.sections.offline")}
    />
  );
}
