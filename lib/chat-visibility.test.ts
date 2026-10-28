import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { chatSystemPrompt } from "./chat-prompt.ts";
import { funnelChatRefusal, hideChatBubble, isMetaFunnelPath } from "./chat-visibility.ts";

const FUNNEL_PATHS = [
  "/market-research",
  "/market-research/",
  "/market-research/checkout",
  "/market-research/checkout?state=TX&p=phc",
  "/market-research/upsell",
  "/market-research/upsell?session_id=cs_test_abc",
  "/market-research/thank-you",
  "/offers",
  "/offers/mrr",
  "/offers/market-research",
  "/upsell",
  "/thank-you",
];

const OPEN_PATHS = ["/", "/shop", "/launch-kit", "/go/tx-home-care", "/get-started", "/bundles", "/course"];

describe("chat bubble stays off the $47 funnel", () => {
  it("hides every market-research, offer, upsell, and thank-you route", () => {
    for (const path of FUNNEL_PATHS) {
      assert.equal(hideChatBubble(path), true, path);
      assert.equal(isMetaFunnelPath(path), true, path);
    }
  });

  it("keeps the assistant on the shop, launch kit, and bundle pages", () => {
    for (const path of OPEN_PATHS) {
      assert.equal(hideChatBubble(path), false, path);
      assert.equal(funnelChatRefusal(path), null, path);
    }
    assert.equal(hideChatBubble("/admin"), true);
    assert.equal(hideChatBubble("/dashboard/orders"), true);
    assert.equal(hideChatBubble("/checkout/success"), true);
    assert.equal(isMetaFunnelPath("/checkout"), false);
  });

  it("refuses the model on the funnel so the $997 LAUNCH20 close cannot be returned", () => {
    const prompt = chatSystemPrompt(Date.parse("2026-10-28T18:00:00Z"));
    assert.match(prompt, /\$997/);
    assert.match(prompt, /LAUNCH20/);

    for (const path of FUNNEL_PATHS) {
      const refusal = funnelChatRefusal(path);
      assert.ok(refusal, path);
      assert.equal(refusal.error, "Chat is unavailable on this page.");
      assert.doesNotMatch(refusal.error, /997|LAUNCH20|\$647|bundle/i);
    }
  });

  it("wires the hide into the bubble and stops the model before it can answer", () => {
    const bubble = readFileSync(new URL("../app/components/ChatBubble.tsx", import.meta.url), "utf8");
    assert.match(bubble, /if \(hideChatBubble\(pathname\)\) return null/);
    assert.doesNotMatch(bubble, /pathname === "\/market-research"/);

    const route = readFileSync(new URL("../app/api/chat/route.ts", import.meta.url), "utf8");
    const refusalAt = route.indexOf("funnelChatRefusal(page)");
    const modelAt = route.indexOf("fetch(GATEWAY");
    assert.ok(refusalAt > 0);
    assert.ok(modelAt > refusalAt);
  });
});
