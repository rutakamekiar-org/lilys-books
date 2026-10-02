import { ProductListSchema } from "../../src/models/Product";
import { productFixtures } from "../fixtures/products.mjs";

const result = ProductListSchema.safeParse(productFixtures);

if (!result.success) {
  const details = result.error.issues
    .map(issue => `${issue.path.join(".") || "<root>"}: ${issue.message}`)
    .join("\n- ");
  throw new Error(`Product fixture contract validation failed:\n- ${details}`);
}

console.log(`Validated ${result.data.length} deterministic product fixtures.`);
