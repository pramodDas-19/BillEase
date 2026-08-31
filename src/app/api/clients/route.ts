import { NextResponse } from "next/server";
import { ClientService } from "@/services/client.service";

export async function GET() {
  const data = await ClientService.getClients();
  return NextResponse.json({ success: true, data });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const created = await ClientService.createClient(body);
    return NextResponse.json({ success: true, data: created });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
