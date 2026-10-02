import React from "react";
import { render } from "@testing-library/react-native";
import MarkdownRenderer from "../MarkdownRenderer";

const renderMarkdown = (md: string) =>
  // Paper's useTheme falls back to the default theme without a provider.
  render(<MarkdownRenderer testID="markdown">{md}</MarkdownRenderer>);

describe("MarkdownRenderer", () => {
  it("renders headings, inline formatting, lists, code and links as text", async () => {
    const { getByTestId, getByText } = await renderMarkdown(
      "# Title\n\nSome **bold** and `inline` text.\n\n- first\n- second\n\n```\nblock code\n```\n\nA [link](https://example.com).",
    );

    expect(getByTestId("markdown")).toBeTruthy();
    for (const text of ["Title", "bold", "inline", "first", "second", "block code", "link"]) {
      expect(getByText(text, { exact: false })).toBeTruthy();
    }
  });

  it("renders plain text without markdown syntax", async () => {
    const { getByText } = await renderMarkdown("Just some extracted text.");
    expect(getByText("Just some extracted text.")).toBeTruthy();
  });
});
