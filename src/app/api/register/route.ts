import bcrypt from "bcryptjs";
import { z } from "zod";

import { prisma } from "@/lib/db/prisma";
import { AppError, toErrorResponse } from "@/lib/errors/app-error";

export const runtime = "nodejs";

const registerSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().email(),
  password: z.string().min(8)
});

export async function POST(request: Request) {
  try {
    const input = registerSchema.parse(await request.json());
    const email = input.email.toLowerCase();
    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      throw new AppError("Un compte existe deja avec cet email.", 409);
    }

    const passwordHash = await bcrypt.hash(input.password, 12);

    const user = await prisma.user.create({
      data: {
        name: input.name,
        email,
        passwordHash
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    });

    return Response.json({ user }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
