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
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const relPath = req.nextUrl.searchParams.get('path') || '';
  const audioRoot = path.resolve(process.cwd(), 'private_vault', 'audio');
  const targetPath = path.resolve(audioRoot, relPath);

  if (!targetPath.startsWith(audioRoot + path.sep) || !fs.existsSync(targetPath)) {
    return new NextResponse('Not Found', { status: 404 });
  }

  const fileName = path.basename(targetPath);
  const fullBuf = fs.readFileSync(targetPath);

  return new NextResponse(fullBuf, {
    status: 200,
    headers: {
      'Content-Length': String(fullBuf.length),
      'Content-Type': 'audio/mpeg',
      'Content-Disposition': `attachment; filename="${fileName.replace(/[^\x20-\x7E]/g, '_')}"; filename*=UTF-8''${encodeURIComponent(fileName)}`
    }
  });
}
