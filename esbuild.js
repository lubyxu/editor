require('esbuild').build({
    entryPoints: ['./src/server/server.js'],
    bundle: true,
    outdir: 'build-server',
    format: 'cjs',
})