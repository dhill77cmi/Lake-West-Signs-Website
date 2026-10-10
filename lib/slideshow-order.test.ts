import { expect, test } from "vitest";
import { shuffleAfterFirst } from "./slideshow-order";

test("pins Bedrock, includes each remaining photo once, and preserves the source", () => {
  const photos = ["bedrock", "sign", "plane", "van", "jetski"];
  const result = shuffleAfterFirst(photos, () => 0);
  expect(result[0]).toBe("bedrock");
  expect([...result].sort()).toEqual([...photos].sort());
  expect(photos).toEqual(["bedrock", "sign", "plane", "van", "jetski"]);
  expect(result).not.toEqual(shuffleAfterFirst(photos, () => 0.999));
});
