"use client";

import { motion } from 'framer-motion';
import { ChevronRight, AlertTriangle, TrendingUp, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const tabs = ['Overview', 'Performance', 'SEO', 'Accessibility', 'Security'];

export default function ScanDetailsPage() {
  const [activeTab, setActiveTab] = useState('Overview');

  return (
    <main className="min-h-screen bg-transparent px-6 py-8 text-[#F9FAFB] sm:px-8 lg:px-12" dir="ltr">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <motion.header initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold">example.com</h1>
              <p className="mt-2 text-[#A1A1AA]">Last scanned 2 hours ago</p>
            </div>
            <Button>Run New Scan</Button>
          </div>
        </motion.header>

        {/* Tabs */}
        <div className="mb-8 flex gap-2 border-b border-white/10 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 font-medium whitespace-nowrap transition ${
                activeTab === tab
                  ? 'border-b-2 border-[#EC4899] text-[#F9FAFB]'
                  : 'text-[#A1A1AA] hover:text-[#F9FAFB]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'Overview' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Score Cards Grid */}
            <div className="grid gap-4 lg:grid-cols-5">
              {[
                { label: 'Overall', score: 88, icon: TrendingUp },
                { label: 'Performance', score: 92, icon: Zap },
                { label: 'SEO', score: 78, icon: TrendingUp },
                { label: 'Accessibility', score: 95, icon: Zap },
                { label: 'Security', score: 88, icon: Zap },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Card key={item.label} className="bg-[#111827]/90">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-[#A1A1AA]">{item.label}</p>
                          <p className="text-2xl font-semibold mt-2">{item.score}</p>
                        </div>
                        <Icon className="h-8 w-8 text-[#EC4899] opacity-50" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* AI Summary */}
            <Card className="bg-gradient-to-br from-[#EC4899]/10 to-[#8B5CF6]/10 border-[#EC4899]/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  AI Insight
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[#A1A1AA]">
                  Your website is performing well overall. The main opportunities are in image optimization and SEO metadata. Implementing WebP format for images could improve performance by approximately 8-10 points.
                </p>
              </CardContent>
            </Card>

            {/* Priority Roadmap */}
            <Card className="bg-[#111827]/90">
              <CardHeader>
                <CardTitle>Recommended Fix Order</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { rank: 1, issue: 'Compress hero images', impact: 'High', improvement: '+12' },
                    { rank: 2, issue: 'Add meta descriptions', impact: 'Medium', improvement: '+6' },
                    { rank: 3, issue: 'Remove unused CSS', impact: 'Medium', improvement: '+4' },
                  ].map((item) => (
                    <div
                      key={item.rank}
                      className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-lg font-semibold text-[#A1A1AA]">{item.rank}</span>
                        <div>
                          <p className="font-medium">{item.issue}</p>
                          <p className="text-sm text-[#A1A1AA]">Impact: {item.impact}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[#22C55E] font-semibold">{item.improvement} points</span>
                        <ChevronRight className="h-4 w-4 text-[#A1A1AA]" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Issues */}
            <Card className="bg-[#111827]/90">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-[#F59E0B]" />
                  Detected Issues
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    {
                      title: 'Large images detected',
                      severity: 'High',
                      desc: 'Hero image is 4.5MB unoptimized',
                    },
                    {
                      title: 'Missing meta descriptions',
                      severity: 'Medium',
                      desc: '15 pages missing meta descriptions',
                    },
                    {
                      title: 'Unused CSS detected',
                      severity: 'Low',
                      desc: '~120KB of unused CSS in main bundle',
                    },
                  ].map((issue) => (
                    <div
                      key={issue.title}
                      className="rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-medium flex items-center gap-2">
                            {issue.title}
                            <Badge
                              className={`text-xs ${
                                issue.severity === 'High'
                                  ? 'bg-[#EF4444]/20 text-[#EF4444]'
                                  : issue.severity === 'Medium'
                                    ? 'bg-[#F59E0B]/20 text-[#F59E0B]'
                                    : 'bg-[#06B6D4]/20 text-[#06B6D4]'
                              }`}
                            >
                              {issue.severity}
                            </Badge>
                          </p>
                          <p className="text-sm text-[#A1A1AA] mt-2">{issue.desc}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Performance Tab */}
        {activeTab === 'Performance' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card className="bg-[#111827]/90">
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 lg:grid-cols-3">
                  {[
                    { label: 'LCP', value: '2.1s', status: 'Good' },
                    { label: 'CLS', value: '0.05', status: 'Good' },
                    { label: 'INP', value: '150ms', status: 'Needs Improvement' },
                    { label: 'FCP', value: '1.2s', status: 'Good' },
                    { label: 'TTFB', value: '150ms', status: 'Good' },
                    { label: 'TTI', value: '3.4s', status: 'Good' },
                  ].map((metric) => (
                    <div key={metric.label} className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <p className="text-sm text-[#A1A1AA] mb-2">{metric.label}</p>
                      <p className="text-2xl font-semibold mb-2">{metric.value}</p>
                      <Badge
                        className={`text-xs ${
                          metric.status === 'Good'
                            ? 'bg-[#22C55E]/20 text-[#22C55E]'
                            : 'bg-[#F59E0B]/20 text-[#F59E0B]'
                        }`}
                      >
                        {metric.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Other tabs content would go here */}
        {(activeTab === 'SEO' || activeTab === 'Accessibility' || activeTab === 'Security') && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card className="bg-[#111827]/90">
              <CardHeader>
                <CardTitle>{activeTab} Details</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[#A1A1AA]">Content for {activeTab} tab will be displayed here</p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </main>
  );
}
