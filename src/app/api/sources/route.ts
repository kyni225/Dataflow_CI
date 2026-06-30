import { toErrorResponse } from "@/lib/errors/app-error";
import { requireUser } from "@/lib/session";
import { sourceService } from "@/services/source-service";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await requireUser();
    const sources = await sourceService.list(user.id);

    return Response.json({ sources });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const source = await sourceService.create(user.id, await request.json());

    return Response.json({ source }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
