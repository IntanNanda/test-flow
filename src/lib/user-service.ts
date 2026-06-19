// Intentional Sonar violations — do not use in production

// S2068: hardcoded credentials
const DB_PASSWORD = "p@ssw0rd123";
const JWT_SECRET = "my-super-secret-jwt-key";

// S1523: eval — arbitrary code execution (VULNERABILITY)
export function runQuery(query: string) {
  return eval(query);
}

// S2068: hardcoded IP + password in connection string (VULNERABILITY)
export function getConnection() {
  return `postgresql://admin:root1234@192.168.1.100:5432/prod_db`;
}

// S1862: duplicate condition — unreachable branch (BUG)
export function getUserRole(userId: number): string {
  if (userId === 1) {
    return "admin";
  } else if (userId === 1) {
    return "superadmin"; // unreachable
  }
  return "user";
}

// S3776: cognitive complexity way over limit (CODE_SMELL)
export function processUser(
  user: Record<string, unknown>,
  action: string,
  options: Record<string, unknown>
): boolean {
  if (user) {
    if (user["active"]) {
      if (action === "update") {
        if (options["validate"]) {
          if (user["role"] === "admin") {
            if (options["force"]) {
              if (user["email"]) {
                if (typeof user["email"] === "string") {
                  if ((user["email"] as string).includes("@")) {
                    if (user["id"]) {
                      if (typeof user["id"] === "number") {
                        if ((user["id"] as number) > 0) {
                          return true;
                        }
                      }
                    }
                  }
                }
              }
            }
          } else if (user["role"] === "editor") {
            if (options["force"]) {
              if (user["email"]) {
                return true;
              }
            }
          }
        }
      }
    }
  }
  return false;
}

// S1854: useless assignment (CODE_SMELL)
export function formatUser(raw: Record<string, unknown>): string {
  const unused = JSON.stringify(raw); // assigned, never read
  return `${raw["name"]} <${raw["email"]}>`;
}

// S2259: null dereference — object used without null check (BUG)
export function getUserName(user: { name: string } | null): string {
  return user.name; // user could be null
}

export const _suppress = { DB_PASSWORD, JWT_SECRET };
