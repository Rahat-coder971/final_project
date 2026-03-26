import React from 'react';
import { FaReact, FaPython, FaJava, FaNodeJs, FaDocker, FaAws } from 'react-icons/fa';

const TrustBar = () => {
    const techs = [
        { name: 'React', icon: <FaReact className="text-4xl text-gray-400 hover:text-[#61DAFB] transition-colors" /> },
        { name: 'Python', icon: <FaPython className="text-4xl text-gray-400 hover:text-[#3776AB] transition-colors" /> },
        { name: 'Java', icon: <FaJava className="text-4xl text-gray-400 hover:text-[#007396] transition-colors" /> },
        { name: 'Node.js', icon: <FaNodeJs className="text-4xl text-gray-400 hover:text-[#339933] transition-colors" /> },
        { name: 'Docker', icon: <FaDocker className="text-4xl text-gray-400 hover:text-[#2496ED] transition-colors" /> },
        { name: 'AWS', icon: <FaAws className="text-4xl text-gray-400 hover:text-[#FF9900] transition-colors" /> },
    ];

    return (
        <div className="bg-white py-12 border-y border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <p className="text-center text-sm font-semibold uppercase text-gray-500 tracking-wide mb-8">
                    Master the most in-demand technologies
                </p>
                <div className="grid grid-cols-3 gap-4 md:gap-8 md:grid-cols-6 lg:grid-cols-6 items-center justify-items-center opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
                    {techs.map((tech, index) => (
                        <div key={index} className="flex flex-col items-center gap-2 group cursor-pointer hover:-translate-y-1 transition-transform">
                            {tech.icon}
                            <span className="text-xs font-medium text-gray-400 group-hover:text-gray-600 transition-colors">{tech.name}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TrustBar;
