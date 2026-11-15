import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const ACCESS_PIN = process.env.ACCESS_PIN || 'flgang';

function isAuthorized(req: NextRequest) {
  const headerPin = req.headers.get('x-vault-pin');
  const queryPin = req.nextUrl.searchParams.get('pin');
  return headerPin === ACCESS_PIN || queryPin === ACCESS_PIN;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Code d\'accès requis', pinRequired: true }, { status: 401 });
  }

  const libPath = path.join(process.cwd(), 'private_vault', 'library.json');
  if (!fs.existsSync(libPath)) {
    return NextResponse.json({ online: true, tracks: [], categories: [], stats: { totalTracks: 0, totalSizeBytes: 0, totalDurationSec: 0 } });
  }

  const content = fs.readFileSync(libPath, 'utf8');
  return new NextResponse(content, {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow'
    }
  });
}
