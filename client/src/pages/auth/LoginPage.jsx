import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { FaEnvelope, FaLock, FaGoogle } from 'react-icons/fa';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';

export default function LoginPage() {
  const { register, handleSubmit } = useForm();
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const onSubmit = (data) => {
    login(data).then(() => navigate('/dashboard')).catch(() => {});
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.25),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(34,211,238,0.2),_transparent_35%)] px-4 py-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900/70 shadow-2xl backdrop-blur-xl">
        <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
          <div className="bg-gradient-to-br from-indigo-600/80 to-cyan-500/80 p-8 text-white">
            <h2 className="text-3xl font-semibold">Welcome back</h2>
            <p className="mt-3 text-sm text-slate-100/90">Sign in to continue orchestrating your team and projects.</p>
            <div className="mt-10 rounded-3xl border border-white/20 bg-white/10 p-6 text-sm backdrop-blur">
              <p className="text-lg font-medium">Trusted by product teams worldwide</p>
              <ul className="mt-4 space-y-2 text-slate-100/90">
                <li>• Secure authentication</li>
                <li>• Live team visibility</li>
                <li>• Beautiful task workflows</li>
              </ul>
            </div>
          </div>
          <div className="p-8 sm:p-10">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-semibold">Sign in</h3>
                <p className="text-sm text-slate-400">Access your workspace</p>
              </div>
              <Link to="/" className="text-sm text-cyan-400">Back home</Link>
            </div>
            <form className="mt-8 space-y-4" onSubmit={handleSubmit(onSubmit)}>
              <label className="block">
                <span className="mb-2 block text-sm text-slate-400">Email</span>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3">
                  <FaEnvelope className="text-slate-500" />
                  <input {...register('email')} type="email" className="w-full bg-transparent outline-none" placeholder="you@example.com" />
                </div>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm text-slate-400">Password</span>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3">
                  <FaLock className="text-slate-500" />
                  <input {...register('password')} type="password" className="w-full bg-transparent outline-none" placeholder="••••••••" />
                </div>
              </label>
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-slate-400"><input type="checkbox" className="rounded border-slate-700 bg-slate-950" /> Remember me</label>
                <Link to="/forgot-password" className="text-cyan-400">Forgot password?</Link>
              </div>
              <button className="w-full rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-400 px-4 py-3 font-medium text-white">Log in</button>
            </form>
            <button className="mt-4 flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-800 px-4 py-3 text-sm text-slate-200"><FaGoogle /> Continue with Google</button>
            <p className="mt-6 text-center text-sm text-slate-400">No account yet? <Link to="/register" className="text-cyan-400">Create one</Link></p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
