import React, { useState, useEffect, useRef } from 'react';
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  db, 
  doc, 
  setDoc, 
  serverTimestamp, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  updateDoc
} from '../firebase';
import { useNavigate } from 'react-router-dom';
import { Video, LogIn, Phone, Lock, Mail, ArrowRight, CheckCircle, AlertCircle, Loader2, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type AuthMode = 'google' | 'phone-password' | 'phone-otp';
type View = 'login' | 'register' | 'forgot-password' | 'verify-otp';

const Login: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('google');
  const [view, setView] = useState<View>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form fields
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  
  const navigate = useNavigate();
  const recaptchaRef = useRef<HTMLDivElement>(null);
  const recaptchaVerifier = useRef<RecaptchaVerifier | null>(null);

  useEffect(() => {
    return () => {
      if (recaptchaVerifier.current) {
        recaptchaVerifier.current.clear();
      }
    };
  }, []);

  const setupRecaptcha = () => {
    // Clear existing verifier if it exists to prevent "element removed" errors
    if (recaptchaVerifier.current) {
      try {
        recaptchaVerifier.current.clear();
      } catch (e) {
        console.warn('Error clearing existing reCAPTCHA:', e);
      }
      recaptchaVerifier.current = null;
    }

    if (recaptchaRef.current) {
      try {
        recaptchaVerifier.current = new RecaptchaVerifier(auth, recaptchaRef.current, {
          size: 'invisible',
          callback: () => {
            console.log('reCAPTCHA resolved');
          }
        });
      } catch (err) {
        console.error('reCAPTCHA initialization failed:', err);
      }
    }
  };

  // Helper to convert phone to dummy email for password-based auth
  const phoneToEmail = (p: string) => {
    const cleanPhone = p.replace(/\D/g, '');
    return `${cleanPhone}@vidi-tutorials.com`;
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await createUserProfile(result.user);
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePhonePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const email = phoneToEmail(phone);
      const result = await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (err: any) {
      setError('Invalid phone number or password. If you haven\'t registered, please use the Register tab.');
    } finally {
      setLoading(false);
    }
  };

  const handlePhonePasswordRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const email = phoneToEmail(phone);
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await createUserProfile(result.user, phone);
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      setupRecaptcha();
      if (!recaptchaVerifier.current) throw new Error('Recaptcha not initialized');
      
      // Ensure phone has country code for Firebase OTP
      let formattedPhone = phone.trim();
      if (!formattedPhone.startsWith('+')) {
        formattedPhone = '+91' + formattedPhone; // Default to India if no country code
      }
      
      const result = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier.current);
      setConfirmationResult(result);
      setView('verify-otp');
    } catch (err: any) {
      console.error('OTP Error:', err);
      if (err.code === 'auth/operation-not-allowed') {
        setError('Phone authentication is not enabled in Firebase Console. Please go to Build > Authentication > Sign-in method and enable "Phone".');
      } else {
        setError(err.message || 'Failed to send verification code. Please check the phone number format.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult) return;
    setLoading(true);
    setError(null);
    try {
      const result = await confirmationResult.confirm(otp);
      await createUserProfile(result.user, phone);
      navigate('/');
    } catch (err: any) {
      setError('Invalid verification code.');
    } finally {
      setLoading(false);
    }
  };

  const createUserProfile = async (user: any, phoneNum?: string) => {
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email || '',
      phone: phoneNum || user.phoneNumber || '',
      displayName: user.displayName || 'User',
      photoURL: user.photoURL || '',
      role: user.email === 'thanguduvasu143@gmail.com' ? 'admin' : 'user',
      createdAt: serverTimestamp(),
      bookmarks: [],
      watchHistory: [],
    }, { merge: true });
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] py-10">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-surface p-8 md:p-12 rounded-[2.5rem] shadow-2xl w-full max-w-lg border border-gray-100"
      >
        <div className="text-center mb-10">
          <div className="inline-flex bg-primary/10 p-4 rounded-2xl mb-6">
            <Video className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-black text-text mb-2 tracking-tighter">VidiTutorials</h1>
          <p className="text-text-muted font-medium">
            {view === 'login' ? 'Welcome back! Please login.' : 
             view === 'register' ? 'Join our community today.' : 
             view === 'forgot-password' ? 'Reset your access.' : 'Verify your phone.'}
          </p>
        </div>

        {/* Auth Mode Tabs */}
        {view !== 'verify-otp' && (
          <div className="flex bg-bg p-1.5 rounded-2xl mb-8">
            <button
              onClick={() => { setMode('google'); setView('login'); }}
              className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${mode === 'google' ? 'bg-surface text-primary shadow-sm' : 'text-text-muted/50 hover:text-text-muted'}`}
            >
              Google
            </button>
            <button
              onClick={() => { setMode('phone-password'); setView('login'); }}
              className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${mode === 'phone-password' ? 'bg-surface text-primary shadow-sm' : 'text-text-muted/50 hover:text-text-muted'}`}
            >
              Phone + Pass
            </button>
            <button
              onClick={() => { setMode('phone-otp'); setView('login'); }}
              className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${mode === 'phone-otp' ? 'bg-surface text-primary shadow-sm' : 'text-text-muted/50 hover:text-text-muted'}`}
            >
              Phone OTP
            </button>
          </div>
        )}

        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-50 text-red-600 p-4 rounded-2xl mb-8 text-sm flex items-center gap-3 border border-red-100">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium">{error}</span>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {mode === 'google' && (
            <motion.div key="google" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-4 bg-surface border border-gray-100 text-text px-8 py-4 rounded-2xl font-bold hover:bg-bg transition-all shadow-sm hover:shadow-md disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin text-primary" /> : <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" />}
                <span>Continue with Google</span>
              </button>
            </motion.div>
          )}

          {mode === 'phone-password' && (
            <motion.div key="phone-password" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {view === 'forgot-password' ? (
                <form onSubmit={handleSendOtp} className="space-y-6">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-text-muted/50" />
                    </div>
                    <input
                      type="tel"
                      required
                      placeholder="Phone Number (e.g. +91...)"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="block w-full pl-12 pr-4 py-4 bg-bg border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-lg hover:bg-primary-dark transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3"
                  >
                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Send Reset Code'}
                  </button>
                  <div id="recaptcha-container-forgot" ref={recaptchaRef} className="mt-2"></div>
                  <button
                    type="button"
                    onClick={() => setView('login')}
                    className="w-full text-sm font-bold text-text-muted hover:text-primary transition-colors"
                  >
                    Back to Login
                  </button>
                </form>
              ) : (
                <form onSubmit={view === 'login' ? handlePhonePasswordLogin : handlePhonePasswordRegister} className="space-y-6">
                  <div className="space-y-4">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Phone className="h-5 w-5 text-text-muted/50" />
                      </div>
                      <input
                        type="tel"
                        required
                        placeholder="Phone Number (e.g. +91...)"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="block w-full pl-12 pr-4 py-4 bg-bg border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                      />
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-text-muted/50" />
                      </div>
                      <input
                        type="password"
                        required
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full pl-12 pr-4 py-4 bg-bg border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                      />
                    </div>
                  </div>

                  {view === 'login' && (
                    <div className="flex items-center justify-between">
                      <button 
                        type="button"
                        onClick={() => { setMode('phone-otp'); setView('login'); }}
                        className="text-xs font-bold text-primary hover:underline"
                      >
                        Login with Phone OTP
                      </button>
                      <button 
                        type="button"
                        onClick={() => setView('forgot-password')}
                        className="text-xs font-bold text-primary hover:underline"
                      >
                        Forgot Password?
                      </button>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-lg hover:bg-primary-dark transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3"
                  >
                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (view === 'login' ? 'Login' : 'Create Account')}
                  </button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setView(view === 'login' ? 'register' : 'login')}
                      className="text-sm font-bold text-text-muted hover:text-primary transition-colors"
                    >
                      {view === 'login' ? "Don't have an account? Register" : "Already have an account? Login"}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          )}

          {mode === 'phone-otp' && (
            <motion.div key="phone-otp" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {view === 'verify-otp' ? (
                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Smartphone className="h-5 w-5 text-text-muted/50" />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="6-digit Verification Code"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="block w-full pl-12 pr-4 py-4 bg-bg border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-lg hover:bg-primary-dark transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3"
                  >
                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Verify & Continue'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setView('login')}
                    className="w-full text-sm font-bold text-text-muted hover:text-primary transition-colors"
                  >
                    Change Phone Number
                  </button>
                </form>
              ) : (
                <form onSubmit={handleSendOtp} className="space-y-6">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-text-muted/50" />
                    </div>
                    <input
                      type="tel"
                      required
                      placeholder="Phone Number (e.g. +91...)"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="block w-full pl-12 pr-4 py-4 bg-bg border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-lg hover:bg-primary-dark transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3"
                  >
                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Send Verification Code'}
                  </button>
                  <div id="recaptcha-container-login" ref={recaptchaRef} className="mt-2"></div>
                </form>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-12 pt-8 border-t border-gray-50 text-center">
          <p className="text-[10px] text-text-muted/40 uppercase tracking-[0.2em] font-black">
            Secure Authentication powered by Firebase
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
