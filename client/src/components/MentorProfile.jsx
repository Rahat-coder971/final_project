import React, { useState, useEffect } from 'react';
import { FaUserEdit, FaSave, FaPlus, FaTimes, FaCamera } from 'react-icons/fa';
import { toast } from 'react-toastify';
import * as api from '../api';

const MentorProfile = () => {
    const [profile, setProfile] = useState({
        bio: '',
        skills: [],
        jobTitle: '',
        company: '',
        hourlyRate: 0
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [newSkill, setNewSkill] = useState('');

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const { data } = await api.fetchMentorProfile();
            setProfile({
                bio: data.bio || '',
                skills: data.skills || [],
                jobTitle: data.jobTitle || '',
                company: data.company || '',
                hourlyRate: data.hourlyRate || 0
            });
        } catch (error) {
            console.error("Failed to fetch profile", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.updateMentorProfile(profile);
            toast.success('Profile updated successfully!');
        } catch (error) {
            console.error("Failed to update profile", error);
            toast.error('Failed to update profile.');
        } finally {
            setSaving(false);
        }
    };

    const addSkill = (e) => {
        e.preventDefault();
        if (newSkill && !profile.skills.includes(newSkill)) {
            setProfile({ ...profile, skills: [...profile.skills, newSkill] });
            setNewSkill('');
        }
    };

    const removeSkill = (skillToRemove) => {
        setProfile({ ...profile, skills: profile.skills.filter(s => s !== skillToRemove) });
    };

    if (loading) return <div className="p-10 text-center">Loading profile...</div>;

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Header / Cover */}
                <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600 relative">
                    <div className="absolute -bottom-12 left-8">
                        <div className="relative">
                            <div className="w-24 h-24 bg-white rounded-full p-1 shadow-md">
                                <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center text-2xl overflow-hidden">
                                    {/* Placeholder for avatar */}
                                    👤
                                </div>
                            </div>
                            <button className="absolute bottom-0 right-0 bg-white p-1.5 rounded-full shadow-sm border border-gray-200 text-gray-600 hover:text-primary">
                                <FaCamera className="text-sm" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="pt-16 pb-8 px-8">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Mentor Profile</h2>
                            <p className="text-gray-500">Manage your public profile information</p>
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-6 py-2 bg-primary text-white font-bold rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : <><FaSave /> Save Changes</>}
                        </button>
                    </div>

                    <form className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Job Title</label>
                                <input
                                    type="text"
                                    value={profile.jobTitle}
                                    onChange={(e) => setProfile({ ...profile, jobTitle: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                                    placeholder="e.g. Senior Software Engineer"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Company</label>
                                <input
                                    type="text"
                                    value={profile.company}
                                    onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                                    placeholder="e.g. Google"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Bio</label>
                            <textarea
                                value={profile.bio}
                                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                                rows="4"
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                                placeholder="Tell prospective students about your experience and mentorship style..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Skills & Expertise</label>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {profile.skills.map(skill => (
                                    <span key={skill} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium flex items-center gap-2">
                                        {skill}
                                        <button
                                            type="button"
                                            onClick={() => removeSkill(skill)}
                                            className="text-blue-400 hover:text-blue-600"
                                        >
                                            <FaTimes />
                                        </button>
                                    </span>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newSkill}
                                    onChange={(e) => setNewSkill(e.target.value)}
                                    className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                                    placeholder="Add a skill (e.g. React)"
                                    onKeyDown={(e) => e.key === 'Enter' && addSkill(e)}
                                />
                                <button
                                    onClick={addSkill}
                                    className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-200 font-bold"
                                    type="button"
                                >
                                    <FaPlus />
                                </button>
                            </div>
                        </div>

                        <div className="border-t border-gray-100 pt-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Settings</h3>
                            <div className="w-full md:w-1/2">
                                <label className="block text-sm font-bold text-gray-700 mb-1">Hourly Rate ($)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-gray-500">$</span>
                                    <input
                                        type="number"
                                        value={profile.hourlyRate}
                                        onChange={(e) => setProfile({ ...profile, hourlyRate: e.target.value })}
                                        className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default MentorProfile;
