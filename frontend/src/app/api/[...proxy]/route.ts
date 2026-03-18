import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: { proxy: string[] } }) { return proxyRequest(request, params.proxy); }
export async function POST(request: NextRequest, { params }: { params: { proxy: string[] } }) { return proxyRequest(request, params.proxy); }
export async function PUT(request: NextRequest, { params }: { params: { proxy: string[] } }) { return proxyRequest(request, params.proxy); }
export async function DELETE(request: NextRequest, { params }: { params: { proxy: string[] } }) { return proxyRequest(request, params.proxy); }
export async function PATCH(request: NextRequest, { params }: { params: { proxy: string[] } }) { return proxyRequest(request, params.proxy); }

async function proxyRequest(request: NextRequest, proxyPath: string[]) {
    try {
          const backendUrl = 'http://marcib.ddns.net:4000/api';
          const path = '/' + (proxyPath ? proxyPath.join('/') : '');
          const url = new URL(request.url);
          const targetUrl = `${backendUrl}${path}${url.search}`;

      const headers = new Headers(request.headers);
          headers.set('host', 'marcib.ddns.net:4000');
          headers.delete('connection');
          headers.delete('content-length');

      const fetchOptions: RequestInit = {
              method: request.method,
              headers: headers,
              redirect: 'manual',
      };

      if (request.method !== 'GET' && request.method !== 'HEAD') {
              const buffer = await request.arrayBuffer();
              if (buffer.byteLength > 0) fetchOptions.body = buffer;
      }

      const response = await fetch(targetUrl, fetchOptions);
          const responseHeaders = new Headers(response.headers);
          responseHeaders.delete('transfer-encoding');

      return new NextResponse(response.body, {
              status: response.status,
              statusText: response.statusText,
              headers: responseHeaders,
      });
    } catch (error: any) {
          return NextResponse.json({ error: 'Proxy backend inaccessible', details: error.message }, { status: 502 });
    }
}
