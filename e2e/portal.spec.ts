import { test, expect } from "@playwright/test"

test("@smoke 検索・ページ切り替え・URLの再読込", async ({ page }) => {
  const errors: string[] = []
  const external: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))
  page.on("request", (request) => {
    if (!request.url().startsWith("http://127.0.0.1:3127")) external.push(request.url())
  })
  await page.goto("/all")
  await expect(page.getByTestId("content-card")).toHaveCount(6)
  await page.getByRole("link", { name: "Go to next page" }).click()
  await expect(page).toHaveURL(/page=2/)
  await page.getByRole("textbox", { name: "コンテンツを検索" }).fill("架空ラジオ")
  await expect(page.getByTestId("content-card")).toHaveCount(3)
  await expect(page).toHaveURL(/q=/)
  await page.reload()
  await expect(page.getByTestId("content-card")).toHaveCount(3)
  await expect(page.getByRole("textbox", { name: "コンテンツを検索" })).toHaveValue("架空ラジオ")
  expect(errors).toEqual([])
  expect(external).toEqual([])
})

test("@smoke 固定したデモ日時で期限切れを除外", async ({ page }) => {
  await page.goto("/almost-over")
  await expect(page.getByText("デモ基準日時:", { exact: false })).toBeVisible()
  await expect(page.getByTestId("content-card")).toHaveCount(12)
  await expect(page.getByRole("heading", { name: "配信終了済みの架空番組" })).toHaveCount(0)
  await page.getByRole("textbox", { name: "コンテンツを検索" }).fill("存在しないサンプル")
  await expect(page.getByTestId("content-card")).toHaveCount(0)
  await expect(page.getByText("まもなく配信終了のコンテンツはありません")).toBeVisible()
})

test("@smoke お気に入りとテーマはブラウザ内で保持", async ({ page }) => {
  await page.goto("/all")
  await page.getByRole("button", { name: "推しメンを設定" }).click()
  const dialog = page.getByRole("dialog")
  await dialog.getByRole("button", { name: "朝陽あおい", exact: true }).click()
  await dialog.getByRole("button", { name: "1人を保存" }).click()
  await expect(page.getByRole("button", { name: "お気に入りで絞り込み中" })).toBeVisible()
  await expect(page.getByTestId("content-card")).toHaveCount(6)
  await expect(page).toHaveURL(/\/all$/)
  await page.getByRole("button", { name: "ダークモードに切り替え" }).click()
  await expect(page.locator("html")).toHaveClass(/dark/)
  await page.reload()
  await expect(page.getByRole("button", { name: "推しメン 1人" })).toBeVisible()
  await expect(page.locator("html")).toHaveClass(/dark/)
  await page.getByRole("button", { name: "お気に入りで絞り込み中" }).click()
  await expect(page.getByText("19件", { exact: true })).toBeVisible()
})

test("メンバー別URL・種別・メタデータ・404", async ({ page }) => {
  await page.goto("/all/member/sample-aoi?q=サンプルドラマ")
  await expect(page.getByTestId("content-card")).toHaveCount(2)
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/all\/member\/sample-aoi$/)
  const data = await page.locator('script[type="application/ld+json"]').first().textContent()
  expect(() => JSON.parse(data ?? "")).not.toThrow()
  await page.goto("/audio")
  await expect(page.getByTestId("content-card")).toHaveCount(3)
  const response = await page.goto("/all/member/unknown")
  expect(response?.status()).toBe(404)
})
