import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // আপাতত কোনো বাধা ছাড়াই সব রিকোয়েস্ট অ্যালাউ করে দিচ্ছি
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};