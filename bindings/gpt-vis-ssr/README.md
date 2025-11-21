# gpt-vis-ssr

`Render` [GPT-Vis](https://github.com/antvis/GPT-Vis) in Server-Side with NodeJS.

## Installation

```sh
npm install --save @antv/gpt-vis-ssr
```

## Usage

### As a Library

```js
import { render } from '@antv/gpt-vis-ssr';

const options = {
  type: 'line',
  data: [
    { time: 2018, value: 91.9 },
    { time: 2019, value: 99.1 },
    { time: 2020, value: 101.6 },
    { time: 2021, value: 114.4 },
    { time: 2022, value: 121 },
  ],
};

const vis = await render(options);

const buffer = vis.toBuffer();

// You need to destroy the SSRResult when you are done with it to free up resources.
vis.destroy();
```

### As an HTTP Server

You can also run gpt-vis-ssr as a standalone HTTP server for chart rendering.

#### Local Development

```bash
# Install dependencies and setup (automatically builds canvas)
pnpm install

# If you encounter canvas module errors, run:
pnpm run setup

# Start dev server
pnpm dev:server

# Or build and run in production mode
pnpm run build:server
pnpm run start:server
```

> **Note:** The `canvas` module requires native compilation. If you encounter `Cannot find module '../build/Release/canvas.node'` error, run `pnpm run setup` to fix it. See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for details.

#### Docker Deployment

##### Using Docker Compose (Recommended)

```bash
# Build and start the service
# Note: First build may take 3-5 minutes due to canvas native module compilation
docker-compose up -d
# or for Docker Compose v2+
docker compose up -d

# View logs
docker-compose logs -f

# Stop the service
docker-compose down
```

The server will be available at `http://localhost:3000`.

> **💡 Build Time Note:** The first Docker build takes 3-5 minutes because `canvas` is a native module that needs to be compiled from source on Alpine Linux. Subsequent builds will be much faster due to Docker layer caching. See [docs/CANVAS_BUILD.md](./docs/CANVAS_BUILD.md) for details.

##### Using Docker Directly

```bash
# Build the image
docker build -t gpt-vis-ssr:latest .

# Run the container
docker run -d \
  --name gpt-vis-ssr \
  -p 3000:3000 \
  -e IMAGE_MODE=base64 \
  gpt-vis-ssr:latest
```

#### Environment Variables

| Variable            | Description                                   | Default        | Options         |
| ------------------- | --------------------------------------------- | -------------- | --------------- |
| `PORT`              | Server port                                   | `3000`         | -               |
| `HOST`              | Server host                                   | `0.0.0.0`      | -               |
| `IMAGE_MODE`        | Image return mode                             | `base64`       | `base64`, `url` |
| `BASE_URL`          | Base URL for image URLs (when `url` mode)     | auto-generated | -               |
| `PUBLIC_PATH`       | File system path for images (when `url` mode) | `/app/public`  | -               |
| `PUBLIC_URL_PREFIX` | URL prefix for images (when `url` mode)       | `/images`      | -               |

#### API Endpoints

##### `POST /render`

Render a chart and return the result.

**Request Body:**

```json
{
  "type": "line",
  "data": [
    { "time": "2018", "value": 91.9 },
    { "time": "2019", "value": 99.1 },
    { "time": "2020", "value": 101.6 },
    { "time": "2021", "value": 114.4 },
    { "time": "2022", "value": 121 }
  ]
}
```

**Response (Success):**

```json
{
  "success": true,
  "resultObj": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
}
```

**Response (Error):**

```json
{
  "success": false,
  "errorMessage": "Missing required parameter: type"
}
```

##### `GET /health`

Health check endpoint.

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2025-10-11T12:00:00.000Z",
  "uptime": 123.456
}
```

#### Usage with MCP Server Chart

This server is designed to work with [@antv/mcp-server-chart](https://github.com/antvis/mcp-server-chart). Configure it as a private deployment:

```json
{
  "mcpServers": {
    "mcp-server-chart": {
      "command": "npx",
      "args": ["-y", "@antv/mcp-server-chart"],
      "env": {
        "VIS_REQUEST_SERVER": "http://localhost:3000/render"
      }
    }
  }
}
```

## API

### `render(options: Options): SSRResult`

Render spec into image buffer in NodeJS.

```ts
type SSRResult = {
  toBuffer: (meta?: any) => Buffer;
  destroy: () => void;
};
```

## 🈳 Chinese Font Support

The server automatically registers fonts for Chinese character rendering. For Docker deployments, Chinese fonts (Noto CJK) are included in the image.

If you encounter Chinese characters displaying as squares (乱码), ensure:

1. **Font file exists**: The `public/Gaegu-Regular.ttf` file should be present
2. **Docker**: Chinese fonts are automatically installed in the Docker image
3. **Local development**: Make sure the font file is accessible

The server will log font registration status on startup:

- ✅ Fonts registered successfully
- ⚠️ Failed to register fonts (Chinese may not render correctly)

## License

[MIT](./LICENSE)
