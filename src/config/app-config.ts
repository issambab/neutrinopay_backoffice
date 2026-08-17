import packageJson from "../../package.json";

const currentYear = new Date().getFullYear();

export const APP_CONFIG = {
  name: "Neutrino",
  version: packageJson.version,
  copyright: `© ${currentYear}, Neutrino.`,
  meta: {
    title: "Neutrino - Fintech Wallet & Agent Management Platform",
    description:
      "Neutrino is a modern fintech wallet platform for digital payments, cash-in, cash-out, agent management, wallet balances, transactions, and cash settlement.",
  },
};
