// Image asset module declarations.
// In Expo, `require('./x.png')` resolves to an ImageSourcePropType-like value
// (an asset id, or { uri, width, height }). This lets TypeScript accept these
// imports without a per-file error.

declare module "*.png" {
  const value: string | number;
  export default value;
}

declare module "*.jpg" {
  const value: string | number;
  export default value;
}

declare module "*.jpeg" {
  const value: string | number;
  export default value;
}
