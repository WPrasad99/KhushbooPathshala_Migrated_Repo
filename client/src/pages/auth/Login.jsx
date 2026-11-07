import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { authAPI, getApiErrorMessage } from '../../api';
import './Auth.css';

const Login = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Form inputs
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    const { setSession } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await authAPI.login(loginEmail, loginPassword);
            const token = response?.data?.token || response?.token;
            const user = response?.data?.user || response?.user;

            if (token && user) {
                setSession(token, user);
                navigate('/dashboard');
            } else {
                setError('Login failed: Authentication token was not returned.');
            }
        } catch (err) {
            setError(getApiErrorMessage(err, 'Invalid email or password. Please try again.'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fluid-auth-container">
            {/* Left Column: Minimal Aesthetic Form */}
            <div className="fluid-auth-left">
                <div className="fluid-form-wrapper">
                    <h1 className="fluid-auth-title">Welcome to Cybage Khushboo</h1>

                    {error && (
                        <div className="fluid-auth-error" role="alert">
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="fluid-login-form">
                        <div className="fluid-form-group">
                            <label htmlFor="login-email">Email</label>
                            <div className="fluid-input-wrapper">
                                <FiMail className="fluid-input-icon" />
                                <input
                                    id="login-email"
                                    type="email"
                                    placeholder="name@cybage.com"
                                    value={loginEmail}
                                    onChange={(e) => setLoginEmail(e.target.value)}
                                    required
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        <div className="fluid-form-group">
                            <label htmlFor="login-password">Password</label>
                            <div className="fluid-input-wrapper">
                                <FiLock className="fluid-input-icon" />
                                <input
                                    id="login-password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={loginPassword}
                                    onChange={(e) => setLoginPassword(e.target.value)}
                                    required
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    className="fluid-password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? <FiEyeOff /> : <FiEye />}
                                </button>
                            </div>
                        </div>

                        <button type="submit" className="fluid-submit-btn" disabled={loading}>
                            {loading ? 'Logging in...' : 'Login in'}
                        </button>

                        <div className="fluid-divider-line" />

                        <div className="fluid-help-section">
                            <div className="fluid-help-header">
                                <span className="fluid-help-badge">?</span>
                                <span className="fluid-help-title">Can you change your batch?</span>
                            </div>
                            <p className="fluid-help-desc">
                                Whenever you want, Cybage Khushboo will also guide you according to your needs.
                            </p>
                            <a href="mailto:khushboo@cybage.com" className="fluid-help-link">
                                Contact Us
                            </a>
                        </div>
                    </form>
                </div>
            </div>

            {/* Right Column: Full-View Contained Illustration in Curved Box */}
            <div className="fluid-auth-right">
                <img
                    src="/login-visual.png"
                    alt="Cybage Khushboo Platform Visual"
                    className="fluid-visual-image"
                />
            </div>
        </div>
    );
};

export default Login;
