'use client';
import React, { useState } from 'react';
import Link from 'next/link';

const SecureLink = ({ href, title, children }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <span 
      className={styles.secureLink}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <Link href={href} passHref>
        <span>{children}</span>
      </Link>
      {showTooltip && <span className={styles.tooltip}>{title}</span>}
    </span>
  );
};

export default SecureLink;