import { Dashboard, MagicWand, UserMultiple, Bullseye, ShoppingCart, ChartLine, ChatBot, Settings } from '@carbon/icons-react';

export const astrionNavigation = [
  { label: '工作总览', path: '/dashboard', Icon: Dashboard },
  { label: 'AI 获客', path: '/acquisition', Icon: MagicWand, children: [
    { label: '获客任务', path: '/acquisition/tasks' },
    { label: '目标客户', path: '/acquisition/targets' },
    { label: '线索发现', path: '/acquisition/discovery' },
  ]},
  { label: '客户管理', path: '/crm', Icon: UserMultiple, children: [
    { label: '线索', path: '/crm/leads' },
    { label: '联系人', path: '/crm/contacts' },
    { label: '公司 / 客户', path: '/crm/accounts' },
  ]},
  { label: '销售管道', path: '/sales', Icon: Bullseye, children: [
    { label: '商机看板', path: '/sales/board' },
    { label: '商机列表', path: '/sales/opportunities' },
    { label: '报价管理', path: '/sales/quotes' },
  ]},
  { label: '订单与履约', path: '/orders', Icon: ShoppingCart, children: [
    { label: '订单管理', path: '/orders/list' },
    { label: '发货与履约', path: '/orders/fulfillment' },
    { label: '收款记录', path: '/orders/payments' },
  ]},
  { label: '分析报表', path: '/analytics', Icon: ChartLine, children: [
    { label: '获客分析', path: '/analytics/acquisition' },
    { label: '销售漏斗', path: '/analytics/funnel' },
    { label: '收入分析', path: '/analytics/revenue' },
  ]},
  { label: 'AI 工作台', path: '/ai', Icon: ChatBot, children: [
    { label: 'AI 助手', path: '/ai/assistant' },
    { label: '自动化工作流', path: '/ai/workflows' },
    { label: '执行记录', path: '/ai/runs' },
  ]},
  { label: '系统设置', path: '/settings', Icon: Settings, children: [
    { label: '工作空间', path: '/settings/workspace' },
    { label: '用户与权限', path: '/settings/users' },
    { label: '集成配置', path: '/settings/integrations' },
  ]},
];
