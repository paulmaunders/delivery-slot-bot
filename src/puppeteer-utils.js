const puppeteer = require("puppeteer");
const config = require("./config");
const { StoreError } = require("./errors");

/** @typedef {import("puppeteer").DirectNavigationOptions} DirectNavigationOptions */
/** @typedef {import("puppeteer").Page} Page */
/** @typedef {import("puppeteer").Response} Response */

function getBrowser() {
  if (process.env.PUPPETEER_BROWSER_WS_ENDPOINT) {
    return puppeteer.connect({
      browserWSEndpoint: process.env.PUPPETEER_BROWSER_WS_ENDPOINT,
      // @ts-ignore
      product: config.browser_product,
    });
  }
  return puppeteer.launch({
    executablePath: config.browser_executable_path,
    headless: config.browser_launch_headless,
    // @ts-ignore
    product: config.browser_product,
  });
}

/**
 * @param {Page} page
 * @param {Response | null} response
 */
async function assertResponseOk(page, response) {
  if (!response) {
    throw new StoreError("unexpected page error not returning a response");
  }

  if (response.ok()) {
    return;
  }

  const errorTextElement =
    (await page.$("p.ui-component__notice__error-text")) ||
    (await page.$("section.error-container"));
  if (errorTextElement) {
    const errorText = await page.evaluate(
      (element) => element.innerText,
      errorTextElement
    );
    throw new StoreError(
      `unexpected http response status ${response.status()} ${response.statusText()} with error text: ${errorText}`
    );
  } else {
    throw new StoreError(
      `unexpected http response status ${response.status()} ${response.statusText()} with body:\n${await response.text()}\n`
    );
  }
}

/**
 * @param {Page} page
 * @param {string} url
 * @param {DirectNavigationOptions | undefined } options
 */
async function goto(page, url, options = undefined) {
  await assertResponseOk(page, await page.goto(url, options));
}

/**
 * @param {Page} page
 * @param {string} selector
 */
async function clickAndWaitForNavigation(page, selector) {
  await assertResponseOk(
    page,
    (await Promise.all([page.waitForNavigation(), page.click(selector)]))[0]
  );
}

module.exports = { getBrowser, goto, clickAndWaitForNavigation };
