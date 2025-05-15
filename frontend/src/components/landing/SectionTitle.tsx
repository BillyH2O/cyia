'use client';

import React from "react";

interface SectionTitleProps {
  title: string;
  description: string;
}

export function SectionTitle({ title, description }: SectionTitleProps) {
  return (
    <div className="text-center">
      <h2 className="text-balance text-4xl font-semibold md:text-5xl lg:text-6xl text-gray-900 dark:text-gray-100">
        {title}
      </h2>
      <p className="mx-auto my-8 max-w-2xl text-xl text-gray-600 dark:text-gray-400">
        {description}
      </p>
    </div>
  );
} 