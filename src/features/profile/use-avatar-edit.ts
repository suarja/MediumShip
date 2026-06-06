import { useUser } from "@clerk/clerk-expo";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useState } from "react";

export function useAvatarEdit() {
  const { user } = useUser();
  const [isUploading, setIsUploading] = useState(false);

  const pickAndUploadAvatar = useCallback(async () => {
    if (!user) {
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
      base64: true,
    });

    if (result.canceled || result.assets.length === 0) {
      return;
    }

    const asset = result.assets[0];
    if (!asset.base64) {
      return;
    }

    const mimeType = asset.mimeType ?? "image/jpeg";
    const dataUrl = `data:${mimeType};base64,${asset.base64}`;

    setIsUploading(true);
    try {
      await user.setProfileImage({ file: dataUrl });
    } finally {
      setIsUploading(false);
    }
  }, [user]);

  return {
    pickAndUploadAvatar,
    isUploading,
    canEditAvatar: user != null,
  };
}
