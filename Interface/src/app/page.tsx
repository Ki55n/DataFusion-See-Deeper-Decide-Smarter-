"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { UserAuth } from "./context/AuthContext";
import { LoadingScreen } from "@/components/ui/loading";
import { motion } from "framer-motion";
import Image from "next/image";

export default function Home() {
  const router = useRouter();
  const { user }: any = UserAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      router.push("/dashboard/projects");
    }
    setLoading(false);
  }, [user, router]);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <nav className="fixed w-full bg-slate-900/80 backdrop-blur-sm z-50 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center space-x-2"
            >
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 text-transparent bg-clip-text">
                Data Tukey
              </div>
            </motion.div>
            <div className="flex space-x-4">
              <button 
                onClick={() => user ? router.push("/dashboard/projects") : router.push("/login")} 
                className="px-6 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-all"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="pt-32 pb-20 px-4">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center"
            >
              <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 text-transparent bg-clip-text">
                See Deeper.<br />Decide Smarter.
              </h1>
              <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
                Transform your data into actionable insights with our AI-powered analytics platform.
                Uncover hidden patterns and make data-driven decisions with confidence.
              </p>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <button
                  onClick={() => user ? router.push("/dashboard/projects") : router.push("/login")}
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full text-white font-semibold text-lg hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300"
                >
                  Start Your Journey
                </button>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4 bg-slate-800/50">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
            >
              {[
                {
                  title: "AI-Powered Analysis",
                  description: "Advanced machine learning algorithms that evolve with your data",
                  icon: "🤖"
                },
                {
                  title: "Real-time Insights",
                  description: "Instant analytics and visualization of your data streams",
                  icon: "⚡"
                },
                {
                  title: "Smart Predictions",
                  description: "Accurate forecasting and trend analysis for better decision making",
                  icon: "🎯"
                }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  className="p-6 rounded-2xl bg-slate-800 border border-slate-700 hover:border-blue-500/50 transition-all"
                >
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-slate-400">{feature.description}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto text-center"
          >
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Transform Your Data Analysis?
            </h2>
            <p className="text-xl text-slate-300 mb-8">
              Join thousands of data scientists and analysts who are already using Data Tukey
              to unlock the full potential of their data.
            </p>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <button
                onClick={() => user ? router.push("/dashboard/projects") : router.push("/login")}
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full text-white font-semibold text-lg hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300"
              >
                Get Started for Free
              </button>
            </motion.div>
          </motion.div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-400">
          <p>© 2024 Data Tukey. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
