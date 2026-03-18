import { NextRequest, NextResponse } from 'next/server';

type RouteParams = { params: Promise<{ proxy: string[] }> };

export async function GET(request: NextRequest, { params }: RouteParams) { const p = await params; return proxyRequest(request, p.proxy); }
export async function POST(request: NextRequest, { params }: RouteParams) { const p = await params; return proxyRequest(request, p.proxy); }
export async function PUT(request: NextRequest, { params }: RouteParams) { const p = await params; return proxyRequest(request, p.proxy); }
export async function DELETE(request: NextRequest, { params }: RouteParams) { const p = await params; return proxyRequest(request, p.proxy); }
export async function PATCH(request: NextRequest, { params }: RouteParams) { const p = await params; return proxyRequest(request, p.proxy); }

async function proxyRequest(request: NextRequest, proxyPath: string[]) {
  try {
    const backendUrl = 'http://marcib.ddns.net/api';
    const path = '/' + (proxyPath ? proxyPath.join('/') : '');
    const url = new URL(request.url);
    const targetUrl = `${backendUrl}${path}${url.search}`;

    const headers = new Headers(request.headers);
    headers.set('host', 'marcib.ddns.net');
    
    // Pour ne pas bloquer Next.js, on retire des headers spécifiques
    headers.delete('connection');
    headers.delete('content-length');
    // On conserve le content-type
    
    // Options de fetch
    const fetchOptions: RequestInit = {
      method: request.method,
      headers: headers,
      redirect: 'manual',
    };

    // Body seulement si ce n'est pas un GET/HEAD
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      const buffer = await request.arrayBuffer();
      if (buffer.byteLength > 0) fetchOptions.body = buffer;
    }

    const response = await fetch(targetUrl, fetchOptions);

    // On récupère les headers de la réponse
    const responseHeaders = new Headers(response.headers);
    
    // IMPORTANT: On supprime chunked si présent pour éviter les conflits Next.js
    responseHeaders.delete('transfer-encoding');

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error('Proxy error:', error);
    return NextResponse.json({ error: 'Proxy backend inaccessible', details: error.message }, { status: 502 });
  }
}
