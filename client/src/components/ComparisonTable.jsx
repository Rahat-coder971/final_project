import React from 'react';
import { FaArrowUp, FaArrowDown, FaMinus, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

const ComparisonTable = ({ current, last }) => {
    if (!last) {
        return (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
                <h3 className="text-lg font-bold text-gray-800 mb-2">Milestone Comparison</h3>
                <p className="text-gray-500">Complete your first milestone to see a comparison here!</p>
            </div>
        );
    }

    const currentTitle = current?.title || "Current Milestone";
    const lastTitle = last.title;

    // We can't compare scores yet if current isn't done, but we can show "In Progress"
    // If current IS done (which it might be if we viewing history, but usually this is for active student), 
    // we might not have a score. 
    // The requirement is "Last Milestone vs Current Milestone".
    // "Table Comparison: Compare Quiz Averages, Interview Scores, and Time Taken."

    // For now, since current is "Doing", we might only have Quiz Averages if implemented.
    // If we don't have real quiz data for current, we'll placeholder it or show "Pending".

    const metrics = [
        {
            label: 'Interview Score',
            last: `${last.score}%`,
            current: current.score > 0 ? `${current.score}%` : 'Pending',
            trend: 'neutral'
        },
        {
            label: 'Feedback Sentiment',
            last: last.score >= 75 ? 'Positive' : 'Needs Work',
            current: current.feedback ? (current.score >= 75 ? 'Positive' : 'Needs Work') : 'Pending',
            trend: 'neutral'
        },
        // Add more metrics as we track them (e.g. Quiz Avg, Days Taken)
    ];

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    Start vs. Now
                </h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="text-xs text-gray-500 uppercase border-b border-gray-100">
                            <th className="px-6 py-4 font-medium w-1/3">Metric</th>
                            <th className="px-6 py-4 font-medium w-1/3">{lastTitle} (Last)</th>
                            <th className="px-6 py-4 font-medium w-1/3">{currentTitle} (Now)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {metrics.map((m, i) => (
                            <tr key={i} className="hover:bg-gray-50/50">
                                <td className="px-6 py-4 font-medium text-gray-900">{m.label}</td>
                                <td className="px-6 py-4 text-gray-600">{m.last}</td>
                                <td className="px-6 py-4 text-gray-600 flex items-center gap-2">
                                    {m.current}
                                    {/* Trend Icon logic could go here if current had a value */}
                                </td>
                            </tr>
                        ))}
                        {/* Static Comparison Row for visual effect until we have real current data */}
                        <tr>
                            <td className="px-6 py-4 font-medium text-gray-900">Focus Area</td>
                            <td className="px-6 py-4 text-gray-600">Frontend Basics</td>
                            <td className="px-6 py-4 text-blue-600 font-bold">Backend Logic</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ComparisonTable;
