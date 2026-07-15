/// <reference no-default-lib="true"/>
/// <reference lib="es2020" />
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />

// 让 IDE 识别 .vue 文件
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

export {}
