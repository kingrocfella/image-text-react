import React, { useState } from "react";
import {
  View,
  Alert,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import * as DocumentPicker from "expo-document-picker";
import * as Clipboard from "expo-clipboard";
import {
  Text,
  Button,
  Card,
  TextInput,
  IconButton,
  useTheme,
  ActivityIndicator,
  Menu,
} from "react-native-paper";
import Toast from "react-native-toast-message";
import { useAppDispatch, useAppSelector } from "../store";
import MarkdownRenderer from "../components/MarkdownRenderer";
import {
  extractPdfText,
  clearExtractedPdfText,
  askPdfQuestion,
} from "../store/actions/pdfActions";
import AppHeader from "../components/AppHeader";
import OpenaiPassModal from "../components/OpenaiPassModal";

const PdfScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const { accessToken, tokenType } = useAppSelector((state) => state.auth);
  const { extractedText, description, requestId, extracting } = useAppSelector(
    (state) => state.pdf
  );
  const [pdfUri, setPdfUri] = useState<string | null>(null);
  const [pdfName, setPdfName] = useState<string | null>(null);
  const [query, setQuery] = useState<string>("");
  const [model, setModel] = useState<string>("");
  const [modelMenuVisible, setModelMenuVisible] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const [openaiPass, setOpenaiPass] = useState<string>("");
  const [openaiPassModalVisible, setOpenaiPassModalVisible] = useState(false);
  const [pendingModelSelection, setPendingModelSelection] = useState<
    string | null
  >(null);
  const [showOpenaiPass, setShowOpenaiPass] = useState(false);

  const modelOptions = ["openai", "ollama", "deepseek", "gemini"];

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
    if (!query.trim()) {
      Alert.alert(
        "Question Required",
        "Please enter a question about the PDF uploaded."
      );
      return;
    }

    if (!model) {
      setModelError("Model selection is required");
      Alert.alert(
        "Model Required",
        "Please select a model to use for extraction."
      );
      return;
    }

    if (model === "openai" && !openaiPass.trim()) {
      Alert.alert(
        "OpenAI Pass Required",
        "Please enter your OpenAI pass to use this model."
      );
      return;
    }

    setModelError(null);

    try {
      // If we have a request_id, ask a follow-up question
      if (requestId) {
        await dispatch(
          askPdfQuestion(
            requestId,
            query.trim(),
            model,
            model === "openai" ? openaiPass : undefined,
            accessToken,
            tokenType
          )
        );
      } else {
        // Otherwise, extract text from a new PDF
        if (!pdfUri || !pdfName) {
          Alert.alert("No PDF", "Please select a PDF file first.");
          return;
        }
        await dispatch(
          extractPdfText(
            pdfUri,
            pdfName,
            query.trim(),
            model,
            model === "openai" ? openaiPass : undefined,
            accessToken,
            tokenType
          )
        );
      }
      // Clear the query after successful submission
      setQuery("");
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
    setModel("");
    setModelError(null);
    setOpenaiPass("");
    dispatch(clearExtractedPdfText());
  };

  const handleUploadFreshPdf = () => {
    setPdfUri(null);
    setPdfName(null);
    setQuery("");
    setModel("");
    setModelError(null);
    setOpenaiPass("");
    dispatch(clearExtractedPdfText());
  };

  const handleModelSelect = (selectedModel: string) => {
    if (selectedModel === "openai") {
      // Show modal for OpenAI pass
      setPendingModelSelection(selectedModel);
      setShowOpenaiPass(false); // Reset visibility state
      setOpenaiPassModalVisible(true);
      setModelMenuVisible(false);
    } else {
      setModel(selectedModel);
      setModelMenuVisible(false);
      setModelError(null);
      setOpenaiPass(""); // Clear OpenAI pass if switching to another model
      setShowOpenaiPass(false); // Reset visibility state
    }
  };

  const handleOpenaiPassSubmit = () => {
    if (!openaiPass.trim()) {
      Alert.alert("OpenAI Pass Required", "Please enter your OpenAI pass.");
      return;
    }
    if (pendingModelSelection) {
      setModel(pendingModelSelection);
      setModelError(null);
      setPendingModelSelection(null);
    }
    setOpenaiPassModalVisible(false);
  };

  const handleOpenaiPassCancel = () => {
    setOpenaiPass("");
    setShowOpenaiPass(false);
    setPendingModelSelection(null);
    setOpenaiPassModalVisible(false);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <AppHeader title="PDF to Text" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {pdfUri || requestId ? (
          <View style={styles.previewContainer}>
            {pdfUri && (
              <Card
                style={[styles.pdfInfoCard, { backgroundColor: "#ffffff" }]}
                mode="outlined"
                contentStyle={styles.pdfInfoCardContent}
              >
                <View style={styles.pdfInfoContent}>
                  <IconButton
                    icon="file-document"
                    iconColor={theme.colors.tertiary}
                    size={64}
                    style={styles.pdfIcon}
                  />
                  <Text
                    variant="titleMedium"
                    style={{
                      color: theme.colors.tertiary,
                      textAlign: "center",
                    }}
                    testID="pdf-name"
                  >
                    {pdfName}
                  </Text>
                </View>
              </Card>
            )}

            {requestId && !pdfUri && (
              <Card
                style={[styles.pdfInfoCard, { backgroundColor: "#ffffff" }]}
                mode="outlined"
                contentStyle={styles.pdfInfoCardContent}
              >
                <View style={styles.pdfInfoContent}>
                  <IconButton
                    icon="file-document"
                    iconColor={theme.colors.tertiary}
                    size={64}
                    style={styles.pdfIcon}
                  />
                  <Text
                    variant="titleMedium"
                    style={{
                      color: theme.colors.tertiary,
                      textAlign: "center",
                    }}
                    testID="pdf-session-active"
                  >
                    PDF Session Active
                  </Text>
                  <Text
                    variant="bodySmall"
                    style={{
                      color: theme.colors.tertiary,
                      textAlign: "center",
                      marginTop: 8,
                    }}
                  >
                    You can ask questions about the previously uploaded PDF
                  </Text>
                </View>
              </Card>
            )}

            {!extractedText && (
              <>
                <View style={styles.modelContainer}>
                  <Menu
                    visible={modelMenuVisible}
                    onDismiss={() => setModelMenuVisible(false)}
                    anchor={
                      <Button
                        mode="outlined"
                        onPress={() => setModelMenuVisible(true)}
                        icon="chevron-down"
                        contentStyle={styles.modelButtonContent}
                        style={[
                          styles.modelButton,
                          modelError && styles.modelButtonError,
                        ]}
                        testID="model-dropdown"
                      >
                        {model || "Select Model *"}
                      </Button>
                    }
                  >
                    {modelOptions.map((option) => (
                      <Menu.Item
                        key={option}
                        onPress={() => handleModelSelect(option)}
                        title={option.charAt(0).toUpperCase() + option.slice(1)}
                        testID={`model-option-${option}`}
                      />
                    ))}
                  </Menu>
                  {modelError && (
                    <Text
                      variant="labelSmall"
                      style={[styles.errorText, { color: theme.colors.error }]}
                    >
                      {modelError}
                    </Text>
                  )}
                </View>

                <TextInput
                  label={
                    requestId
                      ? "Ask another question about this PDF"
                      : "Ask a question about the PDF uploaded"
                  }
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
                  disabled={
                    extracting ||
                    !query.trim() ||
                    !model ||
                    (model === "openai" && !openaiPass.trim())
                  }
                  style={styles.extractButton}
                  contentStyle={styles.buttonContent}
                  testID="extract-pdf-button"
                >
                  {extracting
                    ? "Processing..."
                    : requestId
                    ? "Ask Question"
                    : "Extract Text from PDF"}
                </Button>

                {pdfUri && !requestId && (
                  <Button
                    mode="outlined"
                    icon="file-replace"
                    onPress={handlePickDocument}
                    disabled={extracting}
                    style={styles.extractAnotherButton}
                    contentStyle={styles.buttonContent}
                    testID="extract-another-upload-button"
                  >
                    Extract Another
                  </Button>
                )}
              </>
            )}

            {extracting && (
              <View style={styles.loader}>
                <ActivityIndicator
                  size="large"
                  color={theme.colors.primary}
                  testID="extract-loader"
                />
              </View>
            )}

            {extractedText && (
              <>
                {description && (
                  <Card
                    style={[styles.textCard, { backgroundColor: "#ffffff" }]}
                    mode="outlined"
                    contentStyle={styles.textCardContent}
                  >
                    <Text
                      variant="titleMedium"
                      style={{
                        color: theme.colors.tertiary,
                        fontWeight: "600",
                        marginBottom: 8,
                      }}
                    >
                      Description:
                    </Text>
                    {description && (
                      <Text
                        variant="bodyMedium"
                        style={{ color: theme.colors.tertiary }}
                        testID="description-text"
                      >
                        {description}
                      </Text>
                    )}
                  </Card>
                )}

                <Card
                  style={[styles.textCard, { backgroundColor: "#ffffff" }]}
                  mode="outlined"
                  contentStyle={styles.textCardContent}
                >
                  <View style={styles.textHeader}>
                    <Text
                      variant="titleMedium"
                      style={{
                        color: theme.colors.tertiary,
                        fontWeight: "600",
                      }}
                    >
                      Extracted Text:
                    </Text>
                    <IconButton
                      icon="content-copy"
                      iconColor={theme.colors.tertiary}
                      size={24}
                      onPress={handleCopyText}
                      testID="copy-button"
                    />
                  </View>
                  <MarkdownRenderer testID="extracted-text">
                    {extractedText}
                  </MarkdownRenderer>
                </Card>

                {requestId && (
                  <>
                    <View style={styles.modelContainer}>
                      <Menu
                        visible={modelMenuVisible}
                        onDismiss={() => setModelMenuVisible(false)}
                        anchor={
                          <Button
                            mode="outlined"
                            onPress={() => setModelMenuVisible(true)}
                            icon="chevron-down"
                            contentStyle={styles.modelButtonContent}
                            style={[
                              styles.modelButton,
                              modelError && styles.modelButtonError,
                            ]}
                            testID="model-dropdown-followup"
                          >
                            {model || "Select Model *"}
                          </Button>
                        }
                      >
                        {modelOptions.map((option) => (
                          <Menu.Item
                            key={option}
                            onPress={() => handleModelSelect(option)}
                            title={
                              option.charAt(0).toUpperCase() + option.slice(1)
                            }
                            testID={`model-option-followup-${option}`}
                          />
                        ))}
                      </Menu>
                      {modelError && (
                        <Text
                          variant="labelSmall"
                          style={[
                            styles.errorText,
                            { color: theme.colors.error },
                          ]}
                        >
                          {modelError}
                        </Text>
                      )}
                    </View>

                    <TextInput
                      label="Ask another question about this PDF"
                      value={query}
                      onChangeText={setQuery}
                      mode="outlined"
                      multiline
                      numberOfLines={4}
                      placeholder="Enter your question..."
                      style={styles.questionInput}
                      left={<TextInput.Icon icon="help-circle" />}
                      testID="question-input-followup"
                    />

                    <Button
                      mode="contained"
                      icon="text-recognition"
                      onPress={handleExtractText}
                      loading={extracting}
                      disabled={
                        extracting ||
                        !query.trim() ||
                        !model ||
                        (model === "openai" && !openaiPass.trim())
                      }
                      style={styles.extractButton}
                      contentStyle={styles.buttonContent}
                      testID="ask-question-button"
                    >
                      {extracting ? "Processing..." : "Ask Question"}
                    </Button>
                  </>
                )}

                <View style={styles.actionButtonsContainer}>
                  {requestId && (
                    <Button
                      mode="outlined"
                      icon="upload"
                      onPress={handleUploadFreshPdf}
                      style={styles.uploadFreshButton}
                      contentStyle={styles.buttonContent}
                      testID="upload-fresh-pdf-button"
                    >
                      Upload Fresh PDF
                    </Button>
                  )}
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
                </View>
              </>
            )}
          </View>
        ) : (
          <View style={styles.centerContainer}>
            <Card
              style={[styles.welcomeCard, { backgroundColor: "#ffffff" }]}
              mode="outlined"
              contentStyle={styles.welcomeCardContent}
            >
              <View style={styles.welcomeContent}>
                <IconButton
                  icon="file-document-outline"
                  iconColor={theme.colors.tertiary}
                  size={64}
                  style={styles.welcomeIcon}
                />
                <Text
                  variant="headlineSmall"
                  style={{
                    color: theme.colors.tertiary,
                    marginBottom: 8,
                    textAlign: "center",
                  }}
                >
                  Upload PDF
                </Text>
                <Text
                  variant="bodyMedium"
                  style={{
                    color: theme.colors.tertiary,
                    textAlign: "center",
                    marginBottom: 24,
                  }}
                >
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

      <OpenaiPassModal
        visible={openaiPassModalVisible}
        openaiPass={openaiPass}
        showOpenaiPass={showOpenaiPass}
        onOpenaiPassChange={setOpenaiPass}
        onShowOpenaiPassChange={setShowOpenaiPass}
        onSubmit={handleOpenaiPassSubmit}
        onCancel={handleOpenaiPassCancel}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 40,
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
  modelContainer: {
    marginBottom: 20,
  },
  modelButton: {
    borderRadius: 12,
  },
  modelButtonError: {
    borderColor: "#dc2626",
  },
  modelButtonContent: {
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  errorText: {
    marginTop: 4,
    marginLeft: 4,
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
    flex: 1,
  },
  uploadFreshButton: {
    marginTop: 20,
    borderRadius: 12,
    marginRight: 10,
    flex: 1,
  },
  actionButtonsContainer: {
    flexDirection: "row",
    marginTop: 20,
  },
  uploadButton: {
    borderRadius: 12,
  },
});

export default PdfScreen;
