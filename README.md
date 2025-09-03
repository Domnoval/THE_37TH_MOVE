# TTS Portal Interactive AI Gallery - Edge Functions Infrastructure

This repository contains the Netlify Edge Functions infrastructure for the TTS Portal Interactive AI Gallery project, implementing Story 1.2 requirements.

## 🏗️ Infrastructure Overview

The project implements 5 serverless edge functions that provide the backbone for the Interactive AI Gallery:

1. **conversation-handler.ts** - AI personality conversations with Gemini API
2. **creation-processor.ts** - Mashup/remix creation with Canvas API  
3. **image-analyzer.ts** - Artwork analysis for personality generation
4. **custom-commerce-handler.ts** - Printify/Printful integration
5. **error-monitor.ts** - Centralized error handling and logging

## 📁 Project Structure

```
netlify/
├── edge-functions/
│   ├── shared/
│   │   ├── types.ts          # TypeScript interfaces
│   │   └── utils.ts          # Common utilities
│   ├── conversation-handler.ts
│   ├── creation-processor.ts
│   ├── image-analyzer.ts
│   ├── custom-commerce-handler.ts
│   └── error-monitor.ts
└── netlify.toml              # Netlify configuration
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- Netlify CLI (`npm install -g netlify-cli`)
- Supabase account and project (Story 1.1 database)
- Google Gemini API key
- Canvas API key
- Printify/Printful API keys (optional)

### 1. Environment Setup

Create a `.env` file or set environment variables in Netlify dashboard:

```bash
# Supabase Configuration (from Story 1.1)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI Services
GEMINI_API_KEY=your-gemini-api-key
CANVAS_API_KEY=your-canvas-api-key

# Commerce (Optional)
PRINTIFY_API_KEY=your-printify-api-key
PRINTFUL_API_KEY=your-printful-api-key
```

### 2. Local Development

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Start local development server
netlify dev

# Test edge functions locally
curl -X POST http://localhost:8888/api/conversation \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello","personality_id":"uuid-here"}'
```

### 3. Deployment

```bash
# Deploy to Netlify
netlify deploy

# Deploy to production
netlify deploy --prod
```

## 🔧 API Endpoints

### Conversation Handler
**POST /api/conversation**

Start or continue AI personality conversations.

```json
{
  "message": "Hello, how are you today?",
  "personality_id": "550e8400-e29b-41d4-a716-446655440000",
  "conversation_id": "optional-existing-conversation-id",
  "session_token": "optional-for-anonymous-users"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Hello! I'm doing well, thank you for asking...",
    "conversation_id": "550e8400-e29b-41d4-a716-446655440001",
    "message_id": "550e8400-e29b-41d4-a716-446655440002",
    "personality": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Artistic Sage"
    }
  }
}
```

### Creation Processor
**POST /api/creation**

Process artwork mashups and remixes.

```json
{
  "type": "mashup",
  "source_artwork_ids": [
    "artwork-uuid-1",
    "artwork-uuid-2"
  ],
  "parameters": {
    "blend_mode": "overlay",
    "opacity": 0.7,
    "style_strength": 0.8
  },
  "title": "My Amazing Mashup",
  "session_token": "optional-for-anonymous-users"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "creation_id": "550e8400-e29b-41d4-a716-446655440003",
    "status": "processing",
    "progress": 0,
    "estimated_completion": "2025-01-01T12:05:00.000Z"
  }
}
```

### Image Analyzer
**POST /api/analyze-image**

Analyze artwork for style, content, and AI personality generation.

```json
{
  "image_url": "https://example.com/artwork.jpg",
  "analysis_type": "personality_generation",
  "session_token": "optional-for-anonymous-users"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "analysis_id": "550e8400-e29b-41d4-a716-446655440004",
    "results": {
      "extracted_features": {
        "emotions": ["vibrant", "energetic"],
        "colors": ["blue", "yellow", "red"],
        "styles": ["abstract", "expressionist"]
      }
    },
    "generated_personality": {
      "id": "550e8400-e29b-41d4-a716-446655440005",
      "name": "Vibrant Blue",
      "description": "An energetic AI personality..."
    },
    "confidence_score": 0.85
  }
}
```

### Commerce Handler
**POST /api/commerce**

Handle e-commerce operations with Printify/Printful.

```json
{
  "action": "create_product",
  "data": {
    "artwork_id": "550e8400-e29b-41d4-a716-446655440006",
    "product_type": "t-shirt",
    "name": "Amazing Artwork T-Shirt",
    "price": 29.99,
    "description": "Custom t-shirt featuring amazing artwork"
  },
  "session_token": "optional-for-anonymous-users"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "product": {
      "id": "550e8400-e29b-41d4-a716-446655440007",
      "name": "Amazing Artwork T-Shirt",
      "price": 29.99,
      "external_product_id": "printify-product-123"
    },
    "external_id": "printify-product-123",
    "service": "printify"
  }
}
```

### Error Monitor
**GET /api/error-monitor?action=health**

Check system health and error statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-01-01T12:00:00.000Z",
    "response_time_ms": 45,
    "database": {
      "healthy": true,
      "response_time_ms": 23
    },
    "error_rates": {
      "critical_last_hour": 0,
      "total_last_hour": 3
    }
  }
}
```

## 🔐 Security Features

- **Rate Limiting**: Built-in rate limiting for all endpoints
- **CORS Protection**: Proper CORS headers configured
- **Input Validation**: Comprehensive input sanitization
- **Authentication**: Support for both authenticated and anonymous users
- **Session Management**: Secure anonymous session handling
- **Error Logging**: All errors logged securely to Supabase

## 🎯 Database Integration

The edge functions integrate with the Supabase database schema from Story 1.1:

- **users** - User management and authentication
- **anonymous_sessions** - Anonymous user session tracking
- **ai_personalities** - AI personality configurations
- **conversations** & **conversation_messages** - Conversation storage
- **artworks** & **galleries** - Artwork management
- **creations** & **creation_steps** - Creation processing tracking
- **products** & **orders** - E-commerce functionality
- **error_logs** - Error monitoring and debugging

## 📊 Monitoring & Analytics

### Health Checks
```bash
curl https://your-site.netlify.app/api/error-monitor?action=health
```

### Error Statistics (requires authentication)
```bash
curl https://your-site.netlify.app/api/error-monitor?action=stats&timeframe=day \
  -H "Authorization: Bearer your-jwt-token"
```

### System Alerts
```bash
curl https://your-site.netlify.app/api/error-monitor?action=alerts
```

## 🛠️ Development

### Running Tests
```bash
# Test individual functions locally
netlify functions:invoke conversation-handler --payload='{"message":"test"}'

# Test with curl
curl -X POST http://localhost:8888/api/conversation \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello","personality_id":"test-uuid"}'
```

### Debugging
- Check Netlify function logs in dashboard
- Use `console.log()` for debugging (appears in Netlify logs)
- Monitor error rates via `/api/error-monitor`
- Check Supabase logs for database issues

### Adding New Edge Functions
1. Create new `.ts` file in `netlify/edge-functions/`
2. Import shared utilities from `./shared/utils.ts`
3. Add configuration to `netlify.toml`
4. Update this README with endpoint documentation

## 🚨 Error Handling

All edge functions implement comprehensive error handling:

- **Validation Errors**: Clear messages for invalid input
- **Authentication Errors**: Proper 401/403 responses
- **Rate Limiting**: 429 responses with retry information
- **Server Errors**: Logged to database with request context
- **Monitoring**: Real-time error tracking and alerting

## 📈 Performance

- **Caching**: Strategic caching for frequently accessed data
- **Rate Limiting**: Prevents abuse and ensures fair usage
- **Optimization**: Minimal cold start times with efficient code
- **CDN**: Global edge deployment for low latency
- **Monitoring**: Performance metrics and health checks

## 🔄 CI/CD

The project supports automated deployment:

```yaml
# .github/workflows/deploy.yml
name: Deploy to Netlify
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - uses: netlify/actions/cli@master
        with:
          args: deploy --prod
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

## 📚 API Documentation

For detailed API documentation including request/response schemas, error codes, and examples, see the individual edge function files. Each function includes comprehensive JSDoc comments.

## 🆘 Troubleshooting

### Common Issues

1. **Environment Variables Not Set**
   - Check Netlify dashboard environment variables
   - Ensure all required API keys are configured

2. **Database Connection Issues**
   - Verify Supabase URL and keys
   - Check RLS policies allow edge function access

3. **Rate Limiting Issues**
   - Check rate limits in edge function code
   - Monitor error logs for rate limit violations

4. **CORS Issues**
   - Verify CORS headers in `netlify.toml`
   - Check client-side request headers

### Support

For support and issues:
- Check Netlify function logs
- Review Supabase database logs  
- Monitor `/api/error-monitor` for system health
- Create GitHub issues for bugs or feature requests

---

## 📋 Story 1.2 Acceptance Criteria ✅

✅ All 5 edge functions created with proper Deno imports  
✅ Supabase integration using environment variables  
✅ Google Gemini API integration for conversations  
✅ Canvas API integration for creation tools  
✅ Commerce API integration (Printify/Printful)  
✅ Comprehensive error handling with monitoring  
✅ TypeScript interfaces for all data structures  
✅ Security validation for all inputs  
✅ Anonymous user session management  
✅ Performance optimization with caching strategies  

**Deliverables Completed:**
1. ✅ 5 complete Edge Function files
2. ✅ shared/types.ts with TypeScript interfaces  
3. ✅ shared/utils.ts with common utilities  
4. ✅ netlify.toml configuration  
5. ✅ README.md with deployment instructions

The Edge Functions infrastructure is now ready for deployment and integration with the frontend application!