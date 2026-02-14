import React, { useState, InputHTMLAttributes, ReactNode } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import './Input.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: ReactNode;
}

const Input: React.FC<InputProps> = ({
    label,
    error,
    id,
    icon,
    type = 'text',
    className = '',
    ...props
}) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

    return (
        <div className={`input-group ${className}`}>
            {label && <label htmlFor={id} className="input-label">{label}</label>}
            <div className="input-field-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                {icon && <div className="input-icon" style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)', display: 'flex' }}>{icon}</div>}
                <input
                    id={id}
                    type={inputType}
                    className={`input-field ${error ? 'input-error' : ''}`}
                    style={{
                        paddingLeft: icon ? '40px' : '16px',
                        paddingRight: isPassword ? '40px' : '16px',
                        width: '100%'
                    }}
                    {...props}
                />
                {isPassword && (
                    <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                            position: 'absolute',
                            right: '12px',
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            display: 'flex',
                            padding: '4px'
                        }}
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                )}
            </div>
            {error && <span className="input-error-message" style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{error}</span>}
        </div>
    );
};

export default Input;
