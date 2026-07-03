import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/app/api/auth/[...nextauth]/auth";
import prisma from "@/utils/prisma";
import { withError } from "@/utils/middleware";
import { ACTIVE_WORKSPACE_COOKIE } from "@/utils/workspaces";

const updateWorkspaceBody = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  image: z.string().url().nullable().optional(),
});

export const PATCH = withError(
  async (
    request: Request,
    { params }: { params: { workspaceId?: string } },
  ) => {
    const session = await auth();
    if (!session?.user.email || !session.user.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (!params.workspaceId) {
      return NextResponse.json({ error: "Missing workspace id" }, { status: 400 });
    }

    const actor = await prisma.membership.findFirst({
      where: {
        organizationId: params.workspaceId,
        OR: [{ userId: session.user.id }, { invitedEmail: session.user.email }],
      },
      select: { role: true },
    });

    if (!actor || (actor.role !== "OWNER" && actor.role !== "ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const json = await request.json();
    const body = updateWorkspaceBody.parse(json);

    const organization = await prisma.organization.update({
      where: { id: params.workspaceId },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.image !== undefined ? { image: body.image } : {}),
      },
      select: {
        id: true,
        name: true,
        image: true,
      },
    });

    return NextResponse.json(organization);
  },
);

export const POST = withError(
  async (
    _request: Request,
    { params }: { params: { workspaceId?: string } },
  ) => {
    const session = await auth();
    if (!session?.user.email || !session.user.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (!params.workspaceId) {
      return NextResponse.json({ error: "Missing workspace id" }, { status: 400 });
    }

    const membership = await prisma.membership.findFirst({
      where: {
        organizationId: params.workspaceId,
        OR: [{ userId: session.user.id }, { invitedEmail: session.user.email }],
      },
      select: { organizationId: true },
    });

    if (!membership) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const response = NextResponse.json({
      activeWorkspaceId: membership.organizationId,
    });

    response.cookies.set(ACTIVE_WORKSPACE_COOKIE, membership.organizationId, {
      path: "/",
      sameSite: "lax",
    });

    return response;
  },
);
