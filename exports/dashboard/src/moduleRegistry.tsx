import { lazy } from 'react';

export const OrdersModuleLazy = lazy(() =>
  import('./modules/orders/OrdersModule').then((module) => ({ default: module.OrdersModule })),
);

export const ProductsModuleLazy = lazy(() =>
  import('./modules/products/ProductsModule').then((module) => ({ default: module.ProductsModule })),
);

export const CustomersModuleLazy = lazy(() =>
  import('./modules/customers/CustomersModule').then((module) => ({ default: module.CustomersModule })),
);

export const MarketingModuleLazy = lazy(() =>
  import('./modules/marketing/MarketingModule').then((module) => ({ default: module.MarketingModule })),
);

export const FrontendModuleLazy = lazy(() =>
  import('./modules/frontend/FrontendModule').then((module) => ({ default: module.FrontendModule })),
);

export const ReportsModuleLazy = lazy(() =>
  import('./modules/reports/ReportsModule').then((module) => ({ default: module.ReportsModule })),
);

export const SettingsModuleLazy = lazy(() =>
  import('./modules/settings/SettingsModule').then((module) => ({ default: module.SettingsModule })),
);

export const WebsiteBuilderModuleLazy = lazy(() =>
  import('./modules/websiteBuilder/WebsiteBuilderModule').then((module) => ({ default: module.WebsiteBuilderModule })),
);

export const SuperadminModuleLazy = lazy(() =>
  import('./modules/superadmin/SuperadminModule').then((module) => ({ default: module.SuperadminModule })),
);
