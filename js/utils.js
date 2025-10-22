async function getUint8Array(x) {
    if (x == null) return new Uint8Array(0)
    if (x instanceof Blob) return new Uint8Array(await x.arrayBuffer())
    if (typeof x === "string") return new TextEncoder().encode(x)
    return new Uint8Array(x)
}

/**
 * run an emscripten wasm module with given argument and filesystem entries
 * @param {*} wasmModule the wasm module factory function
 * @param {Object} options
 * @param {String[]} options.args command line arguments
 * @param {Object} options.FS key-value pairs of file path and file content (Blob/File/String/Uint8Array). `$stdin` is reserved for standard input.
 * @param {String[]} options.retFiles list of file paths to return after execution
 * @returns {Object} key-value pairs of output entries. `$stdout` and `$stderr` are reserved for standard output and error output.
 */
export async function runWasm(wasmModule, { args = [], FS = {}, retFiles = [] } = {}) {
    let stdout = [], stderr = [], stdin = [], _i = 0
    if (FS.$stdin) {
        stdin = await getUint8Array(FS.$stdin)
        delete FS.$stdin
    }
    var wasm = await wasmModule({
        noInitialRun: true,
        stdin: () => stdin[_i++],
        stdout: (v) => stdout.push(v),
        stderr: (v) => stderr.push(v),
    })
    for (let [path, file] of Object.entries(FS)) {
        if (path.startsWith("$")) continue
        let dir = path.replace(/[^\/]*$/, '')
        wasm.FS.mkdirTree(dir)
        let name = path.replace(/^.*\//, '')
        if (name == "") continue
        wasm.FS.createDataFile(dir, name, await getUint8Array(file), true, true)
    }
    await wasm.callMain(args)
    let result = {
        $stdout: new Blob([new Uint8Array(stdout)]),
        $stderr: new Blob([new Uint8Array(stderr)])
    }
    for (let path of retFiles) {
        try {
            result[path] = new Blob([wasm.FS.readFile(path)])
        } catch (e) { }
    }
    return result
}
