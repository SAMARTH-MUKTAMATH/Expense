import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";

// Note: we use the bundled Helvetica which has no ₹ glyph. We swap ₹ for "Rs."
// in the PDF below to avoid missing-glyph boxes. The web report at /advisor/[id]
// still shows ₹ correctly (browser fonts cover it).
const RUPEE_RE = /₹/g;
const rupeeToRs = (s) => (typeof s === "string" ? s.replace(RUPEE_RE, "Rs.") : s);

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#111",
    lineHeight: 1.45,
  },
  header: {
    marginBottom: 18,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },
  brand: { fontSize: 18, fontWeight: 700, color: "#000" },
  brandAccent: { color: "#5a9e00" },
  meta: { fontSize: 9, color: "#666", marginTop: 4 },
  h1: { fontSize: 16, fontWeight: 700, marginTop: 16, marginBottom: 6, color: "#000" },
  h2: { fontSize: 13, fontWeight: 700, marginTop: 14, marginBottom: 5, color: "#000" },
  h3: { fontSize: 11, fontWeight: 700, marginTop: 10, marginBottom: 4, color: "#222" },
  p: { marginBottom: 4 },
  listItem: { flexDirection: "row", marginBottom: 2, paddingLeft: 8 },
  bullet: { width: 10, fontWeight: 700, color: "#5a9e00" },
  hr: { borderBottomWidth: 0.5, borderBottomColor: "#ddd", marginVertical: 8 },
  table: { marginVertical: 6, borderTopWidth: 0.5, borderTopColor: "#ccc", borderLeftWidth: 0.5, borderLeftColor: "#ccc" },
  tableRow: { flexDirection: "row" },
  tableCell: { borderRightWidth: 0.5, borderRightColor: "#ccc", borderBottomWidth: 0.5, borderBottomColor: "#ccc", padding: 4, fontSize: 9, flex: 1 },
  tableHeader: { backgroundColor: "#f0f0f0", fontWeight: 700 },
  pageNumber: { position: "absolute", bottom: 20, right: 40, fontSize: 8, color: "#999" },
});

// Tokenize markdown into block-level chunks for @react-pdf rendering.
function parseBlocks(markdown) {
  const lines = markdown.split("\n");
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    if (trimmed === "---") {
      blocks.push({ type: "hr" });
      i++;
      continue;
    }

    const h = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      const level = h[1].length;
      blocks.push({ type: "heading", level, text: h[2] });
      i++;
      continue;
    }

    // Table: line starting with | and the next line is a separator |---|
    if (trimmed.startsWith("|") && i + 1 < lines.length && /^\s*\|?\s*:?-+/.test(lines[i + 1].trim())) {
      const rows = [];
      const headerCells = trimmed.split("|").map((c) => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
      rows.push({ cells: headerCells, isHeader: true });
      i += 2; // skip header + separator
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        const cells = lines[i].trim().split("|").map((c) => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
        rows.push({ cells, isHeader: false });
        i++;
      }
      blocks.push({ type: "table", rows });
      continue;
    }

    // List item
    const li = trimmed.match(/^[-*]\s+(.*)$/);
    if (li) {
      blocks.push({ type: "listItem", text: li[1] });
      i++;
      continue;
    }

    // Numbered list item
    const oli = trimmed.match(/^\d+\.\s+(.*)$/);
    if (oli) {
      blocks.push({ type: "listItem", text: oli[1] });
      i++;
      continue;
    }

    // Paragraph (collect consecutive non-empty non-special lines)
    let para = trimmed;
    i++;
    while (i < lines.length && lines[i].trim() && !/^(#{1,6}\s|[-*]\s|\d+\.\s|\|)/.test(lines[i].trim()) && lines[i].trim() !== "---") {
      para += " " + lines[i].trim();
      i++;
    }
    blocks.push({ type: "paragraph", text: para });
  }

  return blocks;
}

// Strip basic inline markdown for plain text rendering.
function stripInline(s) {
  return s
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
}

function AdvisorPdfDoc({ markdown, meta }) {
  const blocks = parseBlocks(markdown);
  const headingStyle = (level) => (level === 1 ? styles.h1 : level === 2 ? styles.h2 : styles.h3);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header} fixed>
          <Text style={styles.brand}>
            Budget<Text style={styles.brandAccent}>FLOW</Text> — Financial Intelligence Report
          </Text>
          <Text style={styles.meta}>
            {meta?.userName ? `For ${meta.userName} · ` : ""}
            {meta?.monthKey ? `Month: ${meta.monthKey} · ` : ""}
            Generated {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </Text>
        </View>

        {blocks.map((b, idx) => {
          if (b.type === "hr") return <View key={idx} style={styles.hr} />;
          if (b.type === "heading") {
            return (
              <Text key={idx} style={headingStyle(b.level)}>
                {rupeeToRs(stripInline(b.text))}
              </Text>
            );
          }
          if (b.type === "paragraph") {
            return (
              <Text key={idx} style={styles.p}>
                {rupeeToRs(stripInline(b.text))}
              </Text>
            );
          }
          if (b.type === "listItem") {
            return (
              <View key={idx} style={styles.listItem}>
                <Text style={styles.bullet}>•</Text>
                <Text style={{ flex: 1 }}>{rupeeToRs(stripInline(b.text))}</Text>
              </View>
            );
          }
          if (b.type === "table") {
            return (
              <View key={idx} style={styles.table} wrap={false}>
                {b.rows.map((r, ri) => (
                  <View key={ri} style={styles.tableRow}>
                    {r.cells.map((c, ci) => (
                      <Text
                        key={ci}
                        style={[styles.tableCell, r.isHeader ? styles.tableHeader : null]}
                      >
                        {stripInline(c)}
                      </Text>
                    ))}
                  </View>
                ))}
              </View>
            );
          }
          return null;
        })}

        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  );
}

/**
 * Render the advisor markdown into a PDF buffer.
 * @param {string} markdown
 * @param {{ monthKey?: string, userName?: string }} meta
 * @returns {Promise<Buffer>}
 */
export async function renderAdvisorPdf(markdown, meta = {}) {
  return await renderToBuffer(<AdvisorPdfDoc markdown={markdown} meta={meta} />);
}
