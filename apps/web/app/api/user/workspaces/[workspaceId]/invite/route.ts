import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/auth";
import prisma from "@/utils/prisma";
import { withError } from "@/utils/middleware";
import { z } from "zod";

const inviteBody = z.object({
  email: z.string().email(),
  role: z.enum(["OWNER", "ADMIN", "USER"]).default("USER"),
});

export const POST = withError(
  async (
    request: Request,
    { params }: { params: { workspaceId?: string } },
  ) => {
    const session = await auth();
    if (!session?.user.email || !session.user.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (!params.workspaceId) {
      return NextResponse.json(
        { error: "Missing workspace id" },
        { status: 400 },
      );
    }

    const actor = await prisma.membership.findFirst({
      where: {
        organizationId: params.workspaceId,
        userId: session.user.id,
      },
      select: { role: true },
    });

    if (!actor) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 },
      );
    }

    if (actor.role === "USER") {
      return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }

    const json = await request.json();
    const body = inviteBody.parse(json);

    const membership = await prisma.membership.upsert({
      where: {
        organizationId_invitedEmail: {
          organizationId: params.workspaceId,
          invitedEmail: body.email,
        },
      },
      create: {
        organizationId: params.workspaceId,
        invitedEmail: body.email,
        invitedName: null,
        role: body.role,
      },
      update: {
        role: body.role,
        invitedName: null,
      },
      select: {
        id: true,
        role: true,
        invitedEmail: true,
      },
    });

    return NextResponse.json(membership, { status: 201 });
  },
);
