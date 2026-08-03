// Seeds/updates every known core.utils.config key with its real current default, as an actual
// document in the shared `configs` collection — until this runs, getConfig's defaultValue
// argument is the only place these values exist; nothing is visible or editable in the database.
// Re-run any time you want to reset a key back to its code-documented default; to change a value
// going forward, use core.utils.config.setConfig(key, value, type) or edit the document directly
// — this script is a one-time/reset seed, not the live update path.
//
// Run from this directory: MONGO_URI=mongodb://localhost:27017/godhan node scripts/seedConfig.mjs
// (defaults to that same local URI if the env var isn't set, matching every service's own .env).
import core from "../index.js";

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/godhan";

const configs = [
  // cattle-service — breeding cycle
  { key: "GESTATION_DAYS_COW", value: 283, type: "number", note: "Gestation length assumed for cows (days)" },
  { key: "GESTATION_DAYS_BUFFALO", value: 310, type: "number", note: "Gestation length assumed for buffalo (days)" },
  { key: "PD_CONFIRM_DAYS", value: 21, type: "number", note: "Days after AI before a returned-heat/pregnancy-watch reminder fires" },
  { key: "CALVING_WINDOW_DAYS", value: 3, type: "number", note: "± window shown around the estimated calving date" },
  { key: "CALVING_DUE_SOON_DAYS", value: 7, type: "number", note: "How many days before the calving window to start reminding" },
  { key: "VACCINATION_DUE_SOON_DAYS", value: 7, type: "number", note: "How many days before a vaccination's nextDueDate to start reminding" },
  // cattle-service — marketplace eligibility
  { key: "MARKETPLACE_ELIGIBLE_DAYS", value: 90, type: "number", note: "Days of continuous IoT pairing required before a cattle can be listed" },
  // cattle-service — revenue planner
  { key: "CREDIT_LIMIT_MONTHS_MULTIPLE", value: 4, type: "number", note: "Suggested credit limit = avg monthly net profit × this" },
  // cattle-service — milk pricing platform defaults (per-farmer config still overrides these)
  { key: "MILK_PRICE_DEFAULT_FIXED_RATE", value: 40, type: "number", note: "₹/L for a farmer who's never configured pricing" },
  { key: "MILK_PRICE_FORMULA_BASE_RATE", value: 40, type: "number", note: "FAT/SNF formula baseline rate (₹/L)" },
  { key: "MILK_PRICE_FORMULA_BASE_FAT", value: 3.5, type: "number", note: "FAT/SNF formula baseline FAT %" },
  { key: "MILK_PRICE_FORMULA_BASE_SNF", value: 8.5, type: "number", note: "FAT/SNF formula baseline SNF %" },
  { key: "MILK_PRICE_FORMULA_FAT_INCENTIVE", value: 4, type: "number", note: "₹ per FAT % point above/below baseline" },
  { key: "MILK_PRICE_FORMULA_SNF_INCENTIVE", value: 3, type: "number", note: "₹ per SNF % point above/below baseline" },
  // marketplace-service
  { key: "LISTING_DURATION_DAYS", value: 60, type: "number", note: "Days a fixed/negotiable listing stays active before auto-expiry" },
  { key: "MIN_LISTING_AGE_MONTHS", value: 15, type: "number", note: "A calf at/under this age can't be listed at all" },
  { key: "BID_INCREMENT_AMOUNT", value: 1000, type: "number", note: "₹ minimum raise over the current highest auction bid" },
  { key: "AUCTION_MAX_LACTATION", value: 2, type: "number", note: "Auction listings restricted to heifers up to this lactation number" },
  { key: "TOKEN_UNLOCK_FEE", value: 1000, type: "number", note: "₹ fee to unlock a listing's seller contact details" },
  // helper-service
  { key: "HALF_DAY_ATTENDANCE_MULTIPLIER", value: 0.5, type: "number", note: "Fraction of a full day credited for a half-day attendance mark" },
  // report-service
  { key: "ASSUMED_MONTHLY_WORK_DAYS", value: 30, type: "number", note: "Days/month assumed when annualizing a helper's daily wage into a monthly salary expense" },
  // Pre-existing keys that were already read via getConfig elsewhere, but never had a real
  // document either — included here so the whole config store is visible/editable in one place.
  { key: "CASHBACK_PERCENT", value: 2, type: "number", note: "wallet-service: cashback % credited on a wallet recharge" },
  { key: "MAX_COIN_REDEMPTION_PERCENT", value: 50, type: "number", note: "wallet-service: max % of a charge that coins can cover" },
  { key: "REFERRAL_REWARD_COINS", value: 50, type: "number", note: "user-service: coins credited to a referrer on a converted referral" },
  { key: "SUPPORT_EMAIL", value: "agrogodhan@gmail.com", type: "string", note: "user-service: Help & Support contact email" },
];

async function main() {
  await core.db.connectMongo({ uri: MONGO_URI });
  for (const { key, value, type, note } of configs) {
    await core.utils.config.setConfig(key, value, type);
    console.log(`seeded ${key} = ${value} (${type}) — ${note}`);
  }
  console.log(`\nSeeded ${configs.length} config keys.`);
  await core.db.mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => { console.error(err); process.exit(1); });
