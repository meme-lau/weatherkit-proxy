import { handle } from "hono/vercel";
import app from "./Hono.js";

// 将 Hono 应用包装成 Vercel 处理函数
const handler = handle(app);

// 必须使用大写的 HTTP 方法进行命名导出，触发 Vercel 的 Web API 模式
export const GET = handler;
export const POST = handler;
export const OPTIONS = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
