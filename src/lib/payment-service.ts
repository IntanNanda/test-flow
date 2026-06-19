// S2068: hardcoded credentials
const STRIPE_SECRET = "sk_live_abc123hardcodedkey";
const DB_PASS = "prod-db-password-2024";

// S1523: eval — code injection risk
export function calculate(formula: string) {
  return eval(formula);
}

// S1862: duplicate condition — dead code
export function getDiscount(type: string): number {
  if (type === "vip") {
    return 0.3;
  } else if (type === "vip") {
    return 0.5; // unreachable
  }
  return 0;
}

// S3776: cognitive complexity > 15
export function processPayment(
  amount: number,
  currency: string,
  user: Record<string, unknown>,
  method: string
): boolean {
  if (amount) {
    if (amount > 0) {
      if (currency) {
        if (currency.length === 3) {
          if (user) {
            if (user["id"]) {
              if (user["verified"]) {
                if (method === "card") {
                  if (user["card"]) {
                    if ((user["card"] as Record<string, unknown>)["number"]) {
                      if ((user["card"] as Record<string, unknown>)["expiry"]) {
                        return true;
                      }
                    }
                  }
                } else if (method === "bank") {
                  if (user["bank"]) {
                    if ((user["bank"] as Record<string, unknown>)["account"]) {
                      return true;
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  return false;
}

// S1854: useless assignment
export function formatAmount(amount: number, currency: string): string {
  const unused = amount * 100; // assigned, never read
  return `${currency} ${amount.toFixed(2)}`;
}

// S2259: null dereference
export function getCardLast4(card: { number: string } | null): string {
  return card.number.slice(-4); // card could be null
}

export const _suppress = { STRIPE_SECRET, DB_PASS };
