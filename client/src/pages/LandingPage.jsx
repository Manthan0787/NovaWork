import { motion } from 'framer-motion';
import { FaArrowRight, FaRocket, FaShieldAlt, FaChartLine, FaUsers, FaCheckCircle } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const stats = [
  { label: 'Active teams', value: '12k+' },
  { label: 'Projects shipped', value: '98%' },
  { label: 'Time saved', value: '40%' }
];

const features = [
  { icon: FaRocket, title: 'Launch faster', text: 'Plan, assign, and ship work with a premium workspace experience.' },
  { icon: FaShieldAlt, title: 'Secure collaboration', text: 'Protect every decision with robust auth and role-aware workflows.' },
  { icon: FaChartLine, title: 'Actionable insights', text: 'Track productivity and delivery with beautiful dashboards.' }
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.25),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(34,211,238,0.2),_transparent_35%)]">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-8">
        <div className="text-2xl font-semibold">NovaWork</div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="rounded-full border border-slate-700 px-4 py-2 text-sm">Login</Link>
          <Link to="/register" className="rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 px-4 py-2 text-sm font-medium text-white">Start free</Link>
        </div>
      </header>

      <main className="mx-auto flex max-w-7xl flex-col gap-16 px-6 pb-24 lg:px-8">
        <section className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="mb-4 inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-sm text-cyan-300">Premium project management for modern teams</span>
            <h1 className="max-w-2xl text-5xl font-semibold leading-tight sm:text-6xl">Run every project with clarity, speed, and style.</h1>
            <p className="mt-6 max-w-xl text-lg text-slate-300">Plan work, track milestones, coordinate your team, and ship faster with a beautifully crafted workspace built for ambitious companies.</p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/register" className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 px-6 py-3 font-medium text-white shadow-lg shadow-cyan-500/20">Get started <FaArrowRight /></Link>
              <Link to="/dashboard" className="rounded-full border border-slate-700 px-6 py-3 font-medium text-slate-200">View demo</Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-6 text-sm text-slate-400">
              {stats.map((item) => (
                <div key={item.label}><span className="text-xl font-semibold text-slate-100">{item.value}</span> <div>{item.label}</div></div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }} className="relative">
            <div className="absolute inset-0 -z-10 rounded-[2rem] bg-gradient-to-br from-indigo-500/20 via-cyan-400/10 to-transparent blur-3xl" />
            <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6 shadow-2xl backdrop-blur-xl">
              <div className="rounded-[1.5rem] border border-slate-800 bg-slate-950/70 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Q3 Product Launch</p>
                    <h2 className="text-xl font-semibold">97% on track</h2>
                  </div>
                  <div className="rounded-full bg-emerald-500/20 px-3 py-1 text-sm text-emerald-300">Healthy</div>
                </div>
                <div className="mt-6 space-y-4">
                  {['Design system', 'Mobile rollout', 'Customer research'].map((item) => (
                    <div key={item} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3">
                      <div className="flex items-center gap-3"><FaCheckCircle className="text-cyan-400" /> <span>{item}</span></div>
                      <span className="text-sm text-slate-400">Done</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.article key={feature.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }} className="rounded-[1.5rem] border border-white/10 bg-slate-900/60 p-6 backdrop-blur-xl">
                <div className="mb-4 inline-flex rounded-2xl bg-gradient-to-br from-indigo-500/20 to-cyan-400/20 p-3 text-cyan-300"><Icon size={20} /></div>
                <h3 className="text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-slate-400">{feature.text}</p>
              </motion.article>
            );
          })}
        </section>
      </main>
    </div>
  );
}
