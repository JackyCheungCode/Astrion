import { useEffect, useMemo, useState } from 'react';
import { supabase, supabaseConfigured, getSelectedWorkspaceId } from './services/crmRepository.js';
import {
  Add, ArrowRight, Search, Renew, Filter, CheckmarkFilled, Time, WarningAlt,
  Building, UserMultiple, Globe, ChartLine, SettingsAdjust
} from '@carbon/icons-react';
import {
  Button, Select, SelectItem, Tile, Tag, ProgressBar, Tabs, TabList, Tab, TabPanels,
  TabPanel, TextInput, TextArea, InlineNotification, Checkbox
} from '@carbon/react';
import './acquisition-page.scss';

const initialTasks = [
  { id: 'ACQ-024', name: '欧洲中型 SaaS 企业', audience: 'B2B 企业客户', region: '欧洲', source: 'Serper + Tavily', status: '待启动', leads: '—', updated: '尚未运行' },
  { id: 'ACQ-023', name: '电商消费者需求探索', audience: 'B2C 消费者', region: '北美', source: 'Tavily', status: '草稿', leads: '—', updated: '尚未运行' },
  { id: 'ACQ-022', name: '制造业数字化决策者', audience: 'B2B 企业客户', region: '亚太地区', source: 'Serper + Tavily', status: '已完成配置', leads: '—', updated: '尚未运行' },
];

const selectOptions = {
  audience: [{ value: 'b2b', label: 'B2B 企业客户' }, { value: 'b2c', label: 'B2C 消费者' }, { value: 'both', label: 'B2B + B2C' }],
  region: [{ value: 'eu', label: '欧洲' }, { value: 'na', label: '北美' }, { value: 'apac', label: '亚太地区' }, { value: 'global', label: '全球' }, { value: 'uk', label: '英国' }],
  industry: [{ value: 'saas', label: '软件 / SaaS' }, { value: 'manufacturing', label: '制造业' }, { value: 'ecommerce', label: '电子商务' }, { value: 'finance', label: '金融服务' }, { value: 'health', label: '医疗健康' }, { value: 'professional', label: '专业服务' }, { value: 'other', label: '其他行业' }],
  companySize: [{ value: 'any', label: '不限规模' }, { value: '1-50', label: '1–50 人' }, { value: '51-200', label: '51–200 人' }, { value: '201-1000', label: '201–1,000 人' }, { value: '1000+', label: '1,000 人以上' }],
  intent: [{ value: 'high', label: '高购买意向' }, { value: 'growth', label: '正在增长 / 扩张' }, { value: 'hiring', label: '近期招聘相关岗位' }, { value: 'technology', label: '技术升级 / 数字化' }, { value: 'all', label: '综合信号' }],
  volume: [{ value: '5', label: '5 条线索' }, { value: '10', label: '10 条线索（单次上限）' }],
  source: [{ value: 'both', label: 'Serper + Tavily（推荐）' }, { value: 'serper', label: 'Serper — 搜索发现' }, { value: 'tavily', label: 'Tavily — 深度研究' }],
};

function CarbonSelect({ id, label, value, options, onChange, helperText }) {
  return <div className="acq-field">
    <Select id={id} labelText={label} value={value} onChange={(event) => onChange(event.target.value)} helperText={helperText}>
      {options.map((option) => <SelectItem key={option.value} value={option.value} text={option.label} />)}
    </Select>
  </div>;
}

export default function AcquisitionPage({ path, navigate, setNotice, notice }) {
  const [activeTab, setActiveTab] = useState(path.endsWith('/targets') ? 'targets' : path.endsWith('/discovery') ? 'discovery' : 'tasks');
  useEffect(()=>{setActiveTab(path.endsWith('/targets')?'targets':path.endsWith('/discovery')?'discovery':'tasks');},[path]);
  const [showBuilder, setShowBuilder] = useState(false);
  const [taskName, setTaskName] = useState('欧洲中型 SaaS 企业');
  const [companyOffering, setCompanyOffering] = useState('');
  const [valueProposition, setValueProposition] = useState('');
  const [idealCustomerNotes, setIdealCustomerNotes] = useState('');
  const [excludedTargets, setExcludedTargets] = useState('');
  const [audience, setAudience] = useState('b2b');
  const [region, setRegion] = useState('eu');
  const [industry, setIndustry] = useState('saas');
  const [companySize, setCompanySize] = useState('51-200');
  const [intent, setIntent] = useState('high');
  const [volume, setVolume] = useState('10');
  const [source, setSource] = useState('both');
  const [research, setResearch] = useState(true);
  const [score, setScore] = useState(true);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [filter, setFilter] = useState('all');
  const [tasks, setTasks] = useState(initialTasks);
  const [searchQuery,setSearchQuery] = useState('');
  const [searchResults,setSearchResults] = useState([]);
  const [providerStatuses,setProviderStatuses] = useState([]);
  const [worksResult,setWorksResult] = useState(null);
  const [persistCandidates,setPersistCandidates] = useState(false);
  const [searching,setSearching] = useState(false);
  const [searchError,setSearchError] = useState('');

  const filteredTasks = useMemo(() => tasks.filter((task) => filter === 'all' || task.status === filter), [tasks, filter]);

  const createTask = () => {
    if (!taskName.trim()) {
      setNotice('请为获客任务选择或填写一个名称。');
      return;
    }
    const regionLabel = selectOptions.region.find((x) => x.value === region)?.label || region;
    const audienceLabel = selectOptions.audience.find((x) => x.value === audience)?.label || audience;
    const sourceLabel = source === 'both' ? 'Serper + Tavily' : source === 'serper' ? 'Serper' : 'Tavily';
    setTasks((prev) => [{ id: `ACQ-${String(25 + prev.length).padStart(3, '0')}`, name: taskName, audience: audienceLabel, region: regionLabel, source: sourceLabel, status: '草稿', leads: '—', updated: '刚刚创建' }, ...prev]);
    setShowBuilder(false);
    setActiveTab('tasks');
    setNotice('获客任务已保存为前端草稿。数据源与后端任务队列尚未连接，暂未发起真实搜索。');
  };

  const handleDiscovery = async () => {
    if (!supabaseConfigured || !supabase) {
      setSearchError('当前仍是演示模式。请配置 Supabase 环境变量、部署 acquisition-research Edge Function，并在服务端配置搜索 API 密钥。');
      return;
    }
    const labelFor = (key, value) => selectOptions[key]?.find((option) => option.value === value)?.label || value;
    const regionLabel = labelFor('region', region);
    const industryLabel = labelFor('industry', industry);
    const audienceLabel = labelFor('audience', audience);
    const intentLabel = labelFor('intent', intent);
    const sizeLabel = labelFor('companySize', companySize);
    const profileContext = [
      companyOffering.trim() && `Our offering: ${companyOffering.trim()}`,
      valueProposition.trim() && `Value proposition: ${valueProposition.trim()}`,
      idealCustomerNotes.trim() && `Ideal customer context: ${idealCustomerNotes.trim()}`,
      excludedTargets.trim() && `Exclude: ${excludedTargets.trim()}`,
    ].filter(Boolean).join('; ');
    const generatedQuery = [
      audience === 'b2c'
        ? `${industryLabel} consumer trends in ${regionLabel} market; ${intentLabel}`
        : audience === 'both'
          ? `${industryLabel} companies and consumer demand in ${regionLabel}; ${intentLabel}`
          : `${industryLabel} companies in ${regionLabel}; company size ${sizeLabel}; ${intentLabel} business signal`,
      profileContext,
    ].filter(Boolean).join('; ');
    const query = searchQuery.trim() || generatedQuery;
    setSearching(true);
    setSearchError('');
    setSearchResults([]);
    setProviderStatuses([]);
    setWorksResult(null);
    try {
      const providers = source === 'both' ? (research ? ['serper','tavily'] : ['serper']) : [source];
      const { data,error } = await supabase.functions.invoke('acquisition-research',{
        body:{query,providers,maxResults:Math.min(10,Math.max(1,Number(volume)||10)),persistCandidates,scoreEvidence:score,verifiedOnly,workspaceId:getSelectedWorkspaceId()||null},
      });
      if(error) throw error;
      setSearchResults(Array.isArray(data?.results)?data.results:[]);
      setProviderStatuses(Array.isArray(data?.providers)?data.providers:[]);
      setWorksResult(data?.works||null);
      setNotice(`搜索完成：${data?.results?.length||0} 条网页结果；${data?.persistedCount||0} 条线索已保存至待审核队列。`);
    } catch(error) {
      let message=error?.message||'搜索请求失败，请检查 Edge Function 部署、登录状态和服务端密钥。';
      if(error?.context&&typeof error.context.clone==='function'){
        try{const payload=await error.context.clone().json();if(payload?.error)message=payload.error;}catch{/* keep the SDK error message */}
      }
      setSearchError(message);
    } finally {
      setSearching(false);
    }
  };

  const pageTitle = activeTab === 'targets' ? '目标客户画像' : activeTab === 'discovery' ? '线索发现' : '获客任务';
  return <div className="acq-page">
    {notice && <div className="acq-inline-notice" role="status"><span>{notice}</span><Button kind="ghost" size="sm" onClick={() => setNotice('')}>关闭</Button></div>}
    <div className="acq-intro-row">
      <div>
        <div className="acq-eyebrow"><span className="acq-eyebrow-dot" /> AI 获客工作台</div>
        <h1>AI 获客</h1>
        <p>从目标客户定义、公开信息发现到线索评估，建立可追踪的获客工作流。</p>
      </div>
      <Button renderIcon={Add} onClick={() => setShowBuilder((value) => !value)}>{showBuilder ? '返回任务列表' : '创建获客任务'}</Button>
    </div>

    <div className="acq-metrics">
      <Tile className="acq-metric"><div className="acq-metric-top"><span>任务总数</span><SettingsAdjust size={18}/></div><strong>{tasks.length}</strong><small>包含本地演示任务</small></Tile>
      <Tile className="acq-metric"><div className="acq-metric-top"><span>待审核线索</span><UserMultiple size={18}/></div><strong>—</strong><small>连接后端后显示</small></Tile>
      <Tile className="acq-metric"><div className="acq-metric-top"><span>高意向线索</span><ChartLine size={18}/></div><strong>—</strong><small>需要真实分析结果</small></Tile>
      <Tile className="acq-metric"><div className="acq-metric-top"><span>数据源状态</span><Globe size={18}/></div><strong className="acq-metric-state">未连接</strong><small>Serper · Tavily · Works API（可选）</small></Tile>
    </div>

    <div className="acq-provider-strip">
      <div className="acq-provider-icon"><Globe size={20}/></div>
      <div className="acq-provider-copy"><strong>数据来源与 AI 分析</strong><span>Serper 负责搜索发现 · Tavily 负责网页研究 · Works API 可选补全企业公开业务信息</span></div>
      <Tag type="cool-gray">前端阶段</Tag>
    </div>

    <Tabs selectedIndex={['tasks','targets','discovery'].indexOf(activeTab)} onChange={({ selectedIndex }) => {
      const next = ['tasks','targets','discovery'][selectedIndex];
      setActiveTab(next);
      navigate(next === 'tasks' ? '/acquisition/tasks' : next === 'targets' ? '/acquisition/targets' : '/acquisition/discovery');
    }}>
      <TabList aria-label="AI 获客模块" contained>
        <Tab>获客任务</Tab><Tab>目标客户画像</Tab><Tab>线索发现</Tab>
      </TabList>
      <TabPanels>
        <TabPanel>
          {showBuilder ? <section className="acq-panel acq-builder">
            <div className="acq-panel-heading"><div><h2>创建获客任务</h2><p>先定义目标客户，再配置搜索来源与研究规则。</p></div><Tag type="blue">步骤 1 / 2</Tag></div>
            <div className="acq-form-section">
              <h3><span>00</span> 企业知识档案</h3>
              <p>先说明企业提供什么、客户为什么选择你，再进行搜索；这些信息用于构建搜索上下文，不会自动公开或写入 CRM。</p>
              <div className="acq-form-grid">
                <div className="acq-field"><TextArea id="acq-company-offering" labelText="产品 / 服务" value={companyOffering} onChange={(event) => setCompanyOffering(event.target.value)} placeholder="例如：为中型企业提供库存预测与供应链优化软件" rows={2}/></div>
                <div className="acq-field"><TextArea id="acq-value-proposition" labelText="核心价值与差异化" value={valueProposition} onChange={(event) => setValueProposition(event.target.value)} placeholder="例如：减少缺货、降低库存成本，支持多仓协同" rows={2}/></div>
                <div className="acq-field"><TextArea id="acq-ideal-customer" labelText="理想客户补充说明" value={idealCustomerNotes} onChange={(event) => setIdealCustomerNotes(event.target.value)} placeholder="例如：有多仓库存、正在拓展欧洲市场的零售企业" rows={2}/></div>
                <div className="acq-field"><TextArea id="acq-excluded-targets" labelText="排除条件（可选）" value={excludedTargets} onChange={(event) => setExcludedTargets(event.target.value)} placeholder="例如：排除微型企业、纯咨询公司和竞争对手" rows={2}/></div>
              </div>
            </div>
            <div className="acq-form-section">
              <h3><span>01</span> 目标客户</h3>
              <div className="acq-form-grid">
                <div className="acq-field"><TextInput id="acq-task-name" labelText="任务名称" value={taskName} onChange={(event) => setTaskName(event.target.value)} placeholder="例如：欧洲中型 SaaS 企业" /></div>
                <CarbonSelect id="acq-audience" label="客户类型" value={audience} options={selectOptions.audience} onChange={setAudience}/>
                <CarbonSelect id="acq-region" label="目标地区" value={region} options={selectOptions.region} onChange={setRegion}/>
                <CarbonSelect id="acq-industry" label="行业" value={industry} options={selectOptions.industry} onChange={setIndustry}/>
                {audience !== 'b2c' && <CarbonSelect id="acq-size" label="企业规模" value={companySize} options={selectOptions.companySize} onChange={setCompanySize}/>}
                <CarbonSelect id="acq-intent" label="优先信号" value={intent} options={selectOptions.intent} onChange={setIntent} helperText="用于排序，不代表已验证的购买意向。"/>
              </div>
            </div>
            <div className="acq-form-section">
              <h3><span>02</span> 数据来源与研究</h3>
              <div className="acq-form-grid">
                <CarbonSelect id="acq-source" label="发现数据源" value={source} options={selectOptions.source} onChange={setSource}/>
                <CarbonSelect id="acq-volume" label="目标线索数量" value={volume} options={selectOptions.volume} onChange={setVolume}/>
              </div>
              <div className="acq-checks">
                <Checkbox id="acq-research" labelText="对候选企业进行网页深度研究（Tavily）" checked={research} onChange={(checked) => setResearch(checked)}/>
                <Checkbox id="acq-score" labelText="启用证据质量评分（规则评分，不代表购买意向）" checked={score} onChange={(checked) => setScore(checked)}/>
                <Checkbox id="acq-verified" labelText="仅展示带网页摘要的可追溯来源" checked={verifiedOnly} onChange={(checked) => setVerifiedOnly(checked)}/>
              </div>
            </div>
            <InlineNotification kind="info" lowContrast title="数据与隐私说明" subtitle="仅规划采集公开、合法可用的信息；每条线索应保留来源链接、采集时间、证据与置信度。外联发送与消费者画像功能需在后续接入授权与合规校验。" hideCloseButton/>
            <div className="acq-builder-footer"><Button kind="secondary" onClick={() => setShowBuilder(false)}>取消</Button><Button renderIcon={ArrowRight} onClick={createTask}>保存为草稿</Button></div>
          </section> : <section className="acq-panel">
            <div className="acq-panel-heading"><div><h2>获客任务</h2><p>配置目标、检查任务状态，并在审核后进入线索处理流程。</p></div><div className="acq-filter"><Filter size={16}/><Select id="acq-status-filter" labelText="任务状态" hideLabel value={filter} onChange={(event) => setFilter(event.target.value)}><SelectItem value="all" text="全部状态"/><SelectItem value="草稿" text="草稿"/><SelectItem value="待启动" text="待启动"/><SelectItem value="已完成配置" text="已完成配置"/></Select></div></div>
            <div className="acq-table-wrap"><table className="acq-table"><thead><tr><th>任务</th><th>客户类型</th><th>地区</th><th>数据源</th><th>状态</th><th>线索数</th><th>最近更新</th></tr></thead><tbody>
              {filteredTasks.map((task) => <tr key={task.id}><td><strong>{task.name}</strong><small>{task.id}</small></td><td>{task.audience}</td><td>{task.region}</td><td>{task.source}</td><td><Tag type={task.status === '草稿' ? 'cool-gray' : task.status === '待启动' ? 'blue' : 'teal'}>{task.status}</Tag></td><td>{task.leads}</td><td>{task.updated}</td></tr>)}
              {!filteredTasks.length && <tr><td colSpan="7" className="acq-empty">没有符合筛选条件的任务。</td></tr>}
            </tbody></table></div>
            <div className="acq-table-footer"><span>当前展示 {filteredTasks.length} 个任务 · 任务列表为前端演示数据</span><Button kind="ghost" size="sm" renderIcon={Renew} onClick={() => setNotice('当前任务列表为本地演示数据；真实刷新将在 API 接入后启用。')}>刷新</Button></div>
          </section>}
        </TabPanel>
        <TabPanel>
          <section className="acq-panel"><div className="acq-panel-heading"><div><h2>目标客户画像</h2><p>定义理想客户特征（ICP），为搜索和评分提供统一标准。</p></div><Button kind="secondary" renderIcon={Add} onClick={() => setNotice('画像编辑与保存将在后端接口接入后启用。')}>新建画像</Button></div>
            <div className="acq-profile-grid">
              <Tile className="acq-profile-card"><div className="acq-profile-top"><Building size={22}/><Tag type="blue">B2B</Tag></div><h3>欧洲成长型 SaaS</h3><p>适合以企业规模、行业匹配、扩张信号与公开业务证据综合评估。</p><div className="acq-profile-tags"><Tag>欧洲</Tag><Tag>软件 / SaaS</Tag><Tag>51–1,000 人</Tag></div><div className="acq-profile-meta"><span>评分规则</span><strong>行业匹配 · 增长信号 · 业务契合度</strong></div><Button kind="ghost" size="sm" onClick={() => { setAudience('b2b'); setRegion('eu'); setIndustry('saas'); setCompanySize('51-200'); setShowBuilder(true); setActiveTab('tasks'); }}>用于新任务 <ArrowRight size={16}/></Button></Tile>
              <Tile className="acq-profile-card"><div className="acq-profile-top"><UserMultiple size={22}/><Tag type="purple">B2C</Tag></div><h3>高意向消费者研究</h3><p>优先聚合市场趋势与授权的一方数据，不自动推断个人敏感属性。</p><div className="acq-profile-tags"><Tag>市场趋势</Tag><Tag>购买需求</Tag><Tag>授权数据</Tag></div><div className="acq-profile-meta"><span>评分规则</span><strong>需求主题 · 内容互动 · 授权信号</strong></div><Button kind="ghost" size="sm" onClick={() => { setAudience('b2c'); setRegion('eu'); setIndustry('ecommerce'); setShowBuilder(true); setActiveTab('tasks'); }}>用于新任务 <ArrowRight size={16}/></Button></Tile>
            </div>
            <InlineNotification kind="info" lowContrast title="画像说明" subtitle="当前为可交互的示例画像；实际 ICP 将由企业资料、产品信息、目标市场与历史成交数据共同生成。" hideCloseButton/>
          </section>
        </TabPanel>
        <TabPanel>
          <section className="acq-panel"><div className="acq-panel-heading"><div><h2>线索发现</h2><p>结合企业知识档案、目标画像与公开网页证据发现候选企业；研究结果需经过证据审核。</p></div><Button renderIcon={Search} onClick={handleDiscovery} disabled={searching}>{searching?'正在搜索…':'开始发现'}</Button></div>
            <div className="acq-discovery-grid">
              <Tile className="acq-discovery-card"><div className="acq-discovery-number">01</div><h3>搜索发现</h3><p>Serper 搜索公开网页与企业站点，获取候选公司及可追溯 URL。</p><Tag type={supabaseConfigured?'blue':'cool-gray'}>{supabaseConfigured?'Edge Function · 需配置密钥':'需配置 Supabase'}</Tag></Tile>
              <Tile className="acq-discovery-card"><div className="acq-discovery-number">02</div><h3>深度研究</h3><p>Tavily 补充企业产品、市场、增长和业务匹配等公开证据。</p><Tag type={supabaseConfigured?'blue':'cool-gray'}>{supabaseConfigured?'Tavily 服务端适配器':'需配置 Supabase'}</Tag></Tile>
              <Tile className="acq-discovery-card"><div className="acq-discovery-number">03</div><h3>公司信息补全</h3><p>可选 Works API 适配器补充企业档案和公开业务联系渠道；需确认供应商接口契约。</p><Tag type="cool-gray">Works API · 可选配置</Tag></Tile>
            </div>
            <div className="acq-search-controls">
              <TextInput id="acq-search-query" labelText="补充搜索关键词（可选）" value={searchQuery} onChange={(event)=>setSearchQuery(event.target.value)} placeholder="默认使用上方行业、地区、规模和信号选项生成查询"/>
              <div className="acq-search-actions"><Checkbox id="acq-persist-candidates" labelText="将候选企业保存为待审核线索（不会自动外联）" checked={persistCandidates} onChange={(checked)=>setPersistCandidates(checked)}/><span className="acq-search-limit">每次最多返回 10 条结果，减少不必要的 API 调用。</span></div>
            </div>
            {searchError&&<InlineNotification kind="error" lowContrast title="线索发现未完成" subtitle={searchError}/>}
            {providerStatuses.length>0&&<div className="acq-provider-status">{providerStatuses.map((provider)=> <div className="acq-provider-status-item" key={provider.provider}><Tag type={provider.status==='ok'?'green':provider.status==='skipped'?'cool-gray':'red'}>{provider.provider}: {provider.status}{provider.count!==undefined?` · ${provider.count}`:''}</Tag>{provider.message&&<small>{provider.message}</small>}</div>)}</div>}
            {providerStatuses.length>0&&searchResults.length===0&&<div className="acq-empty-results">当前没有可展示的搜索结果。请检查上方服务状态、密钥配置或调整搜索关键词。</div>}{searchResults.length>0&&<section className="acq-results-panel"><div className="acq-results-heading"><h3>搜索结果与证据</h3><span>{searchResults.length} 条结果</span></div>{searchResults.map((result,index)=><article className="acq-result-item" key={result.url||index}><div className="acq-result-meta"><Tag type="blue">{(result.providers||[result.provider]).join(' + ')}</Tag><span>{result.domain}</span>{result.evidenceScore!==undefined&&<Tag type={result.evidenceScore>=70?'green':result.evidenceScore>=40?'blue':'cool-gray'}>证据完整度 {result.evidenceScore}/100</Tag>}</div><h4><a href={result.url} target="_blank" rel="noreferrer">{result.title}</a></h4><p>{result.snippet||'未提供摘要。'}</p><small>{result.url}</small></article>)}</section>}
            {worksResult?.status==='ok'&&<section className="acq-works-result"><div><h3>Works API 补全结果（待审核）</h3><p>返回内容仅供当前用户核验，不会自动写入联系人或触发外联。</p></div><pre>{JSON.stringify(worksResult.data,null,2)}</pre></section>}
            {worksResult?.status==='error'&&<InlineNotification kind="warning" lowContrast title="Works API 暂不可用" subtitle={worksResult.message||'请检查服务端 endpoint 与密钥配置。'}/>}
            <div className="acq-progress-panel"><div><h3>发现流程</h3><p>配置任务 → 搜索去重 → 深度研究 → AI 评分 → 人工审核 → CRM</p></div><ProgressBar label="前端界面完成度" value={100} max={100} helperText="仅表示界面骨架已完成，不代表 API 或数据源已连接。"/></div>
            <InlineNotification kind="info" lowContrast title="安全与审核说明" subtitle="API 密钥只保存在 Edge Function Secrets 中。候选企业默认仅展示证据；勾选保存后才会写入 CRM 线索队列，Works 返回的个人联系信息不会自动落库或触发外联。" hideCloseButton/>
          </section>
        </TabPanel>
      </TabPanels>
    </Tabs>
    <div className="acq-footer-note"><Time size={14}/> 所有示例任务均为演示数据。前端不会直接暴露或保存 Serper / Tavily API 密钥。</div>
  </div>;
}
