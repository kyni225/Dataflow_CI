import { auth } from "@/auth";
import { AppError } from "@/lib/errors/app-error";

export async function requireUser() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new AppError("Authentification requise.", 401);
  }

  return session.user;
}
