import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { FaLayerGroup } from 'react-icons/fa';

const TopicStrengthChart = ({ skillsData }) => {
    // skillsData: [{ subject: 'React', A: 80, fullMark: 100 }, ...]

    // Sort by weakness first (lowest score at top) or strength?
    // Let's sort by score descending (Strongest first)
    const sortedData = [...skillsData].sort((a, b) => b.A - a.A);

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-full">
            <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                <FaLayerGroup className="text-indigo-500" /> Topic Mastery
            </h3>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={sortedData} margin={{ left: 0, right: 30 }}>
                        <XAxis type="number" domain={[0, 100]} hide />
                        <YAxis
                            dataKey="subject"
                            type="category"
                            width={100}
                            tick={{ fill: '#4b5563', fontSize: 12, fontWeight: 500 }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip
                            cursor={{ fill: '#f3f4f6' }}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                        />
                        <Bar dataKey="A" barSize={12} radius={[0, 4, 4, 0]}>
                            {sortedData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.A > 75 ? '#10b981' : entry.A > 50 ? '#f59e0b' : '#ef4444'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default TopicStrengthChart;
