import React from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import TrustBar from '../components/TrustBar';

const LandingPage = () => {
    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />
            <Hero />
            <TrustBar />
            {/* Additional sections can be added here */}
        </div>
    );
};

export default LandingPage;
