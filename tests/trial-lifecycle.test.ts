import { describe, it, expect } from "vitest";
import { computeTrialDetails } from "../src/lib/trial-calculator";
import { SubscriptionInfo } from "../src/types";

describe("Trial Lifecycle & Soft Paywall State Machine", () => {
  const BASE_TIME = new Date("2026-09-13T10:00:00.000Z").getTime();
  const DAY_MS = 24 * 60 * 60 * 1000;

  it("should classify Days 1-4 as TRIAL_ACTIVE_EARLY (quiet, creation allowed)", () => {
    // 5 days remaining out of 7
    const sub: SubscriptionInfo = {
      plan: "trial",
      status: "trial_active",
      trialStartDate: new Date(BASE_TIME - 2 * DAY_MS).toISOString(),
      trialEndDate: new Date(BASE_TIME + 5 * DAY_MS).toISOString(),
    };

    const details = computeTrialDetails(sub, BASE_TIME);
    expect(details.state).toBe("TRIAL_ACTIVE_EARLY");
    expect(details.daysRemaining).toBe(5);
    expect(details.canCreate).toBe(true);
    expect(details.isLocked).toBe(false);
    expect(details.isGrace).toBe(false);
  });

  it("should classify Days 5-6 as TRIAL_ACTIVE_MID (amber, creation allowed)", () => {
    // 2 days remaining
    const sub: SubscriptionInfo = {
      plan: "trial",
      status: "trial_active",
      trialStartDate: new Date(BASE_TIME - 5 * DAY_MS).toISOString(),
      trialEndDate: new Date(BASE_TIME + 2 * DAY_MS).toISOString(),
    };

    const details = computeTrialDetails(sub, BASE_TIME);
    expect(details.state).toBe("TRIAL_ACTIVE_MID");
    expect(details.daysRemaining).toBe(2);
    expect(details.canCreate).toBe(true);
    expect(details.isLocked).toBe(false);
  });

  it("should classify final 24 hours as TRIAL_LAST_DAY (warm coral, creation allowed)", () => {
    // 12 hours remaining
    const sub: SubscriptionInfo = {
      plan: "trial",
      status: "trial_active",
      trialStartDate: new Date(BASE_TIME - 6.5 * DAY_MS).toISOString(),
      trialEndDate: new Date(BASE_TIME + 12 * 60 * 60 * 1000).toISOString(),
    };

    const details = computeTrialDetails(sub, BASE_TIME);
    expect(details.state).toBe("TRIAL_LAST_DAY");
    expect(details.canCreate).toBe(true);
    expect(details.isLocked).toBe(false);
  });

  it("should classify post-trial within 48 hours as TRIAL_EXPIRED_GRACE (creation still functional)", () => {
    // Expired 12 hours ago (within 48h grace)
    const trialEnd = new Date(BASE_TIME - 12 * 60 * 60 * 1000).toISOString();
    const sub: SubscriptionInfo = {
      plan: "trial",
      status: "trial_active",
      trialStartDate: new Date(BASE_TIME - 7.5 * DAY_MS).toISOString(),
      trialEndDate: trialEnd,
      gracePeriodEndsAt: new Date(new Date(trialEnd).getTime() + 48 * 60 * 60 * 1000).toISOString(),
    };

    const details = computeTrialDetails(sub, BASE_TIME);
    expect(details.state).toBe("TRIAL_EXPIRED_GRACE");
    expect(details.isGrace).toBe(true);
    expect(details.isLocked).toBe(false);
    expect(details.canCreate).toBe(true); // Account still functional in grace window!
  });

  it("should classify after 48h grace as TRIAL_EXPIRED_LOCKED (soft paywall active)", () => {
    // Expired 50 hours ago (beyond 48h grace)
    const trialEnd = new Date(BASE_TIME - 50 * 60 * 60 * 1000).toISOString();
    const sub: SubscriptionInfo = {
      plan: "trial",
      status: "trial_active",
      trialStartDate: new Date(BASE_TIME - 9 * DAY_MS).toISOString(),
      trialEndDate: trialEnd,
      gracePeriodEndsAt: new Date(new Date(trialEnd).getTime() + 48 * 60 * 60 * 1000).toISOString(),
    };

    const details = computeTrialDetails(sub, BASE_TIME);
    expect(details.state).toBe("TRIAL_EXPIRED_LOCKED");
    expect(details.isGrace).toBe(false);
    expect(details.isLocked).toBe(true);
    expect(details.canCreate).toBe(false); // Gated creation
  });

  it("should recognize SUBSCRIBED_ACTIVE for paid customers", () => {
    const sub: SubscriptionInfo = {
      plan: "pro_monthly",
      status: "active",
      currentPeriodEnd: new Date(BASE_TIME + 30 * DAY_MS).toISOString(),
    };

    const details = computeTrialDetails(sub, BASE_TIME);
    expect(details.state).toBe("SUBSCRIBED_ACTIVE");
    expect(details.isTrial).toBe(false);
    expect(details.canCreate).toBe(true);
    expect(details.isLocked).toBe(false);
  });

  it("should recognize DOWNGRADED_FREE for explicitly chosen free tier", () => {
    const sub: SubscriptionInfo = {
      plan: "free",
      status: "active",
      downgradeChoiceMadeAt: new Date(BASE_TIME).toISOString(),
    };

    const details = computeTrialDetails(sub, BASE_TIME);
    expect(details.state).toBe("DOWNGRADED_FREE");
    expect(details.isTrial).toBe(false);
    expect(details.canCreate).toBe(false);
  });
});
