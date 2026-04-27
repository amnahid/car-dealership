import LoginForm from '@/components/forms/LoginForm';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useTranslations } from 'next-intl';

export default function LoginPage() {
  const t = useTranslations('Auth.login');
  const commonT = useTranslations('Common');

  const pageStyle: React.CSSProperties = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%)',
    position: 'relative',
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
      <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 10 }}>
        <LanguageSwitcher />
      </div>
      <div style={containerStyle}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1
            style={{
              fontSize: '28px',
              fontWeight: 700,
              color: '#28aaa9',
              margin: 0,
            }}
          >
            {commonT('appName')}
          </h1>
          <p
            style={{
              fontSize: '14px',
              color: '#9ca8b3',
              marginTop: '8px',
            }}
          >
            {t('subtitle')}
          </p>
        </div>
        <div style={{ marginBottom: '24px' }}>
          <h2
            style={{
              fontSize: '20px',
              fontWeight: 600,
              color: '#2b2d5d',
              marginBottom: '24px',
            }}
          >
            {t('title')}
          </h2>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
// hmr test login
