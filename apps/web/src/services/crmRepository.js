import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(url && anonKey);
export const supabase = supabaseConfigured
  ? createClient(url, anonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } })
  : null;

const entityMap = {
  '/crm/accounts': {
    table: 'crm_accounts', archived: true, prefix: 'ACC',
    select: ['account_number','name','industry','country_code','rating','owner_user_id','lifecycle_stage'],
    labels: ['账户编号','客户名称','行业','国家/地区','客户等级','负责人','生命周期'],
    create: (name, number) => ({ account_number:number, name, account_type:'prospect', lifecycle_stage:'new', source:'manual' }),
    editName: (record) => record.name,
    update: (name) => ({name}),
    hasAuditColumns: true, assignOwner: true,
  },
  '/crm/contacts': {
    table: 'crm_contacts', archived: true, prefix: 'CON',
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
    table: 'crm_leads', archived: true, prefix: 'LEA',
    select: ['lead_number','company_name','lead_source','score','owner_user_id','status'],
    labels: ['线索编号','公司','来源','评分','负责人','状态'],
    create: (name, number) => ({ lead_number:number, company_name:name, lead_source:'manual', status:'new' }),
    editName: (record) => record.company_name,
    update: (name) => ({company_name:name}),
    hasAuditColumns: true, assignOwner: true,
  },
  '/sales/opportunities': {
    table: 'crm_opportunities', archived: true, prefix: 'OPP',
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
    table: 'crm_quotes', prefix: 'QUO',
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
    table: 'crm_sales_orders', prefix: 'SO',
    select: ['order_number','account_id','quote_id','order_date','currency','total_amount','status'],
    labels: ['订单编号','客户','关联报价','订单日期','币种','订单金额','状态'],
    embeds: ['account:crm_accounts(name,account_number)','quote:crm_quotes(quote_number)'],
    map: (record) => [record.order_number,record.account?.name || '—',record.quote?.quote_number || '—',record.order_date,record.currency,displayValue('total_amount',record.total_amount),record.status],
    create: (_name, number) => ({ order_number:number, order_date:new Date().toISOString().slice(0,10), currency:'EUR', status:'draft' }),
    editName: () => null,
    assignOwner: true,
  },
};

const displayValue = (key,value) => {
  if (value === null || value === undefined || value === '') return '—';
  if (key === 'amount' || key === 'total_amount') return new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR',maximumFractionDigits:2}).format(Number(value));
  if (key === 'probability') return value + '%';
  return String(value);
};

export function supportsPersistentRecords(path) {
  return Boolean(entityMap[path]);
}

async function getWorkspaceContext() {
  if (!supabase) throw new Error('未配置 Supabase。请设置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY。');
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  if (!session?.user) throw new Error('请先登录，再访问工作空间 CRM 数据。');
  const { data, error } = await supabase
    .from('workspace_memberships')
    .select('workspace_id,role_key')
    .eq('user_id',session.user.id)
    .eq('is_active',true)
    .limit(2);
  if (error) throw error;
  if (!data?.length) throw new Error('当前账号尚未加入工作空间。请由管理员完成成员配置。');
  if (data.length > 1) throw new Error('当前账号加入了多个工作空间；工作空间切换器尚未启用，为防止跨组织误操作，当前请求已停止。');
  return { workspaceId:data[0].workspace_id, userId:session.user.id, role:data[0].role_key };
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
  const { data,error } = await query.order('updated_at',{ascending:false}).limit(200);
  if (error) throw error;
  const rows = (data || []).map((record) => config.map ? config.map(record) : config.select.map((key) => displayValue(key,record[key])));
  return { columns:config.labels, rows, recordIds:(data || []).map((record) => record.id), recordNames:(data || []).map((record) => config.editName ? config.editName(record) : null), count:rows.length };
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
  text:'text', longtext:'long_text', number:'number', currency:'currency', date:'date',
  boolean:'boolean', select:'single_select', multi:'multi_select', user:'user_reference',
  relation:'record_reference', formula:'formula', auto:'auto_number',
};

export async function listFieldDefinitions(objectKey) {
  const { workspaceId } = await getWorkspaceContext();
  const { data,error } = await supabase.from('crm_custom_field_definitions')
    .select('id,field_key,label,field_type,is_required,is_unique,is_readonly,options,display_order')
    .eq('workspace_id',workspaceId).eq('object_key',objectKey).eq('is_active',true)
    .order('display_order',{ascending:true}).limit(300);
  if (error) throw error;
  return (data || []).map((field)=>({
    id:field.id,name:field.field_key,label:field.label,type:fieldTypeLabels[field.field_type]||field.field_type,
    required:field.is_required,unique:field.is_unique,isSystem:false,
  }));
}

export async function createFieldDefinition(objectKey,field) {
  const { workspaceId,userId } = await getWorkspaceContext();
  const dbType = fieldTypeToDatabase[field.type];
  if (!dbType) throw new Error('不支持的字段类型。');
  const { data,error } = await supabase.from('crm_custom_field_definitions').insert({
    workspace_id:workspaceId,object_key:objectKey,field_key:field.name,label:field.label,
    field_type:dbType,is_required:Boolean(field.required),is_unique:Boolean(field.unique),
    options:field.options||[],created_by:userId,
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
