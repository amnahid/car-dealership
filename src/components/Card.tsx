interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export default function Card({ children, className = '', style = {} }: CardProps) {
  return (
    <div
      className={`card ${className}`}
      style={style}
    >
      <div className="card-body">
        {children}
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number | string;
  variant?: 'primary' | 'secondary' | 'warning' | 'danger' | 'success' | 'info';
  icon?: string;
  href?: string;
}

export function StatCard({ label, value, variant = 'primary', icon, href }: StatCardProps) {
  const cardContent = (
    <div className={`ic-card-head ${variant !== 'primary' ? variant : ''}`}>
      {icon && (
        <>
          <i className="ic-card-icon" style={{ fontStyle: 'normal' }}>{icon}</i>
        </>
      )}
      <h3 style={{ fontSize: '24px', fontWeight: 700, margin: '10px 0', color: '#2a3142' }}>{value}</h3>
      <p style={{ color: '#adb5bd', marginBottom: 0 }}>{label}</p>
    </div>
  );

  return href ? (
    <a href={href} style={{ textDecoration: 'none', display: 'block' }}>
      {cardContent}
    </a>
  ) : cardContent;
}