import React, { useState } from 'react';
import {
  View,
  Image,
  Alert,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Clipboard from 'expo-clipboard';
import {
  Text,
  Button,
  Card,
  Surface,
  IconButton,
  useTheme,
  ActivityIndicator,
} from 'react-native-paper';
import Toast from 'react-native-toast-message';
import { useAppDispatch, useAppSelector } from '../store';
import { logout } from '../store/actions/authActions';
import { extractText, clearExtractedText } from '../store/actions/imageActions';
import ImagePickerComponent from '../components/ImagePickerComponent';

const HomeScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const theme = useTheme();
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
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Surface
        style={[
          styles.header,
          { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.outline },
        ]}
        elevation={1}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text variant="headlineMedium" style={{ color: theme.colors.primary, fontWeight: 'bold' }} testID="app-title">
              Image to Text
            </Text>
            {user && (
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }} testID="welcome-text">
                Welcome, {user.name}!
              </Text>
            )}
          </View>
          <IconButton
            icon="logout"
            iconColor={theme.colors.error}
            size={24}
            onPress={handleLogout}
            testID="logout-button"
            style={styles.logoutButton}
          />
        </View>
      </Surface>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {image ? (
          <View style={styles.previewContainer}>
            <Card style={[styles.imageCard, { backgroundColor: '#ffffff' }]} mode="outlined" contentStyle={styles.imageCardContent}>
              <Image source={{ uri: image }} style={styles.image} testID="image-preview" />
            </Card>

            {!extractedText && (
              <Button
                mode="contained"
                icon="text-recognition"
                onPress={handleExtractText}
                loading={extracting}
                disabled={extracting}
                style={styles.extractButton}
                contentStyle={styles.buttonContent}
                testID="extract-button"
              >
                {extracting ? 'Extracting...' : 'Extract Text from Picture'}
              </Button>
            )}

            {extracting && (
              <View style={styles.loader}>
                <ActivityIndicator size="large" color={theme.colors.primary} testID="extract-loader" />
              </View>
            )}

            {extractedText && (
              <>
                <Card style={[styles.textCard, { backgroundColor: '#ffffff' }]} mode="outlined" contentStyle={styles.textCardContent}>
                  <View style={styles.textHeader}>
                    <Text variant="titleMedium" style={{ color: theme.colors.primary, fontWeight: '600' }}>
                      Extracted Text:
                    </Text>
                    <IconButton
                      icon="content-copy"
                      iconColor={theme.colors.primary}
                      size={24}
                      onPress={handleCopyText}
                      testID="copy-button"
                    />
                  </View>
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }} testID="extracted-text">
                    {extractedText}
                  </Text>
                </Card>

                <Button
                  mode="outlined"
                  icon="refresh"
                  onPress={handleExtractAnother}
                  style={styles.extractAnotherButton}
                  contentStyle={styles.buttonContent}
                  testID="extract-another-button"
                >
                  Extract Another
                </Button>
              </>
            )}
          </View>
        ) : (
          <View style={styles.centerContainer}>
            <Card style={[styles.welcomeCard, { backgroundColor: '#ffffff' }]} mode="outlined" contentStyle={styles.welcomeCardContent}>
              <View style={styles.welcomeContent}>
                <IconButton
                  icon="camera-outline"
                  iconColor={theme.colors.primary}
                  size={64}
                  style={styles.welcomeIcon}
                />
                <Text variant="headlineSmall" style={{ color: theme.colors.primary, marginBottom: 8, textAlign: 'center' }}>
                  Get Started
                </Text>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', marginBottom: 24 }}>
                  Take a picture or select from gallery to extract text
                </Text>
                <ImagePickerComponent onImageSelected={handleImageSelected} />
              </View>
            </Card>
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
  },
  header: {
    padding: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  logoutButton: {
    margin: 0,
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
  welcomeCard: {
    width: '100%',
    borderRadius: 16,
  },
  welcomeCardContent: {
    padding: 24,
  },
  welcomeContent: {
    alignItems: 'center',
  },
  welcomeIcon: {
    marginBottom: 16,
  },
  previewContainer: {
    width: '100%',
  },
  imageCard: {
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  imageCardContent: {
    padding: 0,
  },
  image: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
  },
  extractButton: {
    marginBottom: 20,
    borderRadius: 12,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  loader: {
    marginTop: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  textCard: {
    marginTop: 10,
    borderRadius: 12,
  },
  textCardContent: {
    padding: 16,
  },
  textHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  extractAnotherButton: {
    marginTop: 20,
    borderRadius: 12,
  },
});

export default HomeScreen;
