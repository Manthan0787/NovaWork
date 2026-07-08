import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { FaEnvelope } from 'react-icons/fa';

export default function ForgotPasswordPage() {
  const { register, handleSubmit } = useForm();

  const onSubmit = (data) => {
    console.log('Reset request', data);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.25),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(34,211,238,0.2),_transparent_35%)] px-4 py-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-2xl rounded-[2rem] border border-white/10 bg-slate-900/70 p-8 shadow-2xl backdrop-blur-xl">
        <h2 className="text-3xl font-semibold">Reset your password</h2>
        <p className="mt-3 text-sm text-slate-400">Enter your email and we will send a secure reset link.</p>
        <form className="mt-8 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <label className="block">
            <span className="mb-2 block text-sm text-slate-400">Email</span>
            <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3">
              <FaEnvelope className="text-slate-500" />
              <input {...register('email')} type="email" className="w-full bg-transparent outline-none" placeholder="you@example.com" />
            </div>
          </label>
          <button className="w-full rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-400 px-4 py-3 font-medium text-white">Send reset link</button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-400"><Link to="/login" className="text-cyan-400">Back to login</Link></p>
      </motion.div>
    </div>
  );
}
