# threejs_template
A basic, dev-mode template for Threejs with Webpack, Typescript and a webpack-web-server. Makes it simple to start playing with a basic ThreeJS setup including Omni controls without having to trudge through Webpack or Threejs setup.

## Usage
1. `degit nikokozak/threejs_template <target_dir>`
2. `cd <target_dir>`
3. `npm install`
4. `git init`
5. `npm run dev`

## Structure
The basic structure in `src` is as follows:
`index.ts` - basic scene setup, holds meshes, scene, etc. Root of the project.
`params.ts` - params that we might want to access across many files, like the width and height of the project.
`utils.ts` - setup and other utils to remove complexity from `index.ts`.

## Details
For ease of use, the following assumptions are made:
1. "Development" mode is hardcoded into `webpack.config.js`.
2. No html webpack plugin is provided. Instead, a base html file is included in `dist/index.html`.
3. Threejs is bundled in with anything in `src`. Make sure to separate vendor files in production.
4. Only two `npm run` commands are provided: `dev` and `build`. Both run in dev mode, alter to your heart's content.
5. Threejs template is full-window, and includes omnidirectional controls.
