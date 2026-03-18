import { NextResponse } from 'next/server';

export async function GET() {
    try {
          const backendUrl = 'http://marcib.ddns.net:4000/';
          const start = Date.now();
          const res = await fetch(backendUrl, { cache: 'no-store' });
          const text = await res.text();
          const time = Date.now() - start;

      return NextResponse.json({
              success: true,
              timeMs: time,
              status: res.status,
              bodyPreview: text.substring(0, 100),
      });
    } catch (error: any) {
          return NextResponse.json({
                  success: false,
                  errorName: error.name,
                  errorMessage: error.message,
                  cause: error.cause?.message || String(error.cause),
                  stack: error.stack
          }, { status: 500 });
    }
}
