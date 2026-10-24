import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(url && anonKey);
export const supabase = supabaseConfigured
  ? createClient(url, anonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } })
  : null;

const entityMap = {
  '/crm/accounts': {
    table: 'crm_accounts', objectKey:'account', archived: true, prefix: 'ACC',
    select: ['account_number','name','industry','country_code','rating','owner_user_id','lifecycle_stage'],
    labels: ['账户编号','客户名称','行业','国家/地区','客户等级','负责人','生命周期'],
    create: (name, number) => ({ account_number:number, name, account_type:'prospect', lifecycle_stage:'new', source:'manual' }),
    editName: (record) => record.name,
    update: (name) => ({name}),
    hasAuditColumns: true, assignOwner: true,
  },
  '/crm/contacts': {
    table: 'crm_contacts', objectKey:'contact', archived: true, prefix: 'CON',
    select: ['contact_number','first_name','last_name','account_id','job_title','email','country_code','consent_status'],
    labels: ['联系人编号','联系人姓名','所属客户','职位','业务邮箱','国家/地区','同意状态'],
    embeds: ['account:crm_accounts(name,account_number)'],
    map: (record) => [record.contact_number, [record.first_name,record.last_name].filter(Boolean).join(' '), record.account?.name || '—', record.job_title, record.email, record.country_code, record.consent_status],
    create: (name, number) => ({ contact_number:number, first_name:'New', last_name:name, consent_status:'unknown', source:'manual' }),
    hasAuditColumns: true, assignOwner: true,
    editName: (record) => [record.first_name,record.last_name].filter(Boolean).join(' '),
    update: (name) => { const parts=name.trim().split(/\s+/); return {first_name:parts.slice(0,-1).join(' '),last_name:parts.at(-1)||name}; },
  },
  '/crm/leads': {
    table: 'crm_leads', objectKey:'lead', archived: true, prefix: 'LEA',
    select: ['lead_number','company_name','lead_source','score','owner_user_id','status'],
    labels: ['线索编号','公司','来源','评分','负责人','状态'],
    create: (name, number) => ({ lead_number:number, company_name:name, lead_source:'manual', status:'new' }),
    editName: (record) => record.company_name,
    update: (name) => ({company_name:name}),
    hasAuditColumns: true, assignOwner: true,
  },
  '/sales/opportunities': {
    table: 'crm_opportunities', objectKey:'opportunity', archived: true, prefix: 'OPP',
    select: ['opportunity_number','name','account_id','stage','amount','probability','expected_close_date'],
    labels: ['商机编号','商机名称','客户','销售阶段','预计金额','概率','预计关闭'],
    embeds: ['account:crm_accounts(name,account_number)'],
    map: (record) => [record.opportunity_number,record.name,record.account?.name || '—',record.stage,displayValue('amount',record.amount),displayValue('probability',record.probability),record.expected_close_date || '—'],
    create: (name, number) => ({ opportunity_number:number, name, stage:'prospecting', status:'open', amount:0, probability:10 }),
    editName: (record) => record.name,
    update: (name) => ({name}),
    hasAuditColumns: true, assignOwner: true,
  },
  '/sales/quotes': {
    table: 'crm_quotes', objectKey:'quote', prefix: 'QUO',
    select: ['quote_number','account_id','opportunity_id','currency','total_amount','version','status'],
    editSelect: ['notes'],
    editName: (record) => record.notes || '',
    update: (name) => ({notes:name}),
    labels: ['报价编号','客户','关联商机','币种','报价金额','版本','状态'],
    embeds: ['account:crm_accounts(name,account_number)','opportunity:crm_opportunities(name,opportunity_number)'],
    map: (record) => [record.quote_number,record.account?.name || '—',record.opportunity?.name || '—',record.currency,displayValue('total_amount',record.total_amount),record.version,record.status],
    create: (name, number) => ({ quote_number:number, notes:name, version:1, currency:'EUR', status:'draft' }),
    assignOwner: true,
  },
  '/orders/list': {
    table: 'crm_sales_orders', objectKey:'order', prefix: 'SO',
    select: ['order_number','account_id','quote_id','order_date','currency','total_amount','status'],
    editSelect: ['customer_reference'],
    editName: (record) => record.customer_reference || '',
    update: (name) => ({customer_reference:name}),
    labels: ['订单编号','客户','关联报价','订单日期','币种','订单金额','状态'],
    embeds: ['account:crm_accounts(name,account_number)','quote:crm_quotes(quote_number)'],
    map: (record) => [record.order_number,record.account?.name || '—',record.quote?.quote_number || '—',record.order_date,record.currency,displayValue('total_amount',record.total_amount),record.status],
    create: (name, number) => ({ order_number:number, customer_reference:name, order_date:new Date().toISOString().slice(0,10), currency:'EUR', status:'draft' }),
    assignOwner: true,
  },
};

entityMap['/acquisition/contacts'] = entityMap['/crm/contacts'];
entityMap['/acquisition/review'] = {
  ...entityMap['/crm/leads'],
  select:['lead_number','company_name','lead_source','score','enrichment_status','status'],
  labels:['线索编号','候选公司','来源','评分','证据状态','审核状态'],
  map:(record)=>[record.lead_number,record.company_name,record.lead_source,record.score??'—',record.enrichment_status,record.status],
};
entityMap['/acquisition/scoring'] = {
  ...entityMap['/crm/leads'],
  select:['lead_number','company_name','score','enrichment_status','source_detail','status'],
  labels:['线索编号','候选公司','评分','证据状态','证据来源','审核状态'],
  map:(record)=>[record.lead_number,record.company_name,record.score??'—',record.enrichment_status,record.source_detail||'—',record.status],
};
entityMap['/acquisition/research'] = {
  ...entityMap['/crm/leads'],
  select:['lead_number','company_name','website','enrichment_status','source_detail','status'],
  labels:['线索编号','候选公司','企业网站','研究状态','来源 URL','审核状态'],
  map:(record)=>[record.lead_number,record.company_name,record.website||'—',record.enrichment_status,record.source_detail||'—',record.status],
};
entityMap['/data/audit'] = {
  table:'audit_events',
  select:['action_key','object_key','record_id','actor_user_id','created_at','metadata'],
  labels:['操作','业务对象','记录 ID','操作人 ID','时间','事件摘要'],
  orderBy:'created_at',
  canCreate:false,
  map:(record)=>[record.action_key,record.object_key,record.record_id||'—',record.actor_user_id||'系统',new Date(record.created_at).toLocaleString(),JSON.stringify(record.metadata||{}).slice(0,180)],
};

entityMap['/crm/accounts'].importNameField='name';
entityMap['/crm/accounts'].importFields=[
  {key:'name',label:'客户名称',type:'text'},{key:'industry',label:'行业',type:'text'},{key:'website',label:'企业网站',type:'url'},
  {key:'annual_revenue',label:'年收入',type:'number'},{key:'phone',label:'电话',type:'phone'},{key:'billing_country',label:'国家/地区',type:'text'},
  {key:'account_type',label:'客户类型',type:'text'},{key:'lifecycle_stage',label:'生命周期',type:'text'},{key:'source',label:'来源',type:'text'},
];
entityMap['/crm/contacts'].importNameField='last_name';
entityMap['/crm/contacts'].importFields=[
  {key:'first_name',label:'名',type:'text'},{key:'last_name',label:'姓',type:'text'},{key:'email',label:'业务邮箱',type:'email'},
  {key:'phone',label:'电话',type:'phone'},{key:'job_title',label:'职位',type:'text'},{key:'account_id',label:'所属客户 ID',type:'uuid'},
  {key:'country_code',label:'国家/地区代码',type:'text'},{key:'consent_status',label:'同意状态',type:'text'},
];
entityMap['/crm/leads'].importNameField='company_name';
entityMap['/crm/leads'].importFields=[
  {key:'company_name',label:'候选公司',type:'text'},{key:'website',label:'企业网站',type:'url'},{key:'lead_source',label:'来源',type:'text'},
  {key:'source_detail',label:'来源 URL',type:'url'},{key:'score',label:'评分',type:'number'},{key:'status',label:'审核状态',type:'text'},
  {key:'enrichment_status',label:'证据状态',type:'text'},
];
entityMap['/sales/opportunities'].importNameField='name';
entityMap['/sales/opportunities'].importFields=[
  {key:'name',label:'商机名称',type:'text'},{key:'account_id',label:'客户账户 ID',type:'uuid'},{key:'stage',label:'销售阶段',type:'text'},
  {key:'amount',label:'预计金额',type:'number'},{key:'probability',label:'概率',type:'number'},{key:'expected_close_date',label:'预计关闭',type:'date'},
  {key:'status',label:'状态',type:'text'},
];
entityMap['/sales/quotes'].importNameField='notes';
entityMap['/sales/quotes'].importFields=[
  {key:'account_id',label:'客户账户 ID',type:'uuid'},{key:'opportunity_id',label:'关联商机 ID',type:'uuid'},{key:'currency',label:'币种',type:'text'},
  {key:'total_amount',label:'报价金额',type:'number'},{key:'status',label:'状态',type:'text'},{key:'notes',label:'报价备注',type:'text'},
];
entityMap['/orders/list'].importNameField='customer_reference';
entityMap['/orders/list'].importFields=[
  {key:'account_id',label:'客户账户 ID',type:'uuid'},{key:'quote_id',label:'关联报价 ID',type:'uuid'},{key:'order_date',label:'订单日期',type:'date'},
  {key:'currency',label:'币种',type:'text'},{key:'total_amount',label:'订单金额',type:'number'},{key:'status',label:'状态',type:'text'},
  {key:'customer_reference',label:'客户参考号',type:'text'},
];

const displayValue = (key,value) => {
  if (value === null || value === undefined || value === '') return '—';
  if (key === 'amount' || key === 'total_amount') return new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR',maximumFractionDigits:2}).format(Number(value));
  if (key === 'probability') return value + '%';
  return String(value);
};

export function supportsPersistentRecords(path) {
  return Boolean(entityMap[path]);
}

const ACTIVE_WORKSPACE_KEY = 'astrion-active-workspace-id';

export function getSelectedWorkspaceId() {
  try { return window.localStorage.getItem(ACTIVE_WORKSPACE_KEY) || ''; }
  catch { return ''; }
}

export function setSelectedWorkspaceId(workspaceId) {
  try {
    if (workspaceId) window.localStorage.setItem(ACTIVE_WORKSPACE_KEY, workspaceId);
    else window.localStorage.removeItem(ACTIVE_WORKSPACE_KEY);
  } catch {
    throw new Error('浏览器存储不可用，无法记住当前工作空间。');
  }
}

export async function listWorkspaceMemberships() {
  if (!supabase) return [];
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  if (!session?.user) throw new Error('请先登录，再读取工作空间。');
  const { data, error } = await supabase
    .from('workspace_memberships')
    .select('workspace_id,role_key,workspace:workspaces(id,name,slug)')
    .eq('user_id', session.user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []).filter((item) => item.workspace).map((item) => ({
    id: item.workspace_id,
    name: item.workspace.name,
    slug: item.workspace.slug,
    role: item.role_key,
  }));
}

async function getWorkspaceContext() {
  if (!supabase) throw new Error('未配置 Supabase。请设置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY。');
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  if (!session?.user) throw new Error('请先登录，再访问工作空间 CRM 数据。');
  const { data, error } = await supabase
    .from('workspace_memberships')
    .select('workspace_id,role_key')
    .eq('user_id', session.user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: true });
  if (error) throw error;
  if (!data?.length) throw new Error('当前账号尚未加入工作空间。请由管理员完成成员配置。');
  const selectedId = getSelectedWorkspaceId();
  const selected = selectedId ? data.find((item) => item.workspace_id === selectedId) : null;
  if (selectedId && !selected) {
    setSelectedWorkspaceId('');
    if (data.length > 1) throw new Error('已选工作空间不再属于当前账号，请重新选择工作空间。');
  }
  if (data.length > 1 && !selected) throw new Error('当前账号加入了多个工作空间，请先在顶部选择工作空间。');
  const membership = selected || data[0];
  return { workspaceId: membership.workspace_id, userId: session.user.id, role: membership.role_key };
}

async function nextCrmNumber(prefix,workspaceId) {
  const { data,error } = await supabase.rpc('next_crm_number',{p_workspace_id:workspaceId,p_prefix:prefix});
  if (error) throw error;
  return data;
}

export async function listCrmRecords(path) {
  const config = entityMap[path];
  if (!config) return null;
  const { workspaceId } = await getWorkspaceContext();
  let query = supabase.from(config.table)
    .select('id,workspace_id,'+[...config.select,...(config.editSelect||[]),...(config.embeds||[])].join(','))
    .eq('workspace_id',workspaceId);
  if (config.archived) query = query.is('archived_at',null);
  const { data,error } = await query.order(config.orderBy||'updated_at',{ascending:false}).limit(200);
  if (error) throw error;
  const rows = (data || []).map((record) => config.map ? config.map(record) : config.select.map((key) => displayValue(key,record[key])));
  return { columns:config.labels, rows, recordIds:(data || []).map((record) => record.id), recordNames:(data || []).map((record) => config.editName ? config.editName(record) : null), canCreate:config.canCreate!==false&&Boolean(config.create), canArchive:Boolean(config.archived), supportsCustomFields:Boolean(config.objectKey), count:rows.length };
}

export async function createCrmRecord(path,name) {
  const config = entityMap[path];
  if (!config) throw new Error('该模块尚未启用持久化记录。');
  if (!name?.trim()) throw new Error('请填写记录名称。');
  const { workspaceId,userId } = await getWorkspaceContext();
  const number = await nextCrmNumber(config.prefix,workspaceId);
  const payload = { workspace_id:workspaceId, ...config.create(name.trim(),number) };
  if (config.hasAuditColumns) {
    payload.created_by = userId;
    payload.updated_by = userId;
  }
  if (config.assignOwner) payload.owner_user_id = userId;
  const { data,error } = await supabase.from(config.table).insert(payload).select('id').single();
  if (error) throw error;
  return data;
}

export function getCrmImportFields(path) {
  return entityMap[path]?.importFields || [];
}

export async function importCrmRows(path,rows) {
  const config=entityMap[path];
  if(!config?.importFields||!config.create)throw new Error('该对象暂不支持 CSV 导入。');
  if(!Array.isArray(rows)||!rows.length)throw new Error('没有可导入的数据行。');
  const {workspaceId,userId}=await getWorkspaceContext();
  const allowed=new Map(config.importFields.map((field)=>[field.key,field]));
  const errors=[];
  let imported=0;
  for(let index=0;index<rows.length;index++){
    const source=rows[index]||{};
    try{
      const values={};
      for(const [key,raw] of Object.entries(source)){
        const field=allowed.get(key);
        if(!field||raw===undefined||raw===null||String(raw).trim()==='')continue;
        if(['number','decimal','currency'].includes(field.type)){
          const number=Number(raw);
          if(!Number.isFinite(number))throw new Error(`字段“${field.label}”不是有效数字`);
          values[key]=number;
        }else if(field.type==='uuid'){
          const value=String(raw).trim();
          if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value))throw new Error(`字段“${field.label}”必须是有效 UUID`);
          values[key]=value;
        }else values[key]=String(raw).trim();
      }
      const name=String(values[config.importNameField]??'').trim();
      if(['account','lead','opportunity'].includes(config.objectKey)&&!name)throw new Error('缺少必填的主名称字段');
      if(config.objectKey==='contact'&&!String(values.last_name??'').trim())throw new Error('联系人必须提供“姓”字段');
      const {data:number,error:numberError}=await supabase.rpc('next_crm_number',{p_workspace_id:workspaceId,p_prefix:config.prefix});
      if(numberError)throw numberError;
      const payload={...config.create(name||'Imported record',number),...values,workspace_id:workspaceId};
      if(config.hasAuditColumns){payload.created_by=userId;payload.updated_by=userId;}
      if(config.assignOwner)payload.owner_user_id=userId;
      const {error}=await supabase.from(config.table).insert(payload);
      if(error)throw error;
      imported++;
    }catch(error){
      errors.push({row:index+2,message:error?.message||'导入失败'});
    }
  }
  return {imported,failed:errors.length,errors};
}

export async function listRecordCustomFields(path,recordId) {
  const config=entityMap[path];
  if(!config?.objectKey||!recordId)return [];
  const {workspaceId}=await getWorkspaceContext();
  const [{data:definitions,error:definitionError},{data:values,error:valueError}]=await Promise.all([
    supabase.from('crm_custom_field_definitions')
      .select('id,field_key,label,field_type,is_required,is_unique,is_readonly,is_searchable,is_filterable,default_value,options,validation_rules')
      .eq('workspace_id',workspaceId).eq('object_key',config.objectKey).eq('is_active',true)
      .order('display_order',{ascending:true}).limit(300),
    supabase.from('crm_custom_field_values')
      .select('id,field_definition_id,value')
      .eq('workspace_id',workspaceId).eq('object_key',config.objectKey).eq('record_id',recordId).limit(300),
  ]);
  if(definitionError)throw definitionError;
  if(valueError)throw valueError;
  const valuesByField=new Map((values||[]).map((item)=>[item.field_definition_id,item]));
  return (definitions||[]).map((field)=>{
    const stored=valuesByField.get(field.id);
    return {
      id:field.id,key:field.field_key,label:field.label,fieldType:field.field_type,
      required:field.is_required,unique:field.is_unique,readonly:field.is_readonly,
      searchable:field.is_searchable,filterable:field.is_filterable,
      options:Array.isArray(field.options)?field.options:[],
      defaultValue:field.default_value,
      validationRules:field.validation_rules||{},
      value:stored?stored.value:field.default_value,
      hasValue:Boolean(stored),rowId:stored?.id,
    };
  });
}

export async function saveRecordCustomField(path,recordId,field,value) {
  const config=entityMap[path];
  if(!config?.objectKey||!recordId)throw new Error('当前记录不支持自定义字段。');
  if(field.readonly||field.fieldType==='formula'||field.fieldType==='auto_number')throw new Error('该字段为只读字段。');
  let parsed=value;
  if(field.fieldType==='number'||field.fieldType==='decimal'||field.fieldType==='currency'){
    if(value===''||value===null||value===undefined)parsed=null;
    else {parsed=Number(value);if(!Number.isFinite(parsed))throw new Error('请输入有效数字。');}
  }else if(field.fieldType==='boolean'){
    parsed=Boolean(value);
  }else if(field.fieldType==='multi_select'){
    parsed=Array.isArray(value)?value:String(value??'').split(',').map((item)=>item.trim()).filter(Boolean);
  }else if(field.fieldType==='json'){
    if(value===''||value===null||value===undefined)parsed=null;
    else {try{parsed=typeof value==='string'?JSON.parse(value):value;}catch{throw new Error('JSON 字段格式不正确。');}}
  }
  if(field.required&&(parsed===null||parsed===undefined||parsed===''||(Array.isArray(parsed)&&!parsed.length)))throw new Error(`字段“${field.label}”为必填字段。`);
  const {workspaceId}=await getWorkspaceContext();
  const {data,error}=await supabase.from('crm_custom_field_values').upsert({
    workspace_id:workspaceId,object_key:config.objectKey,record_id:recordId,field_definition_id:field.id,value:parsed,updated_at:new Date().toISOString(),
  },{onConflict:'workspace_id,record_id,field_definition_id'}).select('id').single();
  if(error)throw error;
  return data;
}

export async function updateCrmRecord(path,recordId,name) {
  const config=entityMap[path];
  if(!config?.update) throw new Error('该模块暂不支持编辑主字段。');
  if(!name?.trim()) throw new Error('记录名称不能为空。');
  const {workspaceId,userId}=await getWorkspaceContext();
  const payload=config.update(name.trim());
  if(config.hasAuditColumns) payload.updated_by=userId;
  const {data,error}=await supabase.from(config.table).update(payload)
    .eq('id',recordId).eq('workspace_id',workspaceId).select('id').single();
  if(error) throw error;
  return data;
}

export async function archiveCrmRecord(path,recordId) {
  const config=entityMap[path];
  if(!config?.archived) throw new Error('该模块暂不支持归档。');
  const {workspaceId,userId}=await getWorkspaceContext();
  const payload={archived_at:new Date().toISOString()};
  if(config.hasAuditColumns) payload.updated_by=userId;
  const {error}=await supabase.from(config.table).update(payload)
    .eq('id',recordId).eq('workspace_id',workspaceId);
  if(error) throw error;
}

export async function setLeadStatus(leadId,status) {
  const allowed=['new','open','working','qualified','nurturing','disqualified','recycled'];
  if(!allowed.includes(status)) throw new Error('不支持的线索状态。');
  const {workspaceId,userId}=await getWorkspaceContext();
  const {data,error}=await supabase.from('crm_leads').update({status,updated_by:userId})
    .eq('id',leadId).eq('workspace_id',workspaceId).select('id').single();
  if(error) throw error;
  return data;
}

export async function convertLeadToAccount(leadId) {
  const { workspaceId } = await getWorkspaceContext();
  const { data:lead,error:leadError } = await supabase.from('crm_leads')
    .select('id,workspace_id,status').eq('id',leadId).eq('workspace_id',workspaceId).single();
  if (leadError) throw leadError;
  const accountNumber = await nextCrmNumber('ACC',workspaceId);
  const contactNumber = await nextCrmNumber('CON',workspaceId);
  const { data,error } = await supabase.rpc('convert_lead_to_account',{
    p_lead_id:lead.id,
    p_account_number:accountNumber,
    p_contact_number:contactNumber,
    p_create_opportunity:false,
    p_opportunity_number:null,
  });
  if (error) throw error;
  return data;
}

export async function convertQuoteToOrder(quoteId) {
  const { workspaceId } = await getWorkspaceContext();
  const { data:quote,error:quoteError } = await supabase.from('crm_quotes')
    .select('id,workspace_id,status').eq('id',quoteId).eq('workspace_id',workspaceId).single();
  if (quoteError) throw quoteError;
  const orderNumber = await nextCrmNumber('SO',workspaceId);
  const { data,error } = await supabase.rpc('convert_accepted_quote_to_order',{
    p_quote_id:quote.id,
    p_order_number:orderNumber,
  });
  if (error) throw error;
  return data;
}

const fieldTypeLabels = {
  text:'文本', long_text:'长文本', number:'数字', decimal:'小数', currency:'金额',
  date:'日期', datetime:'日期时间', boolean:'布尔值', single_select:'单选下拉框',
  multi_select:'多选下拉框', email:'邮箱', phone:'电话', url:'网址',
  user_reference:'用户关联', record_reference:'对象关联', formula:'公式', auto_number:'自动编号', json:'JSON',
};
const fieldTypeToDatabase = {
  text:'text', longtext:'long_text', number:'number', decimal:'decimal', currency:'currency', date:'date',
  boolean:'boolean', datetime:'datetime', email:'email', phone:'phone', url:'url', json:'json', select:'single_select', multi:'multi_select', user:'user_reference',
  relation:'record_reference', formula:'formula', auto:'auto_number',
};

export async function listFieldDefinitions(objectKey) {
  const { workspaceId } = await getWorkspaceContext();
  const { data,error } = await supabase.from('crm_custom_field_definitions')
    .select('id,field_key,label,field_type,is_required,is_unique,is_readonly,is_searchable,is_filterable,default_value,options,validation_rules,display_order')
    .eq('workspace_id',workspaceId).eq('object_key',objectKey).eq('is_active',true)
    .order('display_order',{ascending:true}).limit(300);
  if (error) throw error;
  return (data || []).map((field)=>({
    id:field.id,name:field.field_key,label:field.label,type:fieldTypeLabels[field.field_type]||field.field_type,
    required:field.is_required,unique:field.is_unique,isSystem:false,readonly:field.is_readonly,searchable:field.is_searchable,filterable:field.is_filterable,defaultValue:field.default_value??'',options:Array.isArray(field.options)?field.options:[],validationRules:field.validation_rules||{},
  }));
}

export async function createFieldDefinition(objectKey,field) {
  const { workspaceId,userId } = await getWorkspaceContext();
  const dbType = fieldTypeToDatabase[field.type];
  if (!dbType) throw new Error('不支持的字段类型。');
  const { data,error } = await supabase.from('crm_custom_field_definitions').insert({
    workspace_id:workspaceId,object_key:objectKey,field_key:field.name,label:field.label,
    field_type:dbType,is_required:Boolean(field.required),is_unique:Boolean(field.unique),
    is_readonly:Boolean(field.readonly),is_searchable:field.searchable!==false,is_filterable:field.filterable!==false,
    default_value:field.defaultValue?field.defaultValue:null,options:field.options||[],validation_rules:field.validationRules||{},created_by:userId,
  }).select('id').single();
  if (error) throw error;
  return data;
}

export async function deleteFieldDefinition(fieldId) {
  const { workspaceId } = await getWorkspaceContext();
  const { error } = await supabase.from('crm_custom_field_definitions').delete()
    .eq('id',fieldId).eq('workspace_id',workspaceId);
  if (error) throw error;
}
export async function getCurrentUser() {
  if (!supabase) return null;
  const { data,error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}
