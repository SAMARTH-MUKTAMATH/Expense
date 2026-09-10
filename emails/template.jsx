import {
  Body,
  Button,
  Column,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";

function resolveAppUrl() {
  const explicit = process.env.NEXT_PUBLIC_APP_URL;
  if (explicit) return explicit.replace(/\/+$/, "");
  const deployed =
    process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (deployed) return `https://${deployed}`;
  return "http://localhost:3000";
}

const APP_URL = resolveAppUrl();
const LOGO_URL = `${APP_URL}/email-logo.png`;
const LOGO_IS_REACHABLE = !/^https?:\/\/(localhost|127\.0\.0\.1)/i.test(APP_URL);
const SUPPORT_EMAIL =
  process.env.SUPPORT_EMAIL || process.env.BREVO_SENDER_EMAIL || "";

const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

const inr = (v) => {
  const n = typeof v === "number" ? v : parseFloat(v);
  return Number.isFinite(n) ? inrFormatter.format(n) : "₹0";
};

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
        transactionCount: 47,
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
  advisorReady: {
    userName: "Aarav Sharma",
    type: "advisor-ready",
    data: {
      reportId: "rep_01H8XKJ2M4",
      monthKey: "May 2026",
      healthScore: 72,
    },
  },
};

export default function EmailTemplate({
  userName = "",
  type = "monthly-report",
  data = {},
}) {
  if (type === "monthly-report")
    return <MonthlyReport userName={userName} data={data} />;
  if (type === "budget-alert")
    return <BudgetAlert userName={userName} data={data} />;
  if (type === "settle-reminder")
    return <SettleReminder userName={userName} data={data} />;
  if (type === "advisor-ready")
    return <AdvisorReady userName={userName} data={data} />;
  return null;
}

function AdvisorReady({ userName, data }) {
  const { reportId, monthKey, healthScore } = data || {};
  const period = monthKey || "this month";

  return (
    <Shell
      category="Report"
      footerReason="You receive this email when a financial report is generated for your account."
      preview={`Your ${period} BudgetFLOW advisor report is ready`}
    >
      <Hero
        title={`Your ${period} report is ready`}
        subtitle={`Hi ${userName || "there"} — your full ${period} analysis is attached as a PDF.`}
      />

      {healthScore != null && (
        <Card>
          <Metric
            label="Financial health score"
            value={String(healthScore)}
            suffix="/ 100"
          />
          <BodyText>
            Scored on income stability, spending discipline, savings rate and
            emergency-fund cover. The full breakdown is in the report.
          </BodyText>
        </Card>
      )}

      <Card>
        <CardTitle>What&rsquo;s in the report</CardTitle>
        <BulletList
          items={[
            "Income and expense analysis, category by category",
            "Cash flow and a recurring-expense audit",
            "Forecasts and a financial risk register",
            "Savings opportunities with rupee targets",
            "A staged action plan for the year ahead",
          ]}
        />
      </Card>

      {reportId && (
        <CTA href={`${APP_URL}/advisor/${reportId}`}>View report online</CTA>
      )}

      <Footnote>
        Automated analysis of your own recorded transactions. Information only —
        not investment, tax or legal advice, and no returns are promised. Verify
        figures before acting on them.
      </Footnote>

    </Shell>
  );
}

function MonthlyReport({ userName, data }) {
  const income = data?.stats?.totalIncome || 0;
  const expenses = data?.stats?.totalExpenses || 0;
  const net = income - expenses;
  const surplus = net >= 0;
  const categories = Object.entries(data?.stats?.byCategory || {}).sort(
    ([, a], [, b]) => b - a
  );
  const month = data?.month || "This month";
  const savingsRate = income > 0 ? (net / income) * 100 : null;
  const transactionCount = data?.stats?.transactionCount;
  const topCategory = categories[0];

  return (
    <Shell
      category="Statement"
      footerReason="You receive this summary at the start of each month."
      preview={`Your BudgetFLOW ${data?.month || ""} summary is ready`}
    >
      <Hero
        title={`${month} summary`}
        subtitle={`Hi ${userName || "there"} — a full breakdown of what came in, what went out and what you kept in ${month}.`}
      />

      <Card>
        <Metric
          label={surplus ? "Net saved" : "Net shortfall"}
          value={inr(Math.abs(net))}
          tone={surplus ? "accent" : "danger"}
        />
        <Badge
          label={
            surplus
              ? savingsRate != null
                ? `Surplus · ${savingsRate.toFixed(1)}% of income saved`
                : "Surplus"
              : "Shortfall · spent more than you earned"
          }
          tone={surplus ? "accent" : "danger"}
        />
      </Card>

      <Card>
        <CardTitle>Money in and out</CardTitle>
        <DetailRow label="Total income" value={inr(income)} tone="accent" />
        <Divider />
        <DetailRow label="Total expenses" value={inr(expenses)} tone="danger" />
        <Divider />
        <DetailRow
          label={surplus ? "Net saved" : "Net shortfall"}
          value={inr(Math.abs(net))}
          tone={surplus ? "accent" : "danger"}
          emphasis
        />
        {savingsRate != null && (
          <>
            <Divider />
            <DetailRow
              label="Savings rate"
              value={`${savingsRate.toFixed(1)}%`}
              tone={surplus ? "accent" : "danger"}
            />
          </>
        )}
        {transactionCount != null && (
          <>
            <Divider />
            <DetailRow
              label="Transactions recorded"
              value={String(transactionCount)}
            />
          </>
        )}
      </Card>

      {categories.length > 0 && (
        <Card>
          <CardTitle>Where the money went</CardTitle>
          {categories.map(([category, amount]) => (
            <Row key={category} style={styles.categoryRow}>
              <Column style={styles.categoryLabel}>
                {category}
                {expenses > 0 && (
                  <span style={styles.categoryShare}>
                    {((amount / expenses) * 100).toFixed(0)}%
                  </span>
                )}
              </Column>
              <Column align="right" style={styles.categoryValue}>
                {inr(amount)}
              </Column>
            </Row>
          ))}
        </Card>
      )}

      {data?.insights?.length > 0 && (
        <Card>
          <CardTitle>Insights</CardTitle>
          {data.insights.slice(0, 3).map((insight, i) => (
            <Row key={i} style={{ paddingTop: i === 0 ? 0 : "10px" }}>
              <Column style={styles.bulletCol}>
                <Text style={styles.bullet}>•</Text>
              </Column>
              <Column>
                <Text style={styles.bodyText}>
                  {String(insight).replace(/\$/g, "₹")}
                </Text>
              </Column>
            </Row>
          ))}
        </Card>
      )}

      <CTA href={`${APP_URL}/dashboard`}>Open dashboard</CTA>

      <Footnote>
        Calculated from the transactions recorded in your account — this is not a
        bank statement. Insights are generated automatically.
      </Footnote>

    </Shell>
  );
}

function BudgetAlert({ userName, data }) {
  const budgetAmount = parseFloat(data?.budgetAmount) || 0;
  const totalExpenses = parseFloat(data?.totalExpenses) || 0;
  const remaining = budgetAmount - totalExpenses;
  const pct = parseFloat(data?.percentageUsed) || 0;
  const level = usageLevel(pct);
  const overspent = remaining < 0;
  const accountName = data?.accountName || "your default account";

  return (
    <Shell
      category="Alert"
      footerReason={`You receive this alert when spending on ${accountName} crosses your budget threshold.`}
      preview={`You have used ${pct.toFixed(0)}% of your monthly budget`}
    >
      <Hero
        title={`You have used ${pct.toFixed(0)}% of your budget`}
        subtitle={`Hi ${userName || "there"} — spending on ${accountName} has crossed your alert threshold for this month.`}
      />

      <Card>
        <Metric
          label="Monthly budget used"
          value={`${pct.toFixed(1)}%`}
          tone={level.tone}
        />
        <Badge label={level.label} tone={level.tone} />
        <ProgressBar pct={pct} tone={level.tone} />
      </Card>

      <Card>
        <CardTitle>Budget breakdown</CardTitle>
        <DetailRow label="Monthly budget" value={inr(budgetAmount)} />
        <Divider />
        <DetailRow label="Spent so far" value={inr(totalExpenses)} tone="danger" />
        <Divider />
        <DetailRow
          label={overspent ? "Over budget by" : "Remaining"}
          value={inr(Math.abs(remaining))}
          tone={overspent ? "danger" : "accent"}
          emphasis
        />
        <Divider />
        <DetailRow label="Account" value={accountName} />
      </Card>

      <CTA href={`${APP_URL}/dashboard`}>Review spending</CTA>

    </Shell>
  );
}

function SettleReminder({ userName, data }) {
  const amount = data?.amount;
  const paidByName = data?.paidByName || "another member";
  const groupName = data?.groupName || "your group";
  const description = data?.description || "an expense";

  return (
    <Shell
      category="Group expense"
      footerReason={`${data?.senderName || "A member of your group"} sent this reminder through BudgetFLOW.`}
      preview={`${inr(amount)} is pending in ${groupName}`}
    >
      <Hero
        title={`${inr(amount)} pending in ${groupName}`}
        subtitle={`Hi ${userName || "there"} — ${paidByName} paid for "${description}" and recorded your share in ${groupName}.`}
      />

      <Card>
        <Metric label="Your share" value={inr(amount)} tone="danger" />
        <Badge label="Unsettled" tone="danger" />
      </Card>

      <Card>
        <CardTitle>Expense details</CardTitle>
        <DetailRow label="Description" value={description} />
        <Divider />
        <DetailRow label="Group" value={groupName} />
        <Divider />
        <DetailRow label="Paid by" value={paidByName} />
        {data?.totalExpense != null && (
          <>
            <Divider />
            <DetailRow label="Total expense" value={inr(data.totalExpense)} />
          </>
        )}
        <Divider />
        <DetailRow label="Your share" value={inr(amount)} tone="danger" emphasis />
      </Card>

      <CTA href={`${APP_URL}/groups`}>Open group</CTA>

      <Footnote>
        Settle directly with {paidByName} using UPI, cash or any method you both
        prefer. BudgetFLOW records the expense — it never moves money.
      </Footnote>

    </Shell>
  );
}

function usageLevel(pct) {
  if (pct >= 100) return { label: "Over budget", tone: "danger" };
  if (pct >= 90) return { label: "Critical", tone: "danger" };
  if (pct >= 75) return { label: "High usage", tone: "warn" };
  return { label: "On track", tone: "accent" };
}

function Shell({ preview, category, footerReason, children }) {
  return (
    <Html lang="en">
      <Head>
        <meta name="color-scheme" content="dark" />
        <meta name="supported-color-schemes" content="dark" />
        <style>{`
          body { margin:0 !important; padding:0 !important; width:100% !important; }
          @media only screen and (max-width: 600px) {
            .bf-band { padding-left:16px !important; padding-right:16px !important; }
            .bf-inner { width:100% !important; max-width:100% !important; }
            .bf-card { padding:18px 16px !important; }
            .bf-title { font-size:23px !important; line-height:1.3 !important; }
            .bf-subtitle { font-size:15px !important; }
            .bf-metric { font-size:36px !important; }
            .bf-detail-label { font-size:13px !important; }
            .bf-detail-value { font-size:16px !important; }
            .bf-cta { display:block !important; padding:16px 20px !important; box-sizing:border-box !important; }
            .bf-chip { display:none !important; }
            .bf-footlink { display:inline-block !important; padding:6px 0 !important; }
          }
        `}</style>
      </Head>
      <Preview>{preview}</Preview>
      <Body style={styles.body}>
        <Band background="#0f0f0f" cell={styles.headerCell}>
          <Brand category={category} />
        </Band>

        <Band background="#0a0a0a" cell={styles.mainCell}>
          {children}
        </Band>

        <Band background="#0f0f0f" cell={styles.footerCell}>
          <Footer reason={footerReason} />
        </Band>
      </Body>
    </Html>
  );
}

function Band({ background, cell, children }) {
  return (
    <table
      width="100%"
      border="0"
      cellPadding="0"
      cellSpacing="0"
      role="presentation"
      style={{ ...styles.bandTable, backgroundColor: background }}
    >
      <tbody>
        <tr>
          <td className="bf-band" align="center" style={cell}>
            <table
              width="600"
              border="0"
              cellPadding="0"
              cellSpacing="0"
              role="presentation"
              className="bf-inner"
              style={styles.inner}
            >
              <tbody>
                <tr>
                  <td>{children}</td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

function Brand({ category }) {
  return (
    <Row>
      <Column style={styles.brandLogoCol}>
        <table
          width="36"
          border="0"
          cellPadding="0"
          cellSpacing="0"
          role="presentation"
          style={styles.logoTile}
        >
          <tbody>
            <tr>
              <td align="center" style={styles.logoTileCell}>
                {LOGO_IS_REACHABLE ? (
                  <Img
                    src={LOGO_URL}
                    width="20"
                    height="20"
                    alt=""
                    style={styles.logoGlyph}
                  />
                ) : (
                  <span style={styles.logoFallback}>&#8377;</span>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </Column>
      <Column style={styles.brandNameCol}>
        <Text style={styles.brandText}>
          <span style={{ color: "#ffffff" }}>Budget</span>
          <span style={{ color: "#89E900" }}>FLOW</span>
        </Text>
      </Column>
      {category && (
        <Column align="right" style={styles.brandCategoryCol}>
          <span className="bf-chip" style={styles.brandCategory}>
            {category}
          </span>
        </Column>
      )}
    </Row>
  );
}

function Hero({ title, subtitle }) {
  return (
    <Section style={styles.hero}>
      <Heading as="h1" className="bf-title" style={styles.title}>
        {title}
      </Heading>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </Section>
  );
}

function Card({ children }) {
  return (
    <table
      width="100%"
      border="0"
      cellPadding="0"
      cellSpacing="0"
      role="presentation"
      style={styles.card}
    >
      <tbody>
        <tr>
          <td className="bf-card" style={styles.cardCell}>
            {children}
          </td>
        </tr>
      </tbody>
    </table>
  );
}

function CardTitle({ children }) {
  return <Text style={styles.cardTitle}>{children}</Text>;
}

function BodyText({ children }) {
  return <Text style={styles.bodyText}>{children}</Text>;
}

function Metric({ label, value, suffix, tone = "accent" }) {
  return (
    <>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text
        className="bf-metric"
        style={{ ...styles.metric, color: TONES[tone].fg }}
      >
        {value}
        {suffix && <span style={styles.metricSuffix}> {suffix}</span>}
      </Text>
    </>
  );
}

function Badge({ label, tone = "accent" }) {
  const palette = TONES[tone];
  return (
    <Text style={styles.badgeWrap}>
      <span
        style={{
          ...styles.badge,
          color: palette.fg,
          backgroundColor: palette.bg,
          border: `1px solid ${palette.border}`,
        }}
      >
        {label}
      </span>
    </Text>
  );
}

function DetailRow({ label, value, tone, emphasis }) {
  return (
    <Row style={styles.detailRow}>
      <Column style={styles.detailLabel}>{label}</Column>
      <Column
        align="right"
        className="bf-detail-value"
        style={{
          ...styles.detailValue,
          color: tone ? TONES[tone].fg : "#ffffff",
          fontWeight: emphasis ? "800" : "700",
        }}
      >
        {value}
      </Column>
    </Row>
  );
}

function ProgressBar({ pct, tone }) {
  const filled = Math.max(0, Math.min(pct, 100));
  const color = TONES[tone].fg;

  return (
    <table
      width="100%"
      cellPadding="0"
      cellSpacing="0"
      border="0"
      role="presentation"
      style={styles.progressTable}
    >
      <tbody>
        <tr>
          {filled > 0 && (
            <td
              width={`${filled}%`}
              style={{ ...styles.progressCell, backgroundColor: color }}
            >
              &nbsp;
            </td>
          )}
          {filled < 100 && (
            <td
              width={`${100 - filled}%`}
              style={{ ...styles.progressCell, backgroundColor: "#1f1f1f" }}
            >
              &nbsp;
            </td>
          )}
        </tr>
      </tbody>
    </table>
  );
}

function Divider() {
  return <Hr style={styles.divider} />;
}

function CTA({ href, children }) {
  return (
    <Section style={styles.ctaSection}>
      <Button href={href} className="bf-cta" style={styles.cta}>
        {children}
      </Button>
    </Section>
  );
}

function BulletList({ items }) {
  return items.map((item, i) => (
    <Row key={item} style={{ paddingTop: i === 0 ? 0 : "10px" }}>
      <Column style={styles.bulletCol}>
        <Text style={styles.bullet}>•</Text>
      </Column>
      <Column>
        <Text style={styles.bodyText}>{item}</Text>
      </Column>
    </Row>
  ));
}

function Footnote({ children }) {
  return (
    <table
      width="100%"
      border="0"
      cellPadding="0"
      cellSpacing="0"
      role="presentation"
      style={styles.footnote}
    >
      <tbody>
        <tr>
          <td style={styles.footnoteCell}>
            <Text style={styles.footnoteText}>{children}</Text>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

function Footer({ reason }) {
  return (
    <Section style={styles.footer}>
      {reason && <Text style={styles.footerReason}>{reason}</Text>}

      <Text style={styles.footerLinks}>
        <Link href={`${APP_URL}/dashboard`} style={styles.footerLink}>
          Dashboard
        </Link>
        <span style={styles.footerSep}>·</span>
        <Link href={`${APP_URL}/settings`} style={styles.footerLink}>
          Settings
        </Link>
        {SUPPORT_EMAIL && (
          <>
            <span style={styles.footerSep}>·</span>
            <Link href={`mailto:${SUPPORT_EMAIL}`} style={styles.footerLink}>
              Contact support
            </Link>
          </>
        )}
      </Text>

      <Text style={styles.footerBrand}>
        <span style={{ color: "#ffffff" }}>Budget</span>
        <span style={{ color: "#89E900" }}>FLOW</span>
        <span style={styles.footerTagline}> — your money, in flow.</span>
      </Text>

      <Text style={styles.footerLegal}>
        BudgetFLOW is a personal finance tracking tool. It does not hold, move or
        invest money, and does not provide investment, tax or legal advice.
      </Text>
    </Section>
  );
}

const TONES = {
  accent: { fg: "#89E900", bg: "#1a2600", border: "#2f4400" },
  danger: { fg: "#f87171", bg: "#2a1414", border: "#4a2020" },
  warn: { fg: "#fbbf24", bg: "#2a2110", border: "#4a3a12" },
  neutral: { fg: "#a3a3a3", bg: "#1f1f1f", border: "#2a2a2a" },
};

const styles = {
  body: {
    backgroundColor: "#0a0a0a",
    margin: 0,
    padding: 0,
    width: "100%",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, sans-serif",
  },
  bandTable: {
    width: "100%",
  },
  headerCell: {
    borderBottom: "1px solid #1f1f1f",
    padding: "22px 24px",
  },
  mainCell: {
    padding: "34px 24px 38px",
  },
  footerCell: {
    borderTop: "1px solid #1f1f1f",
    padding: "28px 24px 32px",
  },
  inner: {
    width: "600px",
    maxWidth: "600px",
    margin: "0 auto",
    textAlign: "left",
  },
  brandLogoCol: {
    width: "36px",
    verticalAlign: "middle",
  },
  logoTile: {
    width: "36px",
    height: "36px",
    border: "2px solid #89E900",
    borderRadius: "11px",
  },
  logoTileCell: {
    width: "36px",
    height: "32px",
    textAlign: "center",
    verticalAlign: "middle",
    lineHeight: "1px",
  },
  logoGlyph: {
    display: "inline-block",
    border: 0,
    outline: "none",
  },
  logoFallback: {
    color: "#ffffff",
    fontSize: "17px",
    fontWeight: "700",
    lineHeight: "32px",
  },
  brandNameCol: {
    paddingLeft: "12px",
    verticalAlign: "middle",
  },
  brandText: {
    fontSize: "19px",
    fontWeight: "800",
    letterSpacing: "-0.02em",
    margin: 0,
    lineHeight: "1.2",
  },
  brandCategoryCol: {
    verticalAlign: "middle",
  },
  brandCategory: {
    color: "#a3a3a3",
    fontSize: "11px",
    fontWeight: "700",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    backgroundColor: "#161616",
    border: "1px solid #1f1f1f",
    borderRadius: "999px",
    padding: "5px 12px",
    whiteSpace: "nowrap",
  },
  hero: {
    marginBottom: "22px",
  },
  title: {
    color: "#ffffff",
    fontSize: "26px",
    fontWeight: "800",
    margin: "0 0 10px",
    letterSpacing: "-0.02em",
    lineHeight: "1.25",
  },
  subtitle: {
    color: "#a3a3a3",
    fontSize: "14px",
    lineHeight: "1.6",
    margin: 0,
  },
  card: {
    width: "100%",
    backgroundColor: "#161616",
    border: "1px solid #1f1f1f",
    borderRadius: "12px",
    marginBottom: "14px",
  },
  cardCell: {
    padding: "20px",
  },
  cardTitle: {
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: "700",
    margin: "0 0 14px",
    letterSpacing: "-0.01em",
  },
  metricLabel: {
    color: "#a3a3a3",
    fontSize: "11px",
    fontWeight: "700",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    margin: "0 0 10px",
  },
  metric: {
    fontSize: "40px",
    fontWeight: "800",
    margin: 0,
    letterSpacing: "-0.03em",
    lineHeight: "1.1",
  },
  metricSuffix: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#a3a3a3",
    letterSpacing: "-0.01em",
  },
  badgeWrap: {
    margin: "14px 0 0",
  },
  badge: {
    fontSize: "11px",
    fontWeight: "700",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    borderRadius: "999px",
    padding: "5px 12px",
    whiteSpace: "nowrap",
  },
  detailRow: {},
  detailLabel: {
    color: "#a3a3a3",
    fontSize: "14px",
    fontWeight: "500",
    padding: "9px 12px 9px 0",
    verticalAlign: "middle",
  },
  detailValue: {
    color: "#ffffff",
    fontSize: "17px",
    fontWeight: "700",
    letterSpacing: "-0.01em",
    padding: "9px 0",
    verticalAlign: "middle",
    whiteSpace: "nowrap",
  },
  divider: {
    border: 0,
    borderTop: "1px solid #1f1f1f",
    margin: "6px 0",
  },
  categoryRow: {},
  categoryLabel: {
    color: "#e5e5e5",
    fontSize: "14px",
    textTransform: "capitalize",
    padding: "9px 12px 9px 0",
    verticalAlign: "middle",
  },
  categoryShare: {
    color: "#a3a3a3",
    fontSize: "12px",
    fontWeight: "600",
    paddingLeft: "8px",
  },
  categoryValue: {
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: "700",
    padding: "9px 0",
    verticalAlign: "middle",
    whiteSpace: "nowrap",
  },
  bulletCol: {
    width: "18px",
    verticalAlign: "top",
    paddingTop: "3px",
  },
  bullet: {
    color: "#89E900",
    fontWeight: "700",
    margin: 0,
    fontSize: "16px",
    lineHeight: "1",
  },
  bodyText: {
    color: "#d4d4d4",
    fontSize: "14px",
    lineHeight: "1.6",
    margin: 0,
  },
  progressTable: {
    borderCollapse: "separate",
    borderRadius: "6px",
    overflow: "hidden",
    marginTop: "16px",
    width: "100%",
  },
  progressCell: {
    height: "10px",
    lineHeight: "10px",
    fontSize: "1px",
  },
  ctaSection: {
    textAlign: "center",
    margin: "22px 0 6px",
  },
  cta: {
    backgroundColor: "#89E900",
    color: "#0a0a0a",
    padding: "14px 30px",
    borderRadius: "10px",
    fontWeight: "800",
    fontSize: "15px",
    textDecoration: "none",
    display: "inline-block",
    letterSpacing: "-0.01em",
    textAlign: "center",
  },
  footnote: {
    width: "100%",
    marginTop: "20px",
  },
  footnoteCell: {
    borderLeft: "2px solid #1f1f1f",
    padding: "2px 0 2px 12px",
  },
  footnoteText: {
    color: "#a3a3a3",
    fontSize: "12px",
    lineHeight: "1.6",
    margin: 0,
  },
  footer: {
    textAlign: "center",
  },
  footerReason: {
    color: "#a3a3a3",
    fontSize: "13px",
    lineHeight: "1.6",
    margin: "0 0 14px",
  },
  footerLinks: {
    margin: "0 0 18px",
    fontSize: "13px",
    lineHeight: "1.6",
  },
  footerLink: {
    color: "#89E900",
    fontSize: "13px",
    textDecoration: "none",
    fontWeight: "600",
  },
  footerSep: {
    color: "#525252",
    padding: "0 8px",
  },
  footerBrand: {
    fontSize: "14px",
    fontWeight: "800",
    margin: "0 0 10px",
  },
  footerTagline: {
    color: "#a3a3a3",
    fontWeight: "500",
  },
  footerLegal: {
    color: "#a3a3a3",
    fontSize: "12px",
    lineHeight: "1.6",
    margin: 0,
  },
};

export { PREVIEW_DATA };
