"use client";

import { motion } from 'framer-motion';
import { Trophy, TrendingUp, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function CompetitorAnalysisPage() {
  return (
    <main className="min-h-screen bg-transparent px-6 py-8 text-[#F9FAFB] sm:px-8 lg:px-12" dir="ltr">
      <div className="mx-auto max-w-6xl">
        <motion.header initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-semibold">Competitor Analysis</h1>
          <p className="mt-2 text-[#A1A1AA]">Compare your website performance against competitors</p>
        </motion.header>

        {/* Input Section */}
        <Card className="bg-[#111827]/90 mb-8">
          <CardHeader>
            <CardTitle>Start Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 lg:grid-cols-4">
              <div>
                <label className="block text-sm font-medium mb-2">Your website</label>
                <input
                  type="url"
                  placeholder="https://yoursite.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-[#09090B] text-[#F9FAFB]"
                />
              </div>
              {[1, 2, 3].map((i) => (
                <div key={i}>
                  <label className="block text-sm font-medium mb-2">Competitor {i}</label>
                  <input
                    type="url"
                    placeholder="https://competitor.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-[#09090B] text-[#F9FAFB]"
                  />
                </div>
              ))}
            </div>
            <Button className="mt-4 w-full">Run Comparison</Button>
          </CardContent>
        </Card>

        {/* Ranking */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="mb-8">
          <Card className="bg-[#111827]/90">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-[#F59E0B]" />
                Performance Ranking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { rank: 1, site: 'Your Site', score: 92, highlight: true },
                  { rank: 2, site: 'Competitor A', score: 88, highlight: false },
                  { rank: 3, site: 'Competitor B', score: 81, highlight: false },
                ].map((item) => (
                  <div
                    key={item.rank}
                    className={`flex items-center justify-between rounded-xl border p-4 ${
                      item.highlight
                        ? 'border-[#EC4899]/30 bg-[#EC4899]/10'
                        : 'border-white/10 bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-2xl font-bold text-[#A1A1AA]">{item.rank}.</span>
                      <div>
                        <p className="font-medium">{item.site}</p>
                        <p className="text-sm text-[#A1A1AA]">Performance Score</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-[#F9FAFB]">{item.score}</p>
                      <p className="text-sm text-[#A1A1AA]">/100</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Comparison Table */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mb-8">
          <Card className="bg-[#111827]/90">
            <CardHeader>
              <CardTitle>Detailed Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="px-4 py-3 text-left text-sm font-medium text-[#A1A1AA]">Metric</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-[#A1A1AA]">Your Site</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-[#A1A1AA]">Competitor A</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-[#A1A1AA]">Competitor B</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: 'Performance', you: 92, a: 88, b: 81 },
                      { name: 'SEO', you: 78, a: 85, b: 72 },
                      { name: 'Accessibility', you: 95, a: 88, b: 91 },
                      { name: 'Security', you: 88, a: 92, b: 79 },
                    ].map((row) => (
                      <tr key={row.name} className="border-b border-white/10">
                        <td className="px-4 py-3 font-medium">{row.name}</td>
                        <td className="px-4 py-3">
                          <span className="text-[#22C55E] font-semibold">{row.you}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={row.a > row.you ? 'text-[#F59E0B]' : 'text-[#22C55E]'}>
                            {row.a}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={row.b > row.you ? 'text-[#F59E0B]' : 'text-[#22C55E]'}>
                            {row.b}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Insights */}
        <div className="grid gap-6 lg:grid-cols-2">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <Card className="bg-[#111827]/90">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-[#22C55E]" />
                  Your Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-[#A1A1AA]">
                  <li>• Better accessibility compliance than all competitors</li>
                  <li>• Superior performance metrics</li>
                  <li>• Cleaner code structure</li>
                </ul>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
            <Card className="bg-[#111827]/90">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-[#F59E0B]" />
                  Opportunities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-[#A1A1AA]">
                  <li>• Competitor A has better SEO optimization</li>
                  <li>• Security headers could be improved</li>
                  <li>• Mobile experience needs enhancement</li>
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
