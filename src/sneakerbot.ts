import consola from 'consola'
import puppeteer from 'puppeteer'

import { readdirSync } from 'fs'
import { USER_AGENT } from './constants'

export default class SneakerBot {
  browser: puppeteer.Browser | null

  constructor () {
    this.browser = null
  }

  private async _loadParsers () {
    const dir = `${__dirname}/parsers`
    const files = readdirSync(dir)

    if (!this.browser) {
      throw new Error('Browser cannot be null.')
    }

    if (!files.length) {
      throw new Error('No parsers found.')
    }

    for (const file of files) {
      const page = await this.browser.newPage()
      await page.setUserAgent(USER_AGENT)

      const parser = (await import(`${dir}/${file}`)).default
      parser(page)
    }
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

    try {
      await this._loadParsers()
    } catch (error) {
      return consola.error(error)
    }

    consola.info('SneakerBot has been started.')
  }

  async stop() {
    if (this.browser) {
      await this.browser.disconnect()
    }
  }
}
