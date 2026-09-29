const defaultPostAuthPath = "/dashboard";

export function getPostAuthPath(search: string): string {
  const returnTo = new URLSearchParams(search).get("returnTo");

  if (
    !returnTo ||
    !returnTo.startsWith("/") ||
    returnTo.startsWith("//") ||
    returnTo.includes("\\") ||
    /[\u0000-\u001f]/.test(returnTo)
  ) {
    return defaultPostAuthPath;
  }

  const target = new URL(returnTo, "https://draftwell.local");
  if (target.origin !== "https://draftwell.local") {
    return defaultPostAuthPath;
  }

  return `${target.pathname}${target.search}${target.hash}`;
}
