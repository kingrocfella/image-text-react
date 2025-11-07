import React from 'react';
import { View, Button, Alert, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

interface ImagePickerComponentProps {
  onImageSelected: (uri: string) => void;
}

const ImagePickerComponent: React.FC<ImagePickerComponentProps> = ({ onImageSelected }) => {
  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Camera permission is required to take pictures.');
      return false;
    }
    return true;
  };

  const takePicture = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      onImageSelected(result.assets[0].uri);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      onImageSelected(result.assets[0].uri);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.button}>
        <Button title="Take Picture" onPress={takePicture} />
      </View>
      <View style={styles.button}>
        <Button title="Pick from Gallery" onPress={pickImage} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    gap: 15,
  },
  button: {
    width: 250,
    marginVertical: 5,
  },
});

export default ImagePickerComponent;

