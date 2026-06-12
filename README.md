# GLSL Demo - Interactive 3D Shader Showcase

A Three.js based portfolio showcase for GLSL shader effects with interactive 3D geometries.

## Features

- Real-time GLSL shader rendering
- Interactive 3D geometry selection (Torus Knot, Sphere, Icosahedron, Suzanne)
- Mouse/touch interaction support
- Performance monitoring with Stats.js
- dat.GUI control panel
- OrbitControls camera manipulation
- Responsive to window resizing

## Project Structure

```
glsl-demo/
├── index.html              # Main HTML file
├── main.js                 # Main JavaScript logic
├── shaders/
│   ├── vertex.glsl        # Vertex shader
│   └── fragment.glsl      # Fragment shader
├── objects/
│   └── suzanne_buffergeometry.json  # Suzanne model geometry
└── README.md
```

## Getting Started

1. Clone this repository
2. Replace the shader files in `shaders/` with your own GLSL code
3. Optionally add the `suzanne_buffergeometry.json` file in the `objects/` directory
4. Deploy to GitHub Pages or serve locally

## Customization

### Adding Your Own Shaders

Edit the files:
- `shaders/vertex.glsl` - Your vertex shader code
- `shaders/fragment.glsl` - Your fragment shader code

The following uniforms are available:
- `u_time` (float) - Elapsed time in seconds
- `u_frame` (float) - Frame counter
- `u_resolution` (vec2) - Canvas resolution
- `u_mouse` (vec2) - Mouse position

### Adding the Suzanne Model

Place your `suzanne_buffergeometry.json` file in the `objects/` directory. You can export this from Blender using the Three.js JSON exporter.

## Libraries Used

- [Three.js](https://threejs.org/) - 3D graphics library
- [OrbitControls.js](https://threejs.org/examples/controls/OrbitControls.js) - Camera controls
- [Stats.js](https://github.com/mrdoob/stats.js) - Performance monitoring
- [dat.GUI](https://github.com/dataarts/dat.gui) - Control panel

## License

MIT
