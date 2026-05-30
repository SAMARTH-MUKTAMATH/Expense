import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

const inr = (v) => {
  const n = typeof v === "number" ? v : parseFloat(v);
  return Number.isFinite(n) ? inrFormatter.format(n) : "₹0";
};

// Preview data for `npm run email`
const PREVIEW_DATA = {
  monthlyReport: {
    userName: "Aarav Sharma",
    type: "monthly-report",
    data: {
      month: "May",
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
        "Your housing expenses are 35% of your total spending — within the healthy range.",
        "Great job keeping entertainment under control this month.",
        "Setting up automatic savings could help you save 20% more.",
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
  settleReminder: {
    userName: "Priya",
    type: "settle-reminder",
    data: {
      amount: 1200,
      groupName: "Goa Trip",
      description: "Dinner at Vasco",
      paidByName: "Aarav",
      totalExpense: 3600,
      senderName: "Aarav",
    },
  },
};

export default function EmailTemplate({
  userName = "",
  type = "monthly-report",
  data = {},
}) {
  if (type === "monthly-report") return <MonthlyReport userName={userName} data={data} />;
  if (type === "budget-alert") return <BudgetAlert userName={userName} data={data} />;
  if (type === "settle-reminder") return <SettleReminder userName={userName} data={data} />;
  if (type === "advisor-ready") return <AdvisorReady userName={userName} data={data} />;
  return null;
}

function AdvisorReady({ userName, data }) {
  const { reportId, monthKey, healthScore } = data || {};
  return (
    <Shell preview={`Your ${monthKey || ""} BudgetFLOW advisor report is ready`}>
      <Hero
        eyebrow="Financial advice"
        title={`Your ${monthKey || "monthly"} report is ready`}
        subtitle={`Hi ${userName || "there"} — your full financial intelligence report is attached as a PDF, and also available online.`}
      />

      {healthScore != null && (
        <Section className="bf-card" style={styles.card}>
          <Text style={styles.pctLabel}>Financial Health Score</Text>
          <Text className="bf-pct" style={styles.pctNumber}>
            {healthScore}<span style={{ fontSize: "20px", color: "#a3a3a3" }}> / 100</span>
          </Text>
        </Section>
      )}

      <Section className="bf-card" style={styles.card}>
        <Text style={styles.cardTitle}>📎 PDF attached</Text>
        <Text style={styles.insightText}>
          Download the attachment from your inbox to read the full 18-section
          intelligence report — financial health score, expense analysis,
          forecasts, savings opportunities, and a 12-month action plan.
        </Text>
      </Section>

      {reportId && <CTA href={`${APP_URL}/advisor/${reportId}`}>View online</CTA>}

      <Footer note="Your monthly financial intelligence, delivered." />
    </Shell>
  );
}

function MonthlyReport({ userName, data }) {
  const net = (data?.stats?.totalIncome || 0) - (data?.stats?.totalExpenses || 0);
  const positive = net >= 0;
  const categories = Object.entries(data?.stats?.byCategory || {}).sort(
    ([, a], [, b]) => b - a
  );

  return (
    <Shell preview={`Your BudgetFLOW ${data?.month || ""} report is here`}>
      <Hero
        eyebrow="Monthly report"
        title={`${data?.month || "This month"} summary`}
        subtitle={`Hi ${userName || "there"} — here's how the month looked.`}
      />

      <Section className="bf-card" style={styles.card}>
        <StatRow label="Total income" value={inr(data?.stats?.totalIncome)} valueColor="#89E900" />
        <Divider />
        <StatRow label="Total expenses" value={inr(data?.stats?.totalExpenses)} valueColor="#f87171" />
        <Divider />
        <StatRow
          label="Net saved"
          value={inr(net)}
          valueColor={positive ? "#89E900" : "#f87171"}
          bold
        />
      </Section>

      {categories.length > 0 && (
        <Section className="bf-card" style={styles.card}>
          <Text style={styles.cardTitle}>Where the money went</Text>
          {categories.map(([cat, amt], idx) => (
            <Row key={cat} style={styles.catRow}>
              <Column style={styles.catLabel}>{cat}</Column>
              <Column align="right" style={styles.catValue}>
                {inr(amt)}
              </Column>
            </Row>
          ))}
        </Section>
      )}

      {data?.insights?.length > 0 && (
        <Section className="bf-card" style={styles.card}>
          <Text style={styles.cardTitle}>BudgetFLOW insights</Text>
          {data.insights.slice(0, 3).map((insight, i) => (
            <Row key={i} style={{ paddingTop: i === 0 ? 0 : 8 }}>
              <Column style={styles.bulletCol}>
                <Text style={styles.bullet}>•</Text>
              </Column>
              <Column>
                <Text style={styles.insightText}>
                  {String(insight).replace(/\$/g, "₹")}
                </Text>
              </Column>
            </Row>
          ))}
        </Section>
      )}

      <CTA href={`${APP_URL}/dashboard`}>Open dashboard</CTA>
      <Footer />
    </Shell>
  );
}

function BudgetAlert({ userName, data }) {
  const remaining = (data?.budgetAmount || 0) - (data?.totalExpenses || 0);
  const pct = parseFloat(data?.percentageUsed) || 0;
  const barColor = pct >= 90 ? "#f87171" : pct >= 75 ? "#fbbf24" : "#89E900";

  return (
    <Shell preview={`You've used ${pct.toFixed(0)}% of your monthly budget`}>
      <Hero
        eyebrow="Budget alert"
        title={`You're at ${pct.toFixed(0)}% of your budget`}
        subtitle={`Hi ${userName || "there"} — your ${data?.accountName || "default"} account just crossed the threshold this month.`}
      />

      <Section className="bf-card" style={styles.card}>
        <Text className="bf-pct" style={styles.pctNumber}>{pct.toFixed(1)}%</Text>
        <Text style={styles.pctLabel}>of monthly budget used</Text>
        <div style={styles.progressTrack}>
          <div
            style={{
              ...styles.progressFill,
              width: `${Math.min(pct, 100)}%`,
              backgroundColor: barColor,
            }}
          />
        </div>
      </Section>

      <Section className="bf-card" style={styles.card}>
        <StatRow label="Budget" value={inr(data?.budgetAmount)} />
        <Divider />
        <StatRow label="Spent so far" value={inr(data?.totalExpenses)} valueColor="#f87171" />
        <Divider />
        <StatRow
          label="Remaining"
          value={inr(remaining)}
          valueColor={remaining >= 0 ? "#89E900" : "#f87171"}
          bold
        />
      </Section>

      <CTA href={`${APP_URL}/dashboard`}>View dashboard</CTA>
      <Footer />
    </Shell>
  );
}

function SettleReminder({ userName, data }) {
  return (
    <Shell preview={`You owe ${inr(data?.amount)} in ${data?.groupName || "your group"}`}>
      <Hero
        eyebrow="Settle-up reminder"
        title={`${inr(data?.amount)} pending`}
        subtitle={`Hi ${userName || "there"} — ${data?.paidByName || "someone"} paid for ${data?.description || "an expense"} in ${data?.groupName || "your group"}.`}
      />

      <Section className="bf-card" style={styles.card}>
        <StatRow label="Your share" value={inr(data?.amount)} valueColor="#f87171" bold />
        <Divider />
        <StatRow label="Paid by" value={data?.paidByName || "—"} />
        {data?.totalExpense != null && (
          <>
            <Divider />
            <StatRow label="Total expense" value={inr(data?.totalExpense)} />
          </>
        )}
      </Section>

      <CTA href={`${APP_URL}/groups`}>Open group</CTA>

      <Text style={styles.bodyText}>
        Please settle{" "}
        <strong style={{ color: "#89E900" }}>{inr(data?.amount)}</strong> with{" "}
        {data?.paidByName || "them"} via UPI, cash, or any method that works for
        you both.
      </Text>

      <Footer
        note={`Sent on behalf of ${data?.senderName || "your group admin"} via BudgetFLOW.`}
      />
    </Shell>
  );
}

// ---------- Shared building blocks ----------

function Shell({ preview, children }) {
  return (
    <Html>
      <Head>
        <style>{`
          @media only screen and (max-width: 480px) {
            .bf-body { padding: 16px 6px !important; }
            .bf-container { padding: 20px 14px !important; border-radius: 12px !important; }
            .bf-card { padding: 14px 14px !important; }
            .bf-hero-title { font-size: 22px !important; }
            .bf-stat-value { font-size: 15px !important; }
            .bf-pct { font-size: 34px !important; }
          }
        `}</style>
      </Head>
      <Preview>{preview}</Preview>
      <Body className="bf-body" style={styles.body}>
        <Container className="bf-container" style={styles.container}>
          <Section style={styles.brandStrip}>
            <Text style={styles.brandText}>
              <span style={{ color: "#ffffff" }}>Budget</span>
              <span style={{ color: "#89E900" }}>FLOW</span>
            </Text>
          </Section>
          {children}
        </Container>
      </Body>
    </Html>
  );
}

function Hero({ eyebrow, title, subtitle }) {
  return (
    <Section style={styles.hero}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Heading className="bf-hero-title" style={styles.heroTitle}>{title}</Heading>
      <Text style={styles.heroSubtitle}>{subtitle}</Text>
    </Section>
  );
}

function StatRow({ label, value, valueColor, bold }) {
  return (
    <Row style={styles.statRow}>
      <Column style={styles.statLabel}>{label}</Column>
      <Column
        align="right"
        className="bf-stat-value"
        style={{
          ...styles.statValue,
          color: valueColor || "#ffffff",
          fontWeight: bold ? "800" : "700",
        }}
      >
        {value}
      </Column>
    </Row>
  );
}

function Divider() {
  return <Hr style={styles.divider} />;
}

function CTA({ href, children }) {
  return (
    <Section style={styles.ctaSection}>
      <Button href={href} style={styles.cta}>
        {children}
      </Button>
    </Section>
  );
}

function Footer({ note }) {
  return (
    <Section style={styles.footer}>
      <Text style={styles.footerText}>
        {note || "Track every rupee. Build the habit."}
      </Text>
      <Text style={styles.footerBrand}>
        <span style={{ color: "#ffffff" }}>Budget</span>
        <span style={{ color: "#89E900" }}>FLOW</span>
      </Text>
      <Text style={styles.footerTagline}>
        Your money, in flow.
      </Text>
    </Section>
  );
}

// ---------- Styles (inline, email-safe) ----------

const styles = {
  body: {
    backgroundColor: "#0a0a0a",
    margin: 0,
    padding: "24px 10px",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, sans-serif",
  },
  container: {
    backgroundColor: "#0f0f0f",
    margin: "0 auto",
    padding: "24px 20px",
    borderRadius: "16px",
    maxWidth: "600px",
    border: "1px solid #1f1f1f",
  },
  brandStrip: {
    paddingBottom: "18px",
    borderBottom: "1px solid #1f1f1f",
    marginBottom: "22px",
  },
  brandText: {
    fontSize: "20px",
    fontWeight: "800",
    letterSpacing: "-0.02em",
    margin: 0,
  },
  hero: {
    marginBottom: "22px",
  },
  eyebrow: {
    color: "#89E900",
    fontSize: "11px",
    fontWeight: "700",
    letterSpacing: "0.14em",
    margin: "0 0 8px",
    textTransform: "uppercase",
  },
  heroTitle: {
    color: "#ffffff",
    fontSize: "26px",
    fontWeight: "800",
    margin: "0 0 8px",
    letterSpacing: "-0.02em",
    lineHeight: "1.25",
  },
  heroSubtitle: {
    color: "#a3a3a3",
    fontSize: "14px",
    lineHeight: "1.55",
    margin: 0,
  },
  card: {
    backgroundColor: "#161616",
    border: "1px solid #1f1f1f",
    borderRadius: "12px",
    padding: "18px 20px",
    marginBottom: "14px",
  },
  cardTitle: {
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: "700",
    margin: "0 0 12px",
    letterSpacing: "-0.01em",
  },
  statRow: {
    padding: "6px 0",
  },
  statLabel: {
    color: "#a3a3a3",
    fontSize: "13px",
    fontWeight: "500",
  },
  statValue: {
    color: "#ffffff",
    fontSize: "17px",
    fontWeight: "700",
  },
  divider: {
    border: 0,
    borderTop: "1px solid #1f1f1f",
    margin: "8px 0",
  },
  catRow: {
    padding: "8px 0",
  },
  catLabel: {
    color: "#e5e5e5",
    fontSize: "13px",
    textTransform: "capitalize",
  },
  catValue: {
    color: "#ffffff",
    fontSize: "13px",
    fontWeight: "700",
  },
  bulletCol: {
    width: "16px",
    verticalAlign: "top",
    paddingTop: "2px",
  },
  bullet: {
    color: "#89E900",
    fontWeight: "700",
    margin: 0,
    fontSize: "16px",
    lineHeight: "1",
  },
  insightText: {
    color: "#d4d4d4",
    fontSize: "13px",
    lineHeight: "1.55",
    margin: 0,
  },
  pctNumber: {
    color: "#89E900",
    fontSize: "40px",
    fontWeight: "800",
    margin: 0,
    letterSpacing: "-0.03em",
    lineHeight: "1",
  },
  pctLabel: {
    color: "#a3a3a3",
    fontSize: "11px",
    margin: "6px 0 14px",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    fontWeight: "600",
  },
  progressTrack: {
    height: "10px",
    backgroundColor: "#1f1f1f",
    borderRadius: "6px",
    overflow: "hidden",
  },
  progressFill: {
    height: "10px",
    borderRadius: "6px",
  },
  ctaSection: {
    textAlign: "center",
    margin: "20px 0 4px",
  },
  cta: {
    backgroundColor: "#89E900",
    color: "#0a0a0a",
    padding: "13px 28px",
    borderRadius: "10px",
    fontWeight: "800",
    fontSize: "14px",
    textDecoration: "none",
    display: "inline-block",
    letterSpacing: "-0.01em",
  },
  bodyText: {
    color: "#a3a3a3",
    fontSize: "13px",
    lineHeight: "1.6",
    margin: "16px 0 0",
  },
  footer: {
    marginTop: "28px",
    paddingTop: "20px",
    borderTop: "1px solid #1f1f1f",
    textAlign: "center",
  },
  footerText: {
    color: "#737373",
    fontSize: "12px",
    margin: "0 0 10px",
  },
  footerBrand: {
    fontSize: "14px",
    fontWeight: "800",
    margin: "0 0 4px",
  },
  footerTagline: {
    color: "#737373",
    fontSize: "12px",
    margin: 0,
    fontStyle: "italic",
  },
};

export { PREVIEW_DATA };
