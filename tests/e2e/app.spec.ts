import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("home page introduces the product and reaches the system library", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/StackScope/);
  await expect(page.getByRole("heading", { level: 1, name: /See how software actually works/i })).toBeVisible();
  await page.getByRole("link", { name: "Browse all lessons" }).click();
  await expect(page).toHaveURL(/\/learn\/$/);
  await expect(page.getByRole("heading", { level: 1, name: /Choose a flow/i })).toBeVisible();
});

test("catalog searches lesson content and reports an empty state", async ({ page }) => {
  await page.goto("/learn/");
  const search = page.getByPlaceholder("Search a technology or scenario");
  await search.focus();
  await expect(search).toHaveCSS("outline-style", "solid");
  await search.fill("image");
  await expect(page.getByText("1 guided system")).toBeVisible();
  await expect(page.getByRole("heading", { name: "How is an uploaded image processed?" })).toBeVisible();
  await page.getByLabel("Filter by architecture layer").selectOption("queue");
  await expect(page.getByText("1 guided system")).toBeVisible();
  await page.getByLabel("Filter by architecture layer").selectOption("all");
  await page.getByRole("button", { name: "Level 3" }).click();
  await expect(page.getByText("No matching systems.")).toBeVisible();
  await page.getByRole("button", { name: "All levels" }).click();
  await search.fill("quantum submarine");
  await expect(page.getByText("No matching systems.")).toBeVisible();
});

test("architecture variants keep the visible flow and narration synchronized", async ({ page }) => {
  await page.goto("/learn/scaling-a-service/");
  await page.getByRole("button", { name: "Start-simple monolith" }).click();
  await expect(page.getByRole("heading", { level: 2, name: "Serve the request directly" })).toBeVisible();
  await expect(page.locator('.react-flow__edge[data-id="client-replicas"]')).toHaveClass(/is-active/);
  await expect(page.locator('.react-flow__node[data-id="lb"]')).toHaveCount(0);
  await page.getByRole("button", { name: "Next step" }).click();
  await expect(page.getByRole("heading", { level: 2, name: "Keep one source of truth" })).toBeVisible();
  await expect(page.locator('.react-flow__edge[data-id="replicas-primary"]')).toHaveClass(/is-active/);
});

test("architect composes a compatible stack and explains every boundary", async ({ page }, testInfo) => {
  await page.goto("/architect/");
  await expect(page.getByRole("heading", { level: 1, name: /Compose a stack/i })).toBeVisible();
  const mapBounds = await page.getByTestId("architecture-map").boundingBox();
  const pickerBounds = await page.getByLabel("Choose technologies").boundingBox();
  expect(mapBounds!.width).toBeGreaterThan(testInfo.project.name === "mobile" ? 350 : 1000);
  expect(Math.abs(mapBounds!.x - pickerBounds!.x)).toBeLessThan(2);
  await expect(page.getByText("Conditional fit", { exact: true })).toBeVisible();
  await page.getByRole("radio", { name: /Vue/ }).check();
  await page.getByRole("radio", { name: /Single-page app/ }).check();
  await page.getByRole("radio", { name: /FastAPI/ }).check();
  await page.getByRole("radio", { name: /MongoDB/ }).check();
  await expect(page.getByText("Compatible", { exact: true })).toBeVisible();
  await expect(page).toHaveURL(/frontend=vue/);
  await expect(page).toHaveURL(/backend=fastapi/);
  await page.getByRole("button", { name: /Backend → Database.*PyMongo/i }).click();
  await expect(page.locator(".connection-inspector")).toContainText("FastAPI owns credentials");
  await expect(page.getByRole("link", { name: /FastAPI in containers/i }).first()).toHaveAttribute("href", /fastapi\.tiangolo\.com/);
});

test("theme control persists dark and light preferences", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/architect/");
  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator("body")).toHaveCSS("background-color", "rgb(13, 20, 28)");
  for (const route of ["/architect/", "/", "/learn/", "/concepts/dns/", "/about/methodology/"]) {
    await page.goto(route);
    const darkResults = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
    expect(darkResults.violations, `${route}: ${darkResults.violations.map((item) => item.id).join(", ")}`).toEqual([]);
  }
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: "Switch to light mode" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

test("architect models Angular, microfrontends, microservices, Terraform, and Fargate", async ({ page }) => {
  await page.goto("/architect/");
  await page.getByRole("radio", { name: /Angular/ }).check();
  await page.getByRole("radio", { name: /Microfrontends/ }).check();
  await page.getByRole("radio", { name: /Microservices/ }).check();
  await expect(page.getByText("Conditional fit", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Microfrontends require organizational boundaries, not only routing" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "One database engine must not become one shared ownership boundary" })).toBeVisible();
  await expect(page.getByRole("radio", { name: /Terraform/ })).toBeChecked();
  await expect(page.getByRole("radio", { name: /AWS Fargate/ })).toBeChecked();
  await expect(page.getByTestId("example-node-catalog-mfe")).toContainText("Catalog frontend");
  await expect(page.getByTestId("example-node-account-mfe")).toContainText("Account frontend");
  await expect(page.getByTestId("example-node-checkout-mfe")).toContainText("Checkout frontend");
  await expect(page.getByTestId("example-node-identity-service")).toContainText("Identity service");
  await expect(page.getByTestId("example-node-catalog-service")).toContainText("Catalog service");
  await expect(page.getByTestId("example-node-order-service")).toContainText("Order service");
  await page.getByRole("tab", { name: /state ownership/i }).click();
  await expect(page.getByRole("heading", { name: "Persist state in PostgreSQL" })).toBeVisible();
  await expect(page.locator(".walkthrough-detail").getByText(/never updated with an Order-owned SQL statement/i)).toBeVisible();
  await expect(page.getByRole("link", { name: /Angular deployment/i }).first()).toHaveAttribute("href", /angular\.dev/);
  await expect(page.getByRole("link", { name: /What is Terraform/i }).first()).toHaveAttribute("href", /hashicorp\.com/);
});

test("architect expands delivery into evidence, infrastructure, artifact, rollout, and health", async ({ page }) => {
  await page.goto("/architect/");
  await page.getByRole("button", { name: /Delivery example/ }).click();
  await expect(page.getByRole("button", { name: /Delivery example/ })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("example-node-validate")).toContainText("Validate + lint");
  await expect(page.getByTestId("example-node-test")).toContainText("Test behavior matrix");
  await expect(page.getByTestId("example-node-build")).toContainText("Build 2 immutable artifacts");
  await expect(page.getByTestId("example-node-plan")).toContainText("terraform plan");
  await expect(page.getByTestId("example-node-registry")).toContainText("Image registry set");
  await expect(page.getByTestId("example-node-rollout")).toContainText("Task definition + ECS service");
  await page.getByRole("tab", { name: /software supply chain/i }).click();
  await expect(page.getByRole("heading", { name: "Publish Docker image once" })).toBeVisible();
  await expect(page.locator(".walkthrough-detail").getByText(/Publish an artifact manifest for commit a84d2f/i)).toBeVisible();
});

test("architect composes polyglot microfrontends and microservices", async ({ page }) => {
  await page.goto("/architect/");
  await page.getByRole("radio", { name: /Microfrontends/ }).check();
  await page.getByRole("radio", { name: /Microservices/ }).check();
  await page.getByLabel("catalog microfrontend framework").selectOption("react");
  await page.getByLabel("account microfrontend framework").selectOption("angular");
  await page.getByLabel("checkout microfrontend framework").selectOption("vue");
  await page.getByLabel("identity service framework").selectOption("spring");
  await page.getByLabel("catalog service framework").selectOption("fastapi");
  await page.getByLabel("orders service framework").selectOption("express");

  await expect(page.getByText("4 frameworks across 4 applications")).toBeVisible();
  await expect(page.getByText("3 runtimes across 3 services")).toBeVisible();
  await expect(page.getByTestId("example-node-catalog-mfe")).toContainText("React");
  await expect(page.getByTestId("example-node-account-mfe")).toContainText("Angular");
  await expect(page.getByTestId("example-node-checkout-mfe")).toContainText("Vue");
  await expect(page.getByTestId("example-node-identity-service")).toContainText("Spring Boot");
  await expect(page.getByTestId("example-node-catalog-service")).toContainText("FastAPI");
  await expect(page.getByTestId("example-node-order-service")).toContainText("Express");
  await expect(page.getByRole("heading", { name: "Mixed frontend frameworks are compatible at application boundaries" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Polyglot services are compatible through network contracts" })).toBeVisible();
  await expect(page).toHaveURL(/mfeAccount=angular/);
  await expect(page).toHaveURL(/svcCatalog=fastapi/);

  await page.getByRole("button", { name: /Delivery example/ }).click();
  await expect(page.getByTestId("example-node-build")).toContainText("Build 7 immutable artifacts");
  await page.reload();
  await expect(page.getByLabel("account microfrontend framework")).toHaveValue("angular");
  await expect(page.getByLabel("catalog service framework")).toHaveValue("fastapi");
});

test("architect blocks a scheduler without a container image and restores its URL", async ({ page }) => {
  await page.goto("/architect/?frontend=react&backend=spring&database=mysql&ci=jenkins&packaging=source&deployment=kubernetes");
  await expect(page.getByText("Incompatible", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Kubernetes needs a container image" })).toBeVisible();
  await expect(page.getByRole("radio", { name: /Source \/ build output/ })).toBeChecked();
  await page.getByRole("radio", { name: /Docker image/ }).check();
  await expect(page.getByText("Conditional fit", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("radio", { name: /Docker image/ })).toBeChecked();
});

test("lesson restores URL state, advances, and exposes progressive component detail", async ({ page }) => {
  await page.goto("/learn/signing-in/?step=2&depth=engineering");
  await expect(page.getByRole("heading", { level: 1, name: "What happens when you sign in?" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Validate and limit" })).toBeVisible();

  await page.getByRole("button", { name: "Next step" }).click();
  await expect(page.getByRole("heading", { level: 2, name: "Verify identity" })).toBeVisible();
  await expect(page).toHaveURL(/step=3/);

  await page.locator('.react-flow__node[data-id="identity"]').click();
  await expect(page.getByRole("heading", { level: 2, name: "Identity service" })).toBeVisible();
  await page.getByRole("button", { name: "Production" }).click();
  await expect(page.getByText(/hardened providers, MFA/i)).toBeVisible();
  await expect(page).toHaveURL(/selected=identity/);
  await expect(page).toHaveURL(/depth=production/);
});

test("invalid public state is repaired and the knowledge check provides feedback", async ({ page }) => {
  await page.goto("/learn/loading-a-web-page/?step=999&depth=unknown&selected=missing");
  await expect(page.getByRole("heading", { level: 2, name: "Render and measure" })).toBeVisible();
  await expect(page).toHaveURL(/step=5/);
  await expect(page).not.toHaveURL(/selected=/);
  await page.getByRole("button", { name: "DNS resolution" }).click();
  await expect(page.getByRole("status")).toContainText("Exactly.");
});

test("knowledge checks lock the scored response", async ({ page }) => {
  await page.goto("/learn/signing-in/");
  await page.getByRole("button", { name: "Compressing the page" }).click();
  await expect(page.getByRole("status")).toContainText("Not quite.");
  await expect(page.getByRole("button", { name: "Proving an identity" })).toBeDisabled();
});

test("keyboard users can inspect the active graph and return from a concept without losing state", async ({ page }) => {
  await page.goto("/learn/signing-in/?step=3");
  const node = page.locator('.react-flow__node[data-id="identity"]');
  await node.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { level: 2, name: "Identity service" })).toBeFocused();
  await page.getByRole("link", { name: "Open concept guide →" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Authentication" })).toBeVisible();
  await page.getByRole("link", { name: "← Return to lesson" }).click();
  await expect(page).toHaveURL(/step=3/);
  await expect(page).toHaveURL(/selected=identity/);
});

test("primary routes pass the automated WCAG A/AA baseline", async ({ page }) => {
  for (const route of ["/", "/learn/", "/learn/signing-in/", "/architect/"]) {
    await page.goto(route);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(results.violations, `${route}: ${results.violations.map((item) => `${item.id} (${item.nodes.length})`).join(", ")}`).toEqual([]);
  }
});

test("reduced-motion users get manual playback", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/learn/reading-a-dashboard/");
  const manual = page.getByRole("button", { name: "Manual" });
  await expect(manual).toBeDisabled();
  await page.getByRole("button", { name: "Next step" }).click();
  await expect(page.getByRole("heading", { level: 2, name: "Try the fast path" })).toBeVisible();
});

test("mobile layout keeps the primary experience inside the viewport", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Mobile-only layout assertion");
  await page.goto("/learn/signing-in/");
  const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, width: document.documentElement.clientWidth }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.width + 1);
  await expect(page.getByTestId("system-map")).toBeVisible();
  await expect(page.getByRole("button", { name: "Next step" })).toBeVisible();
  await page.goto("/architect/");
  const architectDimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, width: document.documentElement.clientWidth }));
  expect(architectDimensions.scrollWidth).toBeLessThanOrEqual(architectDimensions.width + 1);
  await expect(page.getByTestId("architecture-map")).toBeVisible();
});
