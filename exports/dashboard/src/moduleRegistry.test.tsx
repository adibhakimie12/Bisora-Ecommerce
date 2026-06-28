import test from 'node:test';
import assert from 'node:assert/strict';

import {
  CustomersModuleLazy,
  FrontendModuleLazy,
  MarketingModuleLazy,
  OrdersModuleLazy,
  ProductsModuleLazy,
  ReportsModuleLazy,
  SettingsModuleLazy,
  WebsiteBuilderModuleLazy,
} from './moduleRegistry';

const lazySymbol = Symbol.for('react.lazy');

test('major admin modules are registered as lazy components for chunk splitting', () => {
  const modules = [
    OrdersModuleLazy,
    ProductsModuleLazy,
    CustomersModuleLazy,
    MarketingModuleLazy,
    FrontendModuleLazy,
    ReportsModuleLazy,
    SettingsModuleLazy,
    WebsiteBuilderModuleLazy,
  ];

  assert.equal(modules.length, 8);
  modules.forEach((component) => {
    assert.equal((component as { $$typeof?: symbol }).$$typeof, lazySymbol);
  });
});
