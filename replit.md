# StoryPals - Custom Children's Story Generator

## Overview

StoryPals is a full-stack web application that creates personalized children's books featuring the user's child as the main character. The application allows users to create custom characters, select or create stories, and generate illustrated books with AI-powered image generation and story creation.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, using Vite as the build tool
- **Routing**: Wouter for client-side routing
- **State Management**: Zustand for global state, React Query for server state
- **UI Components**: Radix UI components with Tailwind CSS for styling
- **Authentication**: Firebase Authentication with Google OAuth

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM (configured but may use Firestore as primary storage)
- **Authentication**: Firebase Admin SDK for server-side auth verification
- **Session Management**: Express sessions with memory store

### Database Design
The application uses a dual approach:
- **Primary**: Firestore for main data storage with collections for users, characters, stories, books, and orders
- **Secondary**: PostgreSQL configured via Drizzle (for potential future migration)

## Key Components

### Character System
- **Predefined Characters**: Pre-built characters with existing models and images
- **Custom Characters**: User-uploaded photos processed through AI training
- **Character Training**: Uses fal.ai for training custom LoRA models on user photos
- **Style Options**: Multiple art styles (Pixar, hand-drawn, watercolor, etc.)

### Story Generation
- **Predefined Stories**: Curated story templates with various themes
- **Custom Stories**: AI-generated stories using OpenAI GPT models
- **Story Validation**: Multi-step validation system ensuring story quality and appropriateness
- **Scene Generation**: Detailed scene descriptions for consistent image generation

### Image Generation Pipeline
- **AI Models**: fal.ai integration for image generation with custom LoRA models
- **Image Processing**: Sharp for image manipulation, Canvas API for compositing
- **Style Consistency**: Character consistency across story scenes using trained models

### PDF Generation
- **Engine**: jsPDF with custom font support (Fredoka, Baloo-2, Chewy)
- **Layout System**: Multiple layout templates for text and image arrangement
- **WYSIWYG Editor**: Drag-and-drop text editing with real-time preview
- **Print Ready**: 6x6 inch format optimized for physical book printing

### File Storage
- **Primary**: Firebase Storage for user uploads and generated content
- **CDN**: Firebase Storage with download tokens for secure access
- **Local Processing**: Temporary file handling for PDF generation and image processing

## Data Flow

1. **User Authentication**: Firebase Auth → Server session validation → Database user record
2. **Character Creation**: Photo upload → Firebase Storage → AI training → Model storage
3. **Story Selection**: User choice → Template/AI generation → Scene breakdown
4. **Image Generation**: Scene prompts + Character model → AI generation → Storage
5. **Book Assembly**: Pages + Images → PDF generation → Download/Order processing
6. **Order Management**: Shipping details → Order record → Fulfillment tracking

## External Dependencies

### AI Services
- **fal.ai**: Primary AI service for image generation and LoRA training
- **OpenAI**: GPT models for story generation and validation

### Firebase Services
- **Authentication**: Google OAuth and user management
- **Firestore**: Primary database for application data
- **Storage**: File storage for images and generated content

### Payment & Shipping
- **Shipping Integration**: Form-based shipping address collection
- **Order Processing**: Internal order management system

### Development Tools
- **Logging**: Pino with Logtail integration for production logging
- **Error Handling**: Custom error boundaries and API error interceptors
- **Development**: Replit-specific plugins and hot reloading

## Deployment Strategy

### Build Process
- **Frontend**: Vite builds React app to `dist/public`
- **Backend**: esbuild bundles server code to `dist/index.js`
- **Fonts**: Custom fonts embedded as base64 in TypeScript files

### Environment Configuration
- **Development**: Local development with Vite dev server and tsx
- **Production**: Node.js server serving built frontend and API routes
- **Environment Variables**: Firebase config, API keys, database URLs

### Scaling Considerations
- **Database**: Firestore provides automatic scaling
- **File Storage**: Firebase Storage handles CDN and global distribution
- **AI Processing**: Job tracking system for long-running AI operations
- **Session Storage**: Currently uses memory store (suitable for single-instance deployment)

### Monitoring & Logging
- **Production Logging**: Logtail integration for centralized log management
- **Development Logging**: Pretty-printed console logs with debug levels
- **Error Tracking**: Custom error boundaries and API error handling