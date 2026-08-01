import { queryOptions } from "@tanstack/react-query";
import {
  cancelMembership,
  changeMembershipPlan,
  getMyAccount,
  getMyMembership,
  listMembershipPlans,
  pauseMembership,
  resumeMembership,
  setMembershipAutoRenew,
  subscribeToPlan,
} from "@/lib/membership.functions";

export const membershipKeys = {
  plans: ["membership", "plans"] as const,
  mine: ["membership", "mine"] as const,
  account: ["account", "me"] as const,
};

export const membershipPlansQuery = () =>
  queryOptions({
    queryKey: membershipKeys.plans,
    queryFn: () => listMembershipPlans(),
    staleTime: 5 * 60 * 1000,
  });

export const myMembershipQuery = () =>
  queryOptions({
    queryKey: membershipKeys.mine,
    queryFn: () => getMyMembership(),
  });

export const myAccountQuery = () =>
  queryOptions({
    queryKey: membershipKeys.account,
    queryFn: () => getMyAccount(),
  });

export const membershipService = {
  subscribe: subscribeToPlan,
  changePlan: changeMembershipPlan,
  pause: pauseMembership,
  resume: resumeMembership,
  cancel: cancelMembership,
  setAutoRenew: setMembershipAutoRenew,
};