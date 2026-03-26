import React from 'react';

const StreakGrid = ({ activityData = [] }) => {
    // Generate last 365 days array
    const generateDates = () => {
        const dates = [];
        const today = new Date();
        for (let i = 364; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            dates.push(date.toISOString().split('T')[0]);
        }
        return dates;
    };

    const allDates = generateDates();

    // Create activity map for quick lookup
    const activityMap = {};
    activityData.forEach(item => {
        activityMap[item.date] = item;
    });

    // Get color class based on average score
    const getColorClass = (activity) => {
        if (!activity || activity.count === 0) return 'bg-gray-100';
        if (activity.avgScore >= 90) return 'bg-purple-500';
        if (activity.avgScore >= 75) return 'bg-blue-500';
        if (activity.avgScore >= 50) return 'bg-green-500';
        return 'bg-yellow-500';
    };

    // Get tooltip text
    const getTooltipText = (date, activity) => {
        if (!activity) return `${date}: No activity`;
        return `${date}: ${activity.avgScore}% (${activity.count} quiz${activity.count > 1 ? 'zes' : ''})`;
    };

    // Group dates by weeks (7 days each)
    const weeks = [];
    for (let i = 0; i < allDates.length; i += 7) {
        weeks.push(allDates.slice(i, i + 7));
    }

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-800">Your Learning Journey</h3>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-gray-100 rounded"></div>
                        <span>None</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-green-500 rounded"></div>
                        <span>50-74%</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-blue-500 rounded"></div>
                        <span>75-89%</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-purple-500 rounded"></div>
                        <span>90%+</span>
                    </div>
                </div>
            </div>

            {/* Grid */}
            <div className="overflow-x-auto">
                <div className="inline-grid gap-1" style={{ gridTemplateColumns: `repeat(${weeks.length}, 12px)`, gridAutoFlow: 'column' }}>
                    {weeks.map((week, weekIdx) => (
                        <div key={weekIdx} className="grid gap-1" style={{ gridTemplateRows: 'repeat(7, 12px)' }}>
                            {week.map((date) => {
                                const activity = activityMap[date];
                                return (
                                    <div
                                        key={date}
                                        className={`w-3 h-3 rounded-sm ${getColorClass(activity)} hover:ring-2 hover:ring-indigo-400 transition-all cursor-pointer`}
                                        title={getTooltipText(date, activity)}
                                    ></div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>

            <p className="text-xs text-gray-400 mt-4">
                {activityData.length} active days in the last year
            </p>
        </div>
    );
};

export default StreakGrid;
