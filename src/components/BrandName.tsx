interface BrandNameProps {
  className?: string;
}

export function BrandName({className = ''}: BrandNameProps) {
  return (
    <span className={`font-display font-extrabold whitespace-nowrap shrink-0 ${className}`}>
      <span className="text-gold">كراش</span>{' '}
      <span className="text-foreground">هاك</span>
    </span>
  );
}
