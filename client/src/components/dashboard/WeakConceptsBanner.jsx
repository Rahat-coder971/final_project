import React from 'react';
import { FaUserTie, FaRobot, FaBook, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

const WeakConceptsBanner = ({ weaknesses = [], onLearnClick }) => {
    if (weaknesses.length === 0) {
        return (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 text-center">
                <FaCheckCircle className="text-green-500 text-4xl mb-2 mx-auto" />
                <h4 className="font-bold text-green-700 text-lg">Great Job!</h4>
                <p className="text-sm text-green-600">No weak concepts detected yet. Keep up the good work!</p>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-6 border border-orange-200">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-gray-800 flex items-center gap-2">
                    <FaExclamationTriangle className="text-orange-500" />
                    Your Weak Concepts - Focus Here!
                </h3>
                <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                    {weaknesses.length} To Fix
                </span>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {weaknesses.slice(0, 6).map((item, idx) => (
                    <ConceptCard key={idx} weakness={item} onLearnClick={onLearnClick} />
                ))}
            </div>
        </div>
    );
};

const ConceptCard = ({ weakness, onLearnClick }) => {
    const isMentor = weakness.source?.includes('Mentor');
    const statusColor = weakness.status === 'Critical' || weakness.status === 'Needs Work' ? 'bg-red-100 text-red-700' :
        weakness.status === 'Recovering' ? 'bg-yellow-100 text-yellow-700' :
            'bg-green-100 text-green-700';

    const progress = weakness.score || 0;

    return (
        <div className="bg-white p-4 rounded-xl border-2 border-gray-200 hover:border-indigo-300 transition-all shadow-sm">
            {/* Topic Name */}
            <h4 className="font-bold text-gray-900 text-base mb-2 truncate" title={weakness.topic}>
                {weakness.topic}
            </h4>

            {/* Source Badge */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className={`text-xs px-2 py-1 rounded flex items-center gap-1 font-bold
                    ${isMentor ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                    {isMentor ? <FaUserTie size={10} /> : <FaRobot size={10} />}
                    {weakness.source}
                </span>
                <span className={`text-xs px-2 py-1 rounded font-bold ${statusColor}`}>
                    {weakness.status}
                </span>
            </div>

            {/* Progress Bar */}
            {progress > 0 && (
                <div className="mb-3">
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className={`h-full ${progress > 70 ? 'bg-green-500' : progress > 50 ? 'bg-yellow-500' : 'bg-red-500'} transition-all`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Recovery: {progress}%</p>
                </div>
            )}

            {/* Learn Button */}
            <button
                onClick={() => onLearnClick && onLearnClick(weakness)}
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg font-bold text-sm 
                           hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
                <FaBook /> Learn This
            </button>
        </div>
    );
};

export default WeakConceptsBanner;
