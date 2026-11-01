import { redirect } from "next/navigation";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ returnUrl?: string | string[] }>;
}) {
  const params = await searchParams;
  const rawReturnUrl = Array.isArray(params.returnUrl)
    ? params.returnUrl[0]
    : params.returnUrl;

  const destination =
    rawReturnUrl &&
    rawReturnUrl.startsWith("/") &&
    !rawReturnUrl.startsWith("//") &&
    !rawReturnUrl.startsWith("/login")
      ? rawReturnUrl
      : "/admin";

  redirect(destination);
}
