import './index.css';

interface LoadingProps{
    theme?: 'light' | 'dark';
    className?: string;
}

export default function Loading({ theme, className }: LoadingProps) {
    return (<div className={`loader ${theme} ${className}`}></div>)
}