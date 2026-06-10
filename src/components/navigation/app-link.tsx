import type { ComponentProps } from "react";
import { Link, usePathname } from "expo-router";

import { appendReturnTo } from "../../features/navigation/app-navigation";

type AppLinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
  href: ComponentProps<typeof Link>["href"];
};

/** Link that records the current route so nested screens can navigate back reliably. */
export function AppLink({ href, ...props }: AppLinkProps) {
  const pathname = usePathname();
  const resolvedHref =
    typeof href === "string" || typeof href === "object"
      ? appendReturnTo(href as string, pathname)
      : href;

  return <Link href={resolvedHref} {...props} />;
}
