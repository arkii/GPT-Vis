import cors from 'cors';
import { randomUUID } from 'crypto';
import express, { Request, Response } from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import { render } from '../src/index';
import type { HealthResponse, RenderRequest, RenderResponse, ServerConfig } from './types';

/**
 * 创建并启动 HTTP 服务器
 */
export async function createServer(config: Partial<ServerConfig> = {}) {
  const serverConfig: ServerConfig = {
    port: Number(process.env.PORT) || 3000,
    host: process.env.HOST || '0.0.0.0',
    imageMode: (process.env.IMAGE_MODE as any) || 'base64',
    publicPath: process.env.PUBLIC_PATH || path.join(process.cwd(), 'public'),
    publicUrlPrefix: process.env.PUBLIC_URL_PREFIX || '/images',
    ...config,
  };

  const app = express();

  // 中间件
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  // 静态文件服务（当 imageMode 为 url 时）
  if (serverConfig.imageMode === 'url' && serverConfig.publicPath) {
    await fs.mkdir(serverConfig.publicPath, { recursive: true });
    app.use(serverConfig.publicUrlPrefix!, express.static(serverConfig.publicPath));
  }

  // 健康检查端点
  app.get('/health', (req: Request, res: Response<HealthResponse>) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // 图表渲染端点
  app.post('/render', async (req: Request, res: Response<RenderResponse>) => {
    const startTime = Date.now();

    try {
      const options: RenderRequest = req.body;

      // 参数校验
      if (!options || !options.type) {
        return res.status(400).json({
          success: false,
          errorMessage: 'Missing required parameter: type',
        });
      }

      console.log(`[${new Date().toISOString()}] Rendering chart: ${options.type}`);

      // 调用 SSR render 函数
      const vis = await render(options as any);
      const buffer = vis.toBuffer();

      let resultObj: string;

      if (serverConfig.imageMode === 'base64') {
        // Base64 模式
        const base64 = buffer.toString('base64');
        resultObj = `data:image/png;base64,${base64}`;
      } else {
        // URL 模式 - 保存到文件系统
        const filename = `${randomUUID()}.png`;
        const filepath = path.join(serverConfig.publicPath!, filename);
        await fs.writeFile(filepath, buffer);

        // 构建访问 URL
        const baseUrl =
          process.env.BASE_URL ||
          `http://${serverConfig.host === '0.0.0.0' ? 'localhost' : serverConfig.host}:${serverConfig.port}`;
        resultObj = `${baseUrl}${serverConfig.publicUrlPrefix}/${filename}`;
      }

      // 清理资源
      vis.destroy();

      const duration = Date.now() - startTime;
      console.log(`[${new Date().toISOString()}] Chart rendered successfully in ${duration}ms`);

      res.json({
        success: true,
        resultObj,
      });
    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error(
        `[${new Date().toISOString()}] Error rendering chart after ${duration}ms:`,
        error,
      );

      res.status(500).json({
        success: false,
        errorMessage: error.message || 'Internal server error',
      });
    }
  });

  // 404 处理
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      errorMessage: 'Not found',
    });
  });

  // 启动服务器
  const server = app.listen(serverConfig.port, serverConfig.host, () => {
    console.log(
      `\n🚀 GPT-Vis SSR Server is running on http://${serverConfig.host}:${serverConfig.port}`,
    );
    console.log(`   - Image Mode: ${serverConfig.imageMode}`);
    console.log(`   - Health Check: http://localhost:${serverConfig.port}/health`);
    console.log(`   - Render Endpoint: http://localhost:${serverConfig.port}/render\n`);
  });

  // 优雅关闭
  const shutdown = async () => {
    console.log('\n\n🛑 Shutting down server...');
    server.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  return server;
}

// 如果直接运行此文件，启动服务器
if (require.main === module) {
  createServer().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}
