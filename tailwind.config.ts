import type { Config } from "tailwindcss";
const config: Config = { content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"], theme: { extend: { fontFamily: { sans: ['ui-sans-serif','system-ui','sans-serif'], mono: ['ui-monospace','SFMono-Regular','monospace'] }, colors: { paper:"#f6f7f2", ink:{DEFAULT:"#151a21",soft:"#525b66",faint:"#929aa3"}, line:"#dfe3df", signal:{good:"#4c7b2a",warn:"#a66d0a",bad:"#b44234"}, accent:{lime:"#b7ef42",blue:"#3468ff",amber:"#ffb52e",coral:"#ff725e"} }, letterSpacing:{tightest:"-0.05em"} } }, plugins: []};
export default config;
