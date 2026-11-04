import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { StoryMarkdown } from "./story-markdown";

const render = (markdown: string) =>
  renderToStaticMarkup(createElement(StoryMarkdown, { markdown }));

describe("K-34: story Markdown is rendered safely on the server", () => {
  it("renders headings, lists, emphasis and tables (GFM)", () => {
    const html = render("## Neden?\n\n- **İnce** kabuk\n\n| a | b |\n|---|---|\n| 1 | 2 |");
    expect(html).toContain("<h2>Neden?</h2>");
    expect(html).toContain("<li><strong>İnce</strong> kabuk</li>");
    expect(html).toContain("<table>");
  });

  it("drops raw HTML instead of passing it through", () => {
    const html = render('Merhaba <script>alert(1)</script><b onclick="x()">kalın</b>');
    expect(html).not.toContain("<script");
    expect(html).not.toContain("onclick");
    expect(html).not.toContain("<b");
  });

  it("drops inline images; photos come from the image register", () => {
    const html = render("Önce ![demlik](https://example.com/demlik.jpg) sonra");
    expect(html).not.toContain("<img");
    expect(html).toContain("Önce");
  });

  it("neutralises javascript: links and marks links that leave the site", () => {
    expect(render("[tıkla](javascript:alert(1))")).not.toContain("javascript:");
    expect(render("[kaynak](https://example.com)")).toContain('rel="noopener noreferrer"');
    expect(render("[tabak](#esnaf-tabagi)")).toBe('<p><a href="#esnaf-tabagi">tabak</a></p>');
  });
});
