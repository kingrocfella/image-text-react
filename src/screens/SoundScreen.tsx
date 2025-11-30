import React, { useState, useEffect } from "react";
import { View, Alert, StyleSheet, ScrollView } from "react-native";
import { StatusBar } from "expo-status-bar";
import * as DocumentPicker from "expo-document-picker";
import * as Clipboard from "expo-clipboard";
import {
  Text,
  Button,
  Card,
  IconButton,
  useTheme,
  ActivityIndicator,
} from "react-native-paper";
import Toast from "react-native-toast-message";
import {
  useAudioRecorder,
  useAudioRecorderState,
  RecordingPresets,
  AudioModule,
} from "expo-audio";
import { useAppDispatch, useAppSelector } from "../store";
import {
  transcribeAudio,
  clearTranscribedText,
} from "../store/actions/audioActions";
import AppHeader from "../components/AppHeader";

const SoundScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const { accessToken, tokenType } = useAppSelector((state) => state.auth);
  const { transcribedText, transcribing } = useAppSelector(
    (state) => state.audio
  );
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [audioFileName, setAudioFileName] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (recorderState.isRecording) {
      interval = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [recorderState.isRecording]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const startRecording = async () => {
    try {
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Permission Required",
          "Please grant microphone permission to record audio."
        );
        return;
      }

      await audioRecorder.prepareToRecordAsync();
      await audioRecorder.record();
      setRecordingDuration(0);
    } catch (error) {
      Alert.alert("Error", "Failed to start recording");
      console.error("Failed to start recording", error);
    }
  };

  const stopRecording = async () => {
    try {
      await audioRecorder.stop();
      const uri = audioRecorder.uri;
      if (uri) {
        setAudioUri(uri);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to stop recording");
      console.error("Failed to stop recording", error);
    }
  };

  const handlePickAudioFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "audio/*",
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setAudioUri(asset.uri);
        setAudioFileName(asset.name || "audio.m4a");
        setRecordingDuration(0);
        dispatch(clearTranscribedText());
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick audio file");
    }
  };

  const handleTranscribeAudio = async () => {
    if (!audioUri) {
      Alert.alert("No Recording", "Please record audio first.");
      return;
    }

    try {
      await dispatch(transcribeAudio(audioUri, accessToken, tokenType));
    } catch (error) {
      Alert.alert(
        "Transcription Failed",
        error instanceof Error ? error.message : "An error occurred"
      );
    }
  };

  const handleCopyText = async () => {
    if (!transcribedText) return;

    try {
      await Clipboard.setStringAsync(transcribedText);
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

  const handleTranscribeAnother = () => {
    setAudioUri(null);
    setAudioFileName(null);
    setRecordingDuration(0);
    dispatch(clearTranscribedText());
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <AppHeader title="Audio to Text" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {audioUri || recorderState.isRecording ? (
          <View style={styles.previewContainer}>
            <Card
              style={[styles.audioCard, { backgroundColor: "#ffffff" }]}
              mode="outlined"
              contentStyle={styles.audioCardContent}
            >
              <View style={styles.audioContent}>
                <IconButton
                  icon={recorderState.isRecording ? "microphone" : "music-note"}
                  iconColor={theme.colors.tertiary}
                  size={64}
                  style={styles.audioIcon}
                />
                <Text
                  variant="titleMedium"
                  style={{
                    color: theme.colors.tertiary,
                    textAlign: "center",
                    marginBottom: 8,
                  }}
                >
                  {recorderState.isRecording
                    ? "Recording..."
                    : audioFileName
                    ? "Audio File Selected"
                    : "Recording Complete"}
                </Text>
                {audioFileName ? (
                  <Text
                    variant="bodyMedium"
                    style={{
                      color: theme.colors.tertiary,
                      textAlign: "center",
                    }}
                    testID="audio-file-name"
                  >
                    {audioFileName}
                  </Text>
                ) : (
                  <Text
                    variant="headlineMedium"
                    style={{
                      color: theme.colors.primary,
                      textAlign: "center",
                      fontWeight: "600",
                    }}
                    testID="recording-duration"
                  >
                    {formatDuration(recordingDuration)}
                  </Text>
                )}
              </View>
            </Card>

            {recorderState.isRecording ? (
              <Button
                mode="contained"
                icon="stop"
                onPress={stopRecording}
                style={styles.stopButton}
                contentStyle={styles.buttonContent}
                buttonColor={theme.colors.error}
                testID="stop-recording-button"
              >
                Stop Recording
              </Button>
            ) : (
              <>
                {!transcribedText && (
                  <>
                    <Button
                      mode="contained"
                      icon="text-recognition"
                      onPress={handleTranscribeAudio}
                      loading={transcribing}
                      disabled={transcribing}
                      style={styles.transcribeButton}
                      contentStyle={styles.buttonContent}
                      testID="transcribe-button"
                    >
                      {transcribing ? "Transcribing..." : "Transcribe Audio"}
                    </Button>

                    {!transcribing && (
                      <Button
                        mode="outlined"
                        icon="refresh"
                        onPress={handleTranscribeAnother}
                        style={styles.changeRecordingButton}
                        contentStyle={styles.buttonContent}
                        testID="change-recording-button"
                      >
                        Change Recording
                      </Button>
                    )}
                  </>
                )}
              </>
            )}

            {transcribing && (
              <View style={styles.loader}>
                <ActivityIndicator
                  size="large"
                  color={theme.colors.primary}
                  testID="transcribe-loader"
                />
              </View>
            )}

            {transcribedText && (
              <>
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
                      Transcribed Text:
                    </Text>
                    <IconButton
                      icon="content-copy"
                      iconColor={theme.colors.tertiary}
                      size={24}
                      onPress={handleCopyText}
                      testID="copy-button"
                    />
                  </View>
                  <Text
                    variant="bodyMedium"
                    style={{ color: theme.colors.tertiary }}
                    testID="transcribed-text"
                  >
                    {transcribedText}
                  </Text>
                </Card>

                <Button
                  mode="outlined"
                  icon="refresh"
                  onPress={handleTranscribeAnother}
                  style={styles.transcribeAnotherButton}
                  contentStyle={styles.buttonContent}
                  testID="transcribe-another-button"
                >
                  Transcribe Another
                </Button>
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
                  icon="microphone-outline"
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
                  Get Started
                </Text>
                <Text
                  variant="bodyMedium"
                  style={{
                    color: theme.colors.tertiary,
                    textAlign: "center",
                    marginBottom: 24,
                  }}
                >
                  Record audio or upload a file to transcribe it to text
                </Text>
                <View style={styles.buttonGroup}>
                  <Button
                    mode="contained"
                    icon="microphone"
                    onPress={startRecording}
                    style={styles.recordButton}
                    contentStyle={styles.buttonContent}
                    testID="start-recording-button"
                  >
                    Record Audio
                  </Button>
                  <Button
                    mode="outlined"
                    icon="file-music"
                    onPress={handlePickAudioFile}
                    style={[
                      styles.uploadButton,
                      { backgroundColor: theme.colors.background },
                    ]}
                    contentStyle={styles.buttonContent}
                    testID="upload-audio-button"
                  >
                    Upload Audio
                  </Button>
                </View>
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
  audioCard: {
    marginBottom: 20,
    borderRadius: 12,
  },
  audioCardContent: {
    padding: 24,
  },
  audioContent: {
    alignItems: "center",
  },
  audioIcon: {
    marginBottom: 8,
  },
  buttonGroup: {
    width: "100%",
    gap: 12,
  },
  recordButton: {
    borderRadius: 12,
  },
  uploadButton: {
    borderRadius: 12,
  },
  stopButton: {
    marginBottom: 20,
    borderRadius: 12,
  },
  transcribeButton: {
    marginBottom: 20,
    borderRadius: 12,
  },
  changeRecordingButton: {
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
  transcribeAnotherButton: {
    marginTop: 20,
    borderRadius: 12,
  },
});

export default SoundScreen;
