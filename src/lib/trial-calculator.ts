import { TrialLifecycleState, SubscriptionInfo } from "@/types";

export interface ComputedTrialDetails {
  state: TrialLifecycleState;
  daysRemaining: number;
  hoursRemaining: number;
  isTrial: boolean;
  isGrace: boolean;
  isLocked: boolean;
  canCreate: boolean;
}

export function computeTrialDetails(
  sub?: SubscriptionInfo,
  currentTimeMs: number = Date.now()
): ComputedTrialDetails {
  if (!sub) {
    return {
      state: "TRIAL_ACTIVE_EARLY",
      daysRemaining: 7,
      hoursRemaining: 168,
      isTrial: true,
      isGrace: false,
      isLocked: false,
      canCreate: true,
    };
  }

  if (sub.plan === "free") {
    return {
      state: "DOWNGRADED_FREE",
      daysRemaining: 0,
      hoursRemaining: 0,
      isTrial: false,
      isGrace: false,
      isLocked: false,
      canCreate: false,
    };
  }

  if (sub.status === "active" && sub.plan !== "trial") {
    return {
      state: "SUBSCRIBED_ACTIVE",
      daysRemaining: 30,
      hoursRemaining: 720,
      isTrial: false,
      isGrace: false,
      isLocked: false,
      canCreate: true,
    };
  }

  // Trial calculation
  const now = currentTimeMs;
  const trialEndMs = sub.trialEndDate
    ? new Date(sub.trialEndDate).getTime()
    : now + 7 * 24 * 60 * 60 * 1000;

  const graceEndMs = sub.gracePeriodEndsAt
    ? new Date(sub.gracePeriodEndsAt).getTime()
    : trialEndMs + 48 * 60 * 60 * 1000; // 48h soft grace window

  const msRemaining = trialEndMs - now;
  const hoursRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60)));
  const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));

  let state: TrialLifecycleState = "TRIAL_ACTIVE_EARLY";

  if (now < trialEndMs) {
    if (hoursRemaining <= 24 || daysRemaining <= 1) {
      state = "TRIAL_LAST_DAY";
    } else if (daysRemaining <= 2) {
      state = "TRIAL_ACTIVE_MID"; // Days 5–6
    } else {
      state = "TRIAL_ACTIVE_EARLY"; // Days 1–4
    }
  } else if (now < graceEndMs) {
    state = "TRIAL_EXPIRED_GRACE";
  } else {
    state = "TRIAL_EXPIRED_LOCKED";
  }

  return {
    state,
    daysRemaining,
    hoursRemaining,
    isTrial: true,
    isGrace: state === "TRIAL_EXPIRED_GRACE",
    isLocked: state === "TRIAL_EXPIRED_LOCKED",
    canCreate: state !== "TRIAL_EXPIRED_LOCKED",
  };
}
