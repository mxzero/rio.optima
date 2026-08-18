import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    name?: string;
    email?: string;
    message?: string;
    organization?: string;
    phone?: string;
    interest?: string;
  };

  if (!body.name?.trim() || !body.email?.trim() || !body.message?.trim()) {
    return NextResponse.json(
      { ok: false, error: "Name, email, and message are required." },
      { status: 400 },
    );
  }

  return NextResponse.json({
    ok: true,
    received: {
      name: body.name.trim(),
      email: body.email.trim(),
      organization: body.organization?.trim() || "",
      phone: body.phone?.trim() || "",
      interest: body.interest?.trim() || "",
    },
  });
}
