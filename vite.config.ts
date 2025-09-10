import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'
import path from 'path'


// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  server: {
    port: 5173,
    strictPort: false, // Allow fallback to other ports if 5173 is busy
    // Configure middleware to serve static files from uploads directory
    middlewareMode: false,
  },
  // Configure static assets
  publicDir: false, // Disable default public directory
  // Custom middleware to serve uploads
  configureServer(server) {
    server.middlewares.use('/uploads', (req, res, next) => {
      const filePath = path.join(process.cwd(), req.url || '')
      
      // Check if file exists
      if (fs.existsSync(filePath)) {
        // Set appropriate headers
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
        
        // Serve the file
        const stat = fs.statSync(filePath)
        const fileExtension = path.extname(filePath).toLowerCase()
        
        // Set content type based on file extension
        const mimeTypes: Record<string, string> = {
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.png': 'image/png',
          '.gif': 'image/gif',
          '.webp': 'image/webp',
          '.svg': 'image/svg+xml'
        }
        
        const contentType = mimeTypes[fileExtension] || 'application/octet-stream'
        res.setHeader('Content-Type', contentType)
        res.setHeader('Content-Length', stat.size)
        
        // Stream the file
        const stream = fs.createReadStream(filePath)
        stream.pipe(res)
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' })
        res.end('File not found')
      }
    })
  }
})
