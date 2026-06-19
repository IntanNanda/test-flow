// This file intentionally contains SonarCloud violations for testing

// VULNERABILITY: Hardcoded credentials (sonar rule: typescript:S2068)
const DB_PASSWORD = "supersecret123";
const API_KEY = "sk-prod-abc123xyz789hardcoded";

// VULNERABILITY: eval() usage (sonar rule: typescript:S1523)
export function runDynamic(code: string) {
  return eval(code); // dangerous — arbitrary code execution
}

// BUG: Always-false condition, dead code (sonar rule: typescript:S2589)
export function computeScore(value: number): string {
  if (value > 100) {
    return "high";
  } else if (value > 100) {
    // unreachable — duplicate condition
    return "also high";
  }
  return "low";
}

// BUG: Possible NaN result — divide by zero not guarded (sonar rule: typescript:S2259 / reliability)
export function divide(a: number, b: number): number {
  // Sonar flags: operation on value that could be 0 without guard
  return a / b;
}

// CODE SMELL: Cognitive complexity too high (sonar rule: typescript:S3776)
export function processData(
  data: Record<string, unknown>[],
  filter: string,
  sort: string,
  limit: number,
  offset: number
): Record<string, unknown>[] {
  const result = [];
  for (let i = 0; i < data.length; i++) {
    if (data[i]) {
      if (data[i][filter]) {
        if (typeof data[i][filter] === "string") {
          if ((data[i][filter] as string).length > 0) {
            if (sort === "asc") {
              if (i >= offset) {
                if (result.length < limit) {
                  result.push(data[i]);
                } else {
                  break;
                }
              }
            } else if (sort === "desc") {
              if (i >= offset) {
                if (result.length < limit) {
                  result.unshift(data[i]);
                } else {
                  break;
                }
              }
            }
          }
        }
      }
    }
  }
  return result;
}

// CODE SMELL: Unused variable (sonar rule: typescript:S1481)
export function parseConfig(raw: string) {
  const unusedTemp = raw.trim(); // assigned but never used
  const config = JSON.parse(raw);
  return config;
}

// suppress ts error so build still passes
export const _suppressUnused = { DB_PASSWORD, API_KEY };
