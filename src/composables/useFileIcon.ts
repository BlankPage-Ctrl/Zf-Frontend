import { extname } from '@/shared/utils/path.utils'

const extensionIconMap: Record<string, string> = {
    '.ts': 'lucide:file-code',
    '.tsx': 'lucide:file-code',
    '.js': 'lucide:file-code',
    '.jsx': 'lucide:file-code',
    '.mjs': 'lucide:file-code',
    '.cjs': 'lucide:file-code',
    '.mts': 'lucide:file-code',
    '.cts': 'lucide:file-code',
    '.vue': 'lucide:file-code',
    '.svelte': 'lucide:file-code',
    '.py': 'lucide:file-code',
    '.go': 'lucide:file-code',
    '.rs': 'lucide:file-code',
    '.java': 'lucide:file-code',
    '.rb': 'lucide:file-code',
    '.php': 'lucide:file-code',
    '.c': 'lucide:file-code',
    '.cpp': 'lucide:file-code',
    '.h': 'lucide:file-code',

    '.json': 'lucide:file-json',
    '.yaml': 'lucide:file-json',
    '.yml': 'lucide:file-json',
    '.toml': 'lucide:file-json',
    '.xml': 'lucide:file-json',

    '.html': 'lucide:file-text',
    '.css': 'lucide:file-type',
    '.scss': 'lucide:file-type',
    '.less': 'lucide:file-type',
    '.postcss': 'lucide:file-type',

    '.md': 'lucide:file-text',
    '.mdx': 'lucide:file-text',
    '.txt': 'lucide:file-text',

    '.png': 'lucide:file-image',
    '.jpg': 'lucide:file-image',
    '.jpeg': 'lucide:file-image',
    '.gif': 'lucide:file-image',
    '.webp': 'lucide:file-image',
    '.ico': 'lucide:file-image',
    '.svg': 'lucide:file-image',

    '.mp3': 'lucide:file-audio',
    '.wav': 'lucide:file-audio',
    '.ogg': 'lucide:file-audio',
    '.flac': 'lucide:file-audio',

    '.mp4': 'lucide:file-video',
    '.webm': 'lucide:file-video',
    '.avi': 'lucide:file-video',
    '.mov': 'lucide:file-video',

    '.csv': 'lucide:file-spreadsheet',
    '.xlsx': 'lucide:file-spreadsheet',
    '.xls': 'lucide:file-spreadsheet',

    '.sh': 'lucide:file-terminal',
    '.bash': 'lucide:file-terminal',
    '.zsh': 'lucide:file-terminal',
    '.fish': 'lucide:file-terminal',

    '.gitignore': 'lucide:file-code',
    '.env': 'lucide:file-text',
    '.editorconfig': 'lucide:file-code',
    '.prettierrc': 'lucide:file-json',
}

const knownFilenames: Record<string, string> = {
    Makefile: 'lucide:file-code',
    Dockerfile: 'lucide:file-code',
    'package.json': 'lucide:file-json',
    'tsconfig.json': 'lucide:file-json',
    'vite.config.ts': 'lucide:file-code',
    'vite.config.js': 'lucide:file-code',
    'README.md': 'lucide:file-text',
    LICENSE: 'lucide:file-text',
}

export function useFileIcon() {
    function getIconName(path: string, isDirectory: boolean, isExpanded = false): string {
        if (isDirectory) {
            return isExpanded ? 'lucide:folder-open' : 'lucide:folder'
        }

        const base = path.split('/').pop() ?? path
        const known = knownFilenames[base]
        if (known) return known

        const ext = extname(path)
        return extensionIconMap[ext] ?? 'lucide:file'
    }

    return { getIconName }
}
