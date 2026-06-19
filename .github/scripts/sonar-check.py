import sys
import json
import os
import subprocess
import time
import urllib.request
import base64

SONAR_TOKEN = os.environ["SONAR_TOKEN"]
SONAR_HOST_URL = os.environ["SONAR_HOST_URL"].rstrip("/")
SONAR_PROJECT_KEY = os.environ["SONAR_PROJECT_KEY"]
BASE_REF = os.environ["BASE_REF"]


def sonar_get(path):
    url = f"{SONAR_HOST_URL}{path}"
    req = urllib.request.Request(url)
    creds = base64.b64encode(f"{SONAR_TOKEN}:".encode()).decode()
    req.add_header("Authorization", f"Basic {creds}")
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())


def get_pr_files():
    result = subprocess.run(
        ["git", "diff", "--name-only", f"origin/{BASE_REF}...HEAD"],
        capture_output=True, text=True
    )
    return [f for f in result.stdout.strip().split("\n")
            if f and f.endswith((".ts", ".tsx", ".js", ".jsx"))]


def read_snippet(filepath, start_line, end_line, flag_line):
    try:
        with open(filepath) as f:
            lines = f.readlines()
        s = max(0, (start_line or flag_line or 1) - 3)
        e = min(len(lines), (end_line or flag_line or 1) + 2)
        result = []
        for i, line in enumerate(lines[s:e], start=s + 1):
            marker = ">>>" if (start_line and end_line and start_line <= i <= end_line) or i == flag_line else "   "
            result.append(f"   {marker} {i:4d} | {line.rstrip()}")
        return "\n".join(result)
    except Exception:
        return ""


def wait_for_analysis():
    print("Waiting for Sonar analysis...")
    for attempt in range(12):
        try:
            data = sonar_get(f"/api/qualitygates/project_status?projectKey={SONAR_PROJECT_KEY}")
            status = data["projectStatus"]["status"]
            if status in ("OK", "ERROR", "WARN"):
                return status, data
        except Exception as ex:
            print(f"  Retry {attempt + 1}/12 -- {ex}")
        time.sleep(10)
    return "UNKNOWN", {}


def main():
    pr_files = get_pr_files()
    if not pr_files:
        print("No JS/TS files changed. Skipping.")
        sys.exit(0)

    print("=== Changed files ===")
    for f in pr_files:
        print(f"  {f}")
    print()

    status, qg_data = wait_for_analysis()

    print(f"=== Quality Gate: {status} ===")
    for c in qg_data.get("projectStatus", {}).get("conditions", []):
        icon = "PASS" if c["status"] == "OK" else "FAIL"
        print(f"  [{icon}] {c['metricKey']}: {c.get('actualValue','?')} (threshold: {c.get('errorThreshold','?')})")
    print()

    found_issues = False

    print("=== Issues by file ===")
    for filepath in pr_files:
        component_key = f"{SONAR_PROJECT_KEY}:{filepath}"
        data = sonar_get(
            f"/api/issues/search?componentKeys={component_key}"
            f"&resolved=false"
            f"&types=BUG,VULNERABILITY,CODE_SMELL&ps=50"
        )
        total = data.get("total", 0)
        if total == 0:
            print(f"  [PASS] {filepath}")
            continue

        print(f"  [FAIL] {filepath} -- {total} issue(s):")
        for issue in data["issues"]:
            line = issue.get("line")
            tr = issue.get("textRange", {})
            start = tr.get("startLine", line)
            end = tr.get("endLine", line)
            print()
            print(f"    [{issue.get('severity','?')}] {issue.get('type','?')} -- {issue.get('rule','?')}")
            print(f"    Message : {issue.get('message','?')}")
            print(f"    Location: {filepath}:{line}")
            snippet = read_snippet(filepath, start, end, line)
            if snippet:
                print(f"    Code snippet:")
                print(snippet)
        found_issues = True

    print()
    print("=== Security Hotspots ===")
    for filepath in pr_files:
        data = sonar_get(
            f"/api/hotspots/search?projectKey={SONAR_PROJECT_KEY}"
            f"&files={filepath}&status=TO_REVIEW&ps=50"
        )
        total = data.get("paging", {}).get("total", 0)
        if total == 0:
            print(f"  [PASS] {filepath}")
            continue

        print(f"  [FAIL] {filepath} -- {total} hotspot(s):")
        for h in data.get("hotspots", []):
            line = h.get("line")
            tr = h.get("textRange", {})
            start = tr.get("startLine", line)
            end = tr.get("endLine", line)
            print()
            print(f"    [HOTSPOT/{h.get('vulnerabilityProbability','?')}] -- {h.get('ruleKey','?')}")
            print(f"    Message : {h.get('message','?')}")
            print(f"    Location: {filepath}:{line}")
            snippet = read_snippet(filepath, start, end, line)
            if snippet:
                print(f"    Code snippet:")
                print(snippet)
        found_issues = True

    print()
    if found_issues:
        print("FAIL: Quality gate failed -- fix issues above before merging.")
        sys.exit(1)

    print("PASS: Quality gate passed. Safe to merge.")


if __name__ == "__main__":
    main()
