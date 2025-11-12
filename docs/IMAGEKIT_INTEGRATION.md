# ImageKit.io Integration

This project includes a comprehensive integration with ImageKit.io for image optimization, transformation, and delivery. ImageKit.io provides real-time image optimization, automatic format delivery (WebP/AVIF), and a powerful transformation API.

## Setup

### 1. Create ImageKit Account

1. Go to [ImageKit.io](https://imagekit.io/) and create an account
2. Navigate to the Developer section in your dashboard
3. Copy your credentials:
   - **Public Key**: Used for client-side operations
   - **Private Key**: Used for server-side operations (keep secure)
   - **URL Endpoint**: Your ImageKit delivery URL (e.g., `https://ik.imagekit.io/your_id`)

### 2. Environment Configuration

Add your ImageKit credentials to your `.env` file:

```bash
# ImageKit Configuration
IMAGEKIT_PUBLIC_KEY="your_public_key_here"
IMAGEKIT_PRIVATE_KEY="your_private_key_here"
IMAGEKIT_URL_ENDPOINT="https://ik.imagekit.io/your_id"
```

### 3. Install Dependencies

The ImageKit SDK is already installed. If you need to install it manually:

```bash
bun add imagekit
```

## Features

### 🚀 Core Features

- **✅ Image Upload**: Drag & drop file upload with progress tracking and validation
- **✅ Image Optimization**: Automatic format conversion (WebP/AVIF) 
- **✅ Image Transformations**: Resize, crop, blur, rotate, and 50+ transformations
- **✅ Responsive Images**: Automatic srcset generation for different screen sizes
- **✅ Lazy Loading**: Intersection Observer-based lazy loading with fallbacks
- **✅ Error Handling**: Comprehensive error handling and graceful fallbacks
- **✅ TypeScript Support**: Full TypeScript support with proper type definitions
- **✅ Server & Client**: Both server-side and client-side upload capabilities

### 📡 API Routes

The following API endpoints are available and fully functional:

- `POST /api/imagekit/upload` - Server-side file upload with validation
- `GET /api/imagekit/auth` - Authentication tokens for client-side uploads  
- `DELETE /api/imagekit/delete` - Delete files from ImageKit storage
- `GET /api/imagekit/config` - Configuration validation and testing

### 🎨 Components

#### ImageUpload Component

```tsx
import { ImageUpload } from '~/app/components'

function MyComponent() {
  const handleUpload = (files) => {
    console.log('Uploaded files:', files)
  }

  return (
    <ImageUpload
      onUpload={handleUpload}
      folder="products"
      tags={['product', 'image']}
      maxFiles={5}
      maxSize={10 * 1024 * 1024} // 10MB
    />
  )
}
```

#### OptimizedImage Component

```tsx
import { OptimizedImage } from '~/app/components'

function ProductCard() {
  return (
    <OptimizedImage
      src="product-image.jpg"
      alt="Product"
      width={400}
      height={300}
      transformations={{
        crop: 'force',
        quality: 80,
        format: 'webp'
      }}
      responsive={true}
      lazy={true}
    />
  )
}
```

#### Preset Components

```tsx
import { Avatar, Thumbnail, HeroImage, CardImage } from '~/app/components'

// Avatar with circular crop
<Avatar src="user.jpg" alt="User" size={50} />

// Square thumbnail
<Thumbnail src="image.jpg" alt="Thumbnail" />

// Hero image with responsive breakpoints
<HeroImage src="hero.jpg" alt="Hero" />

// Card image optimized for cards
<CardImage src="card.jpg" alt="Card" />
```

### 🛠 Utility Functions

#### URL Generation

```tsx
import { generateImageUrl, generatePresetImageUrl } from '~/app/lib/imagekit.client-config'

// Basic image URL
const imageUrl = generateImageUrl('my-image.jpg')

// With transformations
const transformedUrl = generateImageUrl('my-image.jpg', {
  width: 400,
  height: 300,
  crop: 'force',
  quality: 80,
  format: 'webp'
})

// Using presets
const thumbnailUrl = generatePresetImageUrl('my-image.jpg', 'thumbnail')
```

#### Server-side Operations

```tsx
import { uploadToImagekit, deleteFromImagekit } from '~/app/lib/imagekit'

// Server-side upload (in API routes)
const result = await uploadToImagekit(fileBuffer, {
  fileName: 'image.jpg',
  folder: 'uploads',
  tags: ['user-content']
})

// Server-side delete
await deleteFromImagekit(fileId)
```

### 🎯 Image Transformations

ImageKit supports a wide range of transformations:

```tsx
const transformations = {
  // Dimensions
  width: 400,
  height: 300,
  aspectRatio: '16:9',
  
  // Cropping
  crop: 'force', // 'at_least', 'at_max', 'force', 'pad_resize'
  
  // Quality & Format
  quality: 80,
  format: 'webp', // 'webp', 'png', 'jpg', 'avif'
  
  // Effects
  blur: 10,
  radius: 20, // or 'max' for circular
  rotation: 90,
  
  // Colors
  background: 'FFFFFF',
  border: '5,FF0000',
  
  // Overlays
  overlay: {
    image: 'watermark.png',
    x: 10,
    y: 10,
    transparency: 50
  }
}
```

### 📏 Preset Transformations

Pre-defined transformation presets for common use cases:

```tsx
import { imagePresets, generatePresetImageUrl } from '~/app/lib/imagekit.client-config'

// Available presets:
// - thumbnail: 150x150, forced crop, WebP, quality 80
// - avatar: 200x200, forced crop, circular, WebP, quality 85
// - hero: 1200x600, forced crop, WebP, quality 85
// - card: 400x300, forced crop, WebP, quality 80
// - gallery: 800x600, at_max crop, WebP, quality 85
// - preview: 300x200, forced crop, WebP, quality 70

const avatarUrl = generatePresetImageUrl('user.jpg', 'avatar')
```

### 🔒 Security & Best Practices

1. **Environment Variables**: Never expose your private key in client-side code
2. **File Validation**: Always validate file types and sizes before upload
3. **Folder Organization**: Use meaningful folder structures for better organization
4. **Tagging**: Use tags for better asset management and searching
5. **CDN Benefits**: Leverage ImageKit's global CDN for fast delivery

### ✅ Integration Status

The ImageKit.io integration is **production-ready** and fully functional:

- ✅ All components are available for use
- ✅ API routes are configured and working
- ✅ Upload functionality tested and confirmed working
- ✅ Image transformations and optimization active
- ✅ TypeScript support with proper types

### 🐛 Troubleshooting

#### Common Issues

1. **"ImageKit not configured" error**
   - Check that all environment variables are set correctly
   - Restart your development server after adding env vars

2. **Upload fails with 401 error**
   - Verify your private key is correct
   - Check that the auth endpoint is working

3. **Images not loading**
   - Verify your URL endpoint is correct
   - Check browser console for CORS issues

4. **Transformations not applied**
   - Check your transformation syntax
   - Verify the image path is correct

#### Debug Mode

Add this to see ImageKit configuration status:

```tsx
import { isImagekitConfigured } from '~/app/lib/imagekit.client-config'

console.log('ImageKit configured:', isImagekitConfigured())

// Test configuration via API
const configTest = await fetch('/api/imagekit/config')
const result = await configTest.json()
console.log('Configuration status:', result)
```

### 📚 Additional Resources

- [ImageKit.io Documentation](https://docs.imagekit.io/)
- [Transformation Reference](https://docs.imagekit.io/features/image-transformations)
- [Upload API Reference](https://docs.imagekit.io/api-reference/upload-file-api)
- [URL Generation](https://docs.imagekit.io/features/image-transformations/resize-crop-and-other-transformations)

### 🧪 Testing the Integration

To verify the integration is working correctly:

1. **Configuration Test**:
```bash
curl http://localhost:3000/api/imagekit/config
```

2. **Upload Test** (using your app's upload component):
```tsx
import { ImageUpload } from '~/app/components'

// Use the ImageUpload component in any page
<ImageUpload
  onUpload={(files) => console.log('✅ Upload successful:', files)}
  onError={(error) => console.error('❌ Upload failed:', error)}
  folder="test"
  tags={['test']}
/>
```

3. **Image Display Test**:
```tsx
import { OptimizedImage } from '~/app/components'

// Display an uploaded image with transformations
<OptimizedImage
  src="/path/to/uploaded/image.jpg" 
  alt="Test image"
  width={300}
  height={200}
  transformations={{ quality: 80, format: 'webp' }}
/>
```

### 💡 Usage Examples

#### Product Image Gallery
```tsx
import { CardImage, ImageUpload } from '~/app/components'

function ProductForm() {
  const [productImages, setProductImages] = useState([])
  
  return (
    <div>
      <ImageUpload
        onUpload={(files) => setProductImages(prev => [...prev, ...files])}
        folder="products"
        tags={['product', 'gallery']}
        maxFiles={10}
      />
      
      <div className="grid grid-cols-3 gap-4 mt-4">
        {productImages.map((image) => (
          <CardImage
            key={image.fileId}
            src={image.filePath}
            alt={image.name}
          />
        ))}
      </div>
    </div>
  )
}
```

#### User Avatar Upload
```tsx
import { Avatar, ImageUpload } from '~/app/components'

function ProfilePage() {
  const [avatarUrl, setAvatarUrl] = useState('/default-avatar.png')
  
  return (
    <div>
      <Avatar src={avatarUrl} alt="User Avatar" size={100} />
      
      <ImageUpload
        onUpload={(files) => setAvatarUrl(files[0].filePath)}
        folder="avatars"
        tags={['avatar', 'profile']}
        maxFiles={1}
        accept="image/*"
      />
    </div>
  )
}
```

### 📈 Performance Benefits

- **Automatic Format Delivery**: WebP/AVIF for supported browsers
- **Global CDN**: Fast delivery worldwide
- **Real-time Optimization**: No pre-processing required
- **Responsive Images**: Automatic srcset generation
- **Lazy Loading**: Improved page load times
