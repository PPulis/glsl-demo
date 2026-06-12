// ============================================================================
// GLSL SHADER DEMO - SELF-CONTAINED VERSION
// ============================================================================

// Simple Stats Monitor (FPS counter)
var Stats = function() {
	var startTime = Date.now(), prevTime = startTime;
	var ms = 0, msMin = Infinity, msMax = 0;
	var fps = 0, fpsMin = Infinity, fpsMax = 0;
	var frames = 0;

	var container = document.createElement('div');
	container.style.cssText = 'position:fixed;top:0;left:0;opacity:0.9;z-index:10000;background:#000;color:#0f0;font-family:monospace;font-size:11px;line-height:1.4;padding:10px;border-right:2px solid #0f0;border-bottom:2px solid #0f0';

	var text = document.createElement('div');
	text.textContent = 'FPS: 0 | MS: 0';
	container.appendChild(text);

	this.dom = container;

	this.update = function() {
		var now = Date.now();
		ms = now - prevTime;
		msMin = Math.min(msMin, ms);
		msMax = Math.max(msMax, ms);
		frames++;

		if (now >= startTime + 1000) {
			fps = Math.round((frames * 1000) / (now - startTime));
			fpsMin = Math.min(fpsMin, fps);
			fpsMax = Math.max(fpsMax, fps);
			text.textContent = 'FPS: ' + fps + ' | MS: ' + ms;
			frames = 0;
			startTime = now;
		}
		prevTime = now;
	};
};

// Simple GUI
var SimpleGUI = function() {
	var container = document.createElement('div');
	container.style.cssText = 'background:rgba(0,0,0,0.85);border:1px solid #333;border-radius:3px;padding:12px;font-family:monospace;font-size:12px;color:#fff;min-width:180px';

	this.add = function(obj, prop, values, callback) {
		var row = document.createElement('div');
		row.style.cssText = 'margin-bottom:8px;padding:4px';

		var label = document.createElement('label');
		label.style.cssText = 'display:block;color:#2FA1D6;margin-bottom:4px;font-weight:bold';
		label.textContent = prop;

		if (Array.isArray(values)) {
			// Dropdown
			var select = document.createElement('select');
			select.style.cssText = 'width:100%;padding:4px;background:#222;color:#fff;border:1px solid #555;cursor:pointer';
			values.forEach(function(v) {
				var opt = document.createElement('option');
				opt.value = v;
				opt.textContent = v;
				if (v === obj[prop]) opt.selected = true;
				select.appendChild(opt);
			});
			select.addEventListener('change', function() {
				obj[prop] = select.value;
				if (callback) callback();
			});
			row.appendChild(label);
			row.appendChild(select);
		} else if (values && values.min !== undefined) {
			// Slider
			var slider = document.createElement('input');
			slider.type = 'range';
			slider.min = values.min;
			slider.max = values.max;
			slider.step = values.step || 0.1;
			slider.value = obj[prop];
			slider.style.cssText = 'width:100%;cursor:pointer';

			var valSpan = document.createElement('span');
			valSpan.style.cssText = 'color:#2FA1D6;margin-left:8px;font-weight:bold';
			valSpan.textContent = obj[prop].toFixed(2);

			slider.addEventListener('input', function() {
				obj[prop] = parseFloat(slider.value);
				valSpan.textContent = obj[prop].toFixed(2);
				if (callback) callback();
			});

			var sliderRow = document.createElement('div');
			sliderRow.style.cssText = 'display:flex;align-items:center';
			sliderRow.appendChild(slider);
			sliderRow.appendChild(valSpan);

			row.appendChild(label);
			row.appendChild(sliderRow);
		}

		container.appendChild(row);
		return this;
	};

	this.domElement = container;
	return this;
};

// ============================================================================
// MAIN APPLICATION
// ============================================================================

window.addEventListener('DOMContentLoaded', function() {
	var renderer, scene, camera, clock, stats, gui, controls;
	var mesh = null;
	var uniforms = {};
	var material = null;
	var vertexShader = '';
	var fragmentShader = '';

	var params = {
		Geometry: 'Torus knot',
		Speed: 1.0,
		Scale: 1.0
	};

	// Load shaders
	Promise.all([
		fetch('shaders/vertex.glsl').then(r => r.text()),
		fetch('shaders/fragment.glsl').then(r => r.text())
	]).then(function([vs, fs]) {
		vertexShader = vs;
		fragmentShader = fs;
		init();
		animate();
	}).catch(function(err) {
		console.error('Failed to load shaders:', err);
		alert('Failed to load shader files. Check that shaders/ directory exists.');
	});

	function init() {
		// WebGL Renderer
		renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
		renderer.setPixelRatio(window.devicePixelRatio);
		renderer.setSize(window.innerWidth, window.innerHeight);
		renderer.setClearColor(0x000000, 1);
		document.getElementById('sketch-container').appendChild(renderer.domElement);

		// Scene & Camera
		scene = new THREE.Scene();
		camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000);
		camera.position.z = 30;

		// Simple orbit controls
		var isDragging = false;
		var previousMousePosition = { x: 0, y: 0 };

		renderer.domElement.addEventListener('mousedown', function(e) {
			isDragging = true;
			previousMousePosition = { x: e.clientX, y: e.clientY };
		});

		renderer.domElement.addEventListener('mousemove', function(e) {
			if (isDragging) {
				var deltaX = e.clientX - previousMousePosition.x;
				var deltaY = e.clientY - previousMousePosition.y;
				camera.rotation.y += deltaX * 0.01;
				camera.rotation.x += deltaY * 0.01;
			}
			previousMousePosition = { x: e.clientX, y: e.clientY };
		});

		renderer.domElement.addEventListener('mouseup', function() {
			isDragging = false;
		});

		renderer.domElement.addEventListener('wheel', function(e) {
			e.preventDefault();
			camera.position.z += e.deltaY * 0.05;
		});

		// Clock
		clock = new THREE.Clock(true);

		// Stats
		stats = new Stats();
		document.body.appendChild(stats.dom);

		// GUI
		gui = new SimpleGUI();
		gui.add(params, 'Geometry', ['Torus knot', 'Sphere', 'Icosahedron'], updateGeometry);
		gui.add(params, 'Speed', { min: 0.1, max: 5, step: 0.1 });
		gui.add(params, 'Scale', { min: 0.5, max: 2, step: 0.1 }, updateGeometry);
		document.getElementById('sketch-gui').appendChild(gui.domElement);

		// Uniforms
		uniforms = {
			u_time: { value: 0.0 },
			u_frame: { value: 0.0 },
			u_resolution: { value: new THREE.Vector2(window.innerWidth * window.devicePixelRatio, window.innerHeight * window.devicePixelRatio) },
			u_mouse: { value: new THREE.Vector2(0, 0) }
		};

		// Material
		material = new THREE.ShaderMaterial({
			uniforms: uniforms,
			vertexShader: vertexShader,
			fragmentShader: fragmentShader,
			side: THREE.DoubleSide,
			transparent: true,
			extensions: { derivatives: true }
		});

		updateGeometry();

		// Events
		window.addEventListener('resize', onWindowResize);
		renderer.domElement.addEventListener('mousemove', onMouseMove);
	}

	function updateGeometry() {
		if (mesh) scene.remove(mesh);

		var geometry;
		var scale = params.Scale;

		switch(params.Geometry) {
			case 'Torus knot':
				geometry = new THREE.TorusKnotGeometry(6.5 * scale, 2.3 * scale, 256, 32);
				break;
			case 'Sphere':
				geometry = new THREE.SphereGeometry(10 * scale, 64, 64);
				break;
			case 'Icosahedron':
				geometry = new THREE.IcosahedronGeometry(10 * scale, 4);
				break;
		}

		mesh = new THREE.Mesh(geometry, material);
		scene.add(mesh);
	}

	function animate() {
		requestAnimationFrame(animate);

		uniforms.u_time.value = clock.getElapsedTime() * params.Speed;
		uniforms.u_frame.value += 1.0;

		// Auto rotate
		if (mesh) mesh.rotation.y += 0.003;

		renderer.render(scene, camera);
		stats.update();
	}

	function onWindowResize() {
		renderer.setSize(window.innerWidth, window.innerHeight);
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		uniforms.u_resolution.value.set(window.innerWidth * window.devicePixelRatio, window.innerHeight * window.devicePixelRatio);
	}

	function onMouseMove(event) {
		uniforms.u_mouse.value.set(event.clientX * window.devicePixelRatio, (window.innerHeight - event.clientY) * window.devicePixelRatio);
	}
});