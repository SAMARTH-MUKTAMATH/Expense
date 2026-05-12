import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

const inr = (v) => {
  const n = typeof v === "number" ? v : parseFloat(v);
  return Number.isFinite(n) ? inrFormatter.format(n) : "₹0";
};

// Dummy data for preview
const PREVIEW_DATA = {
  monthlyReport: {
    userName: "Aarav Sharma",
    type: "monthly-report",
    data: {
      month: "December",
      stats: {
        totalIncome: 80000,
        totalExpenses: 52000,
        byCategory: {
          housing: 18000,
          groceries: 8500,
          transportation: 4500,
          entertainment: 3200,
          utilities: 5800,
        },
      },
      insights: [
        "Your housing expenses are 35% of your total spending — well within the healthy range.",
        "Great job keeping entertainment expenses under control this month!",
        "Setting up automatic savings could help you save 20% more of your income.",
      ],
    },
  },
  budgetAlert: {
    userName: "Aarav Sharma",
    type: "budget-alert",
    data: {
      percentageUsed: 85,
      budgetAmount: 40000,
      totalExpenses: 34000,
      accountName: "HDFC Savings",
    },
  },
};

export default function EmailTemplate({
  userName = "",
  type = "monthly-report",
  data = {},
}) {
  if (type === "monthly-report") {
    const net = (data?.stats?.totalIncome || 0) - (data?.stats?.totalExpenses || 0);

    return (
      <Html>
        <Head />
        <Preview>Your monthly Paisa report is here</Preview>
        <Body style={styles.body}>
          <Container style={styles.container}>
            <Heading style={styles.title}>Your monthly report</Heading>
            <Text style={styles.text}>Hi {userName},</Text>
            <Text style={styles.text}>
              Here&rsquo;s your Paisa summary for {data?.month}.
            </Text>

            <Section style={styles.statsContainer}>
              <div style={styles.stat}>
                <Text style={styles.statLabel}>Total income</Text>
                <Text style={styles.statValueGreen}>
                  {inr(data?.stats?.totalIncome)}
                </Text>
              </div>
              <div style={styles.stat}>
                <Text style={styles.statLabel}>Total expenses</Text>
                <Text style={styles.statValueRed}>
                  {inr(data?.stats?.totalExpenses)}
                </Text>
              </div>
              <div style={styles.stat}>
                <Text style={styles.statLabel}>Net</Text>
                <Text
                  style={net >= 0 ? styles.statValueGreen : styles.statValueRed}
                >
                  {inr(net)}
                </Text>
              </div>
            </Section>

            {data?.stats?.byCategory && (
              <Section style={styles.section}>
                <Heading style={styles.heading}>Expenses by category</Heading>
                {Object.entries(data.stats.byCategory).map(
                  ([category, amount]) => (
                    <div key={category} style={styles.row}>
                      <Text style={styles.rowLabel}>{category}</Text>
                      <Text style={styles.rowValue}>{inr(amount)}</Text>
                    </div>
                  )
                )}
              </Section>
            )}

            {data?.insights && (
              <Section style={styles.section}>
                <Heading style={styles.heading}>Paisa insights</Heading>
                {data.insights.map((insight, index) => (
                  <Text key={index} style={styles.insight}>
                    • {insight}
                  </Text>
                ))}
              </Section>
            )}

            <Text style={styles.footer}>
              Thanks for using Paisa. Keep tracking — every rupee counts.
            </Text>
          </Container>
        </Body>
      </Html>
    );
  }

  if (type === "budget-alert") {
    const remaining =
      (data?.budgetAmount || 0) - (data?.totalExpenses || 0);

    return (
      <Html>
        <Head />
        <Preview>Budget alert from Paisa</Preview>
        <Body style={styles.body}>
          <Container style={styles.container}>
            <Heading style={styles.title}>Budget alert</Heading>
            <Text style={styles.text}>Hi {userName},</Text>
            <Text style={styles.text}>
              You&rsquo;ve used{" "}
              <strong>{data?.percentageUsed?.toFixed?.(1) || data?.percentageUsed}%</strong>{" "}
              of your monthly budget
              {data?.accountName ? ` for ${data.accountName}` : ""}.
            </Text>
            <Section style={styles.statsContainer}>
              <div style={styles.stat}>
                <Text style={styles.statLabel}>Budget</Text>
                <Text style={styles.statValue}>{inr(data?.budgetAmount)}</Text>
              </div>
              <div style={styles.stat}>
                <Text style={styles.statLabel}>Spent so far</Text>
                <Text style={styles.statValueRed}>
                  {inr(data?.totalExpenses)}
                </Text>
              </div>
              <div style={styles.stat}>
                <Text style={styles.statLabel}>Remaining</Text>
                <Text
                  style={
                    remaining >= 0 ? styles.statValueGreen : styles.statValueRed
                  }
                >
                  {inr(remaining)}
                </Text>
              </div>
            </Section>
            <Text style={styles.footer}>
              Open your Paisa dashboard to see what&rsquo;s driving the spend.
            </Text>
          </Container>
        </Body>
      </Html>
    );
  }
}

const styles = {
  body: {
    backgroundColor: "#f6f8fc",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  container: {
    backgroundColor: "#ffffff",
    margin: "0 auto",
    padding: "32px",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.06)",
    maxWidth: "560px",
  },
  title: {
    color: "#0f172a",
    fontSize: "28px",
    fontWeight: "800",
    textAlign: "center",
    margin: "0 0 16px",
    letterSpacing: "-0.02em",
  },
  heading: {
    color: "#0f172a",
    fontSize: "18px",
    fontWeight: "700",
    margin: "0 0 12px",
  },
  text: {
    color: "#475569",
    fontSize: "15px",
    lineHeight: "1.6",
    margin: "0 0 12px",
  },
  insight: {
    color: "#334155",
    fontSize: "14px",
    lineHeight: "1.6",
    margin: "0 0 8px",
  },
  section: {
    marginTop: "24px",
    padding: "20px",
    backgroundColor: "#f8fafc",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
  },
  statsContainer: {
    margin: "24px 0",
    padding: "0",
  },
  stat: {
    marginBottom: "10px",
    padding: "14px 16px",
    backgroundColor: "#ffffff",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statLabel: {
    color: "#64748b",
    fontSize: "13px",
    margin: 0,
  },
  statValue: {
    color: "#0f172a",
    fontSize: "18px",
    fontWeight: "700",
    margin: 0,
  },
  statValueGreen: {
    color: "#059669",
    fontSize: "18px",
    fontWeight: "700",
    margin: 0,
  },
  statValueRed: {
    color: "#dc2626",
    fontSize: "18px",
    fontWeight: "700",
    margin: 0,
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px 0",
    borderBottom: "1px solid #e2e8f0",
  },
  rowLabel: {
    color: "#475569",
    fontSize: "14px",
    margin: 0,
    textTransform: "capitalize",
  },
  rowValue: {
    color: "#0f172a",
    fontSize: "14px",
    fontWeight: "600",
    margin: 0,
  },
  footer: {
    color: "#94a3b8",
    fontSize: "12px",
    textAlign: "center",
    marginTop: "28px",
    paddingTop: "16px",
    borderTop: "1px solid #e2e8f0",
  },
};

// Suppress unused-export warnings; useful for react-email preview
export { PREVIEW_DATA };
