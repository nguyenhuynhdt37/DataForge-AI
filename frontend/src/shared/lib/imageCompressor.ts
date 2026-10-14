/**
 * Re-export sang shared/utils/imageCompressor để đảm bảo tính tương thích ngược
 */
export { 
  compressAvatarImage, 
  formatBytes,
  type CompressionOptions,
  type CompressedImageResult 
} from '../utils/imageCompressor';
