export type FuelType = "Diesel" | "Gas" | "DEF" | "Other";

export interface ExtractedReceiptData {
  seller_name: string;
  seller_address: string;
  seller_city: string;
  seller_state: string;
  fuel_type: FuelType;
  gallons: number;
  price_per_gallon: number;
  total_price: number;
  truck_id: string;
  receipt_date: string; // ISO date string YYYY-MM-DD
}

export interface FuelLog {
  id: string;
  truck_id: string;
  seller_name: string;
  seller_address: string;
  seller_city: string;
  seller_state: string;
  fuel_type: FuelType;
  gallons: number;
  price_per_gallon: number;
  total_price: number;
  receipt_date: string;
  image_url: string;
  extracted_json: ExtractedReceiptData;
  created_at: string;
}

export interface AuditSummary {
  quarter: string;
  total_gallons_purchased: number;
  total_gallons_ga: number;
  miles_traveled_total: number;
  miles_traveled_ga: number;
  mpg: number;
  gallons_consumed_ga: number;
  net_taxable_gallons_ga: number;
  tax_due_ga: number;
}

// 2026 Q1 GA Diesel Tax Rate
export const GA_DIESEL_TAX_RATE_2026 = 0.373; // $0.373 per gallon
export const GA_LATE_INTEREST_RATE_ANNUAL = 0.09; // 9% per year
export const GA_LATE_INTEREST_RATE_MONTHLY = 0.0075; // 0.75% per month
