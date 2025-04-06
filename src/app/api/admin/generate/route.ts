// このファイルは回答生成ロジックが `/api/admin/generate/answers/route.ts` に移動したため、空にするか削除できます。
// 他の /api/admin/generate/ 関連のルートを追加する可能性がある場合は残しておいても構いません。

// 例として空の NextResponse を返すようにしておきます。
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    // 必要に応じて他のHTTPメソッド（GETなど）のハンドラを追加
    return NextResponse.json({ message: 'This endpoint is deprecated. Use /api/admin/generate/answers instead.' }, { status: 404 });
} 