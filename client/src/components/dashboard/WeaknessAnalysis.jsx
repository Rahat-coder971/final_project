import React from 'react';
import { FaExclamationCircle, FaCheckCircle, FaRobot, FaUserTie, FaPlayCircle } from 'react-icons/fa';

const WeaknessAnalysis = ({ weaknesses }) => {
    if (!weaknesses || weaknesses.length === 0) return null;

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full">
            <div className="flex justify-between items-center mb-6">
                <h4 className="font-bold text-gray-700 flex items-center gap-2">
                    <FaExclamationCircle className="text-orange-500" />
                    Needs Attention
                </h4>
                <span className="text-xs bg-orange-50 text-orange-600 px-2 py-1 rounded-full font-bold">
                    {weaknesses.length} Critical Topics
                </span>
            </div>

            <div className="space-y-4">
                {weaknesses.map((item, idx) => (
                    <div key={idx} className="p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-indigo-100 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h5 className="font-bold text-gray-800 text-sm">{item.topic}</h5>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded border flex items-center gap-1
                                        ${item.source.includes('Mentor') ? 'bg-purple-50 text-purple-600 border-purple-200' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>
                                        {item.source.includes('Mentor') ? <FaUserTie size={8} /> : <FaRobot size={8} />}
                                        {item.source}
                                    </span>
                                </div>
                            </div>

                            {/* Recovery Status Pill */}
                            <div className={`px-2 py-1 rounded text-xs font-bold flex items-center gap-1
                                ${item.status === 'Recovering' ? 'bg-green-100 text-green-700' :
                                    item.status === 'Resolved' ? 'bg-indigo-100 text-indigo-700' : 'bg-red-50 text-red-600'}`}>
                                {item.status === 'Recovering' || item.status === 'Resolved' ? <FaCheckCircle size={10} /> : <FaExclamationCircle size={10} />}
                                {item.status}
                            </div>
                        </div>

                        {/* Action Bar */}
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                            <span className="text-xs text-gray-400">
                                {item.missedCount > 0 ? `${item.missedCount} mistakes recently` : 'Flagged in last interview'}
                            </span>
                            <button className="text-xs font-bold text-indigo-600 flex items-center gap-1 hover:text-indigo-800 transition-colors">
                                <FaPlayCircle /> Fix It
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-4 text-center">
                <p className="text-xs text-gray-400">
                    Complete your "Daily Mastery Challenge" to turn these green!
                </p>
            </div>
        </div>
    );
};

export default WeaknessAnalysis;
