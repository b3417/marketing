import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/app/api/auth/[...nextauth]/auth";
import prisma from "@/utils/prisma";
import { withError } from "@/utils/middleware";
import { ACTIVE_WORKSPACE_COOKIE } from "@/utils/workspaces";

type WorkspaceMembership = {
  id: string;
  userId: string | null;
  role: "OWNER" | "ADMIN" | "USER";
  invitedEmail: string | null;
  invitedName: string | null;
  organization: {
    id: string;
    name: string;
    image: string | null;
    membership: {
      id: string;
    }[];
    emailAccounts: {
      id: string;
    }[];
  };
};

const createWorkspaceBody = z.object({
  name: z.string().trim().min(1).max(80),
  image: z.string().url().nullable().optional(),
});

export const GET = withError(async (request: Request) => {
  const session = await auth();
  if (!session?.user.email || !session.user.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const memberships = (await prisma.membership.findMany({
    where: {
      OR: [{ userId: session.user.id }, { invitedEmail: session.user.email }],
    },
    select: {
      id: true,
      userId: true,
      role: true,
      invitedEmail: true,
      invitedName: true,
      organization: {
        select: {
          id: true,
          name: true,
          image: true,
          membership: {
            select: {
              id: true,
            },
          },
          emailAccounts: {
            select: {
              id: true,
            },
          },
        },
      },
    },
    orderBy: [{ organization: { name: "asc" } }],
  })) as WorkspaceMembership[];

  const cookieStore = request.headers.get("cookie") ?? "";
  const activeCookie = cookieStore
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${ACTIVE_WORKSPACE_COOKIE}=`))
    ?.split("=")[1];

  const activeWorkspaceId =
    memberships.find(
      (membership: WorkspaceMembership) =>
        membership.organization.id === activeCookie,
    )?.organization.id ??
    memberships[0]?.organization.id ??
    null;

  const response = NextResponse.json({
    workspaces: memberships.map((membership: WorkspaceMembership) => ({
      id: membership.organization.id,
      name: membership.organization.name,
      image: membership.organization.image,
      role: membership.role,
      memberCount: membership.organization.membership.length,
      accountCount: membership.organization.emailAccounts.length,
      invitedEmail: membership.invitedEmail,
      invitedName: membership.invitedName,
      isPending: !membership.userId && !!membership.invitedEmail,
    })),
    activeWorkspaceId,
  });

  if (activeWorkspaceId && activeWorkspaceId !== activeCookie) {
    response.cookies.set(ACTIVE_WORKSPACE_COOKIE, activeWorkspaceId, {
      path: "/",
      sameSite: "lax",
    });
  }

  return response;
});

export const POST = withError(async (request: Request) => {
  const session = await auth();
  if (!session?.user.email || !session.user.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const json = await request.json();
  const body = createWorkspaceBody.parse(json);

  const organization = await prisma.organization.create({
    data: {
      name: body.name,
      image: body.image ?? null,
      membership: {
        create: {
          role: "OWNER",
          userId: session.user.id,
        },
      },
    },
    select: { id: true },
  });

  const response = NextResponse.json(
    {
      id: organization.id,
    },
    { status: 201 },
  );

  response.cookies.set(ACTIVE_WORKSPACE_COOKIE, organization.id, {
    path: "/",
    sameSite: "lax",
  });

  return response;
});
