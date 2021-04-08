import * as should from 'should';
import { Worker } from '../lib/worker';
import logger from '../lib/logger';
import { cfg } from '../lib/config';
import * as grpcClient from '@restorecommerce/grpc-client';
import * as kafkaClient from '@restorecommerce/kafka-client';
import * as puppeteer from 'puppeteer';
import * as express from 'express';

const Events = kafkaClient.Events;

let worker: Worker;
let client;
let events;
let paymentService;
let browser;

const total = 100;
const currency = 'USD';
const provider = 96; // PayPalExpressCheckout
const setupAuthorizationCall = {
  ip: '1.2.3.4',
  items: [{name: 'sample', quantity: 1, amount: total, description: 'desc'}],
  subtotal: total,
  shipping: 0,
  handling: 0,
  tax: 0,
  currency,
  allow_guest_checkout: true,
  provider
};

async function start(): Promise<void> {
  worker = new Worker();
  await worker.start();
}

async function stop(): Promise<void> {
  await worker.stop();
}

async function connect(clientCfg: string, resourceName: string): Promise<any> { // returns a gRPC service
  events = new Events(cfg.get('events:kafka'), logger);
  await (events.start());

  client = new grpcClient.Client(cfg.get(clientCfg), logger);

  return new Promise((resolve, reject) => {
    client.connect().then(resolve, reject).catch(reject);
  });
}

describe('testing payment-srv', () => {
  before(async () => {
    await start();
    paymentService = await connect('client:payment-srv', '');
    browser = await puppeteer.launch({headless: true});
  });

  after(async () => {
    await stop();
  });

  describe('testing paypal authorization', () => {
    let token: string;
    let url: string;
    let payerId: string;
    let paymentId: string;

    it('should get url from SetupAuthorization', async () => {
      const result = await paymentService.SetupAuthorization(setupAuthorizationCall);

      should(result.error).be.null();
      should(result.data).not.be.null();
      should(result.data.payment_errors).be.empty();
      should(result.data.confirm_initiation_url).not.be.null();
      should(result.data.token).not.be.null();

      token = result.data.token;
      url = result.data.confirm_initiation_url;
    });

    it('should be able to authorize payment from user browser', async function () {
      // PayPal sandbox is extremely slow
      this.timeout(300000);

      payerId = await PayForURL(url);
    });

    it('should get paymentId from Authorize', async () => {
      const result = await paymentService.Authorize({
        provider,
        payment_sum: total,
        currency,
        payment_id: 'UNIT_TEST_PAYMENT',
        payer_id: payerId,
        token: token
      });

      should(result.error).be.null();
      should(result.data).not.be.null();
      should(result.data.payment_errors).be.empty();
      should(result.data.payment_id).not.be.null();
      should(result.data.payment_id).not.be.empty();

      paymentId = result.data.payment_id;
    });

    it('should Capture', async () => {
      const result = await paymentService.Capture({
        provider,
        payment_sum: total,
        currency,
        payment_id: paymentId
      });

      should(result.error).be.null();
      should(result.data).not.be.null();
      should(result.data.payment_errors).be.empty();
    });
  });

  describe('testing paypal purchase', () => {
    let token: string;
    let url: string;
    let payerId: string;

    it('should get url from SetupPurchase', async () => {
      const result = await paymentService.SetupPurchase(setupAuthorizationCall);

      should(result.error).be.null();
      should(result.data).not.be.null();
      should(result.data.payment_errors).be.empty();
      should(result.data.confirm_initiation_url).not.be.null();
      should(result.data.token).not.be.null();

      token = result.data.token;
      url = result.data.confirm_initiation_url;
    });

    it('should be able to authorize payment from user browser', async function () {
      // PayPal sandbox is extremely slow
      this.timeout(300000);

      payerId = await PayForURL(url);
    });

    it('should get paymentId from Purchase', async () => {
      const result = await paymentService.Purchase({
        provider,
        payment_sum: total,
        currency,
        payer_id: payerId,
        token: token
      });

      should(result.error).be.null();
      should(result.data).not.be.null();
      should(result.data.payment_errors).be.empty();
      should(result.data.payment_id).not.be.null();
      should(result.data.payment_id).not.be.empty();
    });
  });
});

/**
 * Go through PP payment process and return the payer ID
 */
async function PayForURL(url: string): Promise<string> {
  const context = await browser.createIncognitoBrowserContext();
  const page = await context.newPage();

  logger.info("Opening: " + url);

  const app = express();
  app.get('/complete', (req, res) => res.send('complete'));
  app.get('/cancel', (req, res) => res.send('cancel'));
  const server = app.listen(61234);

  while(true) {
    await page.goto(url, {
      timeout: 60000
    });

    logger.info("Page Loaded");

    let loginButton = null;
    try {
      loginButton = await page.waitForXPath('//button[contains(translate(., "LOGIN", "login"),"log in")]', {
        timeout: 15000
      });
    }catch (e) {
    }

    if (loginButton === null) {
      logger.info("Reloading: " + url);
      continue;
    }

    logger.info("Login button found");
    await loginButton.click();

    logger.info("Waiting for Email");
    const emailInput = await page.waitForSelector('#splitEmail #email');
    logger.info("Entering Email");
    await emailInput.type(cfg.get('payments:tests:PayPalExpressCheckout:email'));

    const emailContinue = await page.waitForSelector('#splitEmail #btnNext');
    await emailContinue.click();

    // Wait for animation
    await page.waitForTimeout(5000);

    logger.info("Waiting for Password");
    const passwordInput = await page.waitForSelector('#splitPassword #password');
    logger.info("Entering Password");
    await passwordInput.type(cfg.get('payments:tests:PayPalExpressCheckout:password'));

    const login = await page.waitForSelector('#splitPassword #btnLogin');
    await login.click();

    // Wait for navigation
    await page.waitForNavigation({
      timeout: 120000
    });

    logger.info("Waiting for Reviewing Payment");
    const reviewButton = await page.waitForSelector('button#payment-submit-btn', {
      timeout: 300000
    });
    logger.info("Reviewing Payment");
    await page.waitForTimeout(10000);

    await page.evaluate(() => {
      document.querySelector('button#payment-submit-btn').scrollIntoView();
    });

    await page.waitForTimeout(10000);

    await reviewButton.click();

    logger.info("Waiting for redirect");

    await page.waitForNavigation();

    logger.info("Transaction complete");

    break;
  }

  const payerId = (new URL(page.url())).searchParams.get('PayerID');

  logger.info("Received Payer ID: " + payerId);

  await context.close();

  server.close();

  return payerId;
}
