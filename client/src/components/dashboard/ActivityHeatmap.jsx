import React from 'react';


const ActivityHeatmap = ({ activityData, totalDays }) => {
    // Generate a full year grid (52 weeks x 7 days)
    // activityData is array of { date: "YYYY-MM-DD", count: N, level: 0-4 }

    // Helper to get color based on level
    const getColor = (level) => {
        switch (level) {
            case 1: return 'bg-green-200';
            case 2: return 'bg-green-400';
            case 3: return 'bg-green-600';
            case 4: return 'bg-green-800';
            default: return 'bg-gray-100';
        }
    };

    // We need to render 365 squares. 
    // Ideally we map them to months/weeks. 
    // For simplicity, let's just render the blocks in a flex-wrap 
    // or a grid that represents weeks columns.

    // Let's create an array of 365 days ending today
    const generateYearDays = () => {
        const days = [];
        const today = new Date();
        for (let i = 364; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];

            // Find activity for this day
            const activeDay = activityData?.find(a => a.date === dateStr);
            days.push({
                date: dateStr,
                level: activeDay ? activeDay.level : 0,
                count: activeDay ? activeDay.count : 0
            });
        }
        return days;
    };

    const calendarGrid = generateYearDays();

    return (
        <div className="bg-white/50 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-gray-700 mb-4 flex justify-between items-center">
                <span>Consistency Streak</span>
                <span className="text-xs text-gray-400 font-normal">{totalDays} active days this year</span>
            </h3>

            <div className="flex flex-wrap gap-1 justify-center">
                {calendarGrid.map((day, idx) => (
                    <div
                        key={idx}
                        className={`w-3 h-3 rounded-sm ${getColor(day.level)} cursor-pointer transition-colors duration-200 hover:ring-2 hover:ring-offset-1 hover:ring-green-300`}
                        title={`${day.date}: ${day.count} activities`}
                    ></div>
                ))}
            </div>

            <div className="flex items-center gap-2 mt-4 text-xs text-gray-400 justify-end">
                <span>Less</span>
                <div className="w-3 h-3 bg-gray-100 rounded-sm"></div>
                <div className="w-3 h-3 bg-green-200 rounded-sm"></div>
                <div className="w-3 h-3 bg-green-400 rounded-sm"></div>
                <div className="w-3 h-3 bg-green-600 rounded-sm"></div>
                <div className="w-3 h-3 bg-green-800 rounded-sm"></div>
                <span>More</span>
            </div>
        </div>
    );
};

export default ActivityHeatmap;
