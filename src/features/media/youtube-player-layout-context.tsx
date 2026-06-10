import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";

export type YoutubePlayerSlotLayout = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type YoutubePlayerLayoutContextValue = {
  slotLayout: YoutubePlayerSlotLayout | null;
  registerSlotLayout: (layout: YoutubePlayerSlotLayout | null) => void;
};

const YoutubePlayerLayoutContext = createContext<YoutubePlayerLayoutContextValue>({
  slotLayout: null,
  registerSlotLayout: () => {},
});

export function YoutubePlayerLayoutProvider({ children }: PropsWithChildren) {
  const [slotLayout, setSlotLayout] = useState<YoutubePlayerSlotLayout | null>(
    null,
  );

  const registerSlotLayout = useCallback(
    (layout: YoutubePlayerSlotLayout | null) => {
      setSlotLayout(layout);
    },
    [],
  );

  return (
    <YoutubePlayerLayoutContext.Provider
      value={{ slotLayout, registerSlotLayout }}
    >
      {children}
    </YoutubePlayerLayoutContext.Provider>
  );
}

export function useYoutubePlayerLayout() {
  return useContext(YoutubePlayerLayoutContext);
}

type YoutubePlayerSlotProps = {
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * Placeholder on the player screen where the persistent YouTube WebView is
 * overlaid. The host reads window coordinates via measureInWindow.
 */
export function YoutubePlayerSlot({ style, testID }: YoutubePlayerSlotProps) {
  const { registerSlotLayout } = useYoutubePlayerLayout();
  const slotRef = useRef<View>(null);

  const measureSlot = () => {
    slotRef.current?.measureInWindow((x, y, width, height) => {
      if (width > 0 && height > 0) {
        registerSlotLayout({ x, y, width, height });
      }
    });
  };

  return (
    <View
      onLayout={measureSlot}
      ref={slotRef}
      style={style}
      testID={testID ?? "youtube-player-slot"}
    />
  );
}
