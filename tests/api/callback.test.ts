import { describe, it, expect, vi } from 'vitest';
import { GET } from '../../app/auth/callback/route';
import { createClient } from '../../utils/supabase/server';
import { NextResponse } from 'next/server';

// Mock Supabase server client
vi.mock('../../utils/supabase/server', () => ({
    createClient: vi.fn(),
}));

// Mock NextResponse
vi.mock('next/server', () => ({
    NextResponse: {
        redirect: vi.fn().mockImplementation((url) => ({ status: 302, url })),
    },
}));

describe('Auth Callback API Route', () => {
    it('redirects to /game on successful code exchange', async () => {
        // Setup Supabase mock returning success
        const mockExchange = vi.fn().mockResolvedValue({ error: null });
        vi.mocked(createClient).mockResolvedValue({
            auth: { exchangeCodeForSession: mockExchange },
        } as any);

        const request = new Request('http://localhost:3000/auth/callback?code=valid-code&next=/game');
        const response: any = await GET(request);

        // Should call exchangeCodeForSession with 'valid-code'
        expect(mockExchange).toHaveBeenCalledWith('valid-code');

        // Should redirect to /game
        expect(NextResponse.redirect).toHaveBeenCalledWith('http://localhost:3000/game');
        expect(response.url).toBe('http://localhost:3000/game');
    });

    it('redirects back to /login on failed code exchange', async () => {
        // Setup Supabase mock returning an error
        const mockExchange = vi.fn().mockResolvedValue({ error: new Error('Invalid code') });
        vi.mocked(createClient).mockResolvedValue({
            auth: { exchangeCodeForSession: mockExchange },
        } as any);

        const request = new Request('http://localhost:3000/auth/callback?code=invalid-code');
        const response: any = await GET(request);

        // Should redirect to login with error
        expect(NextResponse.redirect).toHaveBeenCalledWith(
            'http://localhost:3000/login?error=Could%20not%20verify%20email.%20The%20link%20may%20be%20expired%20or%20invalid.'
        );
    });

    it('redirects to /login if no code is provided', async () => {
        const request = new Request('http://localhost:3000/auth/callback');
        await GET(request);

        expect(NextResponse.redirect).toHaveBeenCalledWith(
            'http://localhost:3000/login?error=Could%20not%20verify%20email.%20The%20link%20may%20be%20expired%20or%20invalid.'
        );
    });
});
