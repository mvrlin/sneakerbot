import consola from 'consola'
import puppeteer from 'puppeteer'

import { EventEmitter } from 'events'
import { readdirSync } from 'fs'
import { USER_AGENT } from './constants'

const event = new EventEmitter()

let browser: puppeteer.Browser

async function loadParsers () {
  const dir = `${__dirname}/parsers`
  const files = readdirSync(dir)

  if (!browser) {
    throw new Error('Browser cannot be null.')
  }

  if (!files.length) {
    throw new Error('No parsers found.')
  }

  for (const file of files) {
    const page = await browser.newPage()

    await page.setUserAgent(USER_AGENT)
    await page.setViewport({
      width: 1280,
      height: 720
    })

    const parser = (await import(`${dir}/${file}`)).default
    parser(page, event)
  }
}

export async function start () {
  console.clear()

  browser = await puppeteer.launch({
    args: [
      '--disable-accelerated-2d-canvas',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-setuid-sandbox',

      '--no-sandbox'
    ]
  })

  try {
    await loadParsers()
  } catch (error) {
    return consola.error(error)
  }

  event.on('message', message => {
    consola.ready(message)
  })

  event.on('new', product => {
    event.emit('message', `New: ${JSON.stringify(product)}`)
  })

  event.on('restock', product => {
    event.emit('message', `Restock: ${JSON.stringify(product)}`)
  })

  consola.info('SneakerBot has been started.')
}

export async function stop() {
  if (browser) {
    await browser.disconnect()
  }
}
