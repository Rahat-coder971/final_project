import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const ReadinessGauge = ({ score }) => {
    // Score is 0-100
    // Gauge needs 180 degrees
    const data = [
        { name: 'Score', value: score },
        { name: 'Remaining', value: 100 - score }
    ];

    const cx = "50%";
    const cy = "70%";
    const iR = 60;
    const oR = 80;

    let color = '#ef4444'; // Red
    if (score > 40) color = '#f59e0b'; // Orange
    if (score > 70) color = '#10b981'; // Green
    if (score > 90) color = '#3b82f6'; // Blue

    return (
        <div className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
            <h3 className="text-gray-500 font-bold uppercase tracking-wider text-xs absolute top-4 left-4">Ready for Interview?</h3>

            <div className="h-40 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            dataKey="value"
                            startAngle={180}
                            endAngle={0}
                            data={data}
                            cx={cx}
                            cy={cy}
                            innerRadius={iR}
                            outerRadius={oR}
                            stroke="none"
                        >
                            <Cell fill={color} />
                            <Cell fill="#e5e7eb" />
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>

                <div className="absolute top-[65%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                    <div className="text-4xl font-black text-gray-800">{score}%</div>
                    <div className="text-xs font-bold text-gray-400 uppercase">{score > 75 ? 'Ready' : 'In Progress'}</div>
                </div>
            </div>

            <p className="text-center text-xs text-gray-500 mt-[-20px] max-w-[200px]">
                {score > 75
                    ? "You are showing strong consistency. Schedule your mock interview!"
                    : "Keep practicing to demonstrate mastery."}
            </p>
        </div>
    );
};

export default ReadinessGauge;
