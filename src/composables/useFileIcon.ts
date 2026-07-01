import { extname } from '@/shared/utils/path.utils'

import type { Component } from 'vue'

const extensionIconMap: Record<string, string> = {
    '.ts': 'CodeBrackets',
    '.tsx': 'CodeBrackets',
    '.js': 'CodeBrackets',
    '.jsx': 'CodeBrackets',
    '.mjs': 'CodeBrackets',
    '.cjs': 'CodeBrackets',
    '.mts': 'CodeBrackets',
    '.cts': 'CodeBrackets',
    '.vue': 'CodeBrackets',
    '.svelte': 'CodeBrackets',
    '.py': 'CodeBrackets',
    '.go': 'CodeBrackets',
    '.rs': 'CodeBrackets',
    '.java': 'CodeBrackets',
    '.rb': 'CodeBrackets',
    '.php': 'CodeBrackets',
    '.c': 'CodeBrackets',
    '.cpp': 'CodeBrackets',
    '.h': 'CodeBrackets',

    '.json': 'Code',
    '.yaml': 'Code',
    '.yml': 'Code',
    '.toml': 'Code',
    '.xml': 'Code',

    '.html': 'Page',
    '.css': 'Page',
    '.scss': 'Page',
    '.less': 'Page',
    '.postcss': 'Page',

    '.md': 'Page',
    '.mdx': 'Page',
    '.txt': 'Page',

    '.png': 'MediaImage',
    '.jpg': 'MediaImage',
    '.jpeg': 'MediaImage',
    '.gif': 'MediaImage',
    '.webp': 'MediaImage',
    '.ico': 'MediaImage',
    '.svg': 'MediaImage',

    '.mp3': 'MusicDoubleNote',
    '.wav': 'MusicDoubleNote',
    '.ogg': 'MusicDoubleNote',
    '.flac': 'MusicDoubleNote',

    '.mp4': 'MediaVideo',
    '.webm': 'MediaVideo',
    '.avi': 'MediaVideo',
    '.mov': 'MediaVideo',

    '.csv': 'AlbumList',
    '.xlsx': 'AlbumList',
    '.xls': 'AlbumList',

    '.sh': 'Terminal',
    '.bash': 'Terminal',
    '.zsh': 'Terminal',
    '.fish': 'Terminal',

    '.gitignore': 'CodeBrackets',
    '.env': 'Page',
    '.editorconfig': 'CodeBrackets',
    '.prettierrc': 'Code',
}

const knownFilenames: Record<string, string> = {
    Makefile: 'CodeBrackets',
    Dockerfile: 'CodeBrackets',
    'package.json': 'Code',
    'tsconfig.json': 'Code',
    'vite.config.ts': 'CodeBrackets',
    'vite.config.js': 'CodeBrackets',
    'README.md': 'Page',
    LICENSE: 'Page',
}

export function useFileIcon() {
    function getIconName(path: string, isDirectory: boolean, isExpanded = false): string {
        if (isDirectory) {
            return 'Folder'
        }

        const base = path.split('/').pop() ?? path
        const known = knownFilenames[base]
        if (known) return known

        const ext = extname(path)
        return extensionIconMap[ext] ?? 'Page'
    }

    return { getIconName }
}
