-- Add an explicit customer reference on sales orders for SAP-style order processing.
begin;
alter table public.crm_sales_orders
  add column if not exists customer_reference text;
commit;
