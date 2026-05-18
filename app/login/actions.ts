'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
    const supabase = await createClient()

    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    }

    const { error } = await supabase.auth.signInWithPassword(data)

    if (error) {
        console.error('Login Error:', error.message)
        redirect(`/login?error=${encodeURIComponent(error.message)}`)
    }

    revalidatePath('/', 'layout')
    redirect('/game')
}

export async function signup(formData: FormData) {
    const supabase = await createClient()

    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    }

    const { data: authData, error } = await supabase.auth.signUp(data)

    if (error) {
        console.error('Signup Error:', error.message)
        redirect(`/login?error=${encodeURIComponent(error.message)}`)
    }

    // If email confirmation is required, the session will be null after signup
    if (!authData.session) {
        redirect(`/login?error=${encodeURIComponent('Please check your email to confirm your account before logging in.')}`)
    }

    revalidatePath('/', 'layout')
    redirect('/game')
}

export async function loginAsGuest() {
    const supabase = await createClient()

    const { error } = await supabase.auth.signInAnonymously()

    if (error) {
        console.error('Guest Auth Error:', error.message)
        redirect(`/login?error=${encodeURIComponent(error.message)}`)
    }

    revalidatePath('/', 'layout')
    redirect('/game')
}
