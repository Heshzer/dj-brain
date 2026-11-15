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

  const stat = fs.statSync(targetPath);
  const fileSize = stat.size;
  const range = req.headers.get('range');

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    if (isNaN(start) || isNaN(end) || start >= fileSize || end >= fileSize || start > end) {
      return new NextResponse(null, {
        status: 416,
        headers: { 'Content-Range': `bytes */${fileSize}` }
      });
    }

    const chunkLength = (end - start) + 1;
    const buf = Buffer.alloc(chunkLength);
    const fd = fs.openSync(targetPath, 'r');
    fs.readSync(fd, buf, 0, chunkLength, start);
    fs.closeSync(fd);

    return new NextResponse(buf, {
      status: 206,
      headers: {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': String(chunkLength),
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'private, max-age=3600'
      }
    });
  }

  const fullBuf = fs.readFileSync(targetPath);
  return new NextResponse(fullBuf, {
    status: 200,
    headers: {
      'Content-Length': String(fileSize),
      'Accept-Ranges': 'bytes',
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'private, max-age=3600'
    }
  });
}
