import React from 'react';
import './Input.css';

const Input = ({
    label,
    error,
    id,
    className = '',
    ...props
}) => {
    return (
        <div className={`input-group ${className}`}>
            {label && <label htmlFor={id} className="input-label">{label}</label>}
            <input
                id={id}
                className={`input-field ${error ? 'input-error' : ''}`}
                {...props}
            />
            {error && <span className="input-error-message">{error}</span>}
        </div>
    );
};

export default Input;
