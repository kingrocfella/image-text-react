import React, { Fragment } from "react";
import { View } from "react-native";
import { useTheme } from "react-native-paper";
import { useMarkdown } from "react-native-marked";

interface MarkdownRendererProps {
  children: string;
  testID?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  children,
  testID,
}) => {
  const theme = useTheme();

  // The hook returns plain elements rather than the library's FlatList, so the
  // output can sit inside the screen's own ScrollView without nesting lists.
  const elements = useMarkdown(children, {
    colorScheme: theme.dark ? "dark" : "light",
    theme: {
      colors: {
        text: theme.colors.tertiary,
        link: theme.colors.tertiary,
        code: theme.colors.surfaceVariant,
        border: theme.colors.outline,
      },
    },
    styles: {
      text: { color: theme.colors.tertiary, fontSize: 14 },
      h1: {
        color: theme.colors.tertiary,
        fontSize: 24,
        fontWeight: "bold",
        marginVertical: 8,
      },
      h2: {
        color: theme.colors.tertiary,
        fontSize: 20,
        fontWeight: "bold",
        marginVertical: 6,
      },
      h3: {
        color: theme.colors.tertiary,
        fontSize: 18,
        fontWeight: "bold",
        marginVertical: 4,
      },
      paragraph: { marginVertical: 4 },
      li: { color: theme.colors.tertiary },
      list: { marginVertical: 4 },
      codespan: {
        backgroundColor: theme.colors.surfaceVariant,
        color: theme.colors.tertiary,
        paddingHorizontal: 4,
        borderRadius: 4,
      },
      code: {
        backgroundColor: theme.colors.surfaceVariant,
        padding: 12,
        borderRadius: 8,
        marginVertical: 8,
      },
      codeText: { color: theme.colors.tertiary },
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
      tableCell: {
        padding: 8,
        borderWidth: 1,
        borderColor: theme.colors.outline,
      },
    },
  });

  return (
    <View testID={testID}>
      {elements.map((element, index) => (
        <Fragment key={`md_${index}`}>{element}</Fragment>
      ))}
    </View>
  );
};

export default MarkdownRenderer;
