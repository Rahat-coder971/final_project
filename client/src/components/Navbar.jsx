import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
    return (
        <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex-shrink-0 flex items-center">
                        <Link to="/" className="text-2xl font-bold text-primary tracking-tighter">
                            Elevate<span className="text-slate-900">Hub</span>
                        </Link>
                    </div>
                    <div className="hidden md:flex space-x-8 items-center">
                        <Link to="/mentors" className="text-gray-600 hover:text-primary transition-colors">Find Mentors</Link>
                        <Link to="/features" className="text-gray-600 hover:text-primary transition-colors">Features</Link>
                        <Link to="/about" className="text-gray-600 hover:text-primary transition-colors">About</Link>
                    </div>
                    <div className="flex items-center space-x-4">
                        <Link to="/login" className="text-gray-600 hover:text-primary font-medium transition-colors">
                            Login
                        </Link>
                        <Link to="/signup" className="bg-primary text-white px-5 py-2 rounded-full font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30">
                            Get Started
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
