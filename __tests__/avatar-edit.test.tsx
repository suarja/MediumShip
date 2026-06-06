import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import { ProfileIdentity } from "../src/components/profile/profile-identity";
import { changeAppLanguage, initI18n } from "../src/i18n";

const mockSetProfileImage = jest.fn();
const mockLaunchImageLibraryAsync = jest.fn();
const mockRequestMediaLibraryPermissionsAsync = jest.fn();

jest.mock("@clerk/clerk-expo", () => ({
  useUser: () => ({
    user: {
      setProfileImage: mockSetProfileImage,
    },
  }),
}));

jest.mock("expo-image-picker", () => ({
  requestMediaLibraryPermissionsAsync: (...args: unknown[]) =>
    mockRequestMediaLibraryPermissionsAsync(...args),
  launchImageLibraryAsync: (...args: unknown[]) =>
    mockLaunchImageLibraryAsync(...args),
}));

jest.mock("expo-router", () => ({
  Link: ({ children }: { children: React.ReactNode }) => children,
}));

describe("avatar edit", () => {
  beforeAll(async () => {
    await initI18n();
  });

  beforeEach(async () => {
    await changeAppLanguage("en");
    mockSetProfileImage.mockReset();
    mockLaunchImageLibraryAsync.mockReset();
    mockRequestMediaLibraryPermissionsAsync.mockReset();
    mockRequestMediaLibraryPermissionsAsync.mockResolvedValue({ granted: true });
    mockLaunchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [
        {
          uri: "file:///avatar.jpg",
          base64: "aW1hZ2VkYXRh",
          mimeType: "image/jpeg",
        },
      ],
    });
    mockSetProfileImage.mockResolvedValue(undefined);
  });

  it("invokes the picker and uploads via Clerk when the avatar is tapped", async () => {
    render(
      <ProfileIdentity
        editableAvatar
        avatarUrl="https://example.com/avatar.jpg"
        name="Camille Renard"
        since="Since 2026"
        status="Member"
        title="Profile"
      />,
    );

    fireEvent.press(screen.getByTestId("profile-avatar-button"));

    await waitFor(() => {
      expect(mockRequestMediaLibraryPermissionsAsync).toHaveBeenCalled();
      expect(mockLaunchImageLibraryAsync).toHaveBeenCalled();
      expect(mockLaunchImageLibraryAsync).toHaveBeenCalledWith(
        expect.objectContaining({ base64: true }),
      );
      expect(mockSetProfileImage).toHaveBeenCalledWith({
        file: "data:image/jpeg;base64,aW1hZ2VkYXRh",
      });
    });
  });

  it("does nothing when the picker is cancelled", async () => {
    mockLaunchImageLibraryAsync.mockResolvedValue({ canceled: true, assets: [] });

    render(
      <ProfileIdentity
        editableAvatar
        avatarUrl={null}
        name="Camille Renard"
        since="Since 2026"
        status="Member"
        title="Profile"
      />,
    );

    fireEvent.press(screen.getByTestId("profile-avatar-button"));

    await waitFor(() => {
      expect(mockLaunchImageLibraryAsync).toHaveBeenCalled();
    });

    expect(mockSetProfileImage).not.toHaveBeenCalled();
  });

  it("shows a loading state while Clerk upload is in flight", async () => {
    let resolveUpload: (() => void) | undefined;
    mockSetProfileImage.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveUpload = resolve;
        }),
    );

    render(
      <ProfileIdentity
        editableAvatar
        avatarUrl={null}
        name="Camille Renard"
        since="Since 2026"
        status="Member"
        title="Profile"
      />,
    );

    fireEvent.press(screen.getByTestId("profile-avatar-button"));

    await waitFor(() => {
      expect(mockSetProfileImage).toHaveBeenCalled();
    });

    resolveUpload?.();
  });
});
