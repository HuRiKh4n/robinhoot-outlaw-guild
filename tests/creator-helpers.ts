import { expect, type Page } from '@playwright/test';
const category = (field: string) => field === 'PERSONALITY' ? 'Spirit' : field[0] + field.slice(1).toLowerCase();
export async function choose(page: Page, field: string, value: string) {
  await page.getByRole('tab', { name: new RegExp(`^${category(field)}\\b`) }).click();
  await page.getByRole('radio', { name: value, exact: true }).check();
}
export async function selected(page: Page, field: string, value: string) {
  await page.getByRole('tab', { name: new RegExp(`^${category(field)}\\b`) }).click();
  await expect(page.getByRole('radio', { name: value, exact: true })).toBeChecked();
}
