import { EventEmitter } from 'events'
import { Page } from 'puppeteer'

import { existsCache, readCache, writeCache } from '../cache'
import { CACHE_PRODUCTS } from '../constants'

export default async function(page: Page, event: EventEmitter) {
  // Clear all existing cookies on request
  page.on('request', async () => {
    page.deleteCookie(...(await page.cookies()))
  })

  async function fetchProducts() {
    await page.goto(
      'https://www.footpatrol.com/campaign/New+In/latest/?facet-new=latest&fp_sort_order=latest&max=999&AJAX=1'
    )

    // Check if not in queue
    await page.waitForSelector('#productListMain', { timeout: 1000 })

    // Get list of all products
    const products = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('.productListItem'))

      return elements.map(element => {
        const imageElement = element.querySelector('picture img') as HTMLImageElement
        const linkElement = element.querySelector('a.itemImage') as HTMLLinkElement

        return <Product>{
          image: imageElement.dataset.src,
          inStock: true,

          sizes: [],

          title: imageElement.alt,
          url: linkElement.href,
        }
      })
    })

    // Supplement more product info
    for (let index = 0; index < products.length; index++) {
      const product = products[index]

      async function getInfo() {
        try {
          console.log('start', product.title, `(${index + 1} / ${products.length})`)

          await page.goto(product.url)
          await page.waitForSelector('#productSizeStock button.btn-default', { timeout: 3000 })

          const sizes = await page.evaluate(() => {
            const elements = document.querySelectorAll('#productSizeStock button[data-e2e="product-size"]')

            return Array.from(elements, element => {
              return (element as HTMLButtonElement).innerText
            })
          })

          const inStock = sizes.length > 0

          // Assign new info
          products[index] = Object.assign(product, {
            inStock,
            sizes,
          })

          console.log('sizes & stock', product.title)

          if (existsCache(CACHE_PRODUCTS)) {
            const productsJSON = JSON.parse(readCache(CACHE_PRODUCTS)) as Product[]
            const productJSON = productsJSON.find(json => json.title === product.title)

            if (productJSON) {
              const index = productsJSON.indexOf(productJSON)
              const isEqual = JSON.stringify(productJSON) === JSON.stringify(product)

              if (isEqual) {
                console.log('done', product.title, '\n')
                return
              }

              productsJSON[index] = product
              console.log('updated', product.title)

              event.emit('restock', product)
            } else {
              productsJSON.push(product)
              event.emit('new', product)
            }

            writeCache('products.json', JSON.stringify(productsJSON, null, 2))
          } else {
            writeCache('products.json', JSON.stringify([product], null, 2))
          }

          console.log('done', product.title, '\n')
        } catch (error) {
          if (error.name === 'TimeoutError') {
            console.log('timeout', product.title)
          }

          await page.screenshot({ path: '.cache/error.png' })
          await getInfo()
        }
      }

      await getInfo()
    }

    // Loop fetch in a second
    setTimeout(fetchProducts, 1000)

    console.log('finish.\n')
  }

  try {
    await fetchProducts()
  } catch (error) {
    console.error(error)
  }
}
