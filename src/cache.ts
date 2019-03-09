import consola from 'consola'
import fs from 'fs'

import { DIR_CACHE } from './constants'

export function existsCache (name: string) {
  return fs.existsSync(`${DIR_CACHE}/${name}`)
}

export function readCache (name: string) {
  return existsCache(name) ?
    fs.readFileSync(`${DIR_CACHE}/${name}`, 'utf-8') :
    ''
}

export function writeCache (name: string, data: string) {
  const path = `${DIR_CACHE}/${name}`

  if (!fs.existsSync(DIR_CACHE)) {
    consola.warn(`No ${DIR_CACHE} directory found.`)
    fs.mkdirSync(DIR_CACHE)
  }

  try {
    fs.writeFileSync(path, data)
    consola.success(`File ${name} cached.`)
  } catch (error) {
    consola.error(error)
  }
}
