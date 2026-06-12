import { createHmac, randomBytes } from "node:crypto";

import { FamilyMember } from "@prisma/client";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";
import { MemberPayload } from "@/types/planner";

const COOKIE_NAME = "family_weekend_session";
const SESSION_DAYS = 30;

function sessionSecret() {
  const secret = process.env.SESSION_SECRET;

  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET is required in production");
  }

  return secret ?? "family-weekend-planner-dev-secret";
}

function hashToken(token: string) {
  return createHmac("sha256", sessionSecret()).update(token).digest("hex");
}

function expiresAt() {
  const expires = new Date();
  expires.setDate(expires.getDate() + SESSION_DAYS);
  return expires;
}

export function serializeMember(member: FamilyMember): MemberPayload {
  return {
    id: member.id,
    firstName: member.firstName,
    displayName: member.displayName,
    color: member.color,
    isActive: member.isActive,
    isOrganizer: member.isOrganizer
  };
}

export async function createSession(familyMemberId: string) {
  const token = randomBytes(32).toString("base64url");
  const expires = expiresAt();

  await prisma.session.create({
    data: {
      familyMemberId,
      tokenHash: hashToken(token),
      expiresAt: expires
    }
  });

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires
  });
}

export async function getCurrentMember(): Promise<MemberPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { familyMember: true }
  });

  if (!session || session.expiresAt <= new Date() || !session.familyMember.isActive) {
    return null;
  }

  return serializeMember(session.familyMember);
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (token) {
    await prisma.session.deleteMany({
      where: { tokenHash: hashToken(token) }
    });
  }

  cookieStore.delete(COOKIE_NAME);
}
