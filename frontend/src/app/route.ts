import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  const htmlPath = path.join(process.cwd(), 'private_vault', 'vault.html');
  const html = fs.readFileSync(htmlPath, 'utf8');
  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store, must-revalidate',
      'X-Robots-Tag': 'noindex, nofollow, noarchive'
    }
  });
}
