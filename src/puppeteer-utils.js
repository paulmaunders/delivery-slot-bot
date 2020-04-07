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
 * @param {puppeteer.Page} page
 * @param {puppeteer.Response} response
 */
async function assertResponseOk(page, response) {
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
    throw {
      message: `error: unexpected http response status ${response.status()} ${response.statusText()} with error text: ${errorText}`,
    };
  } else {
    throw {
      message: `error: unexpected http response status ${response.status()} ${response.statusText()} with body:\n${await response.text()}\n`,
    };
  }
}

/**
 * @param {puppeteer.Page} page
 * @param {string} url
 */
async function goto(page, url) {
  await assertResponseOk(page, await page.goto(url));
}

/**
 * @param {puppeteer.Page} page
 * @param {string} selector
 */
async function clickAndWaitForNavigation(page, selector) {
  await assertResponseOk(
    page,
    (await Promise.all([page.waitForNavigation(), page.click(selector)]))[0]
  );
}

module.exports = { getBrowser, goto, clickAndWaitForNavigation };
