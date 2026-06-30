import { describe, expect, it } from "vitest";

import { sourceInputSchema } from "@/lib/validation/source-schema";

describe("sourceInputSchema", () => {
  it("rejects duplicate column names", () => {
    const result = sourceInputSchema.safeParse({
      name: "Source test",
      description: "Test",
      columns: [
        { name: "client_id", type: "string", required: true, position: 1 },
        { name: "client_id", type: "string", required: false, position: 2 }
      ]
    });

    expect(result.success).toBe(false);
  });

  it("rejects invalid regular expressions", () => {
    const result = sourceInputSchema.safeParse({
      name: "Source test",
      columns: [
        {
          name: "client_id",
          type: "string",
          required: true,
          regex: "[",
          position: 1
        }
      ]
    });

    expect(result.success).toBe(false);
  });
});
