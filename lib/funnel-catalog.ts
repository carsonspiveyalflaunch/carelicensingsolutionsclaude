import { bundleOfferFlags } from "@/lib/bundle-offer";
import { listSellableBundleAssets } from "@/lib/bundle-files";
import { catalogClients, findCompleteBundle } from "@/lib/complete-bundles";

/** The only catalog combo whose market-research file was missing in the pre-Meta audit. */
export const HI_PERSONAL_HOME_CARE = { code: "HI", program: "Personal Home Care" } as const;

export function isHiPersonalHomeCare(choice: { code: string; program: string }): boolean {
  return choice.code === HI_PERSONAL_HOME_CARE.code && choice.program === HI_PERSONAL_HOME_CARE.program;
}

export function withoutUnavailableReports<T extends { code: string; program: string }>(
  choices: T[],
  unavailable: { code: string; program: string }[],
): T[] {
  if (!unavailable.length) return choices;
  return choices.filter(
    (choice) => !unavailable.some((row) => row.code === choice.code && row.program === choice.program),
  );
}

/**
 * Hide HI Personal Home Care when storage has no market-research file.
 * A failed lookup leaves the choice in place; the offer API still refuses to sell it.
 */
export async function filterFunnelReportChoices<T extends { code: string; program: string }>(
  choices: T[],
): Promise<T[]> {
  if (!choices.some(isHiPersonalHomeCare)) return choices;
  try {
    for (const supabase of catalogClients()) {
      const bundle = await findCompleteBundle(supabase, HI_PERSONAL_HOME_CARE.code, HI_PERSONAL_HOME_CARE.program);
      if (!bundle) continue;
      const assets = await listSellableBundleAssets(supabase, bundle.product_slug);
      if (!bundleOfferFlags(assets).available) {
        return withoutUnavailableReports(choices, [HI_PERSONAL_HOME_CARE]);
      }
      return choices;
    }
  } catch (err) {
    console.error("Could not confirm Hawaii Personal Home Care report:", err);
  }
  return choices;
}
