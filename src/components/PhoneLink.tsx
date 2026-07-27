"use client";

import React from "react";

interface PhoneLinkProps {
  href: string;
  className?: string;
  onClick?: () => void;
  children: React.ReactNode;
}

const PhoneLink = React.memo(function PhoneLink({ href, className, onClick, children }: PhoneLinkProps) {
  return (
    <a href={href} className={className} onClick={onClick}>
      {children}
    </a>
  );
}, () => true);

export default PhoneLink;
