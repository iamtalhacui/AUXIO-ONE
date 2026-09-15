"use client";

import { useSyncExternalStore } from "react";
import {
  INITIAL_ROSTER_SHIFTS,
  buildShiftFromInput,
  workerHasConflict,
} from "@/lib/rostering/mock-data";
import type { CreateShiftInput, RosterShift } from "@/lib/rostering/types";

type RosterState = {
  shifts: RosterShift[];
};

let state: RosterState = {
  shifts: INITIAL_ROSTER_SHIFTS.map((s) => ({ ...s })),
};

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function setState(next: RosterState) {
  state = next;
  emit();
}

export function getRosterState() {
  return state;
}

export function subscribeRoster(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useRosterShifts() {
  return useSyncExternalStore(
    subscribeRoster,
    () => getRosterState().shifts,
    () => getRosterState().shifts,
  );
}

export function createShift(input: CreateShiftInput) {
  const id = `s${Date.now()}`;
  const shift = buildShiftFromInput(input, id);
  setState({ shifts: [...state.shifts, shift] });
  return shift;
}

export function offerShift(shiftId: string, workerId: string): { ok: true } | { ok: false; error: string } {
  const shift = state.shifts.find((s) => s.id === shiftId);
  if (!shift) return { ok: false, error: "Shift not found" };
  if (shift.workerId) return { ok: false, error: "Shift already assigned" };
  if (shift.offeredWorkerId) return { ok: false, error: "Shift already offered" };
  if (workerHasConflict(state.shifts, workerId, shift)) {
    return { ok: false, error: "Worker has a scheduling conflict" };
  }

  setState({
    shifts: state.shifts.map((s) =>
      s.id === shiftId
        ? { ...s, offeredWorkerId: workerId, status: "OFFERED" }
        : s,
    ),
  });
  return { ok: true };
}

export function acceptShiftOffer(
  shiftId: string,
  workerId: string,
): { ok: true } | { ok: false; error: string } {
  const shift = state.shifts.find((s) => s.id === shiftId);
  if (!shift) return { ok: false, error: "Shift not found" };
  if (shift.offeredWorkerId !== workerId) {
    return { ok: false, error: "No offer for this worker" };
  }
  if (workerHasConflict(state.shifts, workerId, shift)) {
    return { ok: false, error: "Cannot accept — scheduling conflict" };
  }

  setState({
    shifts: state.shifts.map((s) =>
      s.id === shiftId
        ? {
            ...s,
            workerId,
            offeredWorkerId: null,
            status: "ASSIGNED",
          }
        : s,
    ),
  });
  return { ok: true };
}

export function declineShiftOffer(shiftId: string, workerId: string) {
  const shift = state.shifts.find((s) => s.id === shiftId);
  if (!shift || shift.offeredWorkerId !== workerId) return;

  setState({
    shifts: state.shifts.map((s) =>
      s.id === shiftId
        ? { ...s, offeredWorkerId: null, status: "UNASSIGNED", workerId: null }
        : s,
    ),
  });
}
