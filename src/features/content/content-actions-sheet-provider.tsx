import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { Id } from "../../../convex/_generated/dataModel";
import { ContentActionsSheet } from "../../components/content/content-actions-sheet";

export type ContentActionsFocus = "all" | "lists";

type ContentActionsSheetState = {
  visible: boolean;
  contentId: Id<"contents"> | null;
  focus: ContentActionsFocus;
};

type ContentActionsSheetContextValue = {
  openContentActions: (
    contentId: Id<"contents">,
    focus?: ContentActionsFocus,
  ) => void;
  closeContentActions: () => void;
};

const ContentActionsSheetContext =
  createContext<ContentActionsSheetContextValue | null>(null);

export function ContentActionsSheetProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ContentActionsSheetState>({
    visible: false,
    contentId: null,
    focus: "all",
  });

  const openContentActions = useCallback(
    (contentId: Id<"contents">, focus: ContentActionsFocus = "all") => {
      setState({ visible: true, contentId, focus });
    },
    [],
  );

  const closeContentActions = useCallback(() => {
    setState((prev) => ({ ...prev, visible: false }));
  }, []);

  const value = useMemo(
    () => ({ openContentActions, closeContentActions }),
    [openContentActions, closeContentActions],
  );

  return (
    <ContentActionsSheetContext.Provider value={value}>
      {children}
      <ContentActionsSheet
        visible={state.visible}
        contentId={state.contentId}
        focus={state.focus}
        onDismiss={closeContentActions}
      />
    </ContentActionsSheetContext.Provider>
  );
}

export function useContentActionsSheet(): ContentActionsSheetContextValue {
  const ctx = useContext(ContentActionsSheetContext);
  if (!ctx) {
    throw new Error(
      "useContentActionsSheet must be used inside ContentActionsSheetProvider",
    );
  }
  return ctx;
}
