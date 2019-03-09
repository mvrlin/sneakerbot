import consola from 'consola'
import puppeteer from 'puppeteer'

export default class SneakerBot {
  browser: puppeteer.Browser | null

  constructor () {
    this.browser = null
  }

  async start () {
    console.clear()

    this.browser = await puppeteer.launch({
      args: [
        '--disable-accelerated-2d-canvas',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-setuid-sandbox',

        '--no-sandbox',
        '--window-size=1280x720'
      ]
    })

    consola.info('SneakerBot has been started.')
  }
}
