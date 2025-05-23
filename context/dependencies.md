# Dependencies and External Services

## Runtime Dependencies

### Core Node.js Dependencies (CLI)

#### Image Processing
- **sharp** `^0.34.1`
  - Purpose: High-performance image processing and manipulation
  - Native module: Yes (requires compilation)
  - Platform support: macOS, Linux, Windows
  - Key features: Image resizing, format conversion, RGBA buffer extraction
  - Alternatives considered: Jimp (pure JS but slower), Canvas (more complex)

#### Command Line Interface
- **yargs** `^17.7.2`
  - Purpose: Command-line argument parsing and validation
  - Features: Automatic help generation, type validation, default values
  - Configuration: Declarative API with fluent syntax
  - No alternatives needed: Industry standard for Node.js CLI tools

### React Web Application Dependencies

#### Core Framework
- **react** `^17.0.2`
  - Purpose: UI component framework
  - Version rationale: Stable release with hooks support
  - Migration path: React 18 planned for future updates

- **react-dom** `^17.0.2`
  - Purpose: DOM rendering for React components
  - Version: Must match React version

- **react-router-dom** `^5.2.0`
  - Purpose: Client-side routing for single-page application
  - Features: History management, nested routes, route parameters

#### Build and Development
- **react-scripts** `4.0.3`
  - Purpose: Create React App build configuration
  - Includes: Webpack, Babel, ESLint, Jest configurations
  - Benefits: Zero-config setup, automatic optimization
  - Customization: Via CRACO or ejecting (not recommended)

#### 3D Graphics and Visualization
- **three** `^0.129.0`
  - Purpose: 3D graphics rendering for structure preview
  - Rendering: WebGL-based with fallbacks
  - Features: Scene management, camera controls, lighting
  - Bundle size: Large (~600KB) but code-split for performance

#### Compression and File Handling
- **jszip** `^3.6.0`
  - Purpose: Client-side ZIP file creation and manipulation
  - Use case: Packaging multiple output files for download
  - Platform: Browser-only implementation

- **pako** `^1.0.11`
  - Purpose: JavaScript implementation of zlib compression
  - Use case: Browser-side gzip compression for compatibility
  - Alternative to: Node.js built-in zlib module

### Development and Testing Dependencies

#### Testing Framework
- **@testing-library/jest-dom** `^5.11.10`
  - Purpose: Custom Jest matchers for DOM elements
  - Testing philosophy: User-centric testing approach

- **@testing-library/react** `^11.2.5`
  - Purpose: React component testing utilities
  - Features: Component rendering, event simulation, queries

- **@testing-library/user-event** `^12.8.3`
  - Purpose: Simulate user interactions for testing
  - Benefits: More realistic event simulation than fireEvent

#### Performance Monitoring
- **web-vitals** `^1.1.1`
  - Purpose: Core Web Vitals measurement
  - Metrics: LCP, FID, CLS, FCP, TTFB
  - Integration: Automated performance reporting

## System Dependencies

### Node.js Runtime
- **Minimum Version**: Node.js 14.x
- **Recommended**: Node.js 16.x or later
- **LTS Policy**: Use current LTS version for production
- **Native Modules**: Required for Sharp compilation

### Platform-Specific Requirements

#### macOS
- **Xcode Command Line Tools**: Required for native module compilation
- **Python**: Required by node-gyp for building native modules
- **Architecture**: Intel x64 and Apple Silicon (M1/M2) supported

#### Linux
- **build-essential**: Required for compilation
- **Python 3**: Required by node-gyp
- **libvips**: Automatically downloaded by Sharp
- **glibc**: Minimum version requirements for Sharp

#### Windows
- **Visual Studio Build Tools**: Required for native compilation
- **Python**: Required by node-gyp
- **Windows SDK**: For native module development

## External Services and APIs

### None Currently Required
- **No external APIs**: All processing happens locally
- **No network dependencies**: Fully offline-capable
- **No authentication services**: Open-source tool
- **No telemetry**: Privacy-focused design

### Future Considerations
- **Texture pack APIs**: Potential integration with texture pack repositories
- **Cloud processing**: Optional remote processing for large images
- **Version updates**: Automatic Minecraft version data updates

## Version Management Strategy

### Semantic Versioning
- **Major versions**: Breaking API changes
- **Minor versions**: New features, Minecraft version updates
- **Patch versions**: Bug fixes, security updates

### Update Policy
- **Dependencies**: Conservative update approach
- **Security patches**: Immediate application when available
- **Breaking changes**: Thorough testing before adoption

### Version Pinning
- **Exact versions**: Used in package-lock.json
- **Caret ranges**: Used in package.json for non-breaking updates
- **Critical dependencies**: Sharp and React pinned to specific versions

## Dependency Risk Assessment

### High Risk Dependencies
- **sharp**: Native module with platform dependencies
  - Risk: Compilation failures on unsupported platforms
  - Mitigation: Clear installation instructions, pre-built binaries

### Medium Risk Dependencies
- **three**: Large bundle size
  - Risk: Performance impact on slower devices
  - Mitigation: Code splitting, lazy loading

- **react-scripts**: Complex build system
  - Risk: Breaking changes in updates
  - Mitigation: Version pinning, gradual updates

### Low Risk Dependencies
- **yargs**: Stable, mature library
- **react**: Industry standard with excellent stability
- **jszip/pako**: Mature compression libraries

## Dependency Alternatives

### Image Processing Alternatives
- **Jimp**: Pure JavaScript, slower but no native dependencies
- **Canvas**: More powerful but heavier and complex setup
- **ImageMagick**: Command-line tool, requires external installation

### CLI Framework Alternatives
- **Commander**: Similar functionality to yargs
- **Minimist**: Lightweight but less features
- **Inquirer**: For interactive CLI experiences

### 3D Rendering Alternatives
- **Babylon.js**: More comprehensive but heavier
- **A-Frame**: VR-focused, overkill for map previews
- **Canvas 2D**: Simpler but less engaging user experience

## License Compatibility

### All Dependencies
- **MIT License**: Majority of dependencies (compatible)
- **BSD License**: Some utilities (compatible)
- **Apache 2.0**: Few dependencies (compatible)
- **No GPL**: Avoided for licensing simplicity

### License Requirements
- **Attribution**: Included in build output
- **Distribution**: All licenses allow redistribution
- **Commercial use**: All dependencies permit commercial use

## Monitoring and Maintenance

### Security Vulnerability Scanning
- **npm audit**: Regular dependency vulnerability checks
- **Dependabot**: Automated security update pull requests
- **Manual review**: Critical dependency updates reviewed manually

### Performance Impact Monitoring
- **Bundle analyzer**: Regular bundle size analysis
- **Core Web Vitals**: Performance metrics tracking
- **Load testing**: CLI performance testing with large images

### Update Schedule
- **Monthly**: Patch version updates
- **Quarterly**: Minor version updates
- **Annually**: Major version updates with breaking changes 