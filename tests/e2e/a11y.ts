import AxeBuilder from "@axe-core/playwright";
import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import type { Result } from "axe-core";

/** WCAG 2.0/2.1/2.2 level A and AA, plus axe's own best-practice rules. */
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

/**
 * Rules the suite deliberately does not enforce. Every entry needs a reason, and
 * ACCESSIBILITY.md explains it in full. Keep this list short.
 */
const SKIPPED_RULES: Record<string, string> = {
  "color-contrast":
    "Accepted brand exception: --accent (#f09b30) is sampled from the cover art of " +
    "«Звичайна» and cannot carry white text at 4.5:1. Full rationale in ACCESSIBILITY.md.",
};

async function findA11yViolations(page: Page): Promise<Result[]> {
  const results = await new AxeBuilder({ page })
    .withTags(AXE_TAGS)
    .disableRules(Object.keys(SKIPPED_RULES))
    .analyze();
  return results.violations;
}

function describe(violations: Result[]): string {
  return violations
    .map(violation => {
      const targets = violation.nodes.map(node => `      - ${node.target.join(" ")}`).join("\n");
      return `  [${violation.impact}] ${violation.id}: ${violation.help}\n${targets}`;
    })
    .join("\n");
}

/** Fails with every offending rule and selector listed, so a CI log is enough to act on. */
export async function expectNoA11yViolations(page: Page, context: string) {
  const violations = await findA11yViolations(page);
  expect(violations, `Accessibility violations on ${context}:\n${describe(violations)}`).toEqual([]);
}
