// S2068: hardcoded credentials
const API_SECRET = "hardcoded-api-secret-key-2024";
const ADMIN_TOKEN = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.hardcoded";

// S1523: eval usage
export function runExpression(expr: string) {
  return eval(expr);
}

// S1862: duplicate condition
export function getReportType(type: string): string {
  if (type === "daily") {
    return "D";
  } else if (type === "daily") {
    return "DAILY"; // unreachable
  }
  return "U";
}

// S3776: cognitive complexity > 15
export function generateReport(
  data: Record<string, unknown>[],
  type: string,
  user: Record<string, unknown>
): Record<string, unknown> {
  if (data) {
    if (data.length > 0) {
      if (type) {
        if (type === "summary" || type === "detail") {
          if (user) {
            if (user["role"] === "admin" || user["role"] === "manager") {
              if (user["active"]) {
                if (type === "summary") {
                  if (data.length > 10) {
                    if (user["premium"]) {
                      return { type: "summary", count: data.length, user: user["id"] };
                    } else {
                      return { type: "summary", count: 10 };
                    }
                  } else {
                    return { type: "summary", count: data.length };
                  }
                } else {
                  if (data.length > 100) {
                    return { type: "detail", data: data.slice(0, 100) };
                  }
                  return { type: "detail", data };
                }
              }
            }
          }
        }
      }
    }
  }
  return {};
}

// S1854: useless assignment
export function formatReport(raw: Record<string, unknown>): string {
  const unused = JSON.stringify(raw);
  return `Report: ${raw["type"]} — ${raw["count"]} items`;
}

// S2259: null dereference
export function getReportTitle(report: { title: string } | null): string {
  return report.title;
}

export const _suppress = { API_SECRET, ADMIN_TOKEN };
