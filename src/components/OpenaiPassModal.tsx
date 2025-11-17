import React from "react";
import { Portal, Dialog, TextInput, Text, Button, useTheme } from "react-native-paper";

interface OpenaiPassModalProps {
  visible: boolean;
  openaiPass: string;
  showOpenaiPass: boolean;
  onOpenaiPassChange: (value: string) => void;
  onShowOpenaiPassChange: (value: boolean) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

const OpenaiPassModal: React.FC<OpenaiPassModalProps> = ({
  visible,
  openaiPass,
  showOpenaiPass,
  onOpenaiPassChange,
  onShowOpenaiPassChange,
  onSubmit,
  onCancel,
}) => {
  const theme = useTheme();

  return (
    <Portal>
      <Dialog
        visible={visible}
        onDismiss={onCancel}
        style={{ backgroundColor: theme.colors.surface }}
      >
        <Dialog.Title style={{ color: theme.colors.onSurface }}>
          OpenAI Pass Required
        </Dialog.Title>
        <Dialog.Content>
          <TextInput
            label="Enter OpenAI Pass"
            value={openaiPass}
            onChangeText={onOpenaiPassChange}
            mode="outlined"
            secureTextEntry={!showOpenaiPass}
            placeholder="Enter your OpenAI pass"
            style={{ marginBottom: 16 }}
            autoFocus
            right={
              <TextInput.Icon
                icon={showOpenaiPass ? "eye-off" : "eye"}
                onPress={() => onShowOpenaiPassChange(!showOpenaiPass)}
              />
            }
          />
          <Text
            variant="bodySmall"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            Your OpenAI pass is required to use the OpenAI model. It will be
            sent securely with your request.
          </Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onCancel}>Cancel</Button>
          <Button mode="contained" onPress={onSubmit}>
            Submit
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

export default OpenaiPassModal;

