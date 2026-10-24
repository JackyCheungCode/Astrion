import { useEffect, useMemo, useState } from 'react';
import {
  Menu, Search, Notification, Help, UserAvatar, ChevronDown, ChevronRight,
  Close, Add, ArrowRight, Grid, Launch, Document
} from '@carbon/icons-react';
import { Button, TextInput } from '@carbon/react';
import './workspace.scss';
import { astrionNavigation } from './navigation/astrion-navigation.js';


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
      <Button kind="ghost" hasIconOnly renderIcon={Search} iconDescription="全局搜索" onClick={() => setSearchOpen(true)} />
      <Button kind="ghost" hasIconOnly renderIcon={Notification} iconDescription="通知" onClick={() => setNotice('通知中心暂未接入。')} />
      <Button kind="ghost" hasIconOnly renderIcon={Help} iconDescription="帮助" onClick={() => setNotice('帮助中心暂未接入。')} />
      <span className="astrion-topbar-divider" />
      <Button kind="ghost" hasIconOnly renderIcon={UserAvatar} iconDescription="用户菜单" onClick={() => setNotice('用户菜单与账号权限将在认证模块接入后启用。')} />
    </header>

    {sidebarOpen && <div className="astrion-sidebar-desktop">{menuTree}</div>}
    {mobileOpen && <div className="astrion-mobile-scrim" onClick={() => setMobileOpen(false)}>
      <aside className="astrion-mobile-drawer" onClick={(event) => event.stopPropagation()}>
        <div className="astrion-drawer-heading"><span>Astrion</span><Button kind="ghost" hasIconOnly renderIcon={Close} iconDescription="关闭菜单" onClick={() => setMobileOpen(false)} /></div>
        {menuTree}
      </aside>
    </div>}

    <main className={`astrion-main ${sidebarOpen ? '' : 'is-wide'}`}>
      <div className="astrion-breadcrumb"><span>工作空间</span><span>/</span><strong>{current.label}</strong></div>
      <div className="astrion-page-heading">
        <div><h1>{current.label}</h1><p>统一管理 Astrion 的获客、客户关系与销售流程。</p></div>
        <Button renderIcon={Add} onClick={() => setNotice('创建操作将在对应业务模块接入后启用。')}>新建</Button>
      </div>
      {notice && <div className="astrion-notice" role="status"><span>{notice}</span><button onClick={() => setNotice('')} aria-label="关闭提示"><Close size={16} /></button></div>}
      <section className="astrion-stat-grid" aria-label="工作概览">
        <article className="astrion-stat-card"><span>新增线索</span><strong>128</strong><small>演示数据</small></article>
        <article className="astrion-stat-card"><span>进行中商机</span><strong>36</strong><small>演示数据</small></article>
        <article className="astrion-stat-card"><span>待处理任务</span><strong>14</strong><small>演示数据</small></article>
        <article className="astrion-stat-card"><span>本月订单</span><strong>52</strong><small>演示数据</small></article>
      </section>
      <section className="astrion-content-card">
        <div className="astrion-card-title"><div><h2>快捷入口</h2><p>选择一个模块继续工作</p></div><Grid size={20} /></div>
        <div className="astrion-shortcuts">
          {[
            { label: '线索发现', description: '探索并整理潜在客户', path: '/acquisition/discovery', Icon: MagicWand },
            { label: '客户管理', description: '维护联系人与公司资料', path: '/crm/leads', Icon: UserMultiple },
            { label: '商机看板', description: '跟踪销售阶段与进度', path: '/sales/board', Icon: Bullseye },
            { label: '分析报表', description: '查看漏斗与业务表现', path: '/analytics', Icon: ChartLine },
          ].map(({ label, description, path: shortcutPath, Icon }) => <button className="astrion-shortcut" key={shortcutPath} onClick={() => navigate(shortcutPath)}>
            <Icon size={24} /><span><strong>{label}</strong><small>{description}</small></span><ArrowRight size={18} />
          </button>)}
        </div>
      </section>
      <section className="astrion-content-card astrion-flow-card">
        <div className="astrion-card-title"><div><h2>业务流程</h2><p>从线索到订单的主要流程</p></div><Launch size={20} /></div>
        <div className="astrion-flow"><span>AI 获客</span><ArrowRight size={16}/><span>线索</span><ArrowRight size={16}/><span>客户</span><ArrowRight size={16}/><span>商机</span><ArrowRight size={16}/><span>报价</span><ArrowRight size={16}/><span>订单</span></div>
      </section>
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
