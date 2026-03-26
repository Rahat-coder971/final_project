import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const Hero = () => {
    return (
        <div className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                <div className="lg:grid lg:grid-cols-12 lg:gap-8">

                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                        className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left"
                    >
                        <div className="inline-flex items-center px-4 py-2 rounded-full border border-blue-100 bg-blue-50 text-primary text-sm font-semibold mb-6">
                            <span className="flex h-2 w-2 rounded-full bg-primary mr-2"></span>
                            The #1 AI Mentorship Platform
                        </div>
                        <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl lg:text-5xl xl:text-6xl">
                            <span className="block xl:inline">Master your craft with</span>{' '}
                            <span className="block text-primary">Expert Mentors & AI</span>
                        </h1>
                        <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                            Elevate Hub combines world-class human mentorship with AI-powered roadmaps to accelerate your learning journey.
                        </p>
                        <div className="mt-8 sm:max-w-lg sm:mx-auto sm:text-center lg:text-left lg:mx-0">
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Link
                                    to="/signup"
                                    className="inline-flex justify-center items-center px-8 py-3 border border-transparent text-base font-medium rounded-full text-white bg-primary hover:bg-blue-700 md:text-lg md:px-10 shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-1"
                                >
                                    Find a Mentor
                                </Link>
                                <Link
                                    to="/roadmap"
                                    className="inline-flex justify-center items-center px-8 py-3 border border-gray-200 text-base font-medium rounded-full text-gray-700 bg-white hover:bg-gray-50 md:text-lg md:px-10 hover:border-gray-300 transition-all hover:-translate-y-1"
                                >
                                    Try AI Roadmap
                                </Link>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center"
                    >
                        <div className="relative mx-auto w-full rounded-lg lg:max-w-md">
                            <div className="relative block w-full bg-white rounded-2xl shadow-xl overflow-hidden transform md:rotate-3 hover:rotate-0 transition-transform duration-500 border border-gray-100">
                                {/* Placeholder for Illustration */}
                                <div className="h-64 sm:h-80 md:h-96 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-8">
                                    <span className="text-6xl sm:text-8xl md:text-9xl">🚀</span>
                                </div>
                                <div className="p-6 bg-white hidden sm:block">
                                    <div className="flex items-center space-x-4 mb-4">
                                        <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse"></div>
                                        <div className="space-y-2">
                                            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                                            <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
                                        </div>
                                    </div>
                                    <div className="h-4 w-full bg-gray-100 rounded mb-2 animate-pulse"></div>
                                    <div className="h-4 w-2/3 bg-gray-100 rounded animate-pulse"></div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                </div>
            </div>
        </div>
    );
};

export default Hero;
