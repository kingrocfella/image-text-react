import React, { useState } from "react";
import {
  View,
  Text,
  Button,
  Alert,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import * as DocumentPicker from "expo-document-picker";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { useAppDispatch, useAppSelector } from "../store";
import {
  extractPdfText,
  clearExtractedPdfText,
} from "../store/actions/pdfActions";

const PdfScreen: React.FC = () => {
  const dispatch = useAppDispatch();
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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title} testID="pdf-screen-title">
          PDF to Text
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {pdfUri ? (
          <View style={styles.previewContainer}>
            <View style={styles.pdfInfoContainer}>
              <Ionicons
                name="document-text-outline"
                size={48}
                color="#007AFF"
              />
              <Text style={styles.pdfName} testID="pdf-name">
                {pdfName}
              </Text>
            </View>
            {!extractedText && (
              <>
                <View style={styles.questionContainer}>
                  <Text style={styles.questionLabel}>
                    Ask a question about the PDF uploaded:
                  </Text>
                  <TextInput
                    style={styles.questionInput}
                    placeholder="Enter your question..."
                    placeholderTextColor="#999"
                    value={query}
                    onChangeText={setQuery}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    testID="question-input"
                  />
                </View>
                <View style={styles.extractButtonContainer}>
                  <Button
                    title={
                      extracting ? "Extracting..." : "Extract Text from PDF"
                    }
                    onPress={handleExtractText}
                    disabled={extracting || !query.trim()}
                    testID="extract-pdf-button"
                  />
                </View>
              </>
            )}
            {extracting && (
              <View style={styles.loader}>
                <ActivityIndicator
                  size="large"
                  color="#007AFF"
                  testID="extract-loader"
                />
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
                    testID="extract-another-button"
                  />
                </View>
              </>
            )}
          </View>
        ) : (
          <View style={styles.centerContainer}>
            <Button
              title="Upload PDF File"
              onPress={handlePickDocument}
              color="#007AFF"
              testID="upload-pdf-button"
            />
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
    backgroundColor: "#fff",
  },
  header: {
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
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
  previewContainer: {
    width: "100%",
  },
  pdfInfoContainer: {
    alignItems: "center",
    marginBottom: 20,
    padding: 20,
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
  },
  pdfName: {
    fontSize: 16,
    marginTop: 10,
    color: "#333",
    textAlign: "center",
  },
  extractButtonContainer: {
    marginBottom: 20,
  },
  loader: {
    marginTop: 10,
    alignItems: "center",
    marginBottom: 20,
  },
  textContainer: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 16,
    marginTop: 10,
  },
  textHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  textLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  copyButton: {
    padding: 4,
    marginLeft: 8,
  },
  extractedText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  extractAnotherContainer: {
    marginTop: 20,
  },
  questionContainer: {
    marginBottom: 20,
  },
  questionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  questionInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
    minHeight: 100,
    color: "#333",
  },
});

export default PdfScreen;
