import React, { useState } from "react";
import {
  View,
  Alert,
  StyleSheet,
  ScrollView,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import * as DocumentPicker from "expo-document-picker";
import * as Clipboard from "expo-clipboard";
import {
  Text,
  Button,
  Card,
  Surface,
  TextInput,
  IconButton,
  useTheme,
  ActivityIndicator,
} from "react-native-paper";
import Toast from "react-native-toast-message";
import { useAppDispatch, useAppSelector } from "../store";
import {
  extractPdfText,
  clearExtractedPdfText,
} from "../store/actions/pdfActions";

const PdfScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const { accessToken, tokenType } = useAppSelector((state) => state.auth);
  const { extractedText, extracting } = useAppSelector((state) => state.pdf);
  const [pdfUri, setPdfUri] = useState<string | null>(null);
  const [pdfName, setPdfName] = useState<string | null>(null);
  const [query, setQuery] = useState<string>("");

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setPdfUri(asset.uri);
        setPdfName(asset.name || "document.pdf");
        dispatch(clearExtractedPdfText());
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick PDF file");
    }
  };

  const handleExtractText = async () => {
    if (!pdfUri || !pdfName) {
      Alert.alert("No PDF", "Please select a PDF file first.");
      return;
    }

    if (!query.trim()) {
      Alert.alert(
        "Question Required",
        "Please enter a question about the PDF uploaded."
      );
      return;
    }

    try {
      await dispatch(
        extractPdfText(pdfUri, pdfName, query.trim(), accessToken, tokenType)
      );
    } catch (error) {
      Alert.alert(
        "Extraction Failed",
        error instanceof Error ? error.message : "An error occurred"
      );
    }
  };

  const handleCopyText = async () => {
    if (!extractedText) return;

    try {
      await Clipboard.setStringAsync(extractedText);
      Toast.show({
        type: "success",
        text1: "Text copied to clipboard",
        position: "bottom",
        visibilityTime: 2000,
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Failed to copy text",
        position: "bottom",
        visibilityTime: 2000,
      });
    }
  };

  const handleExtractAnother = () => {
    setPdfUri(null);
    setPdfName(null);
    setQuery("");
    dispatch(clearExtractedPdfText());
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
        <Text variant="headlineMedium" style={{ color: theme.colors.primary, fontWeight: 'bold' }} testID="pdf-screen-title">
          PDF to Text
        </Text>
      </Surface>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {pdfUri ? (
          <View style={styles.previewContainer}>
            <Card style={[styles.pdfInfoCard, { backgroundColor: '#ffffff' }]} mode="outlined" contentStyle={styles.pdfInfoCardContent}>
              <View style={styles.pdfInfoContent}>
                <IconButton
                  icon="file-document"
                  iconColor={theme.colors.primary}
                  size={64}
                  style={styles.pdfIcon}
                />
                <Text variant="titleMedium" style={{ color: theme.colors.onSurface, textAlign: 'center' }} testID="pdf-name">
                  {pdfName}
                </Text>
              </View>
            </Card>

            {!extractedText && (
              <>
                <TextInput
                  label="Ask a question about the PDF uploaded"
                  value={query}
                  onChangeText={setQuery}
                  mode="outlined"
                  multiline
                  numberOfLines={4}
                  placeholder="Enter your question..."
                  style={styles.questionInput}
                  left={<TextInput.Icon icon="help-circle" />}
                  testID="question-input"
                />

                <Button
                  mode="contained"
                  icon="text-recognition"
                  onPress={handleExtractText}
                  loading={extracting}
                  disabled={extracting || !query.trim()}
                  style={styles.extractButton}
                  contentStyle={styles.buttonContent}
                  testID="extract-pdf-button"
                >
                  {extracting ? "Extracting..." : "Extract Text from PDF"}
                </Button>
              </>
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
                  icon="file-document-outline"
                  iconColor={theme.colors.primary}
                  size={64}
                  style={styles.welcomeIcon}
                />
                <Text variant="headlineSmall" style={{ color: theme.colors.primary, marginBottom: 8, textAlign: 'center' }}>
                  Upload PDF
                </Text>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', marginBottom: 24 }}>
                  Select a PDF file to extract text and ask questions
                </Text>
                <Button
                  mode="contained"
                  icon="upload"
                  onPress={handlePickDocument}
                  style={styles.uploadButton}
                  contentStyle={styles.buttonContent}
                  testID="upload-pdf-button"
                >
                  Upload PDF File
                </Button>
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
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  welcomeCard: {
    width: "100%",
    borderRadius: 16,
  },
  welcomeCardContent: {
    padding: 24,
  },
  welcomeContent: {
    alignItems: "center",
  },
  welcomeIcon: {
    marginBottom: 16,
  },
  previewContainer: {
    width: "100%",
  },
  pdfInfoCard: {
    marginBottom: 20,
    borderRadius: 12,
  },
  pdfInfoCardContent: {
    padding: 24,
  },
  pdfInfoContent: {
    alignItems: "center",
  },
  pdfIcon: {
    marginBottom: 8,
  },
  questionInput: {
    marginBottom: 20,
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
    alignItems: "center",
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  extractAnotherButton: {
    marginTop: 20,
    borderRadius: 12,
  },
  uploadButton: {
    borderRadius: 12,
  },
});

export default PdfScreen;
