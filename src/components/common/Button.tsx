import React, { ButtonHTMLAttributes } from 'react';
import './Button.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    className = '',
    loading = false,
    disabled,
    ...props
}) => {
    return (
        <button
            className={`btn btn-${variant} btn-${size} ${loading ? 'loading' : ''} ${className}`}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? <span className="spinner"></span> : children}
        </button>
    );
};

export default Button;
