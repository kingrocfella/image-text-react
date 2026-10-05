import React from "react";
import { View, Alert, StyleSheet } from "react-native";
import { Button } from "react-native-paper";
import * as ImagePicker from "expo-image-picker";
import { tooLargeMessage } from "../utils/uploadLimits";

interface ImagePickerComponentProps {
  onImageSelected: (uri: string) => void;
}

const ImagePickerComponent: React.FC<ImagePickerComponentProps> = ({
  onImageSelected,
}) => {
  const selectAsset = (asset: ImagePicker.ImagePickerAsset) => {
    const tooLarge = tooLargeMessage("imageBytes", asset.fileSize);
    if (tooLarge) {
      Alert.alert("Image Too Large", tooLarge);
      return;
    }
    onImageSelected(asset.uri);
  };

  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Denied",
        "Camera permission is required to take pictures."
      );
      return false;
    }
    return true;
  };

  const takePicture = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.9,
    });

    if (!result.canceled && result.assets[0]) {
      selectAsset(result.assets[0]);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.9,
    });

    if (!result.canceled && result.assets[0]) {
      selectAsset(result.assets[0]);
    }
  };

  return (
    <View style={styles.container}>
      <Button
        mode="contained"
        icon="camera"
        onPress={takePicture}
        style={styles.button}
        contentStyle={styles.buttonContent}
        testID="take-picture-button"
      >
        Take Picture
      </Button>
      <Button
        mode="contained-tonal"
        icon="image"
        onPress={pickImage}
        style={styles.button}
        contentStyle={styles.buttonContent}
        testID="pick-image-button"
      >
        Pick from Gallery
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
    gap: 16,
  },
  button: {
    width: 280,
    borderRadius: 12,
  },
  buttonContent: {
    paddingVertical: 8,
  },
});

export default ImagePickerComponent;
