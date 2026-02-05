'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronRight,
    File,
    Folder,
    FolderOpen,
    FileCode2,
    FileJson,
    FileText,
    Image,
    Settings,
    Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileNode {
    name: string;
    type: 'file' | 'folder';
    children?: FileNode[];
    content?: string;
    language?: string;
}

interface GeneratedFilesExplorerProps {
    files: FileNode[];
    onFileSelect?: (file: FileNode, path: string) => void;
    selectedPath?: string;
    className?: string;
}

const FILE_ICONS: Record<string, typeof File> = {
    ts: FileCode2,
    tsx: FileCode2,
    js: FileCode2,
    jsx: FileCode2,
    rs: FileCode2,
    sol: FileCode2,
    json: FileJson,
    md: FileText,
    txt: FileText,
    png: Image,
    jpg: Image,
    svg: Image,
    toml: Settings,
    yaml: Settings,
    yml: Settings,
    lock: Lock,
};

function getFileIcon(filename: string) {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    return FILE_ICONS[ext] || File;
}

function getFileColor(filename: string) {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    const colors: Record<string, string> = {
        ts: 'text-blue-400',
        tsx: 'text-blue-400',
        js: 'text-yellow-400',
        jsx: 'text-yellow-400',
        rs: 'text-orange-400',
        sol: 'text-purple-400',
        json: 'text-amber-400',
        md: 'text-forge-muted',
        toml: 'text-forge-muted',
    };
    return colors[ext] || 'text-forge-muted';
}

interface FileTreeNodeProps {
    node: FileNode;
    path: string;
    depth: number;
    onSelect: (file: FileNode, path: string) => void;
    selectedPath?: string;
}

function FileTreeNode({ node, path, depth, onSelect, selectedPath }: FileTreeNodeProps) {
    const [isExpanded, setIsExpanded] = useState(depth < 2);
    const fullPath = path ? `${path}/${node.name}` : node.name;
    const isSelected = fullPath === selectedPath;
    const FileIcon = node.type === 'folder'
        ? (isExpanded ? FolderOpen : Folder)
        : getFileIcon(node.name);

    const handleClick = () => {
        if (node.type === 'folder') {
            setIsExpanded(!isExpanded);
        } else {
            onSelect(node, fullPath);
        }
    };

    return (
        <div>
            <div
                onClick={handleClick}
                className={cn(
                    'flex items-center gap-2 px-2 py-1 rounded-md cursor-pointer transition-colors',
                    'hover:bg-forge-elevated/50',
                    isSelected && 'bg-accent-cyan/10 text-accent-cyan'
                )}
                style={{ paddingLeft: `${depth * 16 + 8}px` }}
            >
                {node.type === 'folder' && (
                    <ChevronRight
                        className={cn(
                            'w-3 h-3 text-forge-muted transition-transform',
                            isExpanded && 'rotate-90'
                        )}
                    />
                )}
                {node.type === 'file' && <span className="w-3" />}
                <FileIcon className={cn(
                    'w-4 h-4',
                    node.type === 'folder' ? 'text-accent-cyan' : getFileColor(node.name)
                )} />
                <span className={cn(
                    'text-sm truncate',
                    isSelected ? 'text-accent-cyan' : 'text-forge-text'
                )}>
                    {node.name}
                </span>
            </div>

            <AnimatePresence>
                {node.type === 'folder' && isExpanded && node.children && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                    >
                        {node.children.map((child) => (
                            <FileTreeNode
                                key={child.name}
                                node={child}
                                path={fullPath}
                                depth={depth + 1}
                                onSelect={onSelect}
                                selectedPath={selectedPath}
                            />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export function GeneratedFilesExplorer({
    files,
    onFileSelect,
    selectedPath,
    className,
}: GeneratedFilesExplorerProps) {
    const [selected, setSelected] = useState<string | undefined>(selectedPath);

    const handleSelect = (file: FileNode, path: string) => {
        setSelected(path);
        onFileSelect?.(file, path);
    };

    // Sort files: folders first, then alphabetically
    const sortedFiles = useMemo(() => {
        const sortNodes = (nodes: FileNode[]): FileNode[] => {
            return [...nodes].sort((a, b) => {
                if (a.type !== b.type) {
                    return a.type === 'folder' ? -1 : 1;
                }
                return a.name.localeCompare(b.name);
            }).map(node => ({
                ...node,
                children: node.children ? sortNodes(node.children) : undefined,
            }));
        };
        return sortNodes(files);
    }, [files]);

    const fileCount = useMemo(() => {
        const count = (nodes: FileNode[]): number => {
            return nodes.reduce((acc, node) => {
                if (node.type === 'file') return acc + 1;
                if (node.children) return acc + count(node.children);
                return acc;
            }, 0);
        };
        return count(files);
    }, [files]);

    return (
        <div className={cn('flex flex-col', className)}>
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-forge-border/50">
                <span className="text-xs font-medium text-forge-muted">GENERATED FILES</span>
                <span className="text-xs text-forge-muted/60">{fileCount} files</span>
            </div>

            {/* File tree */}
            <div className="flex-1 overflow-y-auto py-2">
                {sortedFiles.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                        <Folder className="w-10 h-10 text-forge-muted/30 mx-auto mb-3" />
                        <p className="text-sm text-forge-muted">No files generated yet</p>
                    </div>
                ) : (
                    sortedFiles.map((node) => (
                        <FileTreeNode
                            key={node.name}
                            node={node}
                            path=""
                            depth={0}
                            onSelect={handleSelect}
                            selectedPath={selected}
                        />
                    ))
                )}
            </div>
        </div>
    );
}

// Example usage with mock data
export const EXAMPLE_FILE_TREE: FileNode[] = [
    {
        name: 'src',
        type: 'folder',
        children: [
            {
                name: 'contracts',
                type: 'folder',
                children: [
                    { name: 'Token.rs', type: 'file', language: 'rust' },
                    { name: 'Storage.rs', type: 'file', language: 'rust' },
                ],
            },
            {
                name: 'lib.rs',
                type: 'file',
                language: 'rust',
            },
        ],
    },
    { name: 'Cargo.toml', type: 'file' },
    { name: 'README.md', type: 'file' },
];
