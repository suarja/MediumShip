import { isProFromEntitlement } from "../entitlements/model";
import type { EntitlementRecord } from "../entitlements/model";

export const FREE_MEMBER_LIST_LIMIT = 1;

export function canCreateAnotherList(
  existingCount: number,
  entitlement: EntitlementRecord,
): boolean {
  if (isProFromEntitlement(entitlement)) {
    return true;
  }

  return existingCount < FREE_MEMBER_LIST_LIMIT;
}

export class PersonalListLimitError extends Error {
  constructor() {
    super("Premium required for additional lists");
    this.name = "PersonalListLimitError";
  }
}
