import { NextResponse } from "next/server";

function disableCaching(response: NextResponse) {
  response.headers.set(
    "Cache-Control",
    "private, no-cache, no-store, max-age=0, must-revalidate",
  );
  return response;
}

export default function proxy() {
  return disableCaching(NextResponse.next());
}

export const config = {
  matcher: ["/dashboard/:path*", "/"],
};
