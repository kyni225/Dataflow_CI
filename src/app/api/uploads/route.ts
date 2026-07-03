import { toErrorResponse } from "@/lib/errors/app-error";
import { requireUser } from "@/lib/session";
import { uploadService } from "@/services/upload-service";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await requireUser();
    const uploads = await uploadService.list(user.id);

    return Response.json({ uploads });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: Request) {
  console.log("[API /api/uploads] POST request received");
  
  try {
    const user = await requireUser();
    console.log("[API /api/uploads] User authenticated:", user.id);
    
    const formData = await request.formData();
    console.log("[API /api/uploads] FormData received, calling uploadService.create");
    
    const upload = await uploadService.create(user.id, formData);
    console.log("[API /api/uploads] Upload created successfully:", upload.id);

    return Response.json({ upload }, { status: 202 });
  } catch (error) {
    console.error("[API /api/uploads] Error:", error);
    
    // Include detailed error information in response for debugging
    const errorResponse = toErrorResponse(error);
    const errorData = await errorResponse.json();
    
    // Add more context if available
    if (error instanceof Error) {
      errorData.details = error.message;
      errorData.stack = error.stack;
    }
    
    return Response.json(errorData, { status: errorResponse.status });
  }
}
