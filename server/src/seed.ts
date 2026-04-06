import 'dotenv/config';
import mongoose from 'mongoose';
import { Project } from './models/Project.js';

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('Set MONGODB_URI in server/.env');
  process.exit(1);
}

await mongoose.connect(MONGODB_URI);
await Project.deleteMany({
  slug: { $in: ['sample-motion', 'sample-installation', 'sample-personal'] },
});
await Project.insertMany([
  {
    title: 'Sample motion study',
    slug: 'sample-motion',
    summary: 'Replace this with your own piece.',
    description:
      'Run `npm run seed --prefix server` only once; edit projects in MongoDB or add an admin UI later. Set youtubeUrl to a watch or youtu.be link (or the 11-char id) for an embedded player; optional coverAssetPath overrides the thumbnail.',
    tags: ['motion', 'demo'],
    section: 'dma',
    dmaCategory: 'video',
    sortOrder: 0,
    youtubeUrl: 'https://www.youtube.com/watch?v=LXb3EKWsInQ',
  },
  {
    title: 'Sample installation',
    slug: 'sample-installation',
    summary: 'Another placeholder project.',
    tags: ['installation', 'demo'],
    section: 'photography',
    sortOrder: 0,
  },
  {
    title: 'Sample personal work',
    slug: 'sample-personal',
    summary: 'Placeholder in the Personal Work section.',
    tags: ['personal', 'demo'],
    section: 'personal',
    sortOrder: 0,
  },
]);
console.log('Seeded sample projects.');
await mongoose.disconnect();
