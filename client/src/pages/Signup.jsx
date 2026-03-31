import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaGoogle, FaGithub } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider, githubProvider } from '../firebase';
import * as api from '../api';

const Signup = () => {
    const [role, setRole] = useState('student');
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSuccessfulAuth = (data) => {
        localStorage.setItem('profile', JSON.stringify(data));
        localStorage.setItem('token', data.token);

        toast.success(`Account ready! Welcome, ${data.name}!`);

        if (data.role === 'student') {
            navigate('/dashboard');
        } else {
            navigate('/mentor-dashboard');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const { data } = await api.register({ ...formData, role });
            handleSuccessfulAuth(data);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Signup failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const loginWithGoogle = async () => {
        setIsLoading(true);
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const { email, displayName } = result.user;
            const { data } = await api.firebaseSignIn({ email, name: displayName, role });
            handleSuccessfulAuth(data);
        } catch (err) {
            console.error(err);
            toast.error('Google Sign-Up failed');
        } finally {
            setIsLoading(false);
        }
    };

    const loginWithGithub = async () => {
        setIsLoading(true);
        try {
            const result = await signInWithPopup(auth, githubProvider);
            const { email, displayName, reloadUserInfo } = result.user;
            const name = displayName || reloadUserInfo.screenName;
            const { data } = await api.firebaseSignIn({ email, name, role });
            handleSuccessfulAuth(data);
        } catch (err) {
            console.error(err);
            toast.error('GitHub Sign-Up failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <Link to="/" className="flex justify-center text-3xl font-bold text-primary tracking-tighter mb-6">
                    Elevate<span className="text-slate-900">Hub</span>
                </Link>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Create your account
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Or{' '}
                    <Link to="/login" className="font-medium text-primary hover:text-blue-500">
                        sign in to your account
                    </Link>
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">

                    {/* Role Toggle */}
                    <div className="flex justify-center mb-6">
                        <div className="bg-gray-100 p-1 rounded-lg inline-flex">
                            <button
                                onClick={() => setRole('student')}
                                className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${role === 'student'
                                    ? 'bg-white text-primary shadow-sm'
                                    : 'text-gray-500 hover:text-gray-900'
                                    }`}
                            >
                                I am a Student
                            </button>
                            <button
                                onClick={() => setRole('mentor')}
                                className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${role === 'mentor'
                                    ? 'bg-white text-primary shadow-sm'
                                    : 'text-gray-500 hover:text-gray-900'
                                    }`}
                            >
                                I am a Mentor
                            </button>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <button
                                type="button"
                                onClick={() => loginWithGoogle()}
                                disabled={isLoading}
                                className="w-full flex justify-center items-center gap-3 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
                            >
                                <FaGoogle className="text-red-500 text-lg" />
                                Sign up with Google
                            </button>
                        </div>
                        <div>
                            <button
                                type="button"
                                onClick={loginWithGithub}
                                disabled={isLoading}
                                className="w-full flex justify-center items-center gap-3 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
                            >
                                <FaGithub className="text-gray-900 text-lg" />
                                Sign up with GitHub
                            </button>
                        </div>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">Or sign up with email</span>
                            </div>
                        </div>

                        <form className="space-y-6" onSubmit={handleSubmit}>
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                    Full Name
                                </label>
                                <div className="mt-1">
                                    <input
                                        id="name"
                                        name="name"
                                        type="text"
                                        required
                                        onChange={handleChange}
                                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                    Email address
                                </label>
                                <div className="mt-1">
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        required
                                        onChange={handleChange}
                                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                    Password
                                </label>
                                <div className="mt-1">
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        required
                                        onChange={handleChange}
                                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors disabled:opacity-50"
                                >
                                    {isLoading ? 'Processing...' : `Create ${role === 'student' ? 'Student' : 'Mentor'} Account`}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Signup;
