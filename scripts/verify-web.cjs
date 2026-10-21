const fs = require("fs");
const { chromium } = require("playwright");
const server = require("node:child_process").spawn(
  process.execPath,
  ["scripts/preview.cjs"],
  {
    stdio: "ignore",
    env: { ...process.env, PORT: process.env.NAILY_TEST_PORT || "9183" },
    windowsHide: true,
  },
);
const base = "http://127.0.0.1:" + (process.env.NAILY_TEST_PORT || "9183");
(async () => {
  await new Promise((r) => setTimeout(r, 800));
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.PLAYWRIGHT_CHANNEL
      ? { channel: process.env.PLAYWRIGHT_CHANNEL }
      : {}),
    args: ["--no-proxy-server"],
  });
  try {
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
    });
    const errors = [];
    page.on("console", (m) => {
      if (m.type() === "error") console.log("CONSOLE", m.text());
    });
    page.on("requestfailed", (r) =>
      console.log("FAILED", r.url(), r.failure()),
    );
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("dialog", (d) => d.accept());
    const go = async (path) => {
      await page.goto(base + path, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(500);
    };
    const contains = async (text) => {
      await page
        .getByText(text, { exact: false })
        .first()
        .waitFor({ state: "attached", timeout: 20000 });
    };
    await go("/");
    await contains("Naily");
    fs.mkdirSync("docs/screenshots", { recursive: true });
    await page.screenshot({ path: "docs/screenshots/home-mobile.png" });
    await go("/booking?designId=design-1");
    await contains("예약하기");
    await page.getByText("데모 예약 저장하기", { exact: true }).click();
    await contains("데모 예약을 저장했어요");
    await page.reload();
    await contains("예약하기");
    await page.getByText("데모 예약 저장하기", { exact: true }).click();
    let stored = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("naily.portfolio.v1")),
    );
    if (
      stored.reservations.filter((r) => r.id.startsWith("demo-")).length !== 1
    )
      throw Error("Booking duplicate or persistence failure");
    console.log("booking and duplicate pass");
    await go("/mypage");
    await page
      .getByRole("button", { name: "예약 취소", exact: true })
      .first()
      .click();
    stored = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("naily.portfolio.v1")),
    );
    if (
      stored.reservations.find((r) => r.id.startsWith("demo-")).status !==
      "cancelled"
    )
      throw Error("Cancel failed");
    await go("/settings");
    await page.getByLabel("닉네임", { exact: true }).fill("포트폴리오테스터");
    await page
      .getByRole("button", { name: "프로필 저장", exact: true })
      .click();
    await page.reload();
    if (
      (await page.getByLabel("닉네임", { exact: true }).inputValue()) !==
      "포트폴리오테스터"
    )
      throw Error("Profile persistence failed");
    console.log("profile pass");
    await go("/design/design-1");
    await page.getByLabel("디자인 저장", { exact: true }).click();
    await go("/mypage");
    await contains("복숭아 시럽 프렌치");
    await go("/write");
    await page
      .getByLabel("글 제목", { exact: true })
      .fill("재접속 검증용 네일 후기");
    await page.getByRole("button", { name: "등록", exact: true }).click();
    await page.waitForTimeout(600);
    await contains("재접속 검증용 네일 후기");
    await page.reload();
    await contains("재접속 검증용 네일 후기");
    console.log("write pass");
    await go("/inquiries?shopId=shop-1");
    await page
      .getByLabel("문의 내용", { exact: true })
      .fill("포트폴리오 문의 검증");
    await page
      .getByRole("button", { name: "문의 남기기", exact: true })
      .click();
    await page.reload();
    await contains("포트폴리오 문의 검증");
    await go("/inquiries?shopId=shop-1&owner=1");
    await page.getByLabel("답변", { exact: true }).fill("답변 검증");
    await page.getByRole("button", { name: "답변 저장", exact: true }).click();
    await go("/inquiries?shopId=shop-1");
    await contains("답변 검증");
    console.log("inquiries pass");
    await go("/booking?designId=design-1");
    await page.getByText("데모 예약 저장하기", { exact: true }).click();
    await contains("데모 예약을 저장했어요");
    await go("/shop-dashboard");
    await page.getByText("대시보드 미리보기", { exact: true }).click();
    await page
      .getByRole("button", { name: "예약 승인", exact: true })
      .first()
      .click();
    await page
      .getByRole("button", { name: "방문 완료", exact: true })
      .first()
      .click();
    stored = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("naily.portfolio.v1")),
    );
    if (
      !stored.reservations.some(
        (r) => r.id.startsWith("demo-") && r.status === "completed",
      )
    )
      throw Error("Approval/completion failed");
    await go("/shop-manage?kind=" + encodeURIComponent("공지 작성"));
    await page
      .getByLabel("샵 공지", { exact: true })
      .fill("포트폴리오 공지 검증");
    await page.getByRole("button", { name: "공지 저장", exact: true }).click();
    await go("/shop/shop-1");
    await contains("포트폴리오 공지 검증");
    await go("/shop-manage?kind=" + encodeURIComponent("리뷰 관리"));
    await page.getByRole("textbox").first().fill("리뷰 답변 검증");
    await page
      .getByRole("button", { name: "답변 저장", exact: true })
      .first()
      .click();
    await go("/shop/shop-1/reviews");
    await contains("리뷰 답변 검증");
    await page.screenshot({ path: "docs/screenshots/review-mobile.png" });

    for (const route of [
      "/search",
      "/shop/shop-1",
      "/shop/shop-1/reviews",
      "/shop/shop-1/gallery",
      "/shop/shop-1/map",
      "/shop/shop-1/account",
      "/shop/shop-1/designs",
      "/shop/shop-1/monthly-art",
      "/design-gallery?designId=design-1",
      "/shop-dashboard",
      "/shop-community",
      "/notifications",
      "/activity",
      "/shop-manage",
    ]) {
      await go(route);
      await page.waitForTimeout(100);
      if (
        (await page.locator("body").textContent()).includes("Unmatched Route")
      )
        throw Error("Unmatched " + route);
    }
    if (errors.length) throw Error(errors.join("\n"));
    console.log(
      JSON.stringify({
        booking: true,
        cancellation: true,
        profile: true,
        publishingReload: true,
        inquiries: true,
        routeSmoke: true,
        pageErrors: errors,
      }),
    );
  } finally {
    await browser.close();
  }
})()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => server.kill());
