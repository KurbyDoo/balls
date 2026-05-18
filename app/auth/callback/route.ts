import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')

    // The 'next' param is used to redirect the user to a specific destination after successful login
    const next = searchParams.get('next') ?? '/game'

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            // Successfully exchanged the code for a session, redirect to the app
            return NextResponse.redirect(`${origin}${next}`)
        }
    }

    // If there was no code, or the exchange failed, redirect back to login with an error
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('Could not verify email. The link may be expired or invalid.')}`)
}
