import { useTranslation } from "react-i18next";

import { getContentCoverImageUrl } from "../../features/content/selectors";
import { useClerkAuth } from "../../features/auth/use-clerk-auth";
import { useDownloads } from "../../features/downloads/use-downloads";
import { useIsMember } from "../../features/membership/use-is-member";
import {
  ProfileCollectionSection,
  type ProfileCollectionItem,
} from "./profile-collection-section";

export function DownloadedContentSection() {
  const { t } = useTranslation(["library", "profile"]);
  const { isSignedIn } = useClerkAuth();
  const { isMember, isLoading: isMembershipLoading } = useIsMember();
  const { downloads, isLoading } = useDownloads({ enabled: isSignedIn && isMember });

  const items: ProfileCollectionItem[] = downloads.map((download) => ({
    id: download.content._id,
    href: `/${download.content.kind}/${download.content._id}`,
    title: download.content.title,
    eyebrow: `${t(`library:kinds.${download.content.kind}`)} · ${download.content.category}`,
    meta: t("library:downloads.rowMeta"),
    imageUrl: download.localCoverImagePath ?? getContentCoverImageUrl(download.content),
    iconName: "download",
    badgeLabel: t("library:downloads.badge"),
    tone: download.content.isPremium ? "premium" : "accent",
  }));

  let emptyTitle = t("library:downloads.emptyTitle");
  let emptyBody = t("library:downloads.empty");
  let emptyCtaLabel: string | undefined;
  let emptyCtaHref: string | undefined;

  if (!isSignedIn) {
    emptyTitle = t("library:downloads.guestTitle");
    emptyBody = t("library:downloads.guestHint");
    emptyCtaLabel = t("profile:createAccount");
    emptyCtaHref = "/sign-in";
  } else if (!isMember) {
    emptyTitle = t("library:downloads.memberTitle");
    emptyBody = t("library:downloads.memberHint");
    emptyCtaLabel = t("library:actions.memberCta");
    emptyCtaHref = "/premium";
  } else if (items.length === 0) {
    emptyCtaLabel = t("library:downloads.exploreCta");
    emptyCtaHref = "/home";
  }

  return (
    <ProfileCollectionSection
      emptyBody={emptyBody}
      emptyCtaHref={emptyCtaHref}
      emptyCtaLabel={emptyCtaLabel}
      emptyIconName="download-outline"
      emptyTitle={emptyTitle}
      isLoading={isMembershipLoading || isLoading}
      items={items}
      loadingLabel={t("library:downloads.loading")}
      subtitle={t("profile:sections.downloadsSubtitle")}
      title={t("profile:sections.downloadsTitle")}
    />
  );
}
