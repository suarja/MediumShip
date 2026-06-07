import { Dashboard } from "../components/cms/dashboard";

type PageProps = {
  searchParams?: Promise<{
    tab?: string;
  }>;
};

function resolveInitialTab(tab: string | undefined) {
  return tab === "tenant" ||
    tab === "users" ||
    tab === "categories" ||
    tab === "collections" ||
    tab === "events"
    ? tab
    : "contents";
}

export default async function Page({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : undefined;
  return <Dashboard initialTab={resolveInitialTab(params?.tab)} />;
}
