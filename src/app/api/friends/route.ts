import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
	try {
		const { name, address } = await req.json();

		if (!name || !address) {
			return NextResponse.json(
				{ success: false, error: "Name and address are required" },
				{ status: 400 },
			);
		}

		// ブラウザ側でlocalStorageに保存するので、ここでは検証のみ
		return NextResponse.json({
			success: true,
			friend: { name, address },
		});
	} catch (error: any) {
		return NextResponse.json(
			{ success: false, error: error.message },
			{ status: 500 },
		);
	}
}
