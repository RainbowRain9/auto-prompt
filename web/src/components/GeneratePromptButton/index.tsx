import React from 'react';
import styled from 'styled-components';

const StyledWrapper = styled.div`
  .button {
    background-color: #ffffff00;
    color: #fff;
    width: 12.5em;
    height: 2.9em;
    border: #3654ff 0.2em solid;
    border-radius: 11px;
    text-align: right;
    transition: all 0.6s ease;
  }

  .button:hover {
    background-color: #3654ff;
    cursor: pointer;
  }

  .button.disabled {
    opacity: 0.5;
    cursor: not-allowed;
    border-color: #666;
    color: #999;
  }

  .button.disabled:hover {
    background-color: transparent;
    cursor: not-allowed;
  }

  .button.disabled svg {
    opacity: 0.5;
  }

  .button.disabled:hover svg {
    transform: none;
  }

  .button svg {
    width: 1.6em;
    margin: -0.2em 0.8em 1em;
    position: absolute;
    display: flex;
    transition: all 0.6s ease;
  }

  .button:hover svg {
    transform: translateX(5px);
  }

  .text {
    margin: 0 1.5em
  }`;


interface GeneratePromptButtonProps {
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}

const GeneratePromptButton = ({
  icon,
  children,
  onClick,
  disabled = false
}: GeneratePromptButtonProps) => {
  return (
    <StyledWrapper>
      <button
        onClick={onClick}
        disabled={disabled}
        className={`button ${disabled ? 'disabled' : ''}`}
      >
        {icon}
        <div className="text">
          {children}
        </div>
      </button>
    </StyledWrapper>
  );
}


export default GeneratePromptButton;
