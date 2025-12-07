import { runWasm } from './utils.js'
import * as Modules from './wasm.js'
self.onmessage = async (e) => {
    const { tool, ...options } = e.data
    const result = await runWasm(Modules[tool], options)
    self.postMessage(result)
    self.close()
}
