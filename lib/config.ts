export const BUSINESS = {
  name: process.env.NEXT_PUBLIC_BUSINESS_NAME || "Ideal Car Insurance",
  tagline: process.env.NEXT_PUBLIC_BUSINESS_TAGLINE || "Drive safe • Stay protected",
  phone: process.env.NEXT_PUBLIC_BUSINESS_PHONE || "058 665 4412",
  owner: process.env.NEXT_PUBLIC_OWNER_NAME || "",
};

export const DEFAULT_TEMPLATE = `Hello {name}, your car insurance policy {policy} ({company}) {status}. Please contact ${BUSINESS.name} on ${BUSINESS.phone} to renew your policy. Drive safe!`;
