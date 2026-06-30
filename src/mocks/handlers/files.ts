import { http, HttpResponse } from 'msw'
import fileTreeRaw from '../data/mock-file-tree.json'

interface FileTreeNode {
    id: string
    name: string
    path: string
    type: string
    isDirectory: boolean
    size?: number
    lastModified?: number
    hasChildren?: boolean
    children?: FileTreeNode[]
}

const fileTree = fileTreeRaw as FileTreeNode

function findNode(targetPath: string): FileTreeNode | undefined {
    if (fileTree.path === targetPath || targetPath === '.' || targetPath === '/') {
        return fileTree
    }
    const parts = targetPath.split('/').filter(Boolean)
    let current = fileTree
    for (const part of parts) {
        const child = current.children?.find((c) => c.name === part)
        if (!child) return undefined
        current = child
    }
    return current
}

function flattenTree(node: FileTreeNode): FileTreeNode[] {
    const result: FileTreeNode[] = [node]
    if (node.children) {
        for (const child of node.children) {
            result.push(...flattenTree(child))
        }
    }
    return result
}

function listDir(targetPath: string): FileTreeNode[] {
    const node = findNode(targetPath)
    if (!node || !node.isDirectory) return []
    return node.children ?? []
}

function getStat(targetPath: string): FileTreeNode | undefined {
    return findNode(targetPath)
}

const mockFileContents: Record<string, string> = {
    'src/index.ts': `import express from 'express';\n\nconst app = express();\napp.listen(3000);`,
    'src/controllers/auth.controller.ts': `export class AuthController {\n  login() {}\n  register() {}\n}`,
    'src/data/users.ts': `export const users = [];`,
    'src/middleware/auth.middleware.ts': `export const authMiddleware = (req, res, next) => next();`,
    'src/routes/auth.routes.ts': `import { Router } from 'express';\nexport const authRoutes = Router();`,
    'src/services/auth.service.ts': `export class AuthService {\n  findById() {}\n  create() {}\n}`,
    'src/types/express.d.ts': `declare namespace Express {\n  interface Request {\n    user?: any;\n  }\n}`,
    'src/types/index.ts': `export interface User {\n  id: string;\n  name: string;\n}`,
    '.gitignore': `node_modules/\ndist/\n.env`,
    'package.json': `{\n  "name": "project-test",\n  "version": "1.0.0",\n  "private": true\n}`,
    'tsconfig.json': `{\n  "compilerOptions": {\n    "target": "ES2020",\n    "module": "commonjs"\n  }\n}`,
}

export const fileHandlers = [
    http.get('/workspaces/:workspaceId/files', ({ request }) => {
        const url = new URL(request.url)
        const rawPath = url.searchParams.get('path') || '.'
        const targetPath = rawPath === '.' || rawPath === '/' ? '.' : rawPath
        const nodes = listDir(targetPath)
        return HttpResponse.json({ requestedPath: targetPath, nodes })
    }),

    http.get('/workspaces/:workspaceId/files/stat', ({ request }) => {
        const url = new URL(request.url)
        const rawPath = url.searchParams.get('path') || '.'
        const targetPath = rawPath === '.' || rawPath === '/' ? '.' : rawPath
        const node = getStat(targetPath)
        if (!node) return HttpResponse.json({ message: 'Not Found' }, { status: 404 })
        return HttpResponse.json({ node })
    }),

    http.get('/workspaces/:workspaceId/files/read', ({ request }) => {
        const url = new URL(request.url)
        const path = url.searchParams.get('path') || ''
        const maxBytes = Number(url.searchParams.get('maxBytes')) || 100000
        const content = mockFileContents[path]
        if (content === undefined) {
            const node = findNode(path)
            if (!node) return HttpResponse.json({ message: 'Not Found' }, { status: 404 })
            const placeholder = `[File: ${node.name}]`
            const truncated = placeholder.length > maxBytes
            return HttpResponse.json({
                path,
                content: truncated ? placeholder.slice(0, maxBytes) : placeholder,
                encoding: 'utf-8' as const,
                size: placeholder.length,
                truncated,
            })
        }
        const truncated = content.length > maxBytes
        return HttpResponse.json({
            path,
            content: truncated ? content.slice(0, maxBytes) : content,
            encoding: 'utf-8' as const,
            size: content.length,
            truncated,
        })
    }),

    http.get('/workspaces/:workspaceId/files/events', () => {
        const allFiles = flattenTree(fileTree)
        const filesOnly = allFiles.filter((n) => !n.isDirectory)

        function pickRandom<T>(arr: T[]): T {
            return arr[Math.floor(Math.random() * arr.length)] as T
        }

        const eventTemplates = [
            {
                type: 'MODIFIED',
                extra: (n: FileTreeNode) => ({
                    node: {
                        id: n.id,
                        name: n.name,
                        path: n.path,
                        type: n.type,
                        isDirectory: false,
                        size: n.size,
                        lastModified: Date.now(),
                    },
                }),
            },
            {
                type: 'CREATED',
                extra: (n: FileTreeNode) => ({
                    node: {
                        id: crypto.randomUUID().slice(0, 12),
                        name: n.name.replace(/\.(\w+)$/, '.new.$1'),
                        path: n.path.replace(/\.(\w+)$/, '.new.$1'),
                        type: 'file',
                        isDirectory: false,
                        size: Math.floor(Math.random() * 5000),
                        lastModified: Date.now(),
                    },
                }),
            },
            {
                type: 'DELETED',
                extra: (n: FileTreeNode) => ({
                    node: {
                        id: n.id,
                        name: n.name,
                        path: n.path,
                        type: n.type,
                        isDirectory: false,
                    },
                }),
            },
            {
                type: 'MOVED',
                extra: (n: FileTreeNode) => {
                    const newName = 'moved-' + n.name
                    return {
                        node: {
                            id: n.id,
                            name: newName,
                            path: n.path.replace(n.name, newName),
                            type: n.type,
                            isDirectory: false,
                            size: n.size,
                        },
                        oldPath: n.path,
                    }
                },
            },
        ]

        const stream = new ReadableStream({
            start(controller) {
                const encoder = new TextEncoder()
                let seq = 0

                const emit = () => {
                    const idx = seq % eventTemplates.length
                    const tmpl = eventTemplates[idx]!
                    const file = pickRandom(filesOnly)
                    const event = {
                        type: tmpl.type,
                        timestamp: Date.now(),
                        ...tmpl.extra(file),
                    }
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
                    seq++
                }

                emit()
                const id = setInterval(emit, 8000)
                const close = () => {
                    clearInterval(id)
                    controller.close()
                }
                globalThis.addEventListener('beforeunload', close)
            },
        })
        return new Response(stream, {
            status: 200,
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                Connection: 'keep-alive',
            },
        })
    }),
]
