export type UserRole = "SUPER_ADMIN" | "ORG_ADMIN" | "MANAGER" | "CREATOR";
export type CampaignStatus =
  | "SEARCH" | "NEGOTIATION" | "BRIEF_ACCEPTED" | "CONTRACT"
  | "CONTENT_CREATION" | "APPROVAL" | "PUBLICATION" | "PAYMENT"
  | "COMPLETED" | "CANCELLED";
export type CreatorTaxStatus = "SELF_EMPLOYED" | "IP" | "INDIVIDUAL";
export type MediaStatus = "UPLOADING" | "QUARANTINED" | "PROCESSING" | "READY" | "REJECTED" | "FAILED" | "ARCHIVED";
export type PaymentStatus = "PENDING" | "CHECKING_TAX" | "APPROVED" | "PROCESSING" | "PAID" | "FAILED" | "CANCELLED";
export interface ApiError { statusCode: number; code: string; message: string; requestId?: string }
export interface Paginated<T> { items: T[]; page: number; limit: number; total: number }
export interface Money { amountKopecks: number; currency: "RUB" }
