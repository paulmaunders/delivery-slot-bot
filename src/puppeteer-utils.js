// @ts-check
const puppeteer = require("puppeteer");

function getBrowser() {
  if (process.env.PUPPETEER_BROWSER_WS_ENDPOINT) {
    return puppeteer.connect({
      browserWSEndpoint: process.env.PUPPETEER_BROWSER_WS_ENDPOINT,
    });
  }
  return puppeteer.launch();
}

/**
 * @param {puppeteer.Response} response
 */
async function assertResponseOk(response) {
  if (response.ok()) {
    return;
  }
  throw {
    message: `error: unexpected http response status ${response.status()} ${response.statusText()} with body:\n${await response.text()}\n`,
  };
}

/**
 * @param {puppeteer.Page} page
 * @param {string} url
 */
async function goto(page, url) {
  await assertResponseOk(await page.goto(url));
}

/**
 * @param {puppeteer.Page} page
 * @param {string} selector
 */
async function clickAndWaitForNavigation(page, selector) {
  await assertResponseOk(
    (await Promise.all([page.waitForNavigation(), page.click(selector)]))[0]
  );
}

module.exports = { getBrowser, goto, clickAndWaitForNavigation };
