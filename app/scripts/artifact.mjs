// Turns the single-file Vite build into a Claude artifact page: the artifact host adds its own
// <!doctype>, <html>, <head> and <body>, so we keep only what goes inside them.
import { readFileSync, writeFileSync } from "node:fs"
const html = readFileSync("dist/index.html", "utf8")
const head = html.match(/<head>([\s\S]*?)<\/head>/i)[1]
const body = html.match(/<body>([\s\S]*?)<\/body>/i)[1]
const keep = head.replace(/<meta[^>]*>\s*/gi, "")
const title = keep.match(/<title>[\s\S]*?<\/title>/i)[0]
const rest = keep.replace(title, "")
writeFileSync("dist/artifact.html", `${title}\n${rest.trim()}\n${body.trim()}\n`)
console.log("dist/artifact.html", Math.round(Buffer.byteLength(readFileSync("dist/artifact.html")) / 1024), "KB")
