interface CytechLogoProps {
  size?: number;
}

export function CytechLogo({ size = 30 }: CytechLogoProps) {
  return (
    <img
      src="/cytech_logo.png"
      alt="CY Tech Logo"
      width={size}
      height={size}
    />
  );
} 