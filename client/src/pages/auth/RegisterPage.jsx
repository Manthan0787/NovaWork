import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { FaUser, FaEnvelope, FaLock } from 'react-icons/fa';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';

export default function RegisterPage() {
  const { register, handleSubmit } = useForm();
  const navigate = useNavigate();
  const { register: registerUser } = useContext(AuthContext);

  const onSubmit = (data) => {
    registerUser(data).then(() => navigate('/dashboard')).catch(() => {});
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.25),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(34,211,238,0.2),_transparent_35%)] px-4 py-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900/70 shadow-2xl backdrop-blur-xl">
        <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
          <div className="bg-gradient-to-br from-cyan-600/80 to-indigo-500/80 p-8 text-white">
            <h2 className="text-3xl font-semibold">Create your workspace</h2>
            <p className="mt-3 text-sm text-slate-100/90">Bring your ideas to life with structured planning and tracking.</p>
            <div className="mt-10 rounded-3xl border border-white/20 bg-white/10 p-6 text-sm backdrop-blur">
              <p className="text-lg font-medium">Starter features</p>
              <ul className="mt-4 space-y-2 text-slate-100/90">
                <li>• Drag & drop task boards</li>
                <li>• Calendar and timeline views</li>
                <li>• Instant collaboration</li>
              </ul>
            </div>
          </div>
          <div className="p-8 sm:p-10">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-semibold">Create account</h3>
                <p className="text-sm text-slate-400">Join NovaWork today</p>
              </div>
              <Link to="/" className="text-sm text-cyan-400">Back home</Link>
            </div>
            <form className="mt-8 space-y-4" onSubmit={handleSubmit(onSubmit)}>
              <label className="block">
                <span className="mb-2 block text-sm text-slate-400">Full name</span>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3">
                  <FaUser className="text-slate-500" />
                  <input {...register('name')} className="w-full bg-transparent outline-none" placeholder="Alex Morgan" />
                </div>
              </label>
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
              <button className="w-full rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-400 px-4 py-3 font-medium text-white">Create account</button>
            </form>
            <p className="mt-6 text-center text-sm text-slate-400">Already have an account? <Link to="/login" className="text-cyan-400">Log in</Link></p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
