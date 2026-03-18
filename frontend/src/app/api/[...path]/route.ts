import { NextRequest, NextResponse } from 'next/server';

// Service URLs - Configure for Docker or Local Development
const getAuthServiceUrl = () => {
  if (process.env.AUTH_SERVICE_URL) {
    return process.env.AUTH_SERVICE_URL;
  }
  return 'http://localhost:3001';
};

const getBookServiceUrl = () => {
  if (process.env.BOOK_SERVICE_URL) {
    return process.env.BOOK_SERVICE_URL;
  }
  return 'http://localhost:3002';
};

// Catch-all API Proxy Route
// Forwards requests to auth-service or book-service based on XTransformPort
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleRequest(request, params);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleRequest(request, params);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleRequest(request, params);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleRequest(request, params);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleRequest(request, params);
}

async function handleRequest(
  request: NextRequest,
  params: Promise<{ path: string[] }>
) {
  const { path } = await params;
  const searchParams = request.nextUrl.searchParams;
  
  // Determine target service based on XTransformPort
  const transformPort = searchParams.get('XTransformPort');
  
  let targetServiceUrl: string;
  if (transformPort === '3001') {
    targetServiceUrl = getAuthServiceUrl();
  } else if (transformPort === '3002') {
    targetServiceUrl = getBookServiceUrl();
  } else {
    // Default to book service
    targetServiceUrl = getBookServiceUrl();
  }
  
  // Build target URL
  const apiPath = path.join('/');
  const targetUrl = `${targetServiceUrl}/api/${apiPath}?${searchParams.toString()}`;
  
  // Get request body if present
  let body: string | undefined;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    body = await request.text();
  }
  
  // Forward headers, including cookies
  const headers = new Headers();
  request.headers.forEach((value, key) => {
    // Forward all headers except host
    if (key.toLowerCase() !== 'host') {
      headers.set(key, value);
    }
  });
  
  // Forward cookies from the client request
  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) {
    headers.set('cookie', cookieHeader);
  }
  
  try {
    // Make the proxy request
    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
      redirect: 'manual', // Don't follow redirects automatically
    });
    
    // Forward response headers including Set-Cookie
    const responseHeaders = new Headers();
    response.headers.forEach((value, key) => {
      // Forward all headers
      responseHeaders.set(key, value);
    });
    
    // Get the response body
    const responseBody = await response.text();
    
    // Create response with forwarded headers
    const nextResponse = new NextResponse(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
    
    // Forward Set-Cookie headers explicitly
    const setCookieHeaders = response.headers.getSetCookie();
    setCookieHeaders.forEach(cookie => {
      nextResponse.headers.append('Set-Cookie', cookie);
    });
    
    return nextResponse;
  } catch (error) {
    console.error('[API Proxy] Error:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: 'Service unavailable',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}
