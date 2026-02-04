'use client';

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Upload,
    File,
    Image,
    Video,
    Folder,
    X,
    Check,
    ExternalLink,
    Copy,
    Loader2,
    HardDrive,
    AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface UploadedFile {
    name: string;
    size: number;
    type: string;
    ipfsHash: string;
    ipfsUrl: string;
    pinataUrl: string;
}

interface IPFSUploadPanelProps {
    pinataApiKey: string;
    pinataSecretKey: string;
}

export function IPFSUploadPanel({ pinataApiKey, pinataSecretKey }: IPFSUploadPanelProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [copiedHash, setCopiedHash] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const uploadToPinata = async (file: File): Promise<UploadedFile> => {
        const formData = new FormData();
        formData.append('file', file);

        const metadata = JSON.stringify({
            name: file.name,
            keyvalues: {
                uploadedFrom: 'Cradle',
                timestamp: new Date().toISOString(),
            }
        });
        formData.append('pinataMetadata', metadata);

        const options = JSON.stringify({
            cidVersion: 1,
        });
        formData.append('pinataOptions', options);

        const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
            method: 'POST',
            headers: {
                'pinata_api_key': pinataApiKey,
                'pinata_secret_api_key': pinataSecretKey,
            },
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Upload failed: ${response.status}`);
        }

        const data = await response.json();

        return {
            name: file.name,
            size: file.size,
            type: file.type,
            ipfsHash: data.IpfsHash,
            ipfsUrl: `ipfs://${data.IpfsHash}`,
            pinataUrl: `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`,
        };
    };

    const handleFiles = useCallback(async (files: FileList | null) => {
        if (!files || files.length === 0) return;

        if (!pinataApiKey || !pinataSecretKey) {
            setError('Please configure your Pinata API keys first');
            return;
        }

        setError(null);
        setIsUploading(true);

        try {
            const uploadPromises = Array.from(files).map(file => uploadToPinata(file));
            const results = await Promise.all(uploadPromises);
            setUploadedFiles(prev => [...results, ...prev]);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Upload failed');
        } finally {
            setIsUploading(false);
        }
    }, [pinataApiKey, pinataSecretKey]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        handleFiles(e.dataTransfer.files);
    }, [handleFiles]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const copyToClipboard = async (text: string, hash: string) => {
        await navigator.clipboard.writeText(text);
        setCopiedHash(hash);
        setTimeout(() => setCopiedHash(null), 2000);
    };

    const getFileIcon = (type: string) => {
        if (type.startsWith('image/')) return Image;
        if (type.startsWith('video/')) return Video;
        return File;
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <div className="space-y-4">
            {/* Drop zone */}
            <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                    'relative border-2 border-dashed rounded-xl p-6 cursor-pointer transition-all duration-200',
                    'flex flex-col items-center justify-center gap-2',
                    isDragging
                        ? 'border-accent-cyan bg-accent-cyan/10'
                        : 'border-forge-border/50 hover:border-white/30 hover:bg-forge-elevated/30',
                    isUploading && 'pointer-events-none opacity-50'
                )}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFiles(e.target.files)}
                    accept="image/*,video/*,audio/*,application/*,text/*"
                />

                {isUploading ? (
                    <>
                        <Loader2 className="w-8 h-8 text-accent-cyan animate-spin" />
                        <p className="text-sm text-white">Uploading to IPFS...</p>
                    </>
                ) : (
                    <>
                        <div className="p-3 rounded-xl bg-accent-cyan/10 border border-accent-cyan/20">
                            <Upload className="w-6 h-6 text-accent-cyan" />
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-medium text-white">
                                Drop files here or click to upload
                            </p>
                            <p className="text-xs text-forge-muted mt-1">
                                Images, videos, documents, or any file type
                            </p>
                        </div>
                    </>
                )}
            </div>

            {/* Error message */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30"
                    >
                        <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                        <p className="text-xs text-red-400">{error}</p>
                        <button
                            onClick={() => setError(null)}
                            className="ml-auto text-red-400 hover:text-red-300"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Uploaded files list */}
            {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                    <p className="text-[10px] text-forge-muted uppercase tracking-wider">
                        Uploaded Files ({uploadedFiles.length})
                    </p>

                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                        <AnimatePresence>
                            {uploadedFiles.map((file, index) => {
                                const FileIcon = getFileIcon(file.type);

                                return (
                                    <motion.div
                                        key={file.ipfsHash}
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="p-3 rounded-lg bg-forge-elevated/50 border border-forge-border/50"
                                    >
                                        <div className="flex items-start gap-3">
                                            {/* File icon */}
                                            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                                <FileIcon className="w-4 h-4 text-emerald-400" />
                                            </div>

                                            {/* File info */}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-white truncate">
                                                    {file.name}
                                                </p>
                                                <p className="text-[10px] text-forge-muted">
                                                    {formatFileSize(file.size)} • Pinned to IPFS
                                                </p>

                                                {/* IPFS Hash */}
                                                <div className="flex items-center gap-1.5 mt-2">
                                                    <code className="text-[10px] text-accent-cyan bg-accent-cyan/10 px-1.5 py-0.5 rounded font-mono truncate flex-1">
                                                        {file.ipfsHash}
                                                    </code>
                                                    <button
                                                        onClick={() => copyToClipboard(file.ipfsHash, file.ipfsHash)}
                                                        className="p-1 rounded hover:bg-white/10 transition-colors"
                                                        title="Copy hash"
                                                    >
                                                        {copiedHash === file.ipfsHash ? (
                                                            <Check className="w-3 h-3 text-emerald-400" />
                                                        ) : (
                                                            <Copy className="w-3 h-3 text-forge-muted" />
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action buttons */}
                                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-forge-border/30">
                                            <a
                                                href={file.pinataUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-accent-cyan/10 hover:bg-accent-cyan/20 text-accent-cyan text-[11px] font-medium transition-colors"
                                            >
                                                <ExternalLink className="w-3 h-3" />
                                                View on Pinata
                                            </a>
                                            <button
                                                onClick={() => copyToClipboard(file.ipfsUrl, file.ipfsHash + '-url')}
                                                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-forge-bg/50 hover:bg-forge-bg text-forge-muted hover:text-white text-[11px] font-medium transition-colors"
                                            >
                                                <Copy className="w-3 h-3" />
                                                Copy IPFS URL
                                            </button>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                </div>
            )}
        </div>
    );
}
