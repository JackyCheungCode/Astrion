import { useEffect, useState } from 'react';
import {
  Add, Download, OverflowMenuHorizontal, ChevronRight, ChartLine, Settings,
  DataBase, Flow, TrashCan, Save, Launch, ArrowUpRight, Time, Edit, Renew
} from '@carbon/icons-react';
import { createCrmRecord, listCrmRecords, supportsPersistentRecords, supabaseConfigured, convertLeadToAccount, convertQuoteToOrder, updateCrmRecord, archiveCrmRecord, restoreCrmRecord, setLeadStatus, listRecordCustomFields, saveRecordCustomField, getCrmImportFields, importCrmRows, listFieldDefinitions, createFieldDefinition, deleteFieldDefinition } from './services/crmRepository.js';
import {
  Button, TextInput, Select, SelectItem, Tag, Table, TableHead,
  TableRow, TableHeader, TableBody, TableCell, TableToolbar, TableToolbarContent,
  TableToolbarSearch, TableContainer, Pagination, Tile, InlineNotification,
  Modal, TextArea, Checkbox
} from '@carbon/react';
import './business-module.scss';

const records = {
  '/dashboard': {
    title: '工作总览', description: '统一查看客户关系、销售进度与运营任务。',
    metrics: [['客户账户', '1,284', '本地演示数据'], ['活跃商机', '86', '本地演示数据'], ['待跟进任务', '24', '本地演示数据'], ['本月成交额', '€248,600', '本地演示数据']],
    shortcuts: [['客户账户','/crm/accounts'],['联系人','/crm/contacts'],['线索管理','/crm/leads'],['商机管理','/sales/opportunities'],['自定义字段','/settings/fields'],['自动化工作流','/ai/workflows']]
  },
  '/crm/accounts': { title:'客户账户', description:'统一管理企业客户、组织层级、客户等级与主数据。', columns:['账户编号','客户名称','行业','地区','客户等级','负责人','状态'], rows:[['ACC-000104','Northstar Industries','制造业','德国','战略客户','销售团队 A','有效'],['ACC-000103','BluePeak Systems','软件 / SaaS','波兰','重点客户','Anna Kowalska','有效'],['ACC-000102','Meridian Commerce','电子商务','法国','标准客户','销售团队 B','有效'],['ACC-000101','Asterion Medical','医疗健康','荷兰','重点客户','Marek Nowak','待审核'],['ACC-000100','Vertex Logistics','物流','西班牙','标准客户','销售团队 A','有效']] },
  '/crm/contacts': { title:'联系人', description:'管理客户联系人、职位、决策角色与业务互动。', columns:['联系人编号','姓名','所属公司','职位','业务邮箱','地区','状态'], rows:[['CON-00251','Anna Weber','Northstar Industries','采购总监','anna.weber@example.com','德国','已验证'],['CON-00250','Piotr Zieliński','BluePeak Systems','CTO','piotr.z@example.com','波兰','待验证'],['CON-00249','Claire Martin','Meridian Commerce','运营负责人','claire.m@example.com','法国','已验证'],['CON-00248','Sofia de Vries','Asterion Medical','数字化平台主管','sofia.d@example.com','荷兰','待验证']] },
  '/crm/leads': { title:'线索管理', description:'管理线索来源、资格、评分、分配及客户转化。', columns:['线索编号','线索名称','公司','来源','评分','负责人','状态'], rows:[['LEA-00842','数字化升级需求','Northstar Industries','AI 获客',92,'Anna Weber','待审核'],['LEA-00841','CRM 现代化项目','BluePeak Systems','官网',84,'销售团队 A','已分配'],['LEA-00840','供应链自动化','Vertex Logistics','Serper',78,'销售团队 B','新建'],['LEA-00839','客户数据平台','Meridian Commerce','Tavily',73,'Anna Weber','培育中']] },
  '/sales/board': { title:'商机看板', description:'以销售阶段管理商机推进、预计成交与风险。', board:true },
  '/sales/opportunities': { title:'商机管理', description:'跟踪商机金额、销售阶段、成交概率与预计关闭日期。', columns:['商机编号','商机名称','客户','销售阶段','预计金额','概率','预计关闭'], rows:[['OPP-00314','企业 CRM 平台','Northstar Industries','方案评估','€84,000','60%','2026-11-20'],['OPP-00313','数据整合项目','BluePeak Systems','需求确认','€42,500','35%','2026-12-05'],['OPP-00312','客户服务升级','Asterion Medical','报价阶段','€26,000','75%','2026-11-08'],['OPP-00311','销售自动化','Meridian Commerce','初步接洽','€18,000','20%','2026-12-18']] },
  '/sales/quotes': { title:'报价管理', description:'管理报价版本、价格条件、折扣和审批状态。', columns:['报价编号','客户','关联商机','币种','报价金额','版本','状态'], rows:[['QUO-00182','Northstar Industries','OPP-00314','EUR','€84,000','V2','待审批'],['QUO-00181','Asterion Medical','OPP-00312','EUR','€26,000','V1','已发送'],['QUO-00180','BluePeak Systems','OPP-00313','EUR','€42,500','V1','草稿']] },
  '/orders/list': { title:'订单管理', description:'管理销售订单、商业条款、交付状态与关联财务记录。', columns:['订单编号','客户','订单日期','币种','订单金额','履约状态','状态'], rows:[['SO-00092','Northstar Industries','2026-10-16','EUR','€84,000','准备履约','已确认'],['SO-00091','Asterion Medical','2026-10-14','EUR','€26,000','部分发货','处理中'],['SO-00090','Meridian Commerce','2026-10-09','EUR','€18,000','已交付','已完成']] },
  '/orders/fulfillment': { title:'发货与履约', description:'跟踪订单行、发货、交付、异常和退货。', columns:['履约编号','订单编号','客户','计划日期','承运商','进度','状态'], rows:[['FUL-00044','SO-00092','Northstar Industries','2026-10-28','待分配','准备中','待处理'],['FUL-00043','SO-00091','Asterion Medical','2026-10-25','DHL','部分发货','处理中']] },
  '/orders/payments': { title:'收款记录', description:'查看收款、分配、退款与对账状态。', columns:['收款编号','客户','关联订单','金额','方式','收款日期','状态'], rows:[['PAY-00081','Asterion Medical','SO-00091','€13,000','银行转账','2026-10-18','已核对'],['PAY-00080','Meridian Commerce','SO-00090','€18,000','银行转账','2026-10-12','已分配']] },
  '/analytics': { title:'分析报表', description:'从销售漏斗、获客渠道、收入与团队绩效洞察业务。', analytics:true },
  '/analytics/acquisition': { title:'获客分析', description:'比较获客来源、线索质量与渠道转化。', analytics:true },
  '/analytics/funnel': { title:'销售漏斗', description:'查看各阶段转化率、停留时间与流失原因。', analytics:true },
  '/analytics/revenue': { title:'收入分析', description:'按客户、产品、地区与时间维度查看收入。', analytics:true },
  '/ai/assistant': { title:'AI 助手', description:'以客户上下文为基础，生成研究摘要、行动建议与跟进草稿。', assistant:true },
  '/ai/workflows': { title:'自动化工作流', description:'编排触发器、条件、审批和跨模块动作。', workflows:true },
  '/ai/runs': { title:'执行记录', description:'查看自动化运行状态、日志、重试与错误。', columns:['执行编号','工作流','触发时间','耗时','执行人','状态'], rows:[['RUN-00318','新线索评分','2026-10-24 08:12','2.4 秒','系统','成功'],['RUN-00317','客户数据去重','2026-10-24 08:05','1.1 秒','系统','成功'],['RUN-00316','高意向提醒','2026-10-24 07:54','—','系统','等待配置']] },
  '/settings/fields': { title:'字段与对象配置', description:'定义业务对象、字段类型、选项、必填规则、权限和页面布局。', fields:true },
  '/settings/workspace': { title:'工作空间设置', description:'配置企业资料、区域、语言、时区与默认业务选项。', settings:true },
  '/settings/users': { title:'用户与权限', description:'管理用户、角色、团队、记录访问范围与字段权限。', settings:true },
  '/settings/integrations': { title:'集成配置', description:'管理搜索数据源、AI 服务、外部系统和 Webhook。', integrations:true },
};

records['/acquisition/contacts'] = {
  ...records['/crm/contacts'],
  title:'联系人发现',
  description:'查看与线索相关的联系人主数据；真实记录受工作空间权限控制。',
};
records['/acquisition/review'] = {
  ...records['/crm/leads'],
  title:'线索审核队列',
  description:'审核搜索发现的候选企业、来源和资格状态；保存的候选记录默认需要人工核验。',
  columns:['线索编号','候选公司','来源','评分','证据状态','审核状态'],
  rows:[['LEA-DEMO-01','Northstar Industries','Serper','—','needs_review','new'],['LEA-DEMO-02','BluePeak Systems','Tavily','—','needs_review','new']],
};
records['/acquisition/scoring'] = {
  ...records['/crm/leads'],
  title:'评分与证据',
  description:'集中查看线索评分、证据状态与来源链接。尚未自动生成 AI 评分。',
  columns:['线索编号','候选公司','评分','证据状态','证据来源','审核状态'],
  rows:[['LEA-DEMO-01','Northstar Industries','—','needs_review','公开网页证据','new'],['LEA-DEMO-02','BluePeak Systems','—','needs_review','企业网站','new']],
};
records['/acquisition/research'] = {
  ...records['/crm/leads'],
  title:'企业研究',
  description:'查看企业网站、研究状态与来源 URL；来源证据保留供人工复核。',
  columns:['线索编号','候选公司','企业网站','研究状态','来源 URL','审核状态'],
  rows:[['LEA-DEMO-01','Northstar Industries','northstar.example','needs_review','https://example.com','new'],['LEA-DEMO-02','BluePeak Systems','bluepeak.example','needs_review','https://example.org','new']],
};
records['/data/audit'] = {
  title:'审计日志',
  description:'只读查看关键 CRM 操作、业务对象、操作者与事件摘要；仅授权角色可访问真实审计记录。',
  columns:['操作','业务对象','记录 ID','操作人 ID','时间','事件摘要'],
  rows:[['lead_created','crm_leads','DEMO-LEAD-01','system','2026-10-24','演示审计事件'],['quote_accepted','crm_quotes','DEMO-QUOTE-01','sales_manager','2026-10-23','演示审计事件']],
  canCreate:false,
};
records['/data/import-export'] = {
  title:'导入与导出',
  description:'导入 CSV 时先预览并映射字段，系统按工作空间权限逐行校验和保存。',
  canCreate:false,
};

const defaultColumns = ['编号','名称','所属对象','负责人','状态','更新时间'];
const defaultRows = [['REC-0001','示例业务记录','客户账户','系统管理员','待配置','2026-10-24'],['REC-0002','示例业务记录','联系人','销售团队 A','待配置','2026-10-23'],['REC-0003','示例业务记录','商机','销售团队 B','待配置','2026-10-22']];
const statusType = (value) => /有效|已验证|已完成|成功|已确认|已核对|已分配/.test(value) ? 'green' : /待审核|待审批|待处理|处理中|等待|准备中/.test(value) ? 'warm-gray' : /风险|失败|拒绝|逾期/.test(value) ? 'red' : 'blue';

function Metric({label,value,foot}) { return <Tile className="bm-metric"><span>{label}</span><strong>{value}</strong><small>{foot}</small></Tile>; }

function GenericTable({ config, onCreate, onConvert, onOpenRecord, onQualify, onDisqualify, onRestore, onToggleArchived }) {
  const [query,setQuery] = useState('');
  const [status,setStatus] = useState('all');
  const [pageSize,setPageSize] = useState(10);
  const columns = config.columns || defaultColumns;
  const rows = config.rows || defaultRows;
  const filtered = rows.map((row,sourceIndex)=>({row,sourceIndex,recordId:config.recordIds?.[sourceIndex]})).filter(({row}) => row.join(' ').toLowerCase().includes(query.toLowerCase()) && (status === 'all' || row.some((cell) => cell === status)));
  const headers = columns.map((header,key) => ({key,header}));
  const dataRows = filtered.map(({row,sourceIndex,recordId},i) => ({id:recordId||String(i),recordName:config.recordNames?.[sourceIndex],isArchived:config.recordArchivedFlags?.[sourceIndex]===true,...Object.fromEntries(columns.map((col,j)=>[String(j),row[j] ?? '—']))}));
  const exportCsv = () => {
    const csvRows=[columns,...filtered.map(({row})=>row)];
    const csv=csvRows.map((row)=>row.map((value)=>`"${String(value??'').replace(/"/g,'""')}"`).join(',')).join('\r\n');
    const blob=new Blob(['\uFEFF',csv],{type:'text/csv;charset=utf-8;'});
    const url=URL.createObjectURL(blob);
    const link=document.createElement('a');
    link.href=url;
    link.download=`astrion-${(config.path||'records').replace(/[^a-z0-9-_]+/gi,'-')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };
  return <TableContainer className="bm-table-container" title="">
    <TableToolbar><TableToolbarContent>
      <TableToolbarSearch persistent value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索当前列表" />
      <Select id="bm-status-filter" labelText="状态筛选" hideLabel size="md" value={status} onChange={(e)=>setStatus(e.target.value)}>
        <SelectItem value="all" text="全部状态"/><SelectItem value="有效" text="有效"/><SelectItem value="待审核" text="待审核"/><SelectItem value="处理中" text="处理中"/><SelectItem value="草稿" text="草稿"/>
      </Select>
      {config.isPersistent&&config.canArchive&&<Checkbox id="bm-show-archived" labelText="仅查看已归档" checked={Boolean(config.includeArchived)} onChange={(checked)=>onToggleArchived?.(checked)}/>}
      <Button kind="tertiary" renderIcon={Download} onClick={exportCsv}>导出筛选结果</Button>
      {!config.includeArchived&&config.canCreate!==false&&<Button renderIcon={Add} onClick={onCreate}>新建记录</Button>}
    </TableToolbarContent></TableToolbar>
    <Table size="lg" useZebraStyles={false}>
      <TableHead><TableRow>{headers.map((header)=><TableHeader key={header.key}>{header.header}</TableHeader>)}<TableHeader>操作</TableHeader></TableRow></TableHead>
      <TableBody>{dataRows.map((row,i)=><TableRow key={row.id}>{headers.map(({key,header})=><TableCell key={key}>{key === '0' ? <button className="bm-record-link" onClick={()=>onOpenRecord(row)}>{row[key]}</button> : header === '状态' ? <Tag type={statusType(row[key])}>{row[key]}</Tag> : row[key]}</TableCell>)}<TableCell><div className="bm-row-actions">{row.isArchived&&config.isPersistent?<Button kind="tertiary" size="sm" onClick={()=>onRestore?.(row.id)}>恢复记录</Button>:<>{['/crm/leads','/acquisition/review','/acquisition/scoring','/acquisition/research'].includes(config.path)&&config.isPersistent&&row['5']!=='converted'&&row['5']!=='disqualified'&&row['5']!=='qualified'&&<Button kind="tertiary" size="sm" onClick={()=>onQualify?.(row.id)}>标记合格</Button>}{['/crm/leads','/acquisition/review','/acquisition/scoring','/acquisition/research'].includes(config.path)&&config.isPersistent&&row['5']==='qualified'&&<Button kind="tertiary" size="sm" onClick={()=>onConvert?.(row.id)}>转化</Button>}{['/crm/leads','/acquisition/review','/acquisition/scoring','/acquisition/research'].includes(config.path)&&config.isPersistent&&row['5']!=='converted'&&row['5']!=='disqualified'&&<Button kind="ghost" size="sm" onClick={()=>onDisqualify?.(row.id)}>排除</Button>}{config.path==='/sales/quotes'&&config.isPersistent&&row['6']==='accepted'&&<Button kind="tertiary" size="sm" onClick={()=>onConvert?.(row.id)}>转订单</Button>}<Button kind="ghost" size="sm" hasIconOnly renderIcon={OverflowMenuHorizontal} iconDescription="查看记录详情" onClick={()=>onOpenRecord(row)}/></>}</div></TableCell></TableRow>)}</TableBody>
    </Table>
    <div className="bm-table-footer"><span>显示 {filtered.length} 条记录 · {config.isPersistent ? '数据库数据' : '演示数据'}</span><Pagination pageSizes={[5,10,20]} pageSize={pageSize} totalItems={filtered.length} onChange={({pageSize:nextSize})=>setPageSize(nextSize)} /></div>
  </TableContainer>;
}

function FieldConfiguration() {
  const fieldsByObject = {
    account: [
      {name:'account_number',label:'账户编号',type:'自动编号',required:true,unique:true},
      {name:'account_name',label:'客户名称',type:'文本',required:true,unique:false},
      {name:'industry',label:'行业',type:'单选下拉框',required:false,unique:false},
      {name:'annual_revenue',label:'年收入',type:'金额',required:false,unique:false},
      {name:'owner_id',label:'负责人',type:'用户关联',required:false,unique:false},
    ],
    contact: [
      {name:'contact_number',label:'联系人编号',type:'自动编号',required:true,unique:true},
      {name:'full_name',label:'联系人姓名',type:'文本',required:true,unique:false},
      {name:'account_id',label:'所属客户',type:'对象关联',required:true,unique:false},
      {name:'job_title',label:'职位',type:'文本',required:false,unique:false},
      {name:'email',label:'业务邮箱',type:'文本',required:false,unique:true},
    ],
    lead: [
      {name:'lead_number',label:'线索编号',type:'自动编号',required:true,unique:true},
      {name:'lead_name',label:'线索名称',type:'文本',required:true,unique:false},
      {name:'source',label:'线索来源',type:'单选下拉框',required:true,unique:false},
      {name:'score',label:'线索评分',type:'数字',required:false,unique:false},
      {name:'qualification_status',label:'资格状态',type:'单选下拉框',required:true,unique:false},
    ],
    opportunity: [
      {name:'opportunity_number',label:'商机编号',type:'自动编号',required:true,unique:true},
      {name:'opportunity_name',label:'商机名称',type:'文本',required:true,unique:false},
      {name:'account_id',label:'客户账户',type:'对象关联',required:true,unique:false},
      {name:'stage',label:'销售阶段',type:'单选下拉框',required:true,unique:false},
      {name:'expected_revenue',label:'预计金额',type:'金额',required:true,unique:false},
    ],
    quote: [
      {name:'quote_number',label:'报价编号',type:'自动编号',required:true,unique:true},
      {name:'opportunity_id',label:'关联商机',type:'对象关联',required:true,unique:false},
      {name:'currency',label:'币种',type:'单选下拉框',required:true,unique:false},
      {name:'discount_percent',label:'折扣比例',type:'数字',required:false,unique:false},
      {name:'valid_until',label:'有效期至',type:'日期',required:true,unique:false},
    ],
    order: [
      {name:'sales_order_number',label:'销售订单编号',type:'自动编号',required:true,unique:true},
      {name:'account_id',label:'客户账户',type:'对象关联',required:true,unique:false},
      {name:'order_date',label:'订单日期',type:'日期',required:true,unique:false},
      {name:'total_amount',label:'订单金额',type:'金额',required:true,unique:false},
      {name:'fulfillment_status',label:'履约状态',type:'单选下拉框',required:true,unique:false},
    ],
  };
  const [objectName,setObjectName] = useState('account');
  const [label,setLabel] = useState('');
  const [fieldType,setFieldType] = useState('text');
  const [required,setRequired] = useState(false);
  const [unique,setUnique] = useState(false);
  const [optionsText,setOptionsText] = useState('');
  const [defaultValue,setDefaultValue] = useState('');
  const [validationRulesText,setValidationRulesText] = useState('{}');
  const [searchable,setSearchable] = useState(true);
  const [filterable,setFilterable] = useState(true);
  const [readOnly,setReadOnly] = useState(false);
  const [fields,setFields] = useState(fieldsByObject.account.map((field)=>({...field,isSystem:true})));
  const [fieldError,setFieldError] = useState('');
  useEffect(()=>{
    let active=true;
    const defaults=(fieldsByObject[objectName]||fieldsByObject.account).map((field)=>({...field,isSystem:true}));
    if(!supabaseConfigured){setFields(defaults);setFieldError('');return ()=>{active=false;};}
    listFieldDefinitions(objectName).then((custom)=>{if(active){setFields([...defaults,...custom.filter((field)=>!defaults.some((item)=>item.name===field.name))]);setFieldError('');}})
      .catch((error)=>{if(active){setFields(defaults);setFieldError(error?.message||'自定义字段读取失败。');}});
    return ()=>{active=false;};
  },[objectName]);
  const typeLabels = {text:'文本',longtext:'长文本',number:'数字',decimal:'小数',currency:'金额',date:'日期',datetime:'日期时间',boolean:'布尔值',email:'邮箱',phone:'电话',url:'网址',json:'JSON',select:'单选下拉框',multi:'多选下拉框',user:'用户关联',relation:'对象关联',formula:'公式',auto:'自动编号'};
  const generatedFieldName = label.trim().normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'') || 'custom_field_' + (fields.length + 1);
  const addField = async () => {
    if (!label.trim()) return;
    const fieldKey = generatedFieldName;
    if (fields.some((field)=>field.name===fieldKey)) return;
    const options=['select','multi'].includes(fieldType)?optionsText.split(',').map((value)=>value.trim()).filter(Boolean):[];
    if(['select','multi'].includes(fieldType)&&!options.length){setFieldError('单选或多选字段至少需要一个选项。');return;}
    let validationRules={};
    try{
      validationRules=validationRulesText.trim()?JSON.parse(validationRulesText):{};
      if(!validationRules||Array.isArray(validationRules)||typeof validationRules!=='object')throw new Error('校验规则必须是 JSON 对象。');
    }catch(error){setFieldError(error?.message||'校验规则 JSON 格式不正确。');return;}
    const nextField={name:fieldKey,label:label.trim(),type:typeLabels[fieldType],required,unique,isSystem:false,options,defaultValue,validationRules,searchable,filterable,readonly:readOnly};
    if(supabaseConfigured){
      try{
        const saved=await createFieldDefinition(objectName,{name:fieldKey,label:label.trim(),type:fieldType,required,unique,options,defaultValue,validationRules,searchable,filterable,readonly:readOnly});
        setFields((prev)=>[...prev,{...nextField,id:saved.id}]);
        setFieldError('');
      }catch(error){setFieldError(error?.message||'字段保存失败，请检查工作空间权限。');return;}
    }else setFields((prev)=>[...prev,nextField]);
    setLabel('');setRequired(false);setUnique(false);setOptionsText('');setDefaultValue('');setValidationRulesText('{}');setSearchable(true);setFilterable(true);setReadOnly(false);
  };
  const removeField = async (field) => {
    if(field.isSystem)return;
    if(field.id&&supabaseConfigured){
      try{await deleteFieldDefinition(field.id);setFieldError('');}
      catch(error){setFieldError(error?.message||'字段删除失败，请检查权限。');return;}
    }
    setFields((prev)=>prev.filter((item)=>item.name!==field.name));
  };
  return <div className="bm-field-config">
    <div className="bm-config-toolbar"><div><h2>对象字段</h2><p>{supabaseConfigured?'字段定义将保存至当前工作空间；字段值验证仍需后端规则执行。':'当前为本地演示模式；配置 Supabase 后可持久化自定义字段定义。'}</p></div><Select id="bm-object" labelText="业务对象" value={objectName} onChange={(e)=>{const next=e.target.value;setObjectName(next);setFields((fieldsByObject[next]||fieldsByObject.account).map((field)=>({...field,isSystem:true})));setOptionsText('');setDefaultValue('');setValidationRulesText('{}');setRequired(false);setUnique(false);setSearchable(true);setFilterable(true);setReadOnly(false);}}><SelectItem value="account" text="客户账户 Account"/><SelectItem value="contact" text="联系人 Contact"/><SelectItem value="lead" text="线索 Lead"/><SelectItem value="opportunity" text="商机 Opportunity"/><SelectItem value="quote" text="报价 Quote"/><SelectItem value="order" text="销售订单 Sales Order"/></Select></div>
    {fieldError&&<InlineNotification kind="warning" lowContrast title="字段配置提示" subtitle={fieldError}/>}<div className="bm-field-list"><div className="bm-field-head"><span>字段标签</span><span>API 名称</span><span>类型</span><span>规则</span><span>操作</span></div>
      {fields.map((field,index)=><div className="bm-field-row" key={field.name}><div><strong>{field.label}</strong><small>{field.required?'必填':'可选'}{field.unique?' · 唯一':''}{field.readonly?' · 只读':''}{field.searchable===false?' · 不可搜索':''}{field.filterable===false?' · 不可筛选':''}</small>{field.options?.length>0&&<small>选项：{field.options.join('、')}</small>}</div><code>{field.name}</code><span>{field.type}</span><span>{field.required?<Tag type="red">必填</Tag>:<Tag type="cool-gray">可选</Tag>}{field.unique&&<Tag type="blue">唯一</Tag>}</span><Button kind="ghost" size="sm" hasIconOnly renderIcon={TrashCan} iconDescription="删除字段" disabled={field.isSystem} onClick={()=>removeField(field)}/></div>)}
    </div>
    <div className="bm-add-field"><h3>新增字段</h3><div className="bm-field-form">
      <TextInput id="bm-field-label" labelText="字段标签" value={label} onChange={(e)=>setLabel(e.target.value)} placeholder="例如：客户优先级"/>
      <div className="bm-generated-api"><span>API 名称（自动生成）</span><code>{generatedFieldName}</code></div>
      <Select id="bm-field-type" labelText="字段类型" value={fieldType} onChange={(e)=>setFieldType(e.target.value)}>{Object.entries(typeLabels).map(([value,text])=><SelectItem key={value} value={value} text={text}/>)}</Select>
      {['select','multi'].includes(fieldType)&&<TextInput id="bm-field-options" labelText="下拉选项（逗号分隔）" value={optionsText} onChange={(e)=>setOptionsText(e.target.value)} placeholder="例如：高,中,低"/>}
      <TextInput id="bm-field-default" labelText="默认值（可选）" value={defaultValue} onChange={(e)=>setDefaultValue(e.target.value)} placeholder="默认值"/>
      <TextArea id="bm-field-validation" labelText="校验规则 JSON" value={validationRulesText} onChange={(e)=>setValidationRulesText(e.target.value)} rows={2}/>
    </div><div className="bm-field-checks"><Checkbox id="bm-required" labelText="必填字段" checked={required} onChange={(checked)=>setRequired(checked)}/><Checkbox id="bm-unique" labelText="唯一值" checked={unique} onChange={(checked)=>setUnique(checked)}/><Checkbox id="bm-searchable" labelText="可搜索" checked={searchable} onChange={(checked)=>setSearchable(checked)}/><Checkbox id="bm-filterable" labelText="可筛选" checked={filterable} onChange={(checked)=>setFilterable(checked)}/><Checkbox id="bm-readonly" labelText="只读字段" checked={readOnly} onChange={(checked)=>setReadOnly(checked)}/><Button renderIcon={Add} onClick={addField} disabled={!label.trim()||fields.some((field)=>field.name===generatedFieldName)}>添加字段</Button></div></div>
  </div>;
}

function AnalyticsPanel() {
  const bars = [['AI 获客',78],['官网',62],['合作伙伴',48],['活动营销',35],['人工录入',22]];
  return <div className="bm-analytics"><div className="bm-analytics-grid"><Tile><span className="bm-muted">线索总量</span><strong>1,248</strong><small>演示数据</small></Tile><Tile><span className="bm-muted">线索转化率</span><strong>18.6%</strong><small>演示数据</small></Tile><Tile><span className="bm-muted">平均销售周期</span><strong>34 天</strong><small>演示数据</small></Tile><Tile><span className="bm-muted">加权商机金额</span><strong>€428k</strong><small>演示数据</small></Tile></div><Tile className="bm-chart-tile"><h2>线索来源表现</h2><p>按来源比较线索贡献（示例指数）</p>{bars.map(([name,value])=><div className="bm-bar-row" key={name}><span>{name}</span><div><i style={{width:value+'%'}}/></div><strong>{value}</strong></div>)}</Tile><Tile className="bm-chart-tile"><h2>销售漏斗</h2><p>从初步接洽到成交的阶段分布（示例数据）</p><div className="bm-funnel">{[['初步接洽',100],['需求确认',76],['方案评估',54],['报价阶段',32],['成交',18]].map(([label,value])=><div key={label} style={{width:value+'%'}}><span>{label}</span><strong>{value}%</strong></div>)}</div></Tile></div>;
}

function WorkflowPanel() {
  const [steps,setSteps] = useState([{id:1,type:'trigger',label:'触发：新线索创建'},{id:2,type:'condition',label:'条件：线索评分 ≥ 70'},{id:3,type:'action',label:'动作：分配负责人并发送提醒'}]);
  return <div className="bm-workflow"><div className="bm-workflow-head"><div><h2>工作流设计器</h2><p>使用可视化步骤定义跨模块自动化。</p></div><Button renderIcon={Add} onClick={()=>setSteps((prev)=>[...prev,{id:Date.now(),type:'action',label:'动作：更新业务记录'}])}>添加步骤</Button></div>{steps.map((step,index)=><div className="bm-workflow-step" key={step.id}><div className={'bm-step-number '+step.type}>{index+1}</div><div><strong>{step.label}</strong><small>{step.type==='trigger'?'事件触发器':step.type==='condition'?'业务条件':'执行动作'}</small></div><Button kind="ghost" hasIconOnly renderIcon={TrashCan} iconDescription="移除步骤" onClick={()=>setSteps((prev)=>prev.filter((x)=>x.id!==step.id))}/></div>)}<InlineNotification kind="info" lowContrast title="执行器尚未连接" subtitle="当前为前端交互原型，不会执行外部操作或修改真实业务数据。"/></div>;
}

function SettingsPanel({type}) {
  const [saved,setSaved] = useState(false);
  const [region,setRegion] = useState('eu');
  const [language,setLanguage] = useState('zh-CN');
  const [timezone,setTimezone] = useState('Europe/Warsaw');
  const [provider,setProvider] = useState('serper-tavily');
  if(type==='integrations') return <div className="bm-settings-grid">{[['Serper','搜索发现 API','未连接'],['Tavily','网页研究与内容提取','未连接'],['Workers API','流程编排与服务端代理','未连接'],['Supabase','身份、数据库与存储','需检查配置']].map(([name,desc,status])=><Tile className="bm-integration" key={name}><div className="bm-integration-head"><strong>{name}</strong><Tag type="cool-gray">{status}</Tag></div><p>{desc}</p><Button kind="tertiary" renderIcon={Settings} onClick={()=>setSaved(true)}>配置连接</Button></Tile>)}{saved&&<InlineNotification kind="info" lowContrast title="连接配置尚未保存" subtitle="请在服务端接入后安全保存密钥；不要将 API Key 写入前端。"/>}</div>;
  if(type==='users') return <div className="bm-settings-grid">{[['系统管理员','管理员','全部模块'],['销售团队 A','销售经理','客户与销售'],['营销运营','营销分析师','AI 获客与报表']].map(([name,role,scope])=><Tile className="bm-user-tile" key={name}><div className="bm-user-avatar">{name.slice(0,1)}</div><div><strong>{name}</strong><p>{role}</p><small>{scope}</small></div><Button kind="ghost" hasIconOnly renderIcon={Edit} iconDescription="编辑用户" onClick={()=>setSaved(true)}/></Tile>)}{saved&&<InlineNotification kind="info" lowContrast title="权限管理待接入" subtitle="用户列表为示例数据，权限更改尚未写入服务端。"/>}</div>;
  return <div className="bm-settings-form"><h2>工作空间默认值</h2><p>以选项为主，统一组织地区、语言与时区。</p><div className="bm-field-form"><Select id="bm-region" labelText="默认地区" value={region} onChange={(e)=>setRegion(e.target.value)}><SelectItem value="eu" text="欧洲"/><SelectItem value="na" text="北美"/><SelectItem value="apac" text="亚太地区"/><SelectItem value="global" text="全球"/></Select><Select id="bm-language" labelText="界面语言" value={language} onChange={(e)=>setLanguage(e.target.value)}><SelectItem value="zh-CN" text="简体中文"/><SelectItem value="en" text="English"/><SelectItem value="pl" text="Polski"/></Select><Select id="bm-timezone" labelText="默认时区" value={timezone} onChange={(e)=>setTimezone(e.target.value)}><SelectItem value="Europe/Warsaw" text="Europe/Warsaw"/><SelectItem value="Europe/Berlin" text="Europe/Berlin"/><SelectItem value="UTC" text="UTC"/></Select></div><Button renderIcon={Save} onClick={()=>setSaved(true)}>保存偏好</Button>{saved&&<InlineNotification kind="success" lowContrast title="偏好已在当前页面暂存" subtitle="后端持久化尚未连接。"/>}</div>;
}

function AssistantPanel() {
  const [prompt,setPrompt] = useState('');
  const [answer,setAnswer] = useState('');
  return <div className="bm-assistant"><div className="bm-assistant-intro"><div className="bm-ai-mark">AI</div><div><h2>你的业务 AI 助手</h2><p>基于 CRM 上下文生成研究提纲、客户摘要和销售行动草稿。</p></div></div><div className="bm-prompt-chips">{['总结本周高意向线索','找出即将到期的商机','生成客户跟进邮件草稿'].map(x=><button key={x} onClick={()=>setPrompt(x)}>{x}<ArrowUpRight size={16}/></button>)}</div><TextArea id="bm-assistant-prompt" labelText="向 Astrion 提问" value={prompt} onChange={(e)=>setPrompt(e.target.value)} placeholder="例如：总结评分最高的 10 个潜客，并列出每个评分的证据来源。" rows={4}/><Button renderIcon={ArrowUpRight} onClick={()=>setAnswer(prompt.trim()?'AI Gateway 尚未连接。已保留你的问题在当前界面，未发送到外部服务。':'请先输入问题。')}>生成草稿</Button>{answer&&<InlineNotification kind="info" lowContrast title="AI 服务未连接" subtitle={answer}/>}</div>;
}

function BoardPanel() {
  const columns = [['初步接洽',[['OPP-00311','销售自动化','Meridian Commerce','€18,000']]],['需求确认',[['OPP-00313','数据整合项目','BluePeak Systems','€42,500']]],['方案评估',[['OPP-00314','企业 CRM 平台','Northstar Industries','€84,000']]],['报价阶段',[['OPP-00312','客户服务升级','Asterion Medical','€26,000']]],['成交',[]]];
  return <div className="bm-board">{columns.map(([stage,items])=><section className="bm-board-column" key={stage}><div className="bm-board-title"><strong>{stage}</strong><Tag type="cool-gray">{items.length}</Tag></div>{items.map(([id,name,account,value])=><article className="bm-opportunity-card" key={id}><small>{id}</small><strong>{name}</strong><span>{account}</span><b>{value}</b><div><Tag type="blue">进行中</Tag></div></article>)}{!items.length&&<div className="bm-board-empty">暂无记录</div>}</section>)}</div>;
}

function parseCsvFile(text) {
  const source=text.replace(/^\uFEFF/,'');
  const rows=[];
  let row=[],cell='',quoted=false;
  for(let index=0;index<source.length;index++){
    const char=source[index];
    if(char==='"'){
      if(quoted&&source[index+1]==='"'){cell+='"';index++;}
      else quoted=!quoted;
    }else if(char===','&&!quoted){row.push(cell);cell='';}
    else if((char==='\n'||char==='\r')&&!quoted){
      if(char==='\r'&&source[index+1]==='\n')index++;
      row.push(cell);
      if(row.some((value)=>value.trim()!==''))rows.push(row);
      row=[];cell='';
    }else cell+=char;
  }
  if(cell!==''||row.length){row.push(cell);if(row.some((value)=>value.trim()!==''))rows.push(row);}
  return rows;
}

const IMPORT_OBJECTS=[
  {path:'/crm/accounts',label:'客户账户'},
  {path:'/crm/contacts',label:'联系人'},
  {path:'/crm/leads',label:'线索'},
  {path:'/sales/opportunities',label:'商机'},
  {path:'/sales/quotes',label:'报价'},
  {path:'/orders/list',label:'销售订单'},
];

function CsvImportPanel({setNotice}) {
  const [objectPath,setObjectPath]=useState('/crm/accounts');
  const [headers,setHeaders]=useState([]);
  const [csvRows,setCsvRows]=useState([]);
  const [mapping,setMapping]=useState([]);
  const [fileName,setFileName]=useState('');
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  const [result,setResult]=useState(null);
  const fields=getCrmImportFields(objectPath);
  const autoMap=(header,path=objectPath)=>{
    const available=getCrmImportFields(path);
    return available.find((field)=>field.key.toLowerCase()===header.trim().toLowerCase()||field.label===header.trim())?.key||'__ignore__';
  };
  const handleObjectChange=(next)=>{
    setObjectPath(next);
    setMapping(headers.map((header)=>autoMap(header,next)));
    setResult(null);
  };
  const handleFile=async(event)=>{
    const file=event.target.files?.[0];
    if(!file)return;
    setError('');setResult(null);
    try{
      const parsed=parseCsvFile(await file.text());
      if(parsed.length<2)throw new Error('CSV 文件至少需要一行表头和一行数据。');
      const nextHeaders=parsed[0].map((header)=>header.trim());
      if(nextHeaders.some((header)=>!header))throw new Error('CSV 表头不能包含空列名。');
      const nextRows=parsed.slice(1).filter((row)=>row.some((value)=>value.trim()!==''));
      if(!nextRows.length)throw new Error('CSV 文件没有数据行。');
      setHeaders(nextHeaders);setCsvRows(nextRows);setMapping(nextHeaders.map((header)=>autoMap(header)));
      setFileName(file.name);
    }catch(err){setError(err?.message||'CSV 文件解析失败。');setHeaders([]);setCsvRows([]);setMapping([]);}
  };
  const handleImport=async()=>{
    if(!supabaseConfigured){setError('请先配置 Supabase URL 与 publishable/anon key，并登录到工作空间。');return;}
    if(!csvRows.length)return;
    const selected=mapping.filter((key)=>key!=='__ignore__');
    if(new Set(selected).size!==selected.length){setError('同一个目标字段不能映射多个 CSV 列。');return;}
    if(!selected.length){setError('至少映射一列到 CRM 字段。');return;}
    const records=csvRows.map((row)=>Object.fromEntries(mapping.map((target,index)=>[target,row[index]??'']).filter(([target])=>target!=='__ignore__')));
    setBusy(true);setError('');
    try{
      const imported=await importCrmRows(objectPath,records);
      setResult(imported);
      setNotice(`CSV 导入完成：成功 ${imported.imported} 条，失败 ${imported.failed} 条。`);
    }catch(err){setError(err?.message||'导入失败，请检查工作空间权限和字段映射。');}
    finally{setBusy(false);}
  };
  return <div className="bm-import-panel">
    <div className="bm-import-intro"><div><h2>CSV 数据导入</h2><p>先选择目标对象，再映射列。编号、工作空间与创建人由系统生成；关联字段必须使用同一工作空间内的 UUID。</p></div><Tag type={supabaseConfigured?'green':'cool-gray'}>{supabaseConfigured?'Supabase 已配置':'演示环境'}</Tag></div>
    {!supabaseConfigured&&<InlineNotification kind="warning" lowContrast title="尚未连接数据库" subtitle="当前无法写入真实 CRM。配置 Supabase 环境变量并登录后即可导入。"/>}
    <div className="bm-import-controls"><Select id="bm-import-object" labelText="导入到业务对象" value={objectPath} onChange={(event)=>handleObjectChange(event.target.value)}>{IMPORT_OBJECTS.map((item)=><SelectItem key={item.path} value={item.path} text={item.label}/>)}</Select><div className="bm-import-file"><label htmlFor="bm-import-file">选择 CSV 文件</label><input id="bm-import-file" type="file" accept=".csv,text/csv" onChange={handleFile}/>{fileName&&<span>{fileName}</span>}</div></div>
    {headers.length>0&&<><div className="bm-import-summary"><strong>{csvRows.length} 行数据</strong><span>预览前 5 行；未映射列将被忽略。</span></div><div className="bm-import-mapping"><div className="bm-import-section-title">列映射</div>{headers.map((header,index)=><div className="bm-import-map-row" key={`${header}-${index}`}><strong>{header}</strong><Select id={`bm-import-map-${index}`} labelText="映射到字段" hideLabel value={mapping[index]||'__ignore__'} onChange={(event)=>setMapping((prev)=>prev.map((value,i)=>i===index?event.target.value:value))}><SelectItem value="__ignore__" text="忽略此列"/>{fields.map((field)=><SelectItem key={field.key} value={field.key} text={`${field.label} · ${field.key}`}/>)}</Select></div>)}</div><div className="bm-import-preview"><div className="bm-import-section-title">数据预览</div><div className="bm-import-preview-scroll"><table><thead><tr>{headers.map((header,index)=><th key={index}>{header}</th>)}</tr></thead><tbody>{csvRows.slice(0,5).map((row,rowIndex)=><tr key={rowIndex}>{headers.map((_,columnIndex)=><td key={columnIndex}>{row[columnIndex]??''}</td>)}</tr>)}</tbody></table></div></div><Button renderIcon={Add} disabled={busy||!supabaseConfigured} onClick={handleImport}>{busy?'正在导入…':`导入 ${csvRows.length} 行`}</Button></>}
    {error&&<InlineNotification kind="error" lowContrast title="导入未完成" subtitle={error}/>}
    {result&&<div className="bm-import-result"><InlineNotification kind={result.failed?'warning':'success'} lowContrast title="导入结果" subtitle={`成功 ${result.imported} 条，失败 ${result.failed} 条。每一行独立提交，失败行不会回滚已成功的记录。`}/>{result.errors.length>0&&<ul>{result.errors.slice(0,20).map((item,index)=><li key={index}>第 {item.row} 行：{item.message}</li>)}</ul>}</div>}
  </div>;
}

export default function BusinessModulePage({path,navigate,setNotice,notice}) {
  const config = records[path] || {title:path.split('/').filter(Boolean).slice(-1)[0]?.replace(/[-_]/g,' ') || '工作总览',description:'企业业务模块工作区。',columns:defaultColumns,rows:defaultRows};
  const [createOpen,setCreateOpen] = useState(false);
  const [detailOpen,setDetailOpen] = useState(false);
  const [selectedRecord,setSelectedRecord] = useState(null);
  const [editValue,setEditValue] = useState('');
  const [editBusy,setEditBusy] = useState(false);
  const [customFields,setCustomFields] = useState([]);
  const [customFieldsLoading,setCustomFieldsLoading] = useState(false);
  const [customFieldsSaving,setCustomFieldsSaving] = useState(false);
  const [draft,setDraft] = useState({name:'',type:'standard',owner:'team-a',status:'new',industry:'software'});
  const [created,setCreated] = useState([]);
  const [persistentConfig,setPersistentConfig] = useState(null);
  const [persistentError,setPersistentError] = useState('');
  const [loadingRecords,setLoadingRecords] = useState(false);
  const [showArchived,setShowArchived] = useState(false);
  const persistentSupported = supportsPersistentRecords(path);
  const displayColumns = persistentConfig?.columns || config.columns || defaultColumns;
  const openRecord = async (row) => {
    setSelectedRecord({
      id:row.id,
      isArchived:Boolean(row.isArchived),
      editName:row.recordName,
      values:displayColumns.map((label,index)=>({label,value:row[String(index)]??'—'})),
    });
    setEditValue(typeof row.recordName==='string'?row.recordName:'');
    setCustomFields([]);
    setDetailOpen(true);
    if(persistentConfig?.supportsCustomFields&&supabaseConfigured){
      setCustomFieldsLoading(true);
      try{setCustomFields(await listRecordCustomFields(path,row.id));}
      catch(error){setNotice(error?.message||'自定义字段加载失败。');}
      finally{setCustomFieldsLoading(false);}
    }
  };
  const reloadPersistentRecords = async () => { const result = await listCrmRecords(path,{includeArchived:showArchived}); setPersistentConfig(result); setPersistentError(''); };
  const changeCustomField = (fieldId,value) => setCustomFields((prev)=>prev.map((field)=>field.id===fieldId?{...field,value,dirty:true}:field));
  const saveCustomFields = async () => {
    if(!selectedRecord?.id)return;
    const missing=customFields.find((field)=>field.required&&!field.readonly&&(field.value===null||field.value===undefined||field.value===''||(Array.isArray(field.value)&&!field.value.length)));
    if(missing){setNotice(`请填写必填字段“${missing.label}”。`);return;}
    const dirty=customFields.filter((field)=>field.dirty);
    if(!dirty.length)return;
    setCustomFieldsSaving(true);
    try{
      for(const field of dirty)await saveRecordCustomField(path,selectedRecord.id,field,field.value);
      setCustomFields((prev)=>prev.map((field)=>({...field,dirty:false,hasValue:true})));
      setNotice(`已保存 ${dirty.length} 个自定义字段。`);
    }catch(error){setNotice(error?.message||'自定义字段保存失败，请检查字段规则与工作空间权限。');}
    finally{setCustomFieldsSaving(false);}
  };
  const renderCustomField = (field) => {
    const disabled=Boolean(field.readonly)||['formula','auto_number'].includes(field.fieldType);
    const displayValue=field.value===null||field.value===undefined?'':Array.isArray(field.value)?field.value.join(', '):typeof field.value==='object'?JSON.stringify(field.value,null,2):String(field.value);
    const label=`${field.label}${field.required?' *':''}`;
    if(field.fieldType==='boolean')return <Checkbox id={`cf-${field.id}`} labelText={label} checked={Boolean(field.value)} disabled={disabled} onChange={(checked)=>changeCustomField(field.id,checked)}/>;
    if(field.fieldType==='single_select')return <Select id={`cf-${field.id}`} labelText={label} value={displayValue} disabled={disabled} onChange={(event)=>changeCustomField(field.id,event.target.value)}><SelectItem value="" text="请选择"/>{field.options.map((option)=><SelectItem key={option} value={option} text={option}/>)}</Select>;
    if(field.fieldType==='multi_select')return <TextInput id={`cf-${field.id}`} labelText={`${label}（逗号分隔）`} value={displayValue} disabled={disabled} onChange={(event)=>changeCustomField(field.id,event.target.value)}/>;
    if(field.fieldType==='long_text'||field.fieldType==='json')return <TextArea id={`cf-${field.id}`} labelText={label} value={displayValue} disabled={disabled} onChange={(event)=>changeCustomField(field.id,event.target.value)} rows={2}/>;
    const inputType=['number','decimal','currency'].includes(field.fieldType)?'number':field.fieldType==='date'?'date':field.fieldType==='datetime'?'datetime-local':field.fieldType==='email'?'email':field.fieldType==='url'?'url':field.fieldType==='phone'?'tel':'text';
    return <TextInput id={`cf-${field.id}`} labelText={label} value={displayValue} type={inputType} disabled={disabled} onChange={(event)=>changeCustomField(field.id,event.target.value)}/>;
  };
  const handleArchive = async () => {
    if(!selectedRecord?.id)return;
    try{
      await archiveCrmRecord(path,selectedRecord.id);
      await reloadPersistentRecords();
      setDetailOpen(false);
      setNotice('记录已归档，并从默认列表中隐藏。');
    }catch(error){setNotice(error?.message||'归档失败，请检查工作空间权限。');}
  };
  const confirmArchive = () => {
    if(window.confirm('确认归档此记录？归档后它将从默认列表中隐藏。')) void handleArchive();
  };
  const handleRestore = async (recordId) => {
    try {
      await restoreCrmRecord(path,recordId);
      const result = await listCrmRecords(path,{includeArchived:showArchived});
      setPersistentConfig(result);
      setPersistentError('');
      setNotice('记录已恢复，并重新显示在 CRM 列表中。');
    } catch (error) {
      setNotice(error?.message || '恢复失败，请检查工作空间权限。');
    }
  };
  const saveRecordEdit = async () => {
    if(!selectedRecord?.id)return;
    setEditBusy(true);
    try{
      await updateCrmRecord(path,selectedRecord.id,editValue);
      await reloadPersistentRecords();
      setDetailOpen(false);
      setNotice('记录主字段已保存到 CRM 数据库。');
    }catch(error){setNotice(error?.message||'更新失败，请检查记录状态与工作空间权限。');}
    finally{setEditBusy(false);}
  };
  const handleLeadStatus = async (recordId,status) => {
    try{
      await setLeadStatus(recordId,status);
      await reloadPersistentRecords();
      setNotice(status==='qualified'?'线索已标记为合格，可继续转化为客户。':'线索已标记为排除。');
    }catch(error){setNotice(error?.message||'线索状态更新失败，请检查工作空间权限。');}
  };
  const handleConvert = async (recordId) => {
    try {
      if (['/crm/leads','/acquisition/review','/acquisition/scoring','/acquisition/research'].includes(path)) { await convertLeadToAccount(recordId); setNotice('线索已通过原子业务事务转化为客户账户与联系人。'); }
      else if (path === '/sales/quotes') { await convertQuoteToOrder(recordId); setNotice('报价已通过原子业务事务转化为销售订单。'); }
      await reloadPersistentRecords();
    } catch (error) { setNotice(error?.message || '业务转化失败，请检查状态、权限和数据库迁移。'); }
  };
  useEffect(() => {
    let active = true;
    if (!persistentSupported || !supabaseConfigured) {
      setPersistentConfig(null);
      setPersistentError('');
      return () => { active = false; };
    }
    setLoadingRecords(true);
    listCrmRecords(path,{includeArchived:showArchived})
      .then((result) => { if (active) { setPersistentConfig(result); setPersistentError(''); } })
      .catch((error) => { if (active) { setPersistentConfig(null); setPersistentError(error?.message || 'CRM 数据读取失败'); } })
      .finally(() => { if (active) setLoadingRecords(false); });
    return () => { active = false; };
  }, [path, persistentSupported, showArchived]);
  const saveDraft = async () => {
    if(!draft.name.trim()){setNotice('请填写记录名称。');return;}
    if (persistentSupported && supabaseConfigured) {
      try {
        await createCrmRecord(path, draft.name);
        const result = await listCrmRecords(path,{includeArchived:showArchived});
        setPersistentConfig(result);
        setPersistentError('');
        setCreateOpen(false);
        setDraft((prev)=>({...prev,name:''}));
        setNotice('记录已保存到 CRM 数据库。');
      } catch (error) {
        setNotice(error?.message || '保存失败。请检查登录状态、组织成员资格及数据库迁移。');
      }
      return;
    }
    setCreated((prev)=>[{...draft,id:'NEW-'+String(prev.length+1).padStart(4,'0')},...prev]);
    setCreateOpen(false);
    setNotice('记录已添加到当前页面的本地演示列表，尚未保存到服务端。');
  };
  const title = config.title;
  return <div className="bm-page">
    <div className="bm-breadcrumb"><span>工作空间</span><ChevronRight size={12}/><span>{title}</span></div>
    <div className="bm-page-heading"><div><div className="bm-eyebrow">ASTRION BUSINESS PLATFORM</div><h1>{title}</h1><p>{config.description}</p></div>{path!=='/data/import-export'&&<div className="bm-heading-actions"><Button kind="tertiary" renderIcon={Download} onClick={()=>setNotice('请在数据列表中使用“导出筛选结果”。')}>导出</Button>{config.canCreate!==false&&<Button renderIcon={Add} onClick={()=>setCreateOpen(true)}>新建</Button>}</div>}</div>
    {notice&&<InlineNotification className="bm-notice" kind="info" lowContrast title="提示" subtitle={notice} onCloseButtonClick={()=>setNotice('')}/>}
    {path==='/data/import-export'&&<CsvImportPanel setNotice={setNotice}/>}
    {config.metrics&&<div className="bm-metrics">{config.metrics.map(([label,value,foot])=><Metric key={label} label={label} value={value} foot={foot}/>)}</div>}
    {config.shortcuts&&<div className="bm-dashboard-grid"><Tile className="bm-shortcut-tile"><div className="bm-section-heading"><div><h2>快捷入口</h2><p>常用业务对象与配置</p></div><Launch size={20}/></div><div className="bm-shortcut-grid">{config.shortcuts.map(([label,route])=><button key={route} onClick={()=>navigate(route)}><span>{label}</span><ChevronRight size={18}/></button>)}</div></Tile><Tile className="bm-shortcut-tile"><div className="bm-section-heading"><div><h2>业务流程</h2><p>从目标发现到收入确认</p></div><Flow size={20}/></div><div className="bm-process-flow">{['AI 获客','线索','客户','商机','报价','订单'].map((label,i)=><button key={label} onClick={()=>navigate(['/acquisition/discovery','/crm/leads','/crm/accounts','/sales/opportunities','/sales/quotes','/orders/list'][i])}><span>{i+1}</span>{label}</button>)}</div></Tile><Tile className="bm-shortcut-tile"><div className="bm-section-heading"><div><h2>最近更新</h2><p>演示记录，不代表生产数据</p></div><Time size={20}/></div><div className="bm-recent-list">{[['客户账户','Northstar Industries','今天 08:30'],['商机','企业 CRM 平台','今天 08:12'],['线索','数字化升级需求','今天 07:55']].map((x)=><div key={x[1]}><span><strong>{x[1]}</strong><small>{x[0]}</small></span><time>{x[2]}</time></div>)}</div></Tile></div>}
    {config.board&&<BoardPanel/>}
    {config.analytics&&<AnalyticsPanel/>}
    {config.fields&&<FieldConfiguration/>}
    {config.workflows&&<WorkflowPanel/>}
    {config.assistant&&<AssistantPanel/>}
    {config.settings&&<SettingsPanel type="workspace"/>}
    {path==='/settings/users'&&<SettingsPanel type="users"/>}
    {config.integrations&&<SettingsPanel type="integrations"/>}
    {path!=='/data/import-export'&&config.columns&&<><div className="bm-list-summary"><div><strong>{persistentConfig?.count ?? config.rows?.length ?? 0} 条记录</strong><span> · {persistentConfig ? '数据库视图' : '默认视图'}</span></div><div><Tag type={persistentConfig ? 'green' : 'cool-gray'}>{persistentConfig ? '实时数据' : '演示数据'}</Tag><Button kind="ghost" renderIcon={Renew} size="sm" onClick={async()=>{if(persistentSupported&&supabaseConfigured){try{await reloadPersistentRecords();setNotice('CRM 数据已刷新。');}catch(error){setNotice(error?.message||'刷新失败。');}}else setNotice('当前列表已刷新演示数据。');}}>刷新</Button></div>{loadingRecords&&<InlineNotification kind="info" lowContrast title="正在读取 CRM 数据" subtitle="正在从工作空间数据库加载记录。"/>}{persistentError&&<InlineNotification kind="warning" lowContrast title="未能读取真实数据" subtitle={persistentError+'。下方展示的是演示数据，不会与数据库混淆。'}/>}</div><GenericTable config={{...config,path,columns:persistentConfig?.columns||config.columns,rows:persistentConfig?.rows||[...created.map(x=>[x.id,x.name,x.type,x.owner,x.status,new Date().toISOString().slice(0,10)]),...(config.rows||[])],isPersistent:Boolean(persistentConfig),recordIds:persistentConfig?.recordIds,recordNames:persistentConfig?.recordNames,recordArchivedFlags:persistentConfig?.recordArchivedFlags,includeArchived:showArchived,canCreate:persistentConfig?.canCreate??config.canCreate??true,canArchive:persistentConfig?.canArchive??false,supportsCustomFields:persistentConfig?.supportsCustomFields??false}} onConvert={handleConvert} onQualify={(id)=>handleLeadStatus(id,'qualified')} onDisqualify={(id)=>handleLeadStatus(id,'disqualified')} onRestore={handleRestore} onToggleArchived={setShowArchived} onOpenRecord={openRecord} onCreate={()=>setCreateOpen(true)}/></>}
    <div className="bm-page-foot"><span><DataBase size={14}/> Astrion 元数据驱动业务界面</span><span>核心 CRM 数据与获客服务已提供 Supabase 接入；其他模块按页面状态标记演示或待接入</span></div>
    <Modal open={createOpen} modalHeading="新建业务记录" primaryButtonText="保存草稿" secondaryButtonText="取消" onRequestClose={()=>setCreateOpen(false)} onRequestSubmit={saveDraft} size="md">
      <div className="bm-create-form"><TextInput id="bm-record-name" labelText="记录名称" value={draft.name} onChange={(e)=>setDraft((prev)=>({...prev,name:e.target.value}))} placeholder="输入名称"/>{(!persistentSupported||!supabaseConfigured)&&<><Select id="bm-record-type" labelText="记录类型" value={draft.type} onChange={(e)=>setDraft((prev)=>({...prev,type:e.target.value}))}><SelectItem value="standard" text="标准记录"/><SelectItem value="strategic" text="战略客户"/><SelectItem value="qualified" text="已资格审核"/><SelectItem value="partner" text="合作伙伴"/></Select><Select id="bm-record-owner" labelText="负责人" value={draft.owner} onChange={(e)=>setDraft((prev)=>({...prev,owner:e.target.value}))}><SelectItem value="team-a" text="销售团队 A"/><SelectItem value="team-b" text="销售团队 B"/><SelectItem value="marketing" text="营销运营"/><SelectItem value="system" text="系统管理员"/></Select><Select id="bm-record-status" labelText="状态" value={draft.status} onChange={(e)=>setDraft((prev)=>({...prev,status:e.target.value}))}><SelectItem value="new" text="新建"/><SelectItem value="review" text="待审核"/><SelectItem value="active" text="有效"/><SelectItem value="paused" text="暂停"/></Select><InlineNotification kind="info" lowContrast title="演示模式" subtitle="此操作仅更新当前页面状态，不会写入数据库。"/></>}{persistentSupported&&supabaseConfigured&&<InlineNotification kind="info" lowContrast title="数据库保存" subtitle="系统将生成业务编号并保存名称与必要默认字段；其他字段编辑将在后续表单中开放。"/>}</div>
    </Modal>
    <Modal open={detailOpen} modalHeading="记录详情" primaryButtonText="完成" onRequestClose={()=>setDetailOpen(false)} onRequestSubmit={()=>setDetailOpen(false)} size="md">
      {selectedRecord&&<div className="bm-record-detail"><div className="bm-record-detail-id"><span>记录 ID</span><code>{selectedRecord.id}</code></div><div className="bm-record-detail-grid">{selectedRecord.values.map((item,index)=><div key={index}><span>{item.label}</span><strong>{String(item.value??'—')}</strong></div>)}</div>{persistentConfig?.supportsCustomFields&&<section className="bm-custom-values"><div className="bm-custom-values-heading"><h3>自定义字段</h3><span>{customFields.length} 个字段</span></div>{customFieldsLoading?<InlineNotification kind="info" lowContrast title="正在加载自定义字段"/>:customFields.length===0?<p>当前对象尚未配置自定义字段。</p>:<><div className="bm-custom-values-grid">{customFields.map((field)=> <div key={field.id}>{renderCustomField(field)}</div>)}</div>{customFields.some((field)=>field.dirty)&&<Button renderIcon={Save} disabled={customFieldsSaving} onClick={saveCustomFields}>{customFieldsSaving?'正在保存…':'保存自定义字段'}</Button>}</>}</section>}{persistentConfig&&typeof selectedRecord.editName==='string'&&<div className="bm-record-edit"><TextInput id="bm-record-edit-name" labelText="编辑主字段" value={editValue} onChange={(event)=>setEditValue(event.target.value)}/><Button renderIcon={Save} disabled={editBusy||!editValue.trim()} onClick={saveRecordEdit}>{editBusy?'正在保存…':'保存更改'}</Button></div>}{persistentConfig?.canArchive&&!selectedRecord?.isArchived&&<Button kind="danger--tertiary" renderIcon={TrashCan} onClick={confirmArchive}>归档记录</Button>}<InlineNotification kind="info" lowContrast title={persistentConfig?'数据库记录':'演示记录'} subtitle={persistentConfig?'此版本支持查看与部分业务转化；编辑、删除和完整关联记录仍在开发中。':'这是示例记录，不会修改数据库。'}/></div>}
    </Modal>
  </div>;
}
