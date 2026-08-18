import {
  Banknote,
  Bell,
  Building2,
  ChartNoAxesCombined,
  FileWarning,
  Landmark,
  LayoutDashboard,
  type LucideIcon,
  ReceiptText,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Store,
  Users,
  WalletCards,
} from "lucide-react";

export interface NavSubItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  comingSoon?: boolean;
  newTab?: boolean;
  isNew?: boolean;
}

export interface NavMainItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  subItems?: NavSubItem[];
  comingSoon?: boolean;
  newTab?: boolean;
  isNew?: boolean;
}

export interface NavGroup {
  id: number;
  label?: string;
  items: NavMainItem[];
}

export const sidebarItems: NavGroup[] = [
  {
    id: 1,
    items: [
      {
        title: "Acceuil",
        url: "/dashboard/default",
        icon: LayoutDashboard,
        isNew: true,
      },
      {
        title: "Utilisateurs",
        url: "/dashboard/users",
        icon: Users,
      },
      {
        title: "Wallets",
        url: "/dashboard/wallets",
        icon: WalletCards,
        subItems: [
          { title: "All Wallets", url: "/dashboard/wallets" },
          { title: "Customer Wallets", url: "/dashboard/wallets/customers" },
          { title: "Agent Wallets", url: "/dashboard/wallets/agents" },
          { title: "Merchant Wallets", url: "/dashboard/wallets/merchants" },
        ],
      },
      {
        title: "Roles & permissions",
        url: "/dashboard/roles",
        icon: ShieldCheck,
      },
      {
        title: "Compliance",
        url: "/dashboard/compliance",
        icon: FileWarning,
      },
      {
        title: "Marchands",
        url: "/dashboard/merchants",
        icon: Store,
        subItems: [
          { title: "Liste", url: "/dashboard/merchants" },
          { title: "Arborescence", url: "/dashboard/merchants/tree" },
        ],
      },
      {
        title: "Boutiques",
        url: "/dashboard/stores",
        icon: ShoppingBag,
      },
      {
        title: "Agences",
        url: "/dashboard/agencies",
        icon: Landmark,
        subItems: [
          { title: "Agences", url: "/dashboard/agencies" },
          { title: "Agents cash", url: "/dashboard/agents" },
        ],
      },
      {
        title: "Operations cash & float",
        url: "/dashboard/cash-operations",
        icon: ReceiptText,
        subItems: [
          { title: "Cash-in / Cash-out", url: "/dashboard/cash-operations" },
          {
            title: "Alimentations float",
            url: "/dashboard/agent-float-topups",
          },
          {
            title: "Settlements",
            url: "/dashboard/agent-settlements",
          },
        ],
      },
      {
        title: "Settlements",
        url: "/dashboard/agent-settlements",
        icon: Banknote,
      },
      {
        title: "Paiement",
        url: "/dashboard/crm",
        icon: Banknote,
        subItems: [
          { title: "Liens de paiement", url: "/dashboard/coming-soon" },
          { title: "Transactions", url: "/dashboard/coming-soon" },
          { title: "Opérations automatisées", url: "/dashboard/coming-soon" },
        ],
      },

      {
        title: "Notifications",
        url: "/dashboard/coming-soon",
        icon: Bell,
        subItems: [
          { title: "Notifications", url: "/dashboard/coming-soon" },
          { title: "SMS", url: "/dashboard/coming-soon" },
          { title: "Email", url: "/dashboard/coming-soon" },
        ],
      },

      {
        title: "Statistiques",
        url: "/dashboard/analytics",
        icon: ChartNoAxesCombined,
      },
      {
        title: "Mes organisations",
        url: "/dashboard/productivity",
        icon: Building2,
      },
      {
        title: "Paramètres",
        url: "/dashboard/coming-soon",
        icon: Settings,
        subItems: [
          { title: "General", url: "/dashboard/coming-soon" },
          { title: "Fees & Commissions", url: "/dashboard/coming-soon" },
        ],
      },
    ],
  } /*
  {
    id: 2,
    label: "Paiements",
    items: [
      {
        title: "liens de paiement",
        url: "/dashboard/coming-soon",
        icon: Mail,
      },
      {
        title: "Transactions",
        url: "/dashboard/coming-soon",
        icon: MessageSquare,
      },
      {
        title: "Opérations automatisées",
        url: "/dashboard/coming-soon",
        icon: Calendar,
      },
      {
        title: "Authentication",
        url: "/auth",
        icon: Fingerprint,
        subItems: [
          { title: "Login v1", url: "/auth/v1/login", newTab: true },
          { title: "Login v2", url: "/auth/v2/login", newTab: true },
          { title: "Register v1", url: "/auth/v1/register", newTab: true },
          { title: "Register v2", url: "/auth/v2/register", newTab: true },
        ],
      },
    ],
  },
  {
    id: 3,
    label: "Legacy",
    items: [
      {
        title: "Dashboards",
        url: "/dashboard/default-v1",
        subItems: [
          { title: "Default V1", url: "/dashboard/default-v1" },
          { title: "CRM V1", url: "/dashboard/crm-v1" },
          { title: "Finance V1", url: "/dashboard/finance-v1" },
          { title: "Analytics V1", url: "/dashboard/analytics-v1" },
        ],
      },
    ],
  },
  {
    id: 4,
    label: "Misc",
    items: [
      {
        title: "Others",
        url: "/dashboard/coming-soon",
        icon: SquareArrowUpRight,
        comingSoon: true,
      },
    ],
  },*/,
];
