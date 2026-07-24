import { endOfDay } from 'date-fns/endOfDay';
import { isAfter } from 'date-fns/isAfter';

// Ported from the agency subplanprice: compute the per-month "from $X /mo" text
// for a channel's cheapest subscription plan (discount-aware).
const billingCycleMap: Record<string, number> = { MONTHLY: 1, QUARTERLY: 3, HALF_YEARLY: 6, YEARLY: 12, ONE_TIME: 1 };
const validateAmount = (price: number) => Math.ceil(price * 100) / 100;

function currencyNoDecimal(n: number): string {
  const out = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
  return out.replace(/\.00$/, '');
}

export interface PriceDetails {
  finalText: string;
  isDiscounted: boolean;
  originalPricePerMonth: string;
  finalAmount: number;
  perMonthAmount: number;
}

export function getSubscriptionPriceDetails(subscription: any): PriceDetails | null {
  if (!subscription) return null;
  const { price = 0, discount, validity_type: validity } = subscription;
  const now = new Date();
  const validityMultiplier = billingCycleMap[validity!];
  if (!validityMultiplier) return null;

  const isDiscountActive =
    discount?.enabled &&
    (discount.is_permanant ||
      (discount.start_date && discount.end_date && isAfter(now, new Date(discount.start_date)) && isAfter(endOfDay(new Date(discount.end_date)), now)));

  let discountAmount = 0;
  if (isDiscountActive && discount) {
    if (discount.type === 'percentage' && discount.percentage) discountAmount = price * (discount.percentage / 100);
    else if (discount.type === 'amount' && discount.amount) discountAmount = discount.amount;
  }

  const finalAmount = Math.max(price - discountAmount, 0);
  const validatedPerMonth = validateAmount(finalAmount / validityMultiplier);
  const originalPerMonth = validateAmount(price / validityMultiplier);

  return {
    finalText: currencyNoDecimal(validatedPerMonth),
    isDiscounted: !!isDiscountActive && finalAmount < price,
    originalPricePerMonth: currencyNoDecimal(originalPerMonth),
    finalAmount,
    perMonthAmount: validatedPerMonth,
  };
}
