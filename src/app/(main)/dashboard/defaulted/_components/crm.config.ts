import type { ChartConfig } from "@/components/ui/chart";

export const leadsChartData = [
  { date: "1-5", newLeads: 120, disqualified: 40 },
  { date: "6-10", newLeads: 95, disqualified: 30 },
  { date: "11-15", newLeads: 60, disqualified: 22 },
  { date: "16-20", newLeads: 100, disqualified: 35 },
  { date: "21-25", newLeads: 150, disqualified: 70 },
  { date: "26-30", newLeads: 110, disqualified: 60 },
];

export const leadsChartConfig = {
  newLeads: {
    label: "New Leads",
    color: "var(--chart-1)",
  },
  disqualified: {
    label: "Disqualified",
    color: "var(--chart-3)",
  },
  background: {
    color: "var(--primary)",
  },
} as ChartConfig;

export const proposalsChartData = [
  { date: "1-5", proposalsSent: 9 },
  { date: "6-10", proposalsSent: 16 },
  { date: "11-15", proposalsSent: 6 },
  { date: "16-20", proposalsSent: 18 },
  { date: "21-25", proposalsSent: 11 },
  { date: "26-30", proposalsSent: 14 },
];

export const proposalsChartConfig = {
  proposalsSent: {
    label: "Proposals Sent",
    color: "var(--chart-1)",
  },
} as ChartConfig;

export const revenueChartData = [
  { month: "Jul 2024", revenue: 6700 },
  { month: "Aug 2024", revenue: 7100 },
  { month: "Sep 2024", revenue: 6850 },
  { month: "Oct 2024", revenue: 7500 },
  { month: "Nov 2024", revenue: 8000 },
  { month: "Dec 2024", revenue: 8300 },
  { month: "Jan 2025", revenue: 7900 },
  { month: "Feb 2025", revenue: 8400 },
  { month: "Mar 2025", revenue: 8950 },
  { month: "Apr 2025", revenue: 9700 },
  { month: "May 2025", revenue: 11200 },
  { month: "Jun 2025", revenue: 9500 },
];

export const revenueChartConfig = {
  revenue: {
    label: "Revenue",
    color: "var(--chart-1)",
  },
} as ChartConfig;

export const leadsBySourceChartData = [
  { source: "website", leads: 170, fill: "var(--color-website)" },
  { source: "referral", leads: 105, fill: "var(--color-referral)" },
  { source: "social", leads: 90, fill: "var(--color-social)" },
  { source: "cold", leads: 62, fill: "var(--color-cold)" },
  { source: "other", leads: 48, fill: "var(--color-other)" },
];

export const leadsBySourceChartConfig = {
  leads: {
    label: "Leads",
  },
  website: {
    label: "Website",
    color: "var(--chart-1)",
  },
  referral: {
    label: "Referral",
    color: "var(--chart-2)",
  },
  social: {
    label: "Social Media",
    color: "var(--chart-3)",
  },
  cold: {
    label: "Cold Outreach",
    color: "var(--chart-4)",
  },
  other: {
    label: "Other",
    color: "var(--chart-5)",
  },
} as ChartConfig;

export const projectRevenueChartData = [
  { name: "MVP Development", actual: 82000, target: 90000 },
  { name: "Consultation", actual: 48000, target: 65000 },
  { name: "Framer Sites", actual: 34000, target: 45000 },
  { name: "DevOps Support", actual: 77000, target: 90000 },
  { name: "LLM Training", actual: 68000, target: 80000 },
  { name: "Product Launch", actual: 52000, target: 70000 },
].map((row) => ({
  ...row,
  remaining: Math.max(0, row.target - row.actual),
}));

export const projectRevenueChartConfig = {
  actual: {
    label: "Actual",
    color: "var(--chart-1)",
  },
  remaining: {
    label: "Remaining",
    color: "var(--chart-2)",
  },
  label: {
    color: "var(--primary-foreground)",
  },
} as ChartConfig;

export const salesPipelineChartData = [
  { stage: "Leads", value: 680, fill: "var(--chart-1)" },
  { stage: "Qualified", value: 480, fill: "var(--chart-2)" },
  { stage: "Proposal Sent", value: 210, fill: "var(--chart-3)" },
  { stage: "Negotiation", value: 120, fill: "var(--chart-4)" },
  { stage: "Won", value: 45, fill: "var(--chart-5)" },
];

export const salesPipelineChartConfig = {
  value: {
    label: "Leads",
    color: "var(--chart-1)",
  },
  stage: {
    label: "Stage",
  },
} as ChartConfig;

export const regionSalesData = [
  {
    region: "North America",
    sales: 37800,
    percentage: 31,
    growth: "-3.2%",
    isPositive: false,
  },
  {
    region: "Europe",
    sales: 40100,
    percentage: 34,
    growth: "+9.4%",
    isPositive: true,
  },
  {
    region: "Asia Pacific",
    sales: 30950,
    percentage: 26,
    growth: "+12.8%",
    isPositive: true,
  },
  {
    region: "Latin America",
    sales: 12200,
    percentage: 7,
    growth: "-1.7%",
    isPositive: false,
  },
  {
    region: "Middle East & Africa",
    sales: 2450,
    percentage: 2,
    growth: "+6.0%",
    isPositive: true,
  },
];

export const actionItems = [
  {
    id: 1,
    title: "Send kickoff docs",
    desc: "Send onboarding documents and timeline",
    due: "Due today",
    priority: "High",
    priorityColor: "bg-red-100 text-red-700",
    checked: false,
  },
  {
    id: 2,
    title: "Demo call for SaaS MVP",
    desc: "Book Zoom call with client",
    due: "Due tomorrow",
    priority: "Medium",
    priorityColor: "bg-yellow-100 text-yellow-700",
    checked: true,
  },
  {
    id: 3,
    title: "Update case study",
    desc: "Add latest LLM project",
    due: "Due this week",
    priority: "Low",
    priorityColor: "bg-green-100 text-green-700",
    checked: false,
  },
];

export const recentLeadsData = [
  {
    Ref: "TX-1012",
    "Expéditeur / déstinataire": "Youssef Ben Salem",
    Montant: "12,400 TD",
    Status: "Paid",
    Type: "Virement",
    Direction: "up",
    Date: "2026-05-05 14:30",
  },
  {
    Ref: "TX-1018",
    "Expéditeur / déstinataire": "Ahmed Trabelsi",
    Montant: "8,950 TD",
    Status: "Pending",
    Type: "Carte",
    Direction: "down",
    Date: "2026-05-05 14:25",
  },
  {
    Ref: "TX-1005",
    "Expéditeur / déstinataire": "Karim Mansouri",
    Montant: "5,200 TD",
    Status: "Processing",
    Type: "Virement",
    Direction: "up",
    Date: "2026-05-05 13:55",
  },
  {
    Ref: "TX-1001",
    "Expéditeur / déstinataire": "Walid Jaziri",
    Montant: "3,600 TD",
    Status: "Paid",
    Type: "Wallet",
    Direction: "up",
    Date: "2026-05-05 12:50",
  },
  {
    Ref: "TX-1003",
    "Expéditeur / déstinataire": "Omar Ben Amor",
    Montant: "15,000 TD",
    Status: "Pending",
    Type: "Wallet",
    Direction: "down",
    Date: "2026-05-05 10:40",
  },
  {
    Ref: "TX-1008",
    "Expéditeur / déstinataire": "Nour Eddine Hmidi",
    Montant: "2,980 TD",
    Status: "Paid",
    Type: "Carte",
    Direction: "up",
    Date: "2026-05-05 09:55",
  },
  {
    Ref: "TX-1016",
    "Expéditeur / déstinataire": "Mohamed Ali",
    Montant: "6,450 TD",
    Status: "Refunded",
    Type: "Carte",
    Direction: "down",
    Date: "2026-05-05 07:45",
  },
  {
    Ref: "TX-1007",
    "Expéditeur / déstinataire": "Issam Babchia",
    Montant: "11,300 TD",
    Status: "Paid",
    Type: "Virement",
    Direction: "up",
    Date: "2026-05-05 08:10",
  },
  {
    Ref: "TX-1011",
    "Expéditeur / déstinataire": "Hatem Saidi",
    Montant: "7,780 TD",
    Status: "Processing",
    Type: "Wallet",
    Direction: "up",
    Date: "2026-05-05 05:35",
  },
  {
    Ref: "TX-1014",
    "Expéditeur / déstinataire": "Fares Chaabane",
    Montant: "4,300 TD",
    Status: "Failed",
    Type: "Carte",
    Direction: "down",
    Date: "2026-05-05 03:20",
  },
  {
    Ref: "TX-1010",
    "Expéditeur / déstinataire": "Anis Gharbi",
    Montant: "9,120 TD",
    Status: "Pending",
    Type: "Wallet",
    Direction: "down",
    Date: "2026-05-05 06:20",
  },
  {
    Ref: "TX-1002",
    "Expéditeur / déstinataire": "Ammar Khnz",
    Montant: "1,950 TD",
    Status: "Paid",
    Type: "Wallet",
    Direction: "up",
    Date: "2026-05-04 16:05",
  },
  {
    Ref: "TX-1015",
    "Expéditeur / déstinataire": "Sami Ben Youssef",
    Montant: "10,600 TD",
    Status: "Chargeback",
    Type: "Carte",
    Direction: "down",
    Date: "2026-05-03 11:40",
  },
  {
    Ref: "TX-1006",
    "Expéditeur / déstinataire": "Mahdi Khelifi",
    Montant: "5,760 TD",
    Status: "Paid",
    Type: "Virement",
    Direction: "up",
    Date: "2026-05-03 09:10",
  },
  {
    Ref: "TX-1004",
    "Expéditeur / déstinataire": "Zied Mzoughi",
    Montant: "3,250 TD",
    Status: "Pending",
    Type: "Wallet",
    Direction: "down",
    Date: "2026-05-02 18:30",
  },
];
