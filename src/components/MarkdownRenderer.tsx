import React from "react";
import { View } from "react-native";
import { useTheme } from "react-native-paper";
import Markdown from "react-native-markdown-display";

interface MarkdownRendererProps {
  children: string;
  testID?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  children,
  testID,
}) => {
  const theme = useTheme();

  return (
    <View testID={testID}>
      <Markdown
        style={{
          body: { color: theme.colors.tertiary, fontSize: 14 },
          heading1: {
            color: theme.colors.tertiary,
            fontSize: 24,
            fontWeight: "bold",
            marginVertical: 8,
          },
          heading2: {
            color: theme.colors.tertiary,
            fontSize: 20,
            fontWeight: "bold",
            marginVertical: 6,
          },
          heading3: {
            color: theme.colors.tertiary,
            fontSize: 18,
            fontWeight: "bold",
            marginVertical: 4,
          },
          paragraph: {
            color: theme.colors.tertiary,
            marginVertical: 4,
          },
          listItem: { color: theme.colors.tertiary },
          bullet_list: { marginVertical: 4 },
          ordered_list: { marginVertical: 4 },
          code_inline: {
            backgroundColor: theme.colors.surfaceVariant,
            color: theme.colors.tertiary,
            paddingHorizontal: 4,
            borderRadius: 4,
          },
          code_block: {
            backgroundColor: theme.colors.surfaceVariant,
            color: theme.colors.tertiary,
            padding: 12,
            borderRadius: 8,
            marginVertical: 8,
          },
          fence: {
            backgroundColor: theme.colors.surfaceVariant,
            color: theme.colors.tertiary,
            padding: 12,
            borderRadius: 8,
            marginVertical: 8,
          },
          blockquote: {
            backgroundColor: theme.colors.surfaceVariant,
            borderLeftColor: theme.colors.tertiary,
            borderLeftWidth: 4,
            paddingLeft: 12,
            marginVertical: 8,
          },
          link: { color: theme.colors.tertiary },
          strong: { fontWeight: "bold" },
          em: { fontStyle: "italic" },
          table: {
            borderWidth: 1,
            borderColor: theme.colors.outline,
            marginVertical: 8,
          },
          th: {
            backgroundColor: theme.colors.surfaceVariant,
            padding: 8,
            borderWidth: 1,
            borderColor: theme.colors.outline,
          },
          td: {
            padding: 8,
            borderWidth: 1,
            borderColor: theme.colors.outline,
          },
        }}
      >
        {children}
      </Markdown>
    </View>
  );
};

export default MarkdownRenderer;
