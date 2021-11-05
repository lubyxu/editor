// const onEndPlugin = {
//     name: 'onEnd',
//     setup(build) {
//         build.onEnd(() => {
//             require('./runServer');
//         });
//     }
// };


require('esbuild').build({
    entryPoints: ['./src/server/server.js'],
    bundle: true,
    outdir: 'build-server',
    format: 'cjs',
    watch: true,
})