import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(url && anonKey);
export const supabase = supabaseConfigured
  ? createClient(url, anonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } })
  : null;

const entityMap = {
  '/crm/accounts': {
    table: 'crm_accounts', archived: true,
    columns: ['account_number','account_name','industry','country_code','customer_tier','owner_id','status'],
    labels: ['账户编号','客户名称','行业','国家/地区','客户等级','负责人','状态'],
    numberField: 'account_number',
    nameField: 'account_name',
    prefix: 'ACC',
    create: (name, number) => ({ account_number: number, account_name: name, status: 'active' }),
  },
  '/crm/contacts': {
    table: 'crm_contacts', archived: true,
    columns: ['contact_number','full_name','account_id','job_title','email','country_code','status'],
    labels: ['联系人编号','姓名','所属公司','职位','业务邮箱','国家/地区','状态'],
    numberField: 'contact_number',
    nameField: 'last_name',
    prefix: 'CON',
    create: (name, number) => ({ contact_number: number, last_name: name, status: 'active' }),
  },
  '/crm/leads': {
    table: 'crm_leads', archived: true,
    columns: ['lead_number','company_name','source','score','owner_id','status'],
    labels: ['线索编号','公司','来源','评分','负责人','状态'],
    numberField: 'lead_number',
    nameField: 'company_name',
    prefix: 'LEA',
    create: (name, number) => ({ lead_number: number, company_name: name, source: 'manual', status: 'new' }),
  },
  '/sales/opportunities': {
    table: 'crm_opportunities', archived: true,
    columns: ['opportunity_number','opportunity_name','account_id','stage','amount','probability','expected_close_date'],
    labels: ['商机编号','商机名称','客户','销售阶段','预计金额','概率','预计关闭'],
    numberField: 'opportunity_number',
    nameField: 'opportunity_name',
    prefix: 'OPP',
    create: (name, number) => ({ opportunity_number: number, opportunity_name: name, stage: 'prospecting', amount: 0, probability: 10 }),
  },
  '/sales/quotes': {
    table: 'crm_quotes',
    columns: ['quote_number','account_id','opportunity_id','currency','total_amount','version','status'],
    labels: ['报价编号','客户','关联商机','币种','报价金额','版本','状态'],
    numberField: 'quote_number',
    nameField: 'quote_number',
    prefix: 'QUO',
    create: (name, number) => ({ quote_number: name || number, version: 1, currency: 'EUR', status: 'draft' }),
  },
  '/orders/list': {
    table: 'crm_sales_orders',
    columns: ['order_number','account_id','order_date','currency','total_amount','status','status'],
    labels: ['订单编号','客户','订单日期','币种','订单金额','履约状态','状态'],
    numberField: 'order_number',
    nameField: 'order_number',
    prefix: 'SO',
    create: (name, number) => ({ order_number: name || number, order_date: new Date().toISOString().slice(0,10), currency: 'EUR', status: 'draft' }),
  },
};

const displayValue = (key, value) => {
  if (value === null || value === undefined || value === '') return '—';
  if (key === 'amount' || key === 'total_amount') return new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR',maximumFractionDigits:2}).format(Number(value));
  if (key === 'probability') return value + '%';
  return String(value);
};

export function supportsPersistentRecords(path) {
  return Boolean(entityMap[path]);
}

async function getOrgContext() {
  if (!supabase) throw new Error('未配置 Supabase。请设置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY。');
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  if (!session?.user) throw new Error('请先登录，再访问组织 CRM 数据。');
  const { data, error } = await supabase
    .from('organization_memberships')
    .select('organization_id,role')
    .eq('user_id', session.user.id)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data?.organization_id) throw new Error('当前账号尚未加入工作空间。请由管理员完成组织成员配置。');
  return { organizationId: data.organization_id, userId: session.user.id };
}

export async function listCrmRecords(path) {
  const config = entityMap[path];
  if (!config) return null;
  const { organizationId } = await getOrgContext();
  let query = supabase
    .from(config.table)
    .select('id,organization_id,' + config.columns.join(','))
    .eq('organization_id', organizationId);
  if (config.archived) query = query.is('archived_at', null);
  const { data, error } = await query.order('updated_at', { ascending: false }).limit(200);
  if (error) throw error;
  const rows = (data || []).map((record) => config.columns.map((key) => displayValue(key, record[key])));
  return { columns: config.labels, rows, count: rows.length };
}

export async function createCrmRecord(path, name) {
  const config = entityMap[path];
  if (!config) throw new Error('该模块尚未启用持久化记录。');
  if (!name?.trim()) throw new Error('请填写记录名称。');
  const { organizationId, userId } = await getOrgContext();
  const { count, error: countError } = await supabase
    .from(config.table)
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', organizationId);
  if (countError) throw countError;
  const number = config.prefix + '-' + String((count || 0) + 1).padStart(5, '0');
  const payload = {
    organization_id: organizationId,
    created_by: userId,
    ...config.create(name.trim(), number),
  };
  if (['crm_accounts','crm_contacts','crm_leads','crm_opportunities'].includes(config.table)) payload.owner_id = userId;
  const { data, error } = await supabase.from(config.table).insert(payload).select('id').single();
  if (error) throw error;
  return data;
}

export async function getCurrentUser() {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}
