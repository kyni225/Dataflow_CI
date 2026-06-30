export { auth as middleware } from "@/auth";

export const config = {
  matcher: [
    "/((?!api/auth|api/register|_next/static|_next/image|favicon.ico|login|register|samples).*)"
  ]
};
