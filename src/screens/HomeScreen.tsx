import React, { useState } from 'react';
import {
  View,
  Text,
  Button,
  Image,
  Alert,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useAppDispatch, useAppSelector } from '../store';
import { logout } from '../store/actions/authActions';
import { extractText, clearExtractedText } from '../store/actions/imageActions';
import ImagePickerComponent from '../components/ImagePickerComponent';

const HomeScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user, accessToken, tokenType } = useAppSelector((state) => state.auth);
  const { extractedText, extracting } = useAppSelector((state) => state.image);
  const [image, setImage] = useState<string | null>(null);

  const handleImageSelected = (uri: string) => {
    setImage(uri);
    dispatch(clearExtractedText());
  };

  const handleExtractText = async () => {
    if (!image) {
      Alert.alert('No Image', 'Please take or select an image first.');
      return;
    }

    try {
      await dispatch(extractText(image, accessToken, tokenType));
    } catch (error) {
      Alert.alert('Extraction Failed', error instanceof Error ? error.message : 'An error occurred');
    }
  };

  const handleLogout = () => {
    dispatch(logout());
  };

  const handleCopyText = async () => {
    if (!extractedText) return;
    
    try {
      await Clipboard.setStringAsync(extractedText);
      Toast.show({
        type: 'success',
        text1: 'Text copied to clipboard',
        position: 'bottom',
        visibilityTime: 2000,
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Failed to copy text',
        position: 'bottom',
        visibilityTime: 2000,
      });
    }
  };

  const handleExtractAnother = () => {
    setImage(null);
    dispatch(clearExtractedText());
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.title} testID="app-title">Image to Text App</Text>
            {user && (
              <Text style={styles.userName} testID="welcome-text">
                Welcome, {user.name}!
              </Text>
            )}
          </View>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            accessibilityRole="button"
            testID="logout-button"
          >
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {image ? (
          <View style={styles.previewContainer}>
            <Image source={{ uri: image }} style={styles.image} testID="image-preview" />
            {!extractedText && (
              <View style={styles.extractButtonContainer}>
                <Button
                  title={extracting ? "Extracting..." : "Extract Text from Picture"}
                  onPress={handleExtractText}
                  disabled={extracting}
                />
              </View>
            )}
            {extracting && (
              <View style={styles.loader}>
                <ActivityIndicator size="large" color="#007AFF" testID="extract-loader" />
              </View>
            )}
            {extractedText && (
              <>
                <View style={styles.textContainer}>
                  <View style={styles.textHeader}>
                    <Text style={styles.textLabel}>Extracted Text:</Text>
                    <TouchableOpacity
                      style={styles.copyButton}
                      onPress={handleCopyText}
                      accessibilityRole="button"
                      testID="copy-button"
                    >
                      <Ionicons name="copy-outline" size={20} color="#007AFF" />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.extractedText} testID="extracted-text">
                    {extractedText}
                  </Text>
                </View>
                <View style={styles.extractAnotherContainer}>
                  <Button
                    title="Extract Another"
                    onPress={handleExtractAnother}
                    color="#007AFF"
                  />
                </View>
              </>
            )}
          </View>
        ) : (
          <View style={styles.centerContainer}>
            <ImagePickerComponent onImageSelected={handleImageSelected} />
          </View>
        )}
      </ScrollView>

      <StatusBar style="auto" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userName: {
    fontSize: 14,
    color: '#666',
  },
  logoutButton: {
    padding: 8,
    paddingHorizontal: 16,
    backgroundColor: '#ff4444',
    borderRadius: 8,
  },
  logoutText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewContainer: {
    width: '100%',
  },
  image: {
    width: '100%',
    height: 300,
    borderRadius: 10,
    marginBottom: 20,
    resizeMode: 'cover',
  },
  extractButtonContainer: {
    marginBottom: 20,
  },
  loader: {
    marginTop: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  textContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 16,
    marginTop: 10,
  },
  textHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  textLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  copyButton: {
    padding: 4,
    marginLeft: 8,
  },
  extractedText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  extractAnotherContainer: {
    marginTop: 20,
  },
});

export default HomeScreen;

