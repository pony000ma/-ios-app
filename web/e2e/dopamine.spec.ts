import { expect, test } from '@playwright/test';

test('runs the dopamine delivery loop from browsing to reflection', async ({ page }) => {
  await page.goto('/?fast=1');
  await page.getByTestId('profile-tab').click();
  await page.getByPlaceholder('例如：今晚不点也很完整').fill('钱包守夜人');
  await page.getByTestId('register-profile').click();

  await page.getByRole('button', { name: /首页/ }).click();
  await page.getByTestId('restaurant-midnight-crispy-lab').click();
  await page.getByTestId('add-golden-chicken').click();
  await page.getByTestId('cart-tab').click();
  await page.getByTestId('begin-expectation').click();

  await expect(page.getByText('预计 8 分钟后仍然预计 8 分钟').first()).toBeVisible();
  await expect(page.getByTestId('finish-expectation')).toBeEnabled();
  await page.getByTestId('finish-expectation').click();

  await expect(page.getByRole('heading', { name: '你已经拥有了最快乐的那一部分' })).toBeVisible();
  await expect(page.getByTestId('wallet-rest')).toBeVisible();
});
