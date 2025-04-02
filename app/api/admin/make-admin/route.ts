import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/db";
import User from "@/app/models/User";

// このメールアドレスのユーザーを管理者にします
const ADMIN_EMAIL = "yuki0911hanshin@gmail.com";

export async function GET(req: NextRequest) {
  // 安全のため、特定のクエリパラメータを要求するなど、
  // 意図しないアクセスを防ぐ仕組みを追加することを推奨します。
  // 例: const secret = req.nextUrl.searchParams.get('secret');
  //     if (secret !== process.env.ADMIN_SECRET) {
  //       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  //     }

  try {
    await connectToDatabase();

    const user = await User.findOne({ email: ADMIN_EMAIL });

    if (!user) {
      return NextResponse.json(
        { error: `User with email ${ADMIN_EMAIL} not found` },
        { status: 404 }
      );
    }

    if (user.isAdmin) {
      return NextResponse.json(
        { message: `User ${ADMIN_EMAIL} is already an admin` },
        { status: 200 }
      );
    }

    user.isAdmin = true;
    await user.save();

    console.log(`Successfully set user ${ADMIN_EMAIL} as admin.`);
    return NextResponse.json(
      { message: `User ${ADMIN_EMAIL} is now an admin` },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error setting admin user:", error);
    return NextResponse.json(
      { error: "Failed to set admin user" },
      { status: 500 }
    );
  }
} 