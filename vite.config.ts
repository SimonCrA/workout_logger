import { svgSpritemap } from 'vite-plugin-svg-spritemap';

export default {
    plugins: [
        svgSpritemap('src/assets/icons/*.svg', {
            output: {
                filename: 'public/icons.svg'
            }
        })
    ]
};
