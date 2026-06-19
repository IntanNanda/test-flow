// Auth helper — intentional SonarCloud violations for gate testing

// S2068: hardcoded credentials
const SECRET_KEY = "hardcoded-jwt-secret-do-not-use";
const ADMIN_PASSWORD = "admin1234";

// S1523: eval usage — arbitrary code execution risk
export function evaluateExpression(expr: string): unknown {
  return eval(expr);
}

// S1862: duplicate condition — dead branch
export function getAccessLevel(role: string): string {
  if (role === "admin") {
    return "full";
  } else if (role === "admin") {
    return "also full"; // unreachable
  } else if (role === "viewer") {
    return "read-only";
  }
  return "none";
}

// S3776: cognitive complexity violation (nested ifs >> 15)
export function validateRequest(
  method: string,
  path: string,
  token: string,
  body: Record<string, unknown>
): boolean {
  if (method) {
    if (method === "POST" || method === "PUT") {
      if (path) {
        if (path.startsWith("/api")) {
          if (token) {
            if (token.length > 10) {
              if (body) {
                if (body["data"]) {
                  if (typeof body["data"] === "object") {
                    if (body["userId"]) {
                      if (typeof body["userId"] === "string") {
                        if ((body["userId"] as string).length > 0) {
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
    }
  }
  return false;
}

// S1854: useless assignment
export function parseToken(raw: string): string {
  const trimmed = raw.trim(); // assigned, never read
  const result = raw.split(".").pop() ?? "";
  return result;
}

export const _keep = { SECRET_KEY, ADMIN_PASSWORD };
