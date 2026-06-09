import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";

// Helvetica (bundled with @react-pdf) has no ₹ glyph — render "Rs." instead
// of trying to swap fonts (font registration over HTTP is slow + flaky).
const rupee = (n) => `Rs. ${formatInr(n)}`;

function formatInr(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return "0";
  return v.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#111",
    lineHeight: 1.4,
  },
  header: {
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1.5,
    borderBottomColor: "#89E900",
  },
  brand: { fontSize: 16, fontWeight: 700, color: "#000" },
  brandAccent: { color: "#5a9e00" },
  reportTitle: {
    fontSize: 11,
    color: "#444",
    marginTop: 4,
    fontWeight: 700,
  },
  metaRow: { flexDirection: "row", marginTop: 8, flexWrap: "wrap" },
  metaItem: { marginRight: 18, marginTop: 2 },
  metaLabel: { color: "#888", fontSize: 8, textTransform: "uppercase" },
  metaValue: { color: "#111", fontSize: 10, fontWeight: 700 },

  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: "#000",
    marginTop: 18,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  table: {
    borderTopWidth: 0.5,
    borderTopColor: "#bbb",
    borderLeftWidth: 0.5,
    borderLeftColor: "#bbb",
  },
  row: { flexDirection: "row" },
  cell: {
    borderRightWidth: 0.5,
    borderRightColor: "#bbb",
    borderBottomWidth: 0.5,
    borderBottomColor: "#bbb",
    padding: 5,
    fontSize: 9,
  },
  hd: {
    backgroundColor: "#f0f0f0",
    fontWeight: 700,
    fontSize: 9,
  },
  // Column widths (must sum to ~1)
  cDate: { flex: 0.18 },
  cType: { flex: 0.12 },
  cCat: { flex: 0.16 },
  cDesc: { flex: 0.34 },
  cAmt: { flex: 0.2, textAlign: "right" },

  cCategory: { flex: 0.45 },
  cTotal: { flex: 0.3, textAlign: "right" },
  cCount: { flex: 0.25, textAlign: "right" },

  expense: { color: "#b91c1c" },
  income: { color: "#047857" },

  summaryBox: {
    marginTop: 14,
    padding: 12,
    backgroundColor: "#f7fbe9",
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: "#89E900",
  },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  summaryLabel: { color: "#444", fontSize: 10 },
  summaryValue: { color: "#000", fontSize: 10, fontWeight: 700 },
  net: { fontSize: 12 },

  pageNumber: {
    position: "absolute",
    bottom: 18,
    right: 36,
    fontSize: 8,
    color: "#999",
  },
});

function TransactionsPdf({ accountName, rangeLabel, transactions, userName, generatedAt }) {
  // Sort transactions by date ascending for the table; breakdown is computed
  // from the same set so totals match what the user sees on screen.
  const sorted = [...transactions].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  const breakdown = {};
  let income = 0;
  let expense = 0;
  for (const t of transactions) {
    const amt = Number(t.amount);
    if (t.type === "EXPENSE") {
      expense += amt;
      breakdown[t.category] = breakdown[t.category] || { total: 0, count: 0 };
      breakdown[t.category].total += amt;
      breakdown[t.category].count += 1;
    } else {
      income += amt;
    }
  }
  const breakdownEntries = Object.entries(breakdown).sort(
    (a, b) => b[1].total - a[1].total
  );
  const net = income - expense;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header} fixed>
          <Text style={styles.brand}>
            Budget<Text style={styles.brandAccent}>FLOW</Text>
          </Text>
          <Text style={styles.reportTitle}>Transaction statement</Text>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Account</Text>
              <Text style={styles.metaValue}>{accountName || "—"}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Range</Text>
              <Text style={styles.metaValue}>{rangeLabel}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Transactions</Text>
              <Text style={styles.metaValue}>{transactions.length}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Generated</Text>
              <Text style={styles.metaValue}>{generatedAt}</Text>
            </View>
            {userName ? (
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>For</Text>
                <Text style={styles.metaValue}>{userName}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Summary up top so the most important figures are visible without scrolling */}
        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total income</Text>
            <Text style={[styles.summaryValue, styles.income]}>{rupee(income)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total expenses</Text>
            <Text style={[styles.summaryValue, styles.expense]}>{rupee(expense)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, styles.net]}>Net</Text>
            <Text
              style={[
                styles.summaryValue,
                styles.net,
                net >= 0 ? styles.income : styles.expense,
              ]}
            >
              {rupee(net)}
            </Text>
          </View>
        </View>

        {/* Category breakdown */}
        {breakdownEntries.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Category breakdown (expenses)</Text>
            <View style={styles.table}>
              <View style={[styles.row]}>
                <Text style={[styles.cell, styles.hd, styles.cCategory]}>Category</Text>
                <Text style={[styles.cell, styles.hd, styles.cTotal]}>Total</Text>
                <Text style={[styles.cell, styles.hd, styles.cCount]}># txns</Text>
              </View>
              {breakdownEntries.map(([cat, data]) => (
                <View key={cat} style={styles.row} wrap={false}>
                  <Text style={[styles.cell, styles.cCategory]}>
                    {String(cat).charAt(0).toUpperCase() + String(cat).slice(1)}
                  </Text>
                  <Text style={[styles.cell, styles.cTotal]}>{rupee(data.total)}</Text>
                  <Text style={[styles.cell, styles.cCount]}>{data.count}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* All transactions */}
        <Text style={styles.sectionTitle}>Transactions</Text>
        {sorted.length === 0 ? (
          <Text style={{ fontSize: 10, color: "#666" }}>
            No transactions in this range.
          </Text>
        ) : (
          <View style={styles.table}>
            <View style={styles.row}>
              <Text style={[styles.cell, styles.hd, styles.cDate]}>Date</Text>
              <Text style={[styles.cell, styles.hd, styles.cType]}>Type</Text>
              <Text style={[styles.cell, styles.hd, styles.cCat]}>Category</Text>
              <Text style={[styles.cell, styles.hd, styles.cDesc]}>Description</Text>
              <Text style={[styles.cell, styles.hd, styles.cAmt]}>Amount</Text>
            </View>
            {sorted.map((t) => {
              const isExpense = t.type === "EXPENSE";
              const dateStr = new Date(t.date).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "2-digit",
              });
              return (
                <View key={t.id} style={styles.row} wrap={false}>
                  <Text style={[styles.cell, styles.cDate]}>{dateStr}</Text>
                  <Text style={[styles.cell, styles.cType]}>
                    {isExpense ? "Expense" : "Income"}
                  </Text>
                  <Text style={[styles.cell, styles.cCat]}>
                    {String(t.category)
                      .charAt(0)
                      .toUpperCase() + String(t.category).slice(1)}
                  </Text>
                  <Text style={[styles.cell, styles.cDesc]}>
                    {t.description || "—"}
                  </Text>
                  <Text
                    style={[
                      styles.cell,
                      styles.cAmt,
                      isExpense ? styles.expense : styles.income,
                    ]}
                  >
                    {isExpense ? "-" : "+"}
                    {rupee(t.amount)}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

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
 * Render a transactions PDF to a Buffer.
 * @param {object} input
 * @param {string} input.accountName
 * @param {string} input.rangeLabel
 * @param {string} input.userName
 * @param {string} input.generatedAt — already-formatted display string
 * @param {Array} input.transactions
 * @returns {Promise<Buffer>}
 */
export async function renderTransactionsPdf(input) {
  return await renderToBuffer(<TransactionsPdf {...input} />);
}
