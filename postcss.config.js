module.exports = {
    plugins: [
        require('autoprefixer')({
            overrideBrowserslist: [
                'last 2 versions',
                '> 1%',
                'not dead'
            ]
        }),
        {
            postcssPlugin: 'postcss-color-adjust',
            Declaration(decl) {
                if (decl.prop === 'color-adjust' || decl.prop === 'print-color-adjust') {
                    decl.cloneBefore({ prop: '-webkit-print-color-adjust' });
                    decl.prop = 'print-color-adjust';
                }
            }
        }
    ]
}; 