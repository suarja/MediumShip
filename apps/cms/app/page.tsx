import { Dashboard } from "../components/cms/dashboard";
import { isCmsTab } from "../lib/cms-tabs";

type PageProps = {
  searchParams?: Promise<{
    tab?: string;
  }>;
};

function resolveInitialTab(tab: string | undefined) {
  return isCmsTab(tab) ? tab : "contents";
}

export default async function Page({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : undefined;
  return <Dashboard initialTab={resolveInitialTab(params?.tab)} />;
}
