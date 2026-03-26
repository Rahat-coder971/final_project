import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { FaChartLine } from 'react-icons/fa';

const DailyScoreChart = ({ activityData }) => {
    // activityData is array of { date: "YYYY-MM-DD", count: N, level: N, score: N }
    // We need to ensure 'score' exists. 
    // If the backend returns 'avg' or similar, we map it.

    // Let's filter only days with activity and sort by date
    const chartData = activityData
        .filter(day => day.count > 0)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .map(day => ({
            date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            score: Math.round(day.score || 0), // Ensure score is there
            fullDate: day.date
        }))
        .slice(-14); // Last 14 active days for clarity

    if (chartData.length < 2) {
        return (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-full flex flex-col justify-center items-center text-center">
                <FaChartLine className="text-gray-300 text-4xl mb-2" />
                <p className="text-gray-400">Not enough data for trend analysis.<br />Complete more daily quizzes!</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-full">
            <h3 className="font-bold text-gray-800 mb-6 flex items-center justify-between">
                <span className="flex items-center gap-2"><FaChartLine className="text-indigo-500" /> Daily Score Trend</span>
                <span className="text-xs text-gray-400 font-normal">Last 14 Active Days</span>
            </h3>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis
                            dataKey="date"
                            tick={{ fill: '#9ca3af', fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                            interval="preserveStartEnd"
                        />
                        <YAxis
                            domain={[0, 100]}
                            hide // Hide Y axis for cleaner look, tooltip is enough
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1f2937', color: '#fff', borderRadius: '12px', border: 'none', padding: '8px 12px' }}
                            itemStyle={{ color: '#fff' }} // Fix tooltip text color
                            labelStyle={{ color: '#9ca3af', marginBottom: '4px' }}
                            cursor={{ stroke: '#e5e7eb', strokeWidth: 2 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="score"
                            stroke="#4f46e5"
                            strokeWidth={4}
                            dot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: '#4f46e5' }}
                            activeDot={{ r: 7, strokeWidth: 0, fill: '#4f46e5' }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default DailyScoreChart;
