import { useState } from 'react';
import { ArrowRight } from '@carbon/icons-react';
import { Button, InlineNotification, TextInput } from '@carbon/react';
import { supabase } from './services/crmRepository.js';
import './auth-gate.scss';

export default function AuthGate() {
  const [email,setEmail] = useState('');
  const [password,setPassword] = useState('');
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState('');
  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (!email.trim() || !password) { setError('请输入邮箱和密码。'); return; }
    setBusy(true);
    const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (authError) setError(authError.message || '登录失败，请检查账号信息。');
  };
  return <main className="astrion-auth-page">
    <section className="astrion-auth-card">
      <div className="astrion-auth-brand"><span>A</span><div><strong>Astrion</strong><small>BUSINESS PLATFORM</small></div></div>
      <div className="astrion-auth-rule"/>
      <p className="astrion-auth-eyebrow">SECURE WORKSPACE ACCESS</p>
      <h1>登录工作空间</h1>
      <p className="astrion-auth-description">使用已获授权的企业账号访问 CRM 数据和业务模块。</p>
      {error&&<InlineNotification kind="error" lowContrast title="无法登录" subtitle={error}/>}
      <form className="astrion-auth-form" onSubmit={submit}>
        <TextInput id="astrion-auth-email" labelText="企业邮箱" type="email" autoComplete="username" value={email} onChange={(e)=>setEmail(e.target.value)} required/>
        <TextInput id="astrion-auth-password" labelText="密码" type="password" autoComplete="current-password" value={password} onChange={(e)=>setPassword(e.target.value)} required/>
        <Button type="submit" disabled={busy} renderIcon={busy ? undefined : ArrowRight} className="astrion-auth-submit">{busy?'正在验证…':'登录 Astrion'}</Button>
      </form>
      <p className="astrion-auth-footnote">账号由工作空间管理员创建或邀请。当前未开放公开注册，组织成员资格需由管理员配置。</p>
    </section>
    <footer className="astrion-auth-footer">© Astrion · Enterprise CRM · Secure by design</footer>
  </main>;
}
