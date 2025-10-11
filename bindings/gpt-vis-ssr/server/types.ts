/**
 * HTTP 服务器配置
 */
export interface ServerConfig {
  port: number;
  host: string;
  /**
   * 图片返回模式
   * - base64: 返回 base64 编码的图片
   * - url: 保存到文件系统并返回 URL（需要配置静态文件服务）
   */
  imageMode: 'base64' | 'url';
  /**
   * 当 imageMode 为 url 时，文件保存路径
   */
  publicPath?: string;
  /**
   * 当 imageMode 为 url 时，访问 URL 的前缀
   */
  publicUrlPrefix?: string;
}

/**
 * 渲染请求体
 */
export interface RenderRequest {
  type: string;
  data?: any;
  [key: string]: any;
}

/**
 * 渲染响应
 */
export interface RenderResponse {
  /**
   * 是否成功生成图表
   */
  success: boolean;
  /**
   * 图表结果
   * - base64 模式：data:image/png;base64,xxx
   * - url 模式：http://xxx/xxx.png
   */
  resultObj?: string;
  /**
   * 错误信息
   */
  errorMessage?: string;
}

/**
 * 健康检查响应
 */
export interface HealthResponse {
  status: 'ok' | 'error';
  timestamp: string;
  uptime: number;
}
