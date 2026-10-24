import { useEffect, useMemo, useState } from 'react';
import {
  Menu, Search, Notification, Help, UserAvatar, ChevronDown, ChevronRight,
  Close, Add, ArrowRight, Grid, Launch, Document
} from '@carbon/icons-react';
import { Button, TextInput, Dropdown, InlineNotification } from '@carbon/react';
import './workspace.scss';
import AcquisitionPage from './AcquisitionPage.jsx';
import BusinessModulePage from './BusinessModulePage.jsx';
import { astrionNavigation } from './navigation/astrion-navigation.js';
import AuthGate from './AuthGate.jsx';
import { supabase, supabaseConfigured, listWorkspaceMemberships, getSelectedWorkspaceId, setSelectedWorkspaceId } from './services/crmRepository.js';


const iconByPath = new Map();
astrionNavigation.forEach((item) => {
  iconByPath.set(item.path, item.Icon);
  (item.children || []).forEach((child) => iconByPath.set(child.path, item.Icon));
});

function readInitialPath() {
  return window.location.pathname === '/' ? '/dashboard' : window.location.pathname;
}

export default function Workspace() {
  const [path, setPath] = useState(readInitialPath);
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    try { return localStorage.getItem('astrion-sidebar-hidden') !== 'true'; }
    catch { return true; }
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('');
  const [authSession, setAuthSession] = useState(undefined);
  const [workspaceMemberships, setWorkspaceMemberships] = useState([]);
  const [selectedWorkspaceId, setSelectedWorkspaceIdState] = useState('');
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [workspaceError, setWorkspaceError] = useState('');

  useEffect(() => {
    if (!supabaseConfigured || !supabase) { setAuthSession(null); return undefined; }
    let active = true;
    supabase.auth.getSession().then(({data}) => { if (active) setAuthSession(data.session); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setAuthSession(session));
    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!supabaseConfigured || !supabase || !authSession) {
      setWorkspaceMemberships([]);
      setSelectedWorkspaceIdState('');
      setWorkspaceError('');
      return undefined;
    }
    let active = true;
    setWorkspaceLoading(true);
    listWorkspaceMemberships().then((memberships) => {
      if (!active) return;
      setWorkspaceMemberships(memberships);
      const savedId = getSelectedWorkspaceId();
      const selected = memberships.find((item) => item.id === savedId) || memberships[0];
      if (selected) {
        if (selected.id !== savedId) setSelectedWorkspaceId(selected.id);
        setSelectedWorkspaceIdState(selected.id);
      } else {
        setSelectedWorkspaceIdState('');
      }
      setWorkspaceError('');
    }).catch((error) => {
      if (active) setWorkspaceError(error?.message || '无法加载工作空间列表。');
    }).finally(() => {
      if (active) setWorkspaceLoading(false);
    });
    return () => { active = false; };
  }, [authSession?.user?.id]);

  const handleWorkspaceChange = ({ selectedItem }) => {
    if (!selectedItem || selectedItem.id === selectedWorkspaceId) return;
    try {
      setSelectedWorkspaceId(selectedItem.id);
      setSelectedWorkspaceIdState(selectedItem.id);
      setWorkspaceError('');
      setNotice('已切换工作空间。当前页面正在刷新数据。');
    } catch (error) {
      setWorkspaceError(error?.message || '无法切换工作空间。');
    }
  };

  useEffect(() => {
    const onPopState = () => setPath(readInitialPath());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    try { localStorage.setItem('astrion-sidebar-hidden', String(!sidebarOpen)); } catch { /* storage may be disabled */ }
  }, [sidebarOpen]);

  useEffect(() => {
    if (!mobileOpen) return undefined;
    const onKeyDown = (event) => { if (event.key === 'Escape') setMobileOpen(false); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileOpen]);

  const allItems = useMemo(() => astrionNavigation.flatMap((item) => [
    { label: item.label, path: item.path, parent: null },
    ...(item.children || []).map((child) => ({ ...child, parent: item.label })),
  ]), []);
  const filteredItems = allItems.filter((item) =>
    (item.label + ' ' + item.path + ' ' + (item.parent || '')).toLowerCase().includes(query.toLowerCase()),
  );
  const current = allItems.find((item) => item.path === path) ||
    allItems.find((item) => path.startsWith(item.path + '/')) ||
    { label: '工作总览', path: '/dashboard' };
  const activeParent = current.parent || current.label;
  const [expanded, setExpanded] = useState(() => new Set([activeParent, 'AI 获客', '客户管理', '销售管道']));

  useEffect(() => {
    setExpanded((prev) => new Set([...prev, activeParent]));
  }, [activeParent]);

  const navigate = (nextPath) => {
    window.history.pushState({}, '', nextPath);
    setPath(nextPath);
    setSearchOpen(false);
    setMobileOpen(false);
    setQuery('');
    setNotice('');
  };

  const toggleSidebar = () => setSidebarOpen((value) => !value);
  if (supabaseConfigured && authSession === undefined) return <main className="astrion-auth-page"><section className="astrion-auth-card"><div className="astrion-auth-brand"><span>A</span><div><strong>Astrion</strong><small>BUSINESS PLATFORM</small></div></div><p className="astrion-auth-description">正在检查安全登录状态…</p></section></main>;
  if (supabaseConfigured && !authSession) return <AuthGate />;
  const menuTree = (
    <nav className="astrion-nav" aria-label="主导航">
      {astrionNavigation.map(({ label, path: itemPath, Icon, children = [] }) => {
        const active = current.label === label || current.parent === label;
        const isExpanded = expanded.has(label);
        return <div className="astrion-nav-group" key={itemPath}>
          <button className={`astrion-nav-item ${active ? 'is-active' : ''}`} onClick={() => {
            if (children.length) setExpanded((prev) => {
              const next = new Set(prev);
              if (next.has(label)) next.delete(label); else next.add(label);
              return next;
            });
            else navigate(itemPath);
          }} aria-expanded={children.length ? isExpanded : undefined}>
            <Icon size={20} className="astrion-nav-icon" />
            <span>{label}</span>
            {children.length > 0 && (isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />)}
          </button>
          {children.length > 0 && isExpanded && <div className="astrion-subnav">
            {children.map((child) => <button key={child.path}
              className={`astrion-subnav-item ${path === child.path ? 'is-current' : ''}`}
              onClick={() => navigate(child.path)}>{child.label}</button>)}
          </div>}
        </div>;
      })}
    </nav>
  );

  return <div className="astrion-shell">
    <header className="astrion-topbar">
      <Button kind="ghost" hasIconOnly renderIcon={Menu} iconDescription="显示或隐藏侧边栏"
        className="astrion-menu-toggle" onClick={() => {
          if (window.matchMedia('(max-width: 767px)').matches) setMobileOpen((v) => !v);
          else toggleSidebar();
        }} />
      <button className="astrion-wordmark" onClick={() => navigate('/dashboard')} aria-label="Astrion 首页">Astrion</button>
      <div className="astrion-topbar-spacer" />
      {supabaseConfigured && authSession && workspaceMemberships.length > 0 && <div className="astrion-workspace-switcher">
        <Dropdown
          id="astrion-workspace-selector"
          titleText="工作空间"
          label="选择工作空间"
          size="sm"
          items={workspaceMemberships.map((item) => ({ ...item, label: item.name || item.slug || item.id, roleLabel: item.role || '成员' }))}
          itemToString={(item) => item?.label || ''}
          selectedItem={workspaceMemberships.map((item) => ({ ...item, label: item.name || item.slug || item.id })).find((item) => item.id === selectedWorkspaceId) || null}
          onChange={handleWorkspaceChange}
          disabled={workspaceLoading || workspaceMemberships.length < 2}
        />
      </div>}
      <Button kind="ghost" hasIconOnly renderIcon={Search} iconDescription="全局搜索" onClick={() => setSearchOpen(true)} />
      <Button kind="ghost" hasIconOnly renderIcon={Notification} iconDescription="通知" onClick={() => setNotice('通知中心暂未接入。')} />
      <Button kind="ghost" hasIconOnly renderIcon={Help} iconDescription="帮助" onClick={() => setNotice('帮助中心暂未接入。')} />
      <span className="astrion-topbar-divider" />
      <Button kind="ghost" hasIconOnly renderIcon={UserAvatar} iconDescription="用户菜单" onClick={async () => { if (supabaseConfigured && supabase) { await supabase.auth.signOut(); setNotice('已退出登录。'); } else setNotice('当前处于演示模式；配置 Supabase 后可启用账号登录。'); }} />
    </header>

    {sidebarOpen && <div className="astrion-sidebar-desktop">{menuTree}</div>}
    {mobileOpen && <div className="astrion-mobile-scrim" onClick={() => setMobileOpen(false)}>
      <aside className="astrion-mobile-drawer" onClick={(event) => event.stopPropagation()}>
        <div className="astrion-drawer-heading"><span>Astrion</span><Button kind="ghost" hasIconOnly renderIcon={Close} iconDescription="关闭菜单" onClick={() => setMobileOpen(false)} /></div>
        {menuTree}
      </aside>
    </div>}

    <main className={`astrion-main ${sidebarOpen ? '' : 'is-wide'}`}>
      {workspaceError && <InlineNotification kind="error" lowContrast title="工作空间加载失败" subtitle={workspaceError} onCloseButtonClick={() => setWorkspaceError('')} />}
      {['/acquisition','/acquisition/tasks','/acquisition/targets','/acquisition/discovery'].includes(path) ? <AcquisitionPage key={`${selectedWorkspaceId}:${path}`} path={path} navigate={navigate} setNotice={setNotice} notice={notice} /> : <BusinessModulePage key={`${selectedWorkspaceId}:${path}`} path={path} navigate={navigate} setNotice={setNotice} notice={notice} />}
    </main>

    {searchOpen && <div className="astrion-search-scrim" onMouseDown={(event) => { if (event.target === event.currentTarget) setSearchOpen(false); }}>
      <section className="astrion-search-dialog" role="dialog" aria-modal="true" aria-label="全局搜索">
        <div className="astrion-search-input"><Search size={20}/><TextInput id="astrion-global-search" labelText="全局搜索" hideLabel placeholder="搜索菜单、功能或路径…" value={query} onChange={(event) => setQuery(event.target.value)} autoFocus /><Button kind="ghost" hasIconOnly renderIcon={Close} iconDescription="关闭搜索" onClick={() => setSearchOpen(false)} /></div>
        <div className="astrion-search-results">{filteredItems.length ? filteredItems.map((item) => {
          const Icon = iconByPath.get(item.path) || Document;
          return <button key={item.path} className="astrion-search-result" onClick={() => navigate(item.path)}><Icon size={20}/><span><strong>{item.label}</strong><small>{item.parent ? item.parent + ' · ' : ''}{item.path}</small></span><ArrowRight size={16}/></button>;
        }) : <p className="astrion-empty-search">没有匹配的菜单或路径</p>}</div>
        <div className="astrion-search-footer"><span>全局搜索 · 菜单与路径</span><kbd>ESC</kbd></div>
      </section>
    </div>}
  </div>;
}
