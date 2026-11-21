export type Policy = {
  id: string;
  name: string;
  phone: string; // stored as +971XXXXXXXXX
  policyNo: string;
  date: string; // YYYY-MM-DD (sale / entry date)
  purchase: number;
  sell: number;
  profit: number;
  issueDate: string;
  expireDate: string;
  type: string;
  insuranceP: string;
  company: string;
  createdAt: string;
  remindedAt?: string; // YYYY-MM-DD of the last WhatsApp reminder
};

export type Op =
  | { action: "add"; record: Policy }
  | { action: "update"; record: Policy }
  | { action: "delete"; id: string }
  | { action: "import"; records: Policy[] };

export const POLICY_FIELDS: (keyof Policy)[] = [
  "id",
  "name",
  "phone",
  "policyNo",
  "date",
  "purchase",
  "sell",
  "profit",
  "issueDate",
  "expireDate",
  "type",
  "insuranceP",
  "company",
  "createdAt",
  "remindedAt",
];

export const INSURANCE_TYPES = [
  "Comprehensive",
  "Third Party",
  "Third Party + Driver",
  "Third Party + Passenger",
  "Other",
];
