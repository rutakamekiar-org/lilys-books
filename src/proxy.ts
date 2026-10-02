import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  if (!request.nextUrl.searchParams.has("v")) {
    return NextResponse.next();
  }

  const destination = request.nextUrl.clone();
  destination.searchParams.delete("v");

  return NextResponse.redirect(destination, 308);
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
