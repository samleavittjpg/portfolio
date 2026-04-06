import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    summary: { type: String, default: '' },
    description: { type: String, default: '' },
    tags: [{ type: String }],
    /** Public URL path served from disk, e.g. /uploads/uuid.jpg */
    coverAssetPath: { type: String, default: '' },
    /**
     * Optional YouTube watch/share/embed URL or 11-char video id.
     * Thumbnail uses YouTube poster unless coverAssetPath is set; modal plays embed.
     */
    youtubeUrl: { type: String, default: '' },
    /** Home page column: DMA review, Photography, or Personal Work */
    section: {
      type: String,
      enum: ['dma', 'photography', 'personal'],
      default: 'dma',
    },
    /**
     * DMA portfolio subgroup. On the DMA page, `illustration` is shown with `vector`
     * (Vector / Illustration). Tags `illustration` / `vector` match the same bucket.
     */
    dmaCategory: {
      type: String,
      enum: ['', 'glitch', 'vector', 'video', 'illustration'],
      default: '',
    },
    sortOrder: { type: Number, default: 0 },
    /** Optional display date string (e.g. "March 2025") shown in detail modal */
    pieceDate: { type: String, default: '' },
  },
  { timestamps: true }
);

export const Project =
  mongoose.models.Project ?? mongoose.model('Project', projectSchema);
