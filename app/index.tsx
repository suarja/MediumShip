import { Redirect } from "expo-router";

// Public entry: open the guest-first app shell immediately.
export default function Index() {
  return <Redirect href="/home" />;
}
