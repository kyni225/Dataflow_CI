import { toErrorResponse } from "@/lib/errors/app-error";
import { requireUser } from "@/lib/session";
import { getDashboard } from "@/services/dashboard-service";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await requireUser();
    const dashboard = await getDashboard(user.id);

    return Response.json({ dashboard });
  } catch (error) {
    return toErrorResponse(error);
  }
}
