import { useState } from 'react';
import {
  ArrowRight,
  LogoApple,
  LogoGoogle,
  LogoMicrosoft,
} from '@carbon/icons-react';
import {
  Button,
  Checkbox,
  InlineNotification,
  Link,
  TextInput,
} from '@carbon/react';

const providers = [
  { id: 'google', label: '使用 Google 登录', Icon: LogoGoogle },
  { id: 'apple', label: '使用 Apple 登录', Icon: LogoApple },
  { id: 'microsoft', label: '使用 Microsoft 登录', Icon: LogoMicrosoft },
];

function CloudSunMark() {
  return (
    <svg className="astrion-cloud-mark" viewBox="0 0 88 76" fill="none" aria-hidden="true">
      <g stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M28 22 23 14M42 16V6M56 20l6-8M17 31l-9-4M65 31l9-4" />
        <path d="M27 43c1-12 10-21 22-21 10 0 18 6 21 15 8 1 13 7 13 15 0 9-7 16-17 16H20C10 68 4 62 4 53c0-8 6-14 14-15 3-1 6 1 9 5Z" />
      </g>
    </svg>
  );
}

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [remember, setRemember] = useState(false);
  const [notice, setNotice] = useState(null);

  const showPrototypeNotice = (message) => setNotice({
    kind: 'info',
    title: '演示页面',
    subtitle: message,
  });

  const handleContinue = (event) => {
    event.preventDefault();
    showPrototypeNotice('登录功能尚未接入。未发送或保存任何账号信息。');
  };

  return (
    <main className="login-layout">
      <section className="login-panel" aria-labelledby="login-title">
        <div className="login-content">
          <div className="cloud-mark-wrap"><CloudSunMark /></div>

          <header className="login-heading">
            <h1 id="login-title">登录 <strong>Astrion</strong></h1>
            <p>还没有账号？ <Link href="#create-account" onClick={(event) => {
              event.preventDefault();
              showPrototypeNotice('账号注册入口暂未接入。');
            }}>创建账号</Link></p>
          </header>

          <form className="login-form" onSubmit={handleContinue}>
            <TextInput
              id="astrion-identifier"
              labelText="邮箱或用户名"
              hideLabel
              placeholder="邮箱或用户名"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
            />

            <Button className="continue-button" type="submit" renderIcon={ArrowRight}>
              继续
            </Button>

            <div className="remember-row">
              <Checkbox
                id="remember-identifier"
                labelText="记住账号"
                checked={remember}
                onChange={(checked) => setRemember(checked)}
              />
            </div>
          </form>

          <div className="login-divider" aria-label="其他登录方式">
            <span />
            <p>或</p>
            <span />
          </div>

          <div className="provider-list" aria-label="第三方登录选项">
            {providers.map(({ id, label, Icon }) => (
              <Button
                key={id}
                className="provider-button"
                kind="tertiary"
                size="lg"
                type="button"
                renderIcon={Icon}
                onClick={() => showPrototypeNotice(`${label.replace('使用 ', '').replace(' 登录', '')}登录暂未接入；此按钮不会跳转或启动认证。`)}
              >
                {label}
              </Button>
            ))}
          </div>

          {notice && (
            <InlineNotification
              lowContrast
              kind={notice.kind}
              title={notice.title}
              subtitle={notice.subtitle}
              onCloseButtonClick={() => setNotice(null)}
              className="login-notice"
            />
          )}
        </div>

        <footer className="login-footer">
          <span>© 2026 Astrion</span>
          <Link href="#privacy" onClick={(event) => {
            event.preventDefault();
            showPrototypeNotice('隐私政策页面暂未接入。');
          }}>隐私</Link>
          <Link href="#help" onClick={(event) => {
            event.preventDefault();
            showPrototypeNotice('帮助中心暂未接入。');
          }}>帮助</Link>
        </footer>
      </section>

      <aside className="gray-panel" aria-hidden="true" />
    </main>
  );
}
