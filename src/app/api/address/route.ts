import { NextResponse } from "next/server";
import { getCurrentAddress } from "@/lib/jpyc/sdk";

export async function GET() {
	try {
		const address = getCurrentAddress();
		return NextResponse.json({
			success: true,
			address,
		});
	} catch (error: any) {
		return NextResponse.json(
			{ success: false, error: error.message },
			{ status: 500 },
		);
	}
}
