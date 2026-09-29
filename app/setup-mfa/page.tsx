"use client";
import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { enrollCurrentUserInTotp, auth } from '@/lib/firebase/client';
import { multiFactor, signInWithEmailAndPassword } from 'firebase/auth';

/**
 * Page to enroll the currently signed‑in user in TOTP (Google Authenticator) MFA.
 * If no user is signed in, renders an email/password sign‑in form first.
 */
export default function SetupMfa() {
  // Auth / sign‑in state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signInError, setSignInError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // MFA enrollment state
  const [enrollment, setEnrollment] = useState<any>(null);
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'enrolling' | 'verifying' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);

  // Sign‑in handler
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSigningIn(true);
    setSignInError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // auth.currentUser is now set – the effect below will trigger enrollment.
    } catch (e: any) {
      console.error(e);
      setSignInError(e.message || 'Sign‑in failed');
    } finally {
      setIsSigningIn(false);
    }
  };

  // Generate QR code when a user is present and we haven't started enrollment yet.
  useEffect(() => {
    if (!auth.currentUser) return;
    if (enrollment) return; // already have enrollment
    setStatus('enrolling');
    enrollCurrentUserInTotp()
      .then((result) => {
        setEnrollment(result);
        setStatus('idle');
      })
      .catch((e) => {
        console.error(e);
        setError('Failed to generate enrollment');
        setStatus('idle');
      });
  }, [auth.currentUser, enrollment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !enrollment) return;
    setStatus('verifying');
    setError(null);
    try {
      // @ts-ignore – SDK typings differ between versions.
      await multiFactor(auth.currentUser).enroll(enrollment.secret, code);
      await auth.currentUser.getIdToken(true);
      setStatus('done');
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Verification failed');
      setStatus('idle');
    }
  };

  // Render UI
  return (
    <>
      <Head>
        <title>Setup MFA – Google Authenticator</title>
        <meta name="description" content="Enroll in two‑factor authentication using Google Authenticator." />
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 p-4">
        <div className="w-full max-w-md rounded-xl bg-white/10 p-8 backdrop-blur-lg shadow-xl">
          <h1 className="mb-6 text-center text-3xl font-bold text-white">Enable Google Authenticator MFA</h1>

          {/* Sign‑in form if no user */}
          {!auth.currentUser && (
            <form onSubmit={handleSignIn} className="space-y-4">
              {signInError && (
                <div className="rounded bg-red-500/20 p-2 text-center text-red-200 mb-2">{signInError}</div>
              )}
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded border border-white/30 bg-white/5 px-3 py-2 text-white placeholder-gray-400 focus:outline-none"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded border border-white/30 bg-white/5 px-3 py-2 text-white placeholder-gray-400 focus:outline-none"
              />
              <button
                type="submit"
                disabled={isSigningIn}
                className="w-full rounded bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                {isSigningIn ? 'Signing in…' : 'Sign In'}
              </button>
            </form>
          )}

          {/* After sign‑in, enrollment UI */}
          {auth.currentUser && (
            <>
              {error && (
                <div className="mb-4 rounded bg-red-500/20 p-2 text-center text-red-200">{error}</div>
              )}

              {status === 'enrolling' && <p className="text-center text-white">Generating QR code…</p>}

              {enrollment && enrollment.qrCodeUrl && (
                <div className="mb-6 flex flex-col items-center">
                  <p className="mb-2 text-sm text-white">Scan this QR code with Google Authenticator:</p>
                  <img src={enrollment.qrCodeUrl} alt="Google Authenticator QR code" className="rounded border border-white/20" />
                </div>
              )}

              {enrollment && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <label className="block">
                    <span className="text-white">6‑digit code</span>
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      maxLength={6}
                      pattern="[0-9]{6}"
                      required
                      className="mt-1 block w-full rounded border border-white/30 bg-white/5 px-3 py-2 text-center text-white placeholder-gray-400 focus:outline-none"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={status === 'verifying'}
                    className="w-full rounded bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                  >
                    {status === 'verifying' ? 'Verifying…' : 'Enable MFA'}
                  </button>
                </form>
              )}

              {status === 'done' && (
                <p className="mt-4 text-center text-green-300">✅ MFA enabled! Your token has been refreshed.</p>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}
