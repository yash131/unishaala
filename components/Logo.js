'use client';

import Image from 'next/image';
import Link from 'next/link';

const LOGO_URL = 'https://customer-assets.emergentagent.com/job_unishaala-web/artifacts/2nf9p203_Unishaala-logo.jpg';

export function Logo({ size = 'default', showText = true, className = '' }) {
  const sizes = {
    small: { img: 32, text: 'text-lg' },
    default: { img: 40, text: 'text-xl' },
    large: { img: 48, text: 'text-2xl' },
    xlarge: { img: 64, text: 'text-3xl' }
  };

  const { img, text } = sizes[size] || sizes.default;

  return (
    <Link href="/" className={`flex items-center gap-2 ${className}`}>
      <img 
        src={LOGO_URL}
        alt="Unishaala Logo" 
        width={img}
        height={img}
        className="object-contain"
        style={{ height: img, width: 'auto' }}
      />
      {showText && (
        <span className={`${text} font-bold text-brand-600`}>Unishaala</span>
      )}
    </Link>
  );
}

export function LogoIcon({ size = 40 }) {
  return (
    <img 
      src={LOGO_URL}
      alt="Unishaala" 
      width={size}
      height={size}
      className="object-contain"
      style={{ height: size, width: 'auto' }}
    />
  );
}

export default Logo;
