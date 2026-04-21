import LoginForm from '@/components/forms/LoginForm';

export default function LoginPage() {
  const pageStyle: React.CSSProperties = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%)',
  };

  const overlayStyle: React.CSSProperties = {
    content: '""',
    position: 'absolute',
    background: 'rgba(0, 0, 0, 0.03)',
    width: '100%',
    height: '100%',
  };

  const containerStyle: React.CSSProperties = {
    background: '#ffffff',
    boxShadow: '2px 3.464px 14.72px 1.28px rgba(16, 16, 16, 0.15)',
    padding: '60px 40px',
    width: '420px',
    maxWidth: '100%',
    position: 'relative',
    zIndex: 1,
    borderRadius: '8px',
  };

  return (
    <div style={pageStyle}>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.4)',
        }}
      />
      <div style={containerStyle}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1
            style={{
              fontFamily: '"Sarabun", sans-serif',
              fontSize: '28px',
              fontWeight: 700,
              color: '#28aaa9',
              margin: 0,
            }}
          >
            AMYAL CAR
          </h1>
          <p
            style={{
              fontFamily: '"Sarabun", sans-serif',
              fontSize: '14px',
              color: '#9ca8b3',
              marginTop: '8px',
            }}
          >
            Car Dealership & Rental Management
          </p>
        </div>
        <div style={{ marginBottom: '24px' }}>
          <h2
            style={{
              fontFamily: '"Sarabun", sans-serif',
              fontSize: '20px',
              fontWeight: 600,
              color: '#2b2d5d',
              marginBottom: '24px',
            }}
          >
            Sign in to your account
          </h2>
          <LoginForm />
        </div>
        <p
          style={{
            textAlign: 'center',
            fontSize: '12px',
            color: '#9ca8b3',
            marginTop: '16px',
          }}
        >
          Default: admin@amyalcar.com / Admin@123
        </p>
      </div>
    </div>
  );
}