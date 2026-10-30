import React from 'react';
import { auth } from '../../lib/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { Button } from './Button';

export const Login = () => {
  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      window.location.reload(); // إعادة تحميل التطبيق بعد الدخول
    } catch (error) {
      console.error("خطأ في تسجيل الدخول:", error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">مرحباً بك في Flouss</h1>
      <Button onClick={handleLogin} className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium">
        تسجيل الدخول بـ Gmail
      </Button>
    </div>
  );
};
