'use server';

import { revalidatePath } from 'next/cache';

import { getCurrentUserId } from '@desko/auth/server';
import type { ActionResult } from '@desko/domain';
import * as lunch from '@desko/services/lunch';
import { notifyUsers } from '@desko/services/push';
import type {
  AddRestaurantInput,
  CreateProposalInput,
  ProposalIdInput,
  RateRestaurantInput,
} from '@desko/services/lunch';

/**
 * Server actions "lunch" — ADAPTER Next sottile.
 * Logica in `@desko/services/lunch`; qui solo sessione + revalidate.
 */

function revalidateLunch() {
  revalidatePath('/lunch');
  revalidatePath('/dashboard');
}

export async function addRestaurant(
  input: AddRestaurantInput,
): Promise<ActionResult<{ restaurantId: string }>> {
  const userId = await getCurrentUserId();
  const result = await lunch.addRestaurant(userId, input);
  if (result.ok) revalidatePath('/lunch');
  return result;
}

export async function rateRestaurant(input: RateRestaurantInput): Promise<ActionResult> {
  const userId = await getCurrentUserId();
  const result = await lunch.rateRestaurant(userId, input);
  if (result.ok) revalidatePath('/lunch');
  return result;
}

export async function createLunchProposal(
  input: CreateProposalInput,
): Promise<ActionResult<{ proposalId: string }>> {
  const userId = await getCurrentUserId();
  const result = await lunch.createLunchProposal(userId, input);
  if (!result.ok) return result;
  revalidateLunch();

  // Push agli invitati delle proposte private — fire-and-forget:
  // notifyUsers logga e non rilancia, la creazione non può fallire per colpa
  // di una notifica.
  if (result.data.invitedUserIds.length > 0) {
    void notifyUsers(result.data.invitedUserIds, {
      title: 'Invito a pranzo 🍝',
      body: `Sei tra gli invitati a un pranzo alle ${input.meetingTime}. Apri Desko per partecipare.`,
      data: { kind: 'lunch_invite', proposalId: result.data.proposalId },
    });
  }

  return { ok: true, data: { proposalId: result.data.proposalId } };
}

export async function joinLunchProposal(input: ProposalIdInput): Promise<ActionResult> {
  const userId = await getCurrentUserId();
  const result = await lunch.joinLunchProposal(userId, input);
  if (result.ok) revalidateLunch();
  return result;
}

export async function leaveLunchProposal(input: ProposalIdInput): Promise<ActionResult> {
  const userId = await getCurrentUserId();
  const result = await lunch.leaveLunchProposal(userId, input);
  if (result.ok) revalidateLunch();
  return result;
}

export async function cancelLunchProposal(input: ProposalIdInput): Promise<ActionResult> {
  const userId = await getCurrentUserId();
  const result = await lunch.cancelLunchProposal(userId, input);
  if (result.ok) revalidateLunch();
  return result;
}
