import {
  Banknote,
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
      },
      {
        title: "Operations cash",
        url: "/dashboard/cash-operations",
        icon: ReceiptText,
        subItems: [
          { title: "Cash-in / Cash-out", url: "/dashboard/cash-operations" },
          { title: "Float agents", url: "/dashboard/agent-float-topups" },
        ],
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
