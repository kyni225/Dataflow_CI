import { toErrorResponse } from "@/lib/errors/app-error";
import { requireUser } from "@/lib/session";
import { sourceService } from "@/services/source-service";

export const runtime = "nodejs";

type Context = {
  params: Promise<{ sourceId: string }>;
};

export async function GET(_request: Request, context: Context) {
  try {
    const user = await requireUser();
    const { sourceId } = await context.params;
    const source = await sourceService.get(sourceId, user.id);

    return Response.json({ source });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PUT(request: Request, context: Context) {
  try {
    const user = await requireUser();
    const { sourceId } = await context.params;
    const source = await sourceService.update(sourceId, user.id, await request.json());

    return Response.json({ source });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function DELETE(_request: Request, context: Context) {
  try {
    const user = await requireUser();
    const { sourceId } = await context.params;
    await sourceService.delete(sourceId, user.id);

    return Response.json({ ok: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
